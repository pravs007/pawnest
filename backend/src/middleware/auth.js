import jwt from 'jsonwebtoken';
import { User } from '../db/db.js';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'pawnest_super_secret_jwt_key_987654321';

export const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Fetch user from DB to verify they still exist and attach role
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'User not found, authorization denied' });
    }

    req.user = {
      id: user._id || user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is invalid or expired, access denied' });
  }
};

export const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Admin permissions required' });
  }
};
