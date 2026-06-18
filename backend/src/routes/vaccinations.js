import express from 'express';
import { Vaccination, Pet } from '../db/db.js';
import { auth } from '../middleware/auth.js';
import { validateDate, validateTextarea, sanitizeInput } from '../utils/validation.js';

const router = express.Router();

// Helper to validate vaccine name (allows digits/specials like DHPP 5-in-1)
const validateVaccineName = (name) => {
  const trimmed = (name || '').trim();
  if (!name || trimmed === '') {
    return 'Vaccine name is required';
  }
  if (trimmed.length < 2) {
    return 'Vaccine name must be at least 2 characters';
  }
  if (trimmed.length > 50) {
    return 'Vaccine name must be at most 50 characters';
  }
  return '';
};

// Helper to verify user owns the pet associated with the vaccine
const verifyPetOwnership = async (petId, userId) => {
  const pet = await Pet.findById(petId);
  return pet && pet.owner === userId;
};

// @route   GET api/vaccinations
// @desc    Get all vaccinations for all user's pets (for global calendar/timeline)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    // 1. Get user's pets
    const pets = await Pet.find({ owner: req.user.id });
    const petIds = pets.map(p => p._id || p.id);

    if (petIds.length === 0) {
      return res.json([]);
    }

    // 2. Find vaccinations for these pets
    const vaccinations = await Vaccination.find({});
    // Local DB query fallback may not handle complex array $in queries, so we filter in-memory for robustness
    const userVaccinations = vaccinations.filter(v => petIds.includes(v.petId));
    
    // Attach pet name to each record for client utility
    const petMap = pets.reduce((acc, pet) => {
      acc[pet._id || pet.id] = pet.name;
      return acc;
    }, {});

    const formatted = userVaccinations.map(v => ({
      ...v,
      petName: petMap[v.petId] || 'Unknown Pet'
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Fetch all vaccinations error:', err);
    res.status(500).json({ message: 'Server error fetching vaccinations' });
  }
});

// @route   GET api/vaccinations/pet/:petId
// @desc    Get vaccinations for a specific pet
// @access  Private
router.get('/pet/:petId', auth, async (req, res) => {
  const { petId } = req.params;

  try {
    const isOwner = await verifyPetOwnership(petId, req.user.id);
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized to view records for this pet' });
    }

    const vaccinations = await Vaccination.find({ petId });
    res.json(vaccinations);
  } catch (err) {
    console.error('Fetch pet vaccinations error:', err);
    res.status(500).json({ message: 'Server error fetching vaccinations' });
  }
});

// @route   POST api/vaccinations
// @desc    Add vaccination record
// @access  Private
router.post('/', auth, async (req, res) => {
  let { petId, name, dateAdministered, dateDue, status, notes } = req.body;

  try {
    if (!petId || !name || !dateDue) {
      return res.status(400).json({ message: 'Please provide petId, name, and upcoming due date' });
    }

    petId = (petId || '').trim();
    name = (name || '').trim();
    dateDue = (dateDue || '').trim();
    dateAdministered = (dateAdministered || '').trim();
    status = (status || 'Pending').trim();
    notes = (notes || '').trim();

    const nameErr = validateVaccineName(name);
    const dueErr = validateDate(dateDue, true, 'Due date');
    const adminErr = dateAdministered ? validateDate(dateAdministered, false, 'Administered date') : '';
    const notesErr = notes ? validateTextarea(notes, 1, 1000, 'Notes') : '';

    if (nameErr || dueErr || adminErr || notesErr) {
      return res.status(400).json({
        message: nameErr || dueErr || adminErr || notesErr
      });
    }

    const isOwner = await verifyPetOwnership(petId, req.user.id);
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized to add records for this pet' });
    }

    const sanitizedName = sanitizeInput(name);
    const sanitizedDue = sanitizeInput(dateDue);
    const sanitizedAdmin = dateAdministered ? sanitizeInput(dateAdministered) : '';
    const sanitizedStatus = sanitizeInput(status);
    const sanitizedNotes = notes ? sanitizeInput(notes) : '';

    const newVaccine = await Vaccination.create({
      petId: sanitizeInput(petId),
      name: sanitizedName,
      dateAdministered: sanitizedAdmin,
      dateDue: sanitizedDue,
      status: sanitizedStatus,
      notes: sanitizedNotes
    });

    res.status(201).json(newVaccine);
  } catch (err) {
    console.error('Create vaccination error:', err);
    res.status(500).json({ message: 'Server error adding vaccination' });
  }
});

// @route   PUT api/vaccinations/:id
// @desc    Update vaccination record
// @access  Private
router.put('/:id', auth, async (req, res) => {
  let { name, dateAdministered, dateDue, status, notes } = req.body;
  const updates = {};

  if (name !== undefined) {
    const trimmed = (name || '').trim();
    const err = validateVaccineName(trimmed);
    if (err) return res.status(400).json({ message: err });
    updates.name = sanitizeInput(trimmed);
  }

  if (dateAdministered !== undefined) {
    const trimmed = (dateAdministered || '').trim();
    if (trimmed !== '') {
      const err = validateDate(trimmed, false, 'Administered date');
      if (err) return res.status(400).json({ message: err });
      updates.dateAdministered = sanitizeInput(trimmed);
    } else {
      updates.dateAdministered = '';
    }
  }

  if (dateDue !== undefined) {
    const trimmed = (dateDue || '').trim();
    const err = validateDate(trimmed, true, 'Due date');
    if (err) return res.status(400).json({ message: err });
    updates.dateDue = sanitizeInput(trimmed);
  }

  if (status !== undefined) {
    updates.status = sanitizeInput((status || '').trim());
  }

  if (notes !== undefined) {
    const trimmed = (notes || '').trim();
    if (trimmed !== '') {
      const err = validateTextarea(trimmed, 1, 1000, 'Notes');
      if (err) return res.status(400).json({ message: err });
      updates.notes = sanitizeInput(trimmed);
    } else {
      updates.notes = '';
    }
  }

  try {
    const vaccine = await Vaccination.findById(req.params.id);
    if (!vaccine) {
      return res.status(404).json({ message: 'Vaccination record not found' });
    }

    const isOwner = await verifyPetOwnership(vaccine.petId, req.user.id);
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized to modify this record' });
    }

    const updatedVaccine = await Vaccination.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json(updatedVaccine);
  } catch (err) {
    console.error('Update vaccination error:', err);
    res.status(500).json({ message: 'Server error updating vaccination record' });
  }
});

// @route   DELETE api/vaccinations/:id
// @desc    Delete vaccination record
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const vaccine = await Vaccination.findById(req.params.id);
    if (!vaccine) {
      return res.status(404).json({ message: 'Vaccination record not found' });
    }

    const isOwner = await verifyPetOwnership(vaccine.petId, req.user.id);
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized to delete this record' });
    }

    await Vaccination.findByIdAndDelete(req.params.id);
    res.json({ message: 'Vaccination record deleted successfully' });
  } catch (err) {
    console.error('Delete vaccination error:', err);
    res.status(500).json({ message: 'Server error deleting record' });
  }
});

export default router;
