import mongoose from 'mongoose';
import { getLocalModel } from './localDb.js';
import dotenv from 'dotenv';

dotenv.config();

const useLocal = process.env.USE_LOCAL_DB === 'true';

// ----------------------------------------------------
// 1. MONGOOSE SCHEMA & MODEL DEFINITIONS
// ----------------------------------------------------

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  avatar: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

const petSchema = new mongoose.Schema({
  owner: { type: String, required: true }, // Store userId as string for compatibility
  name: { type: String, required: true },
  breed: { type: String, required: true },
  age: { type: String, required: true },
  weight: { type: String, required: true },
  medicalNotes: { type: String, default: '' },
  photo: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

const vaccinationSchema = new mongoose.Schema({
  petId: { type: String, required: true },
  name: { type: String, required: true },
  dateAdministered: { type: String, required: true },
  dateDue: { type: String, required: true },
  status: { type: String, enum: ['Completed', 'Pending'], default: 'Pending' },
  notes: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

const lostFoundSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  type: { type: String, enum: ['lost', 'found'], required: true },
  petName: { type: String, default: 'Unknown' },
  species: { type: String, required: true },
  breed: { type: String, default: 'Unknown' },
  description: { type: String, required: true },
  location: { type: String, required: true },
  dateLostFound: { type: String, required: true },
  contactPhone: { type: String, required: true },
  photo: { type: String, default: '' },
  status: { type: String, enum: ['active', 'resolved'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
});

const adoptionSchema = new mongoose.Schema({
  petName: { type: String, required: true },
  species: { type: String, required: true },
  breed: { type: String, required: true },
  age: { type: String, required: true },
  description: { type: String, required: true },
  photo: { type: String, default: '' },
  status: { type: String, enum: ['available', 'adopted'], default: 'available' },
  submittedBy: { type: String, required: true }, // userId
  requests: [{
    userId: String,
    name: String,
    email: String,
    note: String,
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
});

const rescueSchema = new mongoose.Schema({
  reporterName: { type: String, required: true },
  reporterPhone: { type: String, required: true },
  species: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: String, required: true },
  severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  photo: { type: String, default: '' },
  status: { type: String, enum: ['reported', 'dispatched', 'rescued', 'cancelled'], default: 'reported' },
  assignedRescuer: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

let MongooseUser, MongoosePet, MongooseVaccination, MongooseLostFoundReport, MongooseAdoptionListing, MongooseRescueRequest;

if (!useLocal) {
  MongooseUser = mongoose.model('User', userSchema);
  MongoosePet = mongoose.model('Pet', petSchema);
  MongooseVaccination = mongoose.model('Vaccination', vaccinationSchema);
  MongooseLostFoundReport = mongoose.model('LostFoundReport', lostFoundSchema);
  MongooseAdoptionListing = mongoose.model('AdoptionListing', adoptionSchema);
  MongooseRescueRequest = mongoose.model('RescueRequest', rescueSchema);
}

// ----------------------------------------------------
// 2. EXPORTED DUAL MODELS & DB CONNECTION HELPERS
// ----------------------------------------------------

export const User = useLocal ? getLocalModel('User') : MongooseUser;
export const Pet = useLocal ? getLocalModel('Pet') : MongoosePet;
export const Vaccination = useLocal ? getLocalModel('Vaccination') : MongooseVaccination;
export const LostFoundReport = useLocal ? getLocalModel('LostFoundReport') : MongooseLostFoundReport;
export const AdoptionListing = useLocal ? getLocalModel('AdoptionListing') : MongooseAdoptionListing;
export const RescueRequest = useLocal ? getLocalModel('RescueRequest') : MongooseRescueRequest;

export const connectDB = async () => {
  if (useLocal) {
    console.log('🐾 DB System: Running in Local JSON Database Mode (Persisted in backend/data/*.json)');
    return true;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`🐾 DB System: MongoDB connected successfully to host: ${conn.connection.host}`);
    return true;
  } catch (err) {
    console.error(`🚨 MongoDB Connection Error: ${err.message}`);
    console.log('🐾 DB System Fallback: Reverting to Local JSON Database Mode');
    
    // Dynamically override models to use local DB fallback
    global.USE_LOCAL_FALLBACK = true;
    return false;
  }
};
