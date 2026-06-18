import express from 'express';
import { LostFoundReport, User } from '../db/db.js';
import { auth } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import multer from 'multer';
import { validateName, validateTextarea, validateDate, validatePhone, validateSearch, sanitizeInput } from '../utils/validation.js';

const router = express.Router();

// @route   GET api/reports
// @desc    Get all lost & found reports (with query filters)
// @access  Public
router.get('/', async (req, res) => {
  const { type, species, location, status } = req.query;
  
  try {
    if (species && validateSearch(species)) {
      return res.status(400).json({ message: 'Invalid characters in species query' });
    }
    if (location && validateSearch(location)) {
      return res.status(400).json({ message: 'Invalid characters in location query' });
    }

    const reports = await LostFoundReport.find({});
    
    // Perform filtering in memory for maximum safety across both database modes
    let filtered = reports;

    if (type) {
      filtered = filtered.filter(r => r.type === type);
    }
    if (species) {
      filtered = filtered.filter(r => r.species.toLowerCase() === species.toLowerCase());
    }
    if (location) {
      filtered = filtered.filter(r => r.location.toLowerCase().includes(location.toLowerCase()));
    }
    if (status) {
      filtered = filtered.filter(r => r.status === status);
    }

    // Attach reporter contact names
    const users = await User.find({});
    const userMap = users.reduce((acc, u) => {
      acc[u._id || u.id] = { name: u.name, email: u.email };
      return acc;
    }, {});

    const formatted = filtered.map(doc => {
      const r = doc.toObject ? doc.toObject() : doc;
      return {
        ...r,
        reporter: userMap[r.userId] || { name: 'Unknown User', email: '' }
      };
    });

    // Sort by newest first
    formatted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(formatted);
  } catch (err) {
    console.error('Fetch reports error:', err);
    res.status(500).json({ message: 'Server error fetching reports' });
  }
});

// @route   GET api/reports/:id
// @desc    Get report by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const report = await LostFoundReport.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    const reporter = await User.findById(report.userId);
    const reportObj = report.toObject ? report.toObject() : report;
    res.json({
      ...reportObj,
      reporter: reporter ? { name: reporter.name, email: reporter.email } : { name: 'Unknown User', email: '' }
    });
  } catch (err) {
    console.error('Fetch report detail error:', err);
    res.status(500).json({ message: 'Server error fetching report details' });
  }
});

// @route   POST api/reports
// @desc    Create lost/found report
// @access  Private
router.post('/', auth, (req, res, next) => {
  upload.single('photo')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File size exceeds the 5 MB limit!' });
      }
      return res.status(400).json({ message: err.message });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
}, async (req, res) => {
  let { type, petName, species, breed, description, location, dateLostFound, contactPhone } = req.body;

  try {
    if (!type || !species || !description || !location || !dateLostFound || !contactPhone) {
      return res.status(400).json({ message: 'Please provide type, species, description, location, date, and contact phone' });
    }

    type = (type || '').trim();
    petName = (petName || '').trim();
    species = (species || '').trim();
    breed = (breed || '').trim();
    description = (description || '').trim();
    location = (location || '').trim();
    dateLostFound = (dateLostFound || '').trim();
    contactPhone = (contactPhone || '').trim();

    if (type !== 'lost' && type !== 'found') {
      return res.status(400).json({ message: 'Report type must be lost or found' });
    }

    if (petName && petName.toLowerCase() !== 'unknown') {
      const petNameErr = validateName(petName, 'Pet name');
      if (petNameErr) return res.status(400).json({ message: petNameErr });
    }

    const speciesErr = validateName(species, 'Species');
    if (speciesErr) return res.status(400).json({ message: speciesErr });

    if (breed && breed.toLowerCase() !== 'unknown') {
      const breedErr = validateName(breed, 'Breed');
      if (breedErr) return res.status(400).json({ message: breedErr });
    }

    const descErr = validateTextarea(description, 10, 1000, 'Description');
    if (descErr) return res.status(400).json({ message: descErr });

    const locErr = validateTextarea(location, 2, 200, 'Location');
    if (locErr) return res.status(400).json({ message: locErr });

    const dateErr = validateDate(dateLostFound, false, 'Date');
    if (dateErr) return res.status(400).json({ message: dateErr });

    const phoneErr = validatePhone(contactPhone, 'Contact phone');
    if (phoneErr) return res.status(400).json({ message: phoneErr });

    const sanitizedPetName = petName ? sanitizeInput(petName) : 'Unknown';
    const sanitizedSpecies = sanitizeInput(species);
    const sanitizedBreed = breed ? sanitizeInput(breed) : 'Unknown';
    const sanitizedDesc = sanitizeInput(description);
    const sanitizedLoc = sanitizeInput(location);
    const sanitizedDate = sanitizeInput(dateLostFound);
    const sanitizedPhone = sanitizeInput(contactPhone);

    const defaultPhoto = type === 'lost' 
      ? 'https://images.unsplash.com/photo-1537151608828-ea2b117b6281?w=500&auto=format&fit=crop&q=60' // Lost pet search
      : 'https://images.unsplash.com/photo-1444212477490-ca407925329e?w=500&auto=format&fit=crop&q=60'; // Found stray

    const photoPath = req.file ? `/uploads/${req.file.filename}` : defaultPhoto;

    const newReport = await LostFoundReport.create({
      userId: req.user.id,
      type,
      petName: sanitizedPetName,
      species: sanitizedSpecies,
      breed: sanitizedBreed,
      description: sanitizedDesc,
      location: sanitizedLoc,
      dateLostFound: sanitizedDate,
      contactPhone: sanitizedPhone,
      photo: photoPath,
      status: 'active'
    });

    res.status(201).json(newReport);
  } catch (err) {
    console.error('Create report error:', err);
    res.status(500).json({ message: 'Server error creating report' });
  }
});

// @route   PUT api/reports/:id
// @desc    Update report (resolved status, description, etc.)
// @access  Private
router.put('/:id', auth, (req, res, next) => {
  upload.single('photo')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File size exceeds the 5 MB limit!' });
      }
      return res.status(400).json({ message: err.message });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
}, async (req, res) => {
  let { petName, species, breed, description, location, dateLostFound, contactPhone, status } = req.body;
  const updates = {};

  if (petName !== undefined) {
    const trimmed = (petName || '').trim();
    if (trimmed !== '' && trimmed.toLowerCase() !== 'unknown') {
      const err = validateName(trimmed, 'Pet name');
      if (err) return res.status(400).json({ message: err });
      updates.petName = sanitizeInput(trimmed);
    } else {
      updates.petName = 'Unknown';
    }
  }

  if (species !== undefined) {
    const trimmed = (species || '').trim();
    const err = validateName(trimmed, 'Species');
    if (err) return res.status(400).json({ message: err });
    updates.species = sanitizeInput(trimmed);
  }

  if (breed !== undefined) {
    const trimmed = (breed || '').trim();
    if (trimmed !== '' && trimmed.toLowerCase() !== 'unknown') {
      const err = validateName(trimmed, 'Breed');
      if (err) return res.status(400).json({ message: err });
      updates.breed = sanitizeInput(trimmed);
    } else {
      updates.breed = 'Unknown';
    }
  }

  if (description !== undefined) {
    const trimmed = (description || '').trim();
    const err = validateTextarea(trimmed, 10, 1000, 'Description');
    if (err) return res.status(400).json({ message: err });
    updates.description = sanitizeInput(trimmed);
  }

  if (location !== undefined) {
    const trimmed = (location || '').trim();
    const err = validateTextarea(trimmed, 2, 200, 'Location');
    if (err) return res.status(400).json({ message: err });
    updates.location = sanitizeInput(trimmed);
  }

  if (dateLostFound !== undefined) {
    const trimmed = (dateLostFound || '').trim();
    const err = validateDate(trimmed, false, 'Date');
    if (err) return res.status(400).json({ message: err });
    updates.dateLostFound = sanitizeInput(trimmed);
  }

  if (contactPhone !== undefined) {
    const trimmed = (contactPhone || '').trim();
    const err = validatePhone(trimmed, 'Contact phone');
    if (err) return res.status(400).json({ message: err });
    updates.contactPhone = sanitizeInput(trimmed);
  }

  if (status !== undefined) {
    updates.status = sanitizeInput((status || '').trim());
  }

  if (req.file) {
    updates.photo = `/uploads/${req.file.filename}`;
  }

  try {
    const report = await LostFoundReport.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Check ownership or admin
    if (report.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized to update this report' });
    }

    const updatedReport = await LostFoundReport.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json(updatedReport);
  } catch (err) {
    console.error('Update report error:', err);
    res.status(500).json({ message: 'Server error updating report' });
  }
});

// @route   DELETE api/reports/:id
// @desc    Delete report
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const report = await LostFoundReport.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Check ownership or admin
    if (report.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized to delete this report' });
    }

    await LostFoundReport.findByIdAndDelete(req.params.id);
    res.json({ message: 'Report deleted successfully' });
  } catch (err) {
    console.error('Delete report error:', err);
    res.status(500).json({ message: 'Server error deleting report' });
  }
});

export default router;
