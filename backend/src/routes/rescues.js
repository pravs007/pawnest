import express from 'express';
import { RescueRequest } from '../db/db.js';
import { auth, admin } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import multer from 'multer';
import { validateName, validatePhone, validateTextarea, sanitizeInput } from '../utils/validation.js';

const router = express.Router();

// @route   GET api/rescues
// @desc    Get all rescue requests (community tracking)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const rescues = await RescueRequest.find({});
    // Sort by status priority (reported/dispatched first) and then date
    rescues.sort((a, b) => {
      const priorityMap = { 'reported': 1, 'dispatched': 2, 'rescued': 3, 'cancelled': 4 };
      const priorityA = priorityMap[a.status] || 9;
      const priorityB = priorityMap[b.status] || 9;
      if (priorityA !== priorityB) return priorityA - priorityB;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    res.json(rescues);
  } catch (err) {
    console.error('Fetch rescues error:', err);
    res.status(500).json({ message: 'Server error fetching rescue reports' });
  }
});

// @route   GET api/rescues/:id
// @desc    Get details of a rescue request
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const rescue = await RescueRequest.findById(req.params.id);
    if (!rescue) {
      return res.status(404).json({ message: 'Rescue request not found' });
    }
    res.json(rescue);
  } catch (err) {
    console.error('Fetch rescue detail error:', err);
    res.status(500).json({ message: 'Server error fetching rescue details' });
  }
});

// @route   POST api/rescues
// @desc    Submit emergency rescue request (barrier-free, no auth required to report)
// @access  Public
router.post('/', (req, res, next) => {
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
  let { reporterName, reporterPhone, species, description, location, severity } = req.body;

  try {
    if (!reporterName || !reporterPhone || !species || !description || !location) {
      return res.status(400).json({ message: 'Please provide reporter details, species, description, and location' });
    }

    reporterName = (reporterName || '').trim();
    reporterPhone = (reporterPhone || '').trim();
    species = (species || '').trim();
    description = (description || '').trim();
    location = (location || '').trim();
    severity = (severity || 'medium').trim().toLowerCase();

    const nameErr = validateName(reporterName, 'Reporter name');
    const phoneErr = validatePhone(reporterPhone, 'Reporter phone');
    const speciesErr = validateName(species, 'Species');
    const descErr = validateTextarea(description, 10, 1000, 'Incident description');
    const locErr = validateTextarea(location, 2, 200, 'Location');

    if (nameErr || phoneErr || speciesErr || descErr || locErr) {
      return res.status(400).json({
        message: nameErr || phoneErr || speciesErr || descErr || locErr
      });
    }

    const validSeverities = ['low', 'medium', 'high', 'critical'];
    if (!validSeverities.includes(severity)) {
      return res.status(400).json({ message: 'Invalid severity level' });
    }

    const sanitizedReporterName = sanitizeInput(reporterName);
    const sanitizedReporterPhone = sanitizeInput(reporterPhone);
    const sanitizedSpecies = sanitizeInput(species);
    const sanitizedDesc = sanitizeInput(description);
    const sanitizedLoc = sanitizeInput(location);
    const sanitizedSeverity = sanitizeInput(severity);

    const defaultPhoto = 'https://images.unsplash.com/photo-1599113697920-562b76928e1d?w=500&auto=format&fit=crop&q=60'; // General animal rescue image

    const photoPath = req.file ? `/uploads/${req.file.filename}` : defaultPhoto;

    const newRescue = await RescueRequest.create({
      reporterName: sanitizedReporterName,
      reporterPhone: sanitizedReporterPhone,
      species: sanitizedSpecies,
      description: sanitizedDesc,
      location: sanitizedLoc,
      severity: sanitizedSeverity,
      photo: photoPath,
      status: 'reported',
      assignedRescuer: ''
    });

    res.status(201).json(newRescue);
  } catch (err) {
    console.error('Submit rescue error:', err);
    res.status(500).json({ message: 'Server error submitting rescue request' });
  }
});

// @route   PUT api/rescues/:id
// @desc    Update rescue request status / dispatch rescuer
// @access  Private (Admin only)
router.put('/:id', auth, admin, async (req, res) => {
  let { status, assignedRescuer, severity } = req.body;
  const updates = {};

  if (status !== undefined) {
    status = (status || '').trim().toLowerCase();
    const validStatuses = ['reported', 'dispatched', 'rescued', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    updates.status = sanitizeInput(status);
  }

  if (assignedRescuer !== undefined) {
    const trimmed = (assignedRescuer || '').trim();
    if (trimmed !== '') {
      const err = validateName(trimmed, 'Rescuer name');
      if (err) return res.status(400).json({ message: err });
      updates.assignedRescuer = sanitizeInput(trimmed);
    } else {
      updates.assignedRescuer = '';
    }
  }

  if (severity !== undefined) {
    severity = (severity || '').trim().toLowerCase();
    const validSeverities = ['low', 'medium', 'high', 'critical'];
    if (!validSeverities.includes(severity)) {
      return res.status(400).json({ message: 'Invalid severity level' });
    }
    updates.severity = sanitizeInput(severity);
  }

  try {
    const rescue = await RescueRequest.findById(req.params.id);
    if (!rescue) {
      return res.status(404).json({ message: 'Rescue request not found' });
    }

    const updatedRescue = await RescueRequest.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json(updatedRescue);
  } catch (err) {
    console.error('Update rescue status error:', err);
    res.status(500).json({ message: 'Server error updating rescue request' });
  }
});

export default router;
