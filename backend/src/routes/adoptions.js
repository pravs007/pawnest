import express from 'express';
import { AdoptionListing, User } from '../db/db.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// @route   GET api/adoptions
// @desc    Get all adoption listings
// @access  Public
router.get('/', async (req, res) => {
  try {
    const listings = await AdoptionListing.find({});
    // Sort by available first, then newest
    listings.sort((a, b) => {
      if (a.status === 'available' && b.status === 'adopted') return -1;
      if (a.status === 'adopted' && b.status === 'available') return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    res.json(listings);
  } catch (err) {
    console.error('Fetch adoptions error:', err);
    res.status(500).json({ message: 'Server error fetching adoption listings' });
  }
});

// @route   GET api/adoptions/:id
// @desc    Get adoption listing by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const listing = await AdoptionListing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ message: 'Adoption listing not found' });
    }
    
    // Attach listing submitter info
    const submitter = await User.findById(listing.submittedBy);
    const listingWithSubmitter = {
      ...listing,
      contact: submitter ? { name: submitter.name, email: submitter.email } : { name: 'PawNest Support', email: 'support@pawnest.com' }
    };

    res.json(listingWithSubmitter);
  } catch (err) {
    console.error('Fetch adoption detail error:', err);
    res.status(500).json({ message: 'Server error fetching listing details' });
  }
});

// @route   POST api/adoptions
// @desc    Create an adoption listing
// @access  Private
router.post('/', auth, async (req, res) => {
  const { petName, species, breed, age, description, photo } = req.body;

  try {
    if (!petName || !species || !breed || !age || !description) {
      return res.status(400).json({ message: 'Please enter all required fields' });
    }

    const defaultPhoto = 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500&auto=format&fit=crop&q=60'; // Cute cat default

    const newListing = await AdoptionListing.create({
      petName,
      species,
      breed,
      age,
      description,
      photo: photo || defaultPhoto,
      status: 'available',
      submittedBy: req.user.id,
      requests: []
    });

    res.status(201).json(newListing);
  } catch (err) {
    console.error('Create adoption listing error:', err);
    res.status(500).json({ message: 'Server error creating adoption listing' });
  }
});

// @route   PUT api/adoptions/:id
// @desc    Update adoption listing details
// @access  Private
router.put('/:id', auth, async (req, res) => {
  const { petName, species, breed, age, description, photo, status } = req.body;
  const updates = {};

  if (petName) updates.petName = petName;
  if (species) updates.species = species;
  if (breed) updates.breed = breed;
  if (age) updates.age = age;
  if (description) updates.description = description;
  if (photo) updates.photo = photo;
  if (status) updates.status = status;

  try {
    const listing = await AdoptionListing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ message: 'Adoption listing not found' });
    }

    // Check ownership or admin
    if (listing.submittedBy !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized to update this listing' });
    }

    const updatedListing = await AdoptionListing.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json(updatedListing);
  } catch (err) {
    console.error('Update adoption error:', err);
    res.status(500).json({ message: 'Server error updating listing' });
  }
});

// @route   DELETE api/adoptions/:id
// @desc    Delete adoption listing
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const listing = await AdoptionListing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ message: 'Adoption listing not found' });
    }

    // Check ownership or admin
    if (listing.submittedBy !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized to delete this listing' });
    }

    await AdoptionListing.findByIdAndDelete(req.params.id);
    res.json({ message: 'Adoption listing removed successfully' });
  } catch (err) {
    console.error('Delete adoption error:', err);
    res.status(500).json({ message: 'Server error deleting listing' });
  }
});

// @route   POST api/adoptions/:id/request
// @desc    Submit adoption request for a pet
// @access  Private
router.post('/:id/request', auth, async (req, res) => {
  const { note } = req.body;

  try {
    const listing = await AdoptionListing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ message: 'Adoption listing not found' });
    }

    if (listing.status !== 'available') {
      return res.status(400).json({ message: 'Pet is no longer available for adoption' });
    }

    // Check if user already applied
    const alreadyApplied = listing.requests.some(reqs => reqs.userId === req.user.id);
    if (alreadyApplied) {
      return res.status(400).json({ message: 'You have already submitted an adoption request for this pet' });
    }

    // Create adoption request object
    const newRequest = {
      userId: req.user.id,
      name: req.user.name,
      email: req.user.email,
      note: note || 'I would love to give this beautiful pet a warm home.',
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    // Update requests array
    const updatedRequests = [...listing.requests, newRequest];
    const updatedListing = await AdoptionListing.findByIdAndUpdate(
      req.params.id,
      { requests: updatedRequests },
      { new: true }
    );

    res.json(updatedListing);
  } catch (err) {
    console.error('Submit adoption request error:', err);
    res.status(500).json({ message: 'Server error submitting application' });
  }
});

// @route   PUT api/adoptions/:id/request/:requestId
// @desc    Approve/Reject adoption request
// @access  Private
router.put('/:id/request/:requestId', auth, async (req, res) => {
  const { status } = req.body; // 'approved' or 'rejected'

  if (!status || !['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Please provide status (approved or rejected)' });
  }

  try {
    const listing = await AdoptionListing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ message: 'Adoption listing not found' });
    }

    // Check ownership of listing or admin
    if (listing.submittedBy !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized to manage applications for this listing' });
    }

    // Find the target request
    const requestIndex = listing.requests.findIndex(r => (r._id || r.id || r.userId) === req.params.requestId || r.userId === req.params.requestId);
    if (requestIndex === -1) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Clone requests and update target
    const updatedRequests = [...listing.requests];
    updatedRequests[requestIndex] = {
      ...updatedRequests[requestIndex],
      status
    };

    // Prepare updates
    const updates = { requests: updatedRequests };
    
    // If approved, set adoption status to adopted and reject other pending requests
    if (status === 'approved') {
      updates.status = 'adopted';
      // Automatically reject other pending requests
      for (let i = 0; i < updatedRequests.length; i++) {
        if (i !== requestIndex && updatedRequests[i].status === 'pending') {
          updatedRequests[i].status = 'rejected';
        }
      }
    }

    const updatedListing = await AdoptionListing.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json(updatedListing);
  } catch (err) {
    console.error('Manage application error:', err);
    res.status(500).json({ message: 'Server error managing adoption request' });
  }
});

export default router;
