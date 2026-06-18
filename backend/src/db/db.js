import mongoose from 'mongoose';
import { getLocalModel } from './localDb.js';
import dotenv from 'dotenv';

dotenv.config();

console.log("🐾 DB System: Startup database mode is", process.env.USE_LOCAL_DB === 'true' ? 'Local JSON' : 'MongoDB Atlas');

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

const MongooseUser = mongoose.model('User', userSchema);
const MongoosePet = mongoose.model('Pet', petSchema);
const MongooseVaccination = mongoose.model('Vaccination', vaccinationSchema);
const MongooseLostFoundReport = mongoose.model('LostFoundReport', lostFoundSchema);
const MongooseRescueRequest = mongoose.model('RescueRequest', rescueSchema);

// ----------------------------------------------------
// 2. EXPORTED DUAL MODELS & DB CONNECTION HELPERS
// ----------------------------------------------------

// Helper to dynamically select local vs mongoose model at query time
const getModel = (name, mongooseModel) => {
  return new Proxy({}, {
    get(target, prop) {
      const activeModel = (process.env.USE_LOCAL_DB === 'true') 
        ? getLocalModel(name) 
        : mongooseModel;
      
      const value = activeModel[prop];
      if (typeof value === 'function') {
        return value.bind(activeModel);
      }
      return value;
    }
  });
};

export const User = getModel('User', MongooseUser);
export const Pet = getModel('Pet', MongoosePet);
export const Vaccination = getModel('Vaccination', MongooseVaccination);
export const LostFoundReport = getModel('LostFoundReport', MongooseLostFoundReport);
export const RescueRequest = getModel('RescueRequest', MongooseRescueRequest);

export const connectDB = async () => {
  if (process.env.USE_LOCAL_DB === 'true') {
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

    // Enable local DB fallback by updating the flag
    process.env.USE_LOCAL_DB = 'true';
    return false;
  }
};
