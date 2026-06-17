import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', '..', 'data');

// Ensure directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

class LocalCollection {
  constructor(name) {
    this.name = name;
    this.filePath = path.join(DATA_DIR, `${name.toLowerCase()}s.json`);
    this.initFile();
  }

  initFile() {
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify([], null, 2));
    }
  }

  read() {
    this.initFile();
    try {
      const data = fs.readFileSync(this.filePath, 'utf8');
      return JSON.parse(data);
    } catch (err) {
      console.error(`Error reading database file for ${this.name}:`, err);
      return [];
    }
  }

  write(data) {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
    } catch (err) {
      console.error(`Error writing database file for ${this.name}:`, err);
    }
  }

  // Helper to make object mongoose-like
  wrapDocument(doc) {
    if (!doc) return null;
    const self = this;
    
    // Add mongoose-like _id and id properties
    const wrapped = { ...doc };
    if (!wrapped._id && wrapped.id) wrapped._id = wrapped.id;
    if (wrapped._id && !wrapped.id) wrapped.id = wrapped._id;

    // Add .save() method
    Object.defineProperty(wrapped, 'save', {
      value: async function() {
        const list = self.read();
        const idx = list.findIndex(item => item._id === this._id);
        
        // Remove helper method before saving
        const dataToSave = { ...this };
        delete dataToSave.save;

        if (idx !== -1) {
          list[idx] = dataToSave;
        } else {
          list.push(dataToSave);
        }
        self.write(list);
        return self.wrapDocument(dataToSave);
      },
      enumerable: false,
      writable: true,
      configurable: true
    });

    return wrapped;
  }

  async find(query = {}) {
    const list = this.read();
    const filtered = list.filter(item => {
      for (const key in query) {
        // Simple equal match
        if (query[key] !== undefined && item[key] !== query[key]) {
          return false;
        }
      }
      return true;
    });
    return filtered.map(item => this.wrapDocument(item));
  }

  async findOne(query = {}) {
    const list = this.read();
    const found = list.find(item => {
      for (const key in query) {
        if (query[key] !== undefined && item[key] !== query[key]) {
          return false;
        }
      }
      return true;
    });
    return found ? this.wrapDocument(found) : null;
  }

  async findById(id) {
    return this.findOne({ _id: id });
  }

  async create(data) {
    const list = this.read();
    const newDoc = {
      _id: Math.random().toString(36).substring(2, 11) + Date.now().toString(36),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    list.push(newDoc);
    this.write(list);
    return this.wrapDocument(newDoc);
  }

  async findByIdAndUpdate(id, updateData, options = { new: true }) {
    const list = this.read();
    const idx = list.findIndex(item => item._id === id);
    if (idx === -1) return null;

    // Handle Mongoose $set style or flat style update
    const actualUpdate = updateData.$set ? updateData.$set : updateData;

    list[idx] = {
      ...list[idx],
      ...actualUpdate,
      updatedAt: new Date().toISOString()
    };

    this.write(list);
    return this.wrapDocument(list[idx]);
  }

  async findByIdAndDelete(id) {
    const list = this.read();
    const idx = list.findIndex(item => item._id === id);
    if (idx === -1) return null;

    const removed = list.splice(idx, 1)[0];
    this.write(list);
    return this.wrapDocument(removed);
  }

  async deleteMany(query = {}) {
    const list = this.read();
    const remaining = list.filter(item => {
      for (const key in query) {
        if (item[key] === query[key]) {
          return false;
        }
      }
      return true;
    });
    const deletedCount = list.length - remaining.length;
    this.write(remaining);
    return { deletedCount };
  }

  async countDocuments(query = {}) {
    const results = await this.find(query);
    return results.length;
  }
}

const models = {};

export const getLocalModel = (name) => {
  if (!models[name]) {
    models[name] = new LocalCollection(name);
  }
  return models[name];
};
