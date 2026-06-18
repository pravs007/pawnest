import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './db/db.js';

// Route imports
import authRoutes from './routes/auth.js';
import petRoutes from './routes/pets.js';
import vaccinationRoutes from './routes/vaccinations.js';
import reportRoutes from './routes/reports.js';
import rescueRoutes from './routes/rescues.js';
import aiRoutes from './routes/ai.js';
import adminRoutes from './routes/admin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Database
connectDB();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Support base64 image uploads
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/vaccinations', vaccinationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/rescues', rescueRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);

// Health Check Route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    databaseMode: process.env.USE_LOCAL_DB === 'true' ? 'local-json-files' : 'mongodb'
  });
});

// Serve static assets in production (Placeholder)
app.get('/', (req, res) => {
  res.send('PawNest API is running smoothly.');
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`🐾 Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
