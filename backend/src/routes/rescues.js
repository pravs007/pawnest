import express from 'express';
import { RescueRequest } from '../db/db.js';
import { auth, admin } from '../middleware/auth.js';

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
router.post('/', async (req, res) => {
  const { reporterName, reporterPhone, species, description, location, severity, photo } = req.body;

  try {
    if (!reporterName || !reporterPhone || !species || !description || !location) {
      return res.status(400).json({ message: 'Please provide reporter details, species, description, and location' });
    }

    const defaultPhoto = 'https://images.unsplash.com/photo-1599113697920-562b76928e1d?w=500&auto=format&fit=crop&q=60'; // General animal rescue image

    const newRescue = await RescueRequest.create({
      reporterName,
      reporterPhone,
      species,
      description,
      location,
      severity: severity || 'medium',
      photo: photo || defaultPhoto,
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
  const { status, assignedRescuer, severity } = req.body;
  const updates = {};

  if (status) updates.status = status;
  if (assignedRescuer !== undefined) updates.assignedRescuer = assignedRescuer;
  if (severity) updates.severity = severity;

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
