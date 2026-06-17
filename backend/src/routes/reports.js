import express from 'express';
import { LostFoundReport, User } from '../db/db.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// @route   GET api/reports
// @desc    Get all lost & found reports (with query filters)
// @access  Public
router.get('/', async (req, res) => {
  const { type, species, location, status } = req.query;
  
  try {
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

    const formatted = filtered.map(r => ({
      ...r,
      reporter: userMap[r.userId] || { name: 'Unknown User', email: '' }
    }));

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
    res.json({
      ...report,
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
router.post('/', auth, async (req, res) => {
  const { type, petName, species, breed, description, location, dateLostFound, contactPhone, photo } = req.body;

  try {
    if (!type || !species || !description || !location || !dateLostFound || !contactPhone) {
      return res.status(400).json({ message: 'Please provide type, species, description, location, date, and contact phone' });
    }

    const defaultPhoto = type === 'lost' 
      ? 'https://images.unsplash.com/photo-1537151608828-ea2b117b6281?w=500&auto=format&fit=crop&q=60' // Lost pet search
      : 'https://images.unsplash.com/photo-1444212477490-ca407925329e?w=500&auto=format&fit=crop&q=60'; // Found stray

    const newReport = await LostFoundReport.create({
      userId: req.user.id,
      type,
      petName: petName || 'Unknown',
      species,
      breed: breed || 'Unknown',
      description,
      location,
      dateLostFound,
      contactPhone,
      photo: photo || defaultPhoto,
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
router.put('/:id', auth, async (req, res) => {
  const { petName, species, breed, description, location, dateLostFound, contactPhone, photo, status } = req.body;
  const updates = {};

  if (petName) updates.petName = petName;
  if (species) updates.species = species;
  if (breed) updates.breed = breed;
  if (description) updates.description = description;
  if (location) updates.location = location;
  if (dateLostFound) updates.dateLostFound = dateLostFound;
  if (contactPhone) updates.contactPhone = contactPhone;
  if (photo) updates.photo = photo;
  if (status) updates.status = status;

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
