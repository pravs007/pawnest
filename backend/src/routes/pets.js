import express from 'express';
import { Pet, Vaccination } from '../db/db.js';
import { auth } from '../middleware/auth.js';
import { validateName, validateNumber, validateTextarea, sanitizeInput } from '../utils/validation.js';

const router = express.Router();

// @route   GET api/pets
// @desc    Get all user's pets
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const pets = await Pet.find({ owner: req.user.id });
    res.json(pets);
  } catch (err) {
    console.error('Fetch pets error:', err);
    res.status(500).json({ message: 'Server error fetching pets' });
  }
});

// @route   GET api/pets/:id
// @desc    Get pet by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const pet = await Pet.findById(req.id || req.params.id);
    if (!pet) {
      return res.status(404).json({ message: 'Pet not found' });
    }
    
    // Check ownership
    if (pet.owner !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized to view this pet' });
    }

    res.json(pet);
  } catch (err) {
    console.error('Fetch pet detail error:', err);
    res.status(500).json({ message: 'Server error fetching pet details' });
  }
});

// @route   POST api/pets
// @desc    Add new pet
// @access  Private
router.post('/', auth, async (req, res) => {
  let { name, breed, age, weight, medicalNotes, photo } = req.body;

  try {
    if (!name || !breed || !age || !weight) {
      return res.status(400).json({ message: 'Please provide name, breed, age, and weight' });
    }

    name = (name || '').trim();
    breed = (breed || '').trim();
    age = String(age || '').trim();
    weight = String(weight || '').trim();

    const nameErr = validateName(name, 'Pet name');
    const breedErr = validateName(breed, 'Breed');
    const ageErr = validateNumber(age, 0, 30, 'Age');
    const weightErr = validateNumber(weight, 0, 150, 'Weight');

    if (nameErr || breedErr || ageErr || weightErr) {
      return res.status(400).json({
        message: nameErr || breedErr || ageErr || weightErr
      });
    }

    if (medicalNotes !== undefined && medicalNotes.trim() !== '') {
      const notesErr = validateTextarea(medicalNotes.trim(), 1, 1000, 'Medical notes');
      if (notesErr) {
        return res.status(400).json({ message: notesErr });
      }
    }

    const sanitizedName = sanitizeInput(name);
    const sanitizedBreed = sanitizeInput(breed);
    const sanitizedAge = sanitizeInput(age);
    const sanitizedWeight = sanitizeInput(weight);
    const sanitizedNotes = medicalNotes ? sanitizeInput(medicalNotes.trim()) : '';
    const sanitizedPhoto = photo ? sanitizeInput(photo.trim()) : '';

    const defaultPhoto = 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'; // Cute puppy default

    const newPet = await Pet.create({
      owner: req.user.id,
      name: sanitizedName,
      breed: sanitizedBreed,
      age: sanitizedAge,
      weight: sanitizedWeight,
      medicalNotes: sanitizedNotes,
      photo: sanitizedPhoto || defaultPhoto
    });

    res.status(201).json(newPet);
  } catch (err) {
    console.error('Create pet error:', err);
    res.status(500).json({ message: 'Server error adding pet' });
  }
});

// @route   PUT api/pets/:id
// @desc    Update pet details
// @access  Private
router.put('/:id', auth, async (req, res) => {
  let { name, breed, age, weight, medicalNotes, photo } = req.body;
  const updates = {};
  
  if (name !== undefined) {
    const trimmed = (name || '').trim();
    const err = validateName(trimmed, 'Pet name');
    if (err) return res.status(400).json({ message: err });
    updates.name = sanitizeInput(trimmed);
  }
  
  if (breed !== undefined) {
    const trimmed = (breed || '').trim();
    const err = validateName(trimmed, 'Breed');
    if (err) return res.status(400).json({ message: err });
    updates.breed = sanitizeInput(trimmed);
  }

  if (age !== undefined) {
    const trimmed = String(age || '').trim();
    const err = validateNumber(trimmed, 0, 30, 'Age');
    if (err) return res.status(400).json({ message: err });
    updates.age = sanitizeInput(trimmed);
  }

  if (weight !== undefined) {
    const trimmed = String(weight || '').trim();
    const err = validateNumber(trimmed, 0, 150, 'Weight');
    if (err) return res.status(400).json({ message: err });
    updates.weight = sanitizeInput(trimmed);
  }

  if (medicalNotes !== undefined) {
    const trimmed = (medicalNotes || '').trim();
    if (trimmed !== '') {
      const err = validateTextarea(trimmed, 1, 1000, 'Medical notes');
      if (err) return res.status(400).json({ message: err });
      updates.medicalNotes = sanitizeInput(trimmed);
    } else {
      updates.medicalNotes = '';
    }
  }

  if (photo !== undefined) {
    updates.photo = sanitizeInput(photo.trim());
  }

  try {
    let pet = await Pet.findById(req.params.id);
    if (!pet) {
      return res.status(404).json({ message: 'Pet not found' });
    }

    // Check ownership
    if (pet.owner !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized to update this pet' });
    }

    const updatedPet = await Pet.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json(updatedPet);
  } catch (err) {
    console.error('Update pet error:', err);
    res.status(500).json({ message: 'Server error updating pet' });
  }
});

// @route   DELETE api/pets/:id
// @desc    Delete a pet
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id);
    if (!pet) {
      return res.status(404).json({ message: 'Pet not found' });
    }

    // Check ownership
    if (pet.owner !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized to delete this pet' });
    }

    // Delete associated vaccinations
    await Vaccination.deleteMany({ petId: req.params.id });

    // Delete pet
    await Pet.findByIdAndDelete(req.params.id);

    res.json({ message: 'Pet and associated vaccination records removed successfully' });
  } catch (err) {
    console.error('Delete pet error:', err);
    res.status(500).json({ message: 'Server error deleting pet' });
  }
});

export default router;
