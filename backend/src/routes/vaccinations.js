import express from 'express';
import { Vaccination, Pet } from '../db/db.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

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
  const { petId, name, dateAdministered, dateDue, status, notes } = req.body;

  try {
    if (!petId || !name || !dateDue) {
      return res.status(400).json({ message: 'Please provide petId, name, and upcoming due date' });
    }

    const isOwner = await verifyPetOwnership(petId, req.user.id);
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized to add records for this pet' });
    }

    const newVaccine = await Vaccination.create({
      petId,
      name,
      dateAdministered: dateAdministered || '',
      dateDue,
      status: status || 'Pending',
      notes: notes || ''
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
  const { name, dateAdministered, dateDue, status, notes } = req.body;
  const updates = {};

  if (name) updates.name = name;
  if (dateAdministered !== undefined) updates.dateAdministered = dateAdministered;
  if (dateDue) updates.dateDue = dateDue;
  if (status) updates.status = status;
  if (notes !== undefined) updates.notes = notes;

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
