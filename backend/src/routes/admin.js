import express from 'express';
import { User, Pet, RescueRequest, AdoptionListing, Vaccination } from '../db/db.js';
import { auth, admin } from '../middleware/auth.js';

const router = express.Router();

// @route   GET api/admin/stats
// @desc    Get dashboard metrics and analytics statistics
// @access  Private (Admin Only)
router.get('/stats', auth, admin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({});
    const totalPets = await Pet.countDocuments({});
    const totalRescues = await RescueRequest.countDocuments({});
    const totalAdoptions = await AdoptionListing.countDocuments({});

    // Rescue requests breakdown
    const rescues = await RescueRequest.find({});
    const rescueStats = {
      reported: rescues.filter(r => r.status === 'reported').length,
      dispatched: rescues.filter(r => r.status === 'dispatched').length,
      rescued: rescues.filter(r => r.status === 'rescued').length,
      cancelled: rescues.filter(r => r.status === 'cancelled').length,
    };

    // Severity breakdown
    const severityStats = {
      low: rescues.filter(r => r.severity === 'low').length,
      medium: rescues.filter(r => r.severity === 'medium').length,
      high: rescues.filter(r => r.severity === 'high').length,
      critical: rescues.filter(r => r.severity === 'critical').length,
    };

    // Adoption listings breakdown
    const adoptions = await AdoptionListing.find({});
    const adoptionStats = {
      available: adoptions.filter(a => a.status === 'available').length,
      adopted: adoptions.filter(a => a.status === 'adopted').length,
    };

    res.json({
      totalUsers,
      totalPets,
      totalRescues,
      totalAdoptions,
      rescueStats,
      severityStats,
      adoptionStats
    });
  } catch (err) {
    console.error('Fetch admin stats error:', err);
    res.status(500).json({ message: 'Server error generating platform analytics' });
  }
});

// @route   GET api/admin/users
// @desc    Get all users list
// @access  Private (Admin Only)
router.get('/users', auth, admin, async (req, res) => {
  try {
    const users = await User.find({});
    // Remove passwords before returning
    const sanitized = users.map(u => ({
      id: u._id || u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      avatar: u.avatar,
      createdAt: u.createdAt
    }));
    res.json(sanitized);
  } catch (err) {
    console.error('Fetch users error:', err);
    res.status(500).json({ message: 'Server error fetching user list' });
  }
});

// @route   PUT api/admin/users/:id/role
// @desc    Toggle user role (user <-> admin)
// @access  Private (Admin Only)
router.put('/users/:id/role', auth, admin, async (req, res) => {
  try {
    // Prevent admin from removing their own admin status
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: 'You cannot change your own admin role' });
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const newRole = targetUser.role === 'admin' ? 'user' : 'admin';
    const updatedUser = await User.findByIdAndUpdate(req.params.id, { role: newRole }, { new: true });

    res.json({
      id: updatedUser._id || updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role
    });
  } catch (err) {
    console.error('Toggle role error:', err);
    res.status(500).json({ message: 'Server error updating user role' });
  }
});

// @route   DELETE api/admin/users/:id
// @desc    Delete user and their pets/data
// @access  Private (Admin Only)
router.delete('/users/:id', auth, admin, async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: 'You cannot delete your own admin account' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 1. Delete user's pets
    const pets = await Pet.find({ owner: req.params.id });
    const petIds = pets.map(p => p._id || p.id);
    
    if (petIds.length > 0) {
      // Delete vaccinations for all user's pets
      for (const petId of petIds) {
        await Vaccination.deleteMany({ petId });
      }
      // Delete user's pets
      await Pet.deleteMany({ owner: req.params.id });
    }

    // 2. Delete adoption listings submitted by user
    await AdoptionListing.deleteMany({ submittedBy: req.params.id });

    // 3. Delete lost/found reports submitted by user
    await LostFoundReport.deleteMany({ userId: req.params.id });

    // 4. Delete user account
    await User.findByIdAndDelete(req.params.id);

    res.json({ message: 'User and all associated data deleted successfully' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ message: 'Server error deleting user and user data' });
  }
});

export default router;
