import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../db/db.js';
import { auth } from '../middleware/auth.js';
import dotenv from 'dotenv';
import { validateName, validateEmail, validatePassword, sanitizeInput } from '../utils/validation.js';

dotenv.config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'pawnest_super_secret_jwt_key_987654321';

// @route   POST api/auth/register
// @desc    Register a user
// @access  Public
router.post('/register', async (req, res) => {
  let { name, email, password, avatar } = req.body;

  try {
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please enter all required fields' });
    }

    name = (name || '').trim();
    email = (email || '').trim();
    password = (password || '');

    const nameErr = validateName(name, 'Name');
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);

    if (nameErr || emailErr || passwordErr) {
      return res.status(400).json({
        message: nameErr || emailErr || passwordErr,
        errors: { name: nameErr, email: emailErr, password: passwordErr }
      });
    }

    const sanitizedName = sanitizeInput(name);
    const sanitizedEmail = sanitizeInput(email);

    // Check if user exists
    const existingUser = await User.findOne({ email: sanitizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Check if this is the first user (if so, make them an admin)
    const userCount = await User.countDocuments({});
    const role = userCount === 0 ? 'admin' : 'user';

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = await User.create({
      name: sanitizedName,
      email: sanitizedEmail,
      password: hashedPassword,
      role,
      avatar: avatar ? sanitizeInput(avatar) : `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(sanitizedName)}`
    });

    // Sign JWT
    const token = jwt.sign({ id: newUser._id || newUser.id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: {
        id: newUser._id || newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        avatar: newUser.avatar
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  let { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'Please enter email and password' });
    }

    email = (email || '').trim();
    password = (password || '');

    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);

    if (emailErr || passwordErr) {
      return res.status(400).json({
        message: emailErr || passwordErr,
        errors: { email: emailErr, password: passwordErr }
      });
    }

    const sanitizedEmail = sanitizeInput(email);

    // Check if user exists
    const user = await User.findOne({ email: sanitizedEmail });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Sign JWT
    const token = jwt.sign({ id: user._id || user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// @route   GET api/auth/me
// @desc    Get user data
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      id: user._id || user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching profile' });
  }
});

// @route   PUT api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, async (req, res) => {
  let { name, email, avatar, password } = req.body;
  const updates = {};

  if (name !== undefined) {
    const trimmed = (name || '').trim();
    const nameErr = validateName(trimmed, 'Name');
    if (nameErr) {
      return res.status(400).json({ message: nameErr });
    }
    updates.name = sanitizeInput(trimmed);
  }

  if (email !== undefined) {
    const trimmed = (email || '').trim();
    const emailErr = validateEmail(trimmed);
    if (emailErr) {
      return res.status(400).json({ message: emailErr });
    }
    const sanitizedEmail = sanitizeInput(trimmed);
    // Check if email taken by someone else
    const emailUser = await User.findOne({ email: sanitizedEmail });
    if (emailUser && emailUser._id.toString() !== req.user.id) {
      return res.status(400).json({ message: 'Email is already taken by another account' });
    }
    updates.email = sanitizedEmail;
  }

  if (avatar !== undefined) {
    updates.avatar = sanitizeInput(avatar);
  }

  if (password !== undefined && password !== '') {
    const passwordErr = validatePassword(password);
    if (passwordErr) {
      return res.status(400).json({ message: passwordErr });
    }
    const salt = await bcrypt.genSalt(10);
    updates.password = await bcrypt.hash(password, salt);
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(req.user.id, updates, { new: true });
    res.json({
      id: updatedUser._id || updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      avatar: updatedUser.avatar
    });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ message: 'Server error updating profile' });
  }
});

export default router;
