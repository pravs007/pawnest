import React, { useState } from 'react';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import { validateName, validateNumber, validateTextarea, validateFileUpload, sanitizeInput } from '../utils/validation';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  FolderHeart, 
  Activity, 
  Stethoscope, 
  BellRing,
  Info,
  Calendar,
  X,
  FileText
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const { 
    pets, 
    vaccinations, 
    addPet, 
    updatePet, 
    deletePet, 
    rescues, 
    reports 
  } = useAppData();

  // Modal control states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPet, setSelectedPet] = useState(null);

  // File upload state for pet photos
  const [selectedFileName, setSelectedFileName] = useState('');

  // Form states
  const [petForm, setPetForm] = useState({
    name: '',
    breed: '',
    age: '',
    weight: '',
    medicalNotes: '',
    photo: ''
  });

  const [errors, setErrors] = useState({
    name: '',
    breed: '',
    age: '',
    weight: '',
    medicalNotes: '',
    photo: ''
  });

  const [formError, setFormError] = useState('');

  // Stats calculation
  const pendingVaccines = vaccinations.filter(v => v.status === 'Pending').length;
  const userRescues = rescues.filter(r => r.reporterPhone === user?.phone || r.reporterName === user?.name).length;
  const userReports = reports.filter(r => r.userId === user?.id).length;

  const handleFieldChange = (field, val) => {
    setPetForm(prev => ({ ...prev, [field]: val }));
    let err = '';
    if (field === 'name') {
      err = validateName(val, 'Pet Name');
    } else if (field === 'breed') {
      err = validateName(val, 'Breed / Species');
    } else if (field === 'age') {
      err = validateNumber(val, 0, 30, 'Pet Age');
    } else if (field === 'weight') {
      err = validateNumber(val, 0, 150, 'Weight');
    } else if (field === 'medicalNotes') {
      if (val.trim() !== '') {
        err = validateTextarea(val, 0, 1000, 'Medical & Behavior Notes');
      }
    }
    setErrors(prev => ({ ...prev, [field]: err }));
  };

  const handleFieldBlur = (field) => {
    const val = petForm[field];
    const trimmed = typeof val === 'string' ? val.trim() : val;
    setPetForm(prev => ({ ...prev, [field]: trimmed }));
    
    let err = '';
    if (field === 'name') {
      err = validateName(trimmed, 'Pet Name');
    } else if (field === 'breed') {
      err = validateName(trimmed, 'Breed / Species');
    } else if (field === 'age') {
      err = validateNumber(trimmed, 0, 30, 'Pet Age');
    } else if (field === 'weight') {
      err = validateNumber(trimmed, 0, 150, 'Weight');
    } else if (field === 'medicalNotes') {
      if (trimmed !== '') {
        err = validateTextarea(trimmed, 0, 1000, 'Medical & Behavior Notes');
      }
    }
    setErrors(prev => ({ ...prev, [field]: err }));
  };

  const openAddModal = () => {
    setPetForm({ name: '', breed: '', age: '', weight: '', medicalNotes: '', photo: '' });
    setErrors({ name: '', breed: '', age: '', weight: '', medicalNotes: '', photo: '' });
    setSelectedFileName('');
    setFormError('');
    setShowAddModal(true);
  };

  const openEditModal = (pet, e) => {
    e.stopPropagation(); // Prevent opening detail modal
    setSelectedPet(pet);
    setPetForm({
      name: pet.name,
      breed: pet.breed,
      age: pet.age,
      weight: pet.weight,
      medicalNotes: pet.medicalNotes || '',
      photo: pet.photo || ''
    });
    setErrors({ name: '', breed: '', age: '', weight: '', medicalNotes: '', photo: '' });
    setSelectedFileName(pet.photo ? 'Existing Photo' : '');
    setFormError('');
    setShowEditModal(true);
  };

  const handlePetFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate size and format using custom validation
    const fileErr = validateFileUpload(file, 5);
    if (fileErr) {
      setErrors(prev => ({ ...prev, photo: fileErr }));
      setFormError(fileErr);
      return;
    }

    setErrors(prev => ({ ...prev, photo: '' }));
    setFormError('');
    setSelectedFileName(file.name);

    // Convert file to Base64
    const reader = new FileReader();
    reader.onloadend = () => {
      setPetForm(prev => ({ ...prev, photo: reader.result }));
    };
    reader.onerror = () => {
      setFormError('Failed to read image file');
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePetPhoto = () => {
    setPetForm(prev => ({ ...prev, photo: '' }));
    setSelectedFileName('');
    setErrors(prev => ({ ...prev, photo: '' }));
  };

  const openDetailModal = (pet) => {
    setSelectedPet(pet);
    setShowDetailModal(true);
  };

  const handlePetSubmit = async (e, type) => {
    e.preventDefault();
    const { name, breed, age, weight, medicalNotes, photo } = petForm;
    
    const nameErr = validateName(name, 'Pet Name');
    const breedErr = validateName(breed, 'Breed / Species');
    const ageErr = validateNumber(age, 0, 30, 'Pet Age');
    const weightErr = validateNumber(weight, 0, 150, 'Weight');
    const notesErr = medicalNotes && medicalNotes.trim() !== '' 
      ? validateTextarea(medicalNotes, 0, 1000, 'Medical & Behavior Notes') 
      : '';

    if (nameErr || breedErr || ageErr || weightErr || notesErr || errors.photo) {
      setErrors({
        name: nameErr,
        breed: breedErr,
        age: ageErr,
        weight: weightErr,
        medicalNotes: notesErr,
        photo: errors.photo
      });
      setFormError('Please resolve all validation errors.');
      return;
    }

    try {
      const sanitizedForm = {
        name: sanitizeInput(name),
        breed: sanitizeInput(breed),
        age: sanitizeInput(age),
        weight: sanitizeInput(weight),
        medicalNotes: sanitizeInput(medicalNotes || ''),
        photo
      };

      if (type === 'add') {
        await addPet(sanitizedForm);
        setShowAddModal(false);
      } else {
        await updatePet(selectedPet._id || selectedPet.id, sanitizedForm);
        setShowEditModal(false);
      }
    } catch (err) {
      setFormError(err.message || 'Operation failed');
    }
  };

  const handleDeletePet = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to remove this pet? All associated vaccination records will be permanently deleted.')) {
      try {
        await deletePet(id);
        if (showDetailModal && selectedPet?._id === id) {
          setShowDetailModal(false);
        }
      } catch (err) {
        alert(err.message || 'Failed to delete pet');
      }
    }
  };

  return (
    <div className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full">
      {/* Header Greeting */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-brand-dark tracking-tight">
          Hello, {user?.name || 'Pet Parent'}! 👋
        </h1>
        <p className="text-brand-dark/70 mt-1">Here is a summary of your pets and upcoming care schedules.</p>
      </div>

      {/* Statistics Grid */}
      <div className="grid gap-5 grid-cols-2 md:grid-cols-4 mb-10">
        {/* Stat 1 */}
        <div className="rounded-2xl border border-brand-cream bg-white p-5 shadow-sm hover-card flex items-center gap-4">
          <div className="rounded-xl bg-brand-orange/15 p-3 text-brand-orange shrink-0">
            <FolderHeart className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-brand-dark">{pets.length}</p>
            <p className="text-xs font-semibold text-brand-dark/50 uppercase">Registered Pets</p>
          </div>
        </div>

        {/* Stat 2 */}
        <div className="rounded-2xl border border-brand-cream bg-white p-5 shadow-sm hover-card flex items-center gap-4">
          <div className="rounded-xl bg-brand-green/15 p-3 text-brand-green shrink-0">
            <BellRing className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-brand-dark">{pendingVaccines}</p>
            <p className="text-xs font-semibold text-brand-dark/50 uppercase">Due Vaccines</p>
          </div>
        </div>

        {/* Stat 3 */}
        <div className="rounded-2xl border border-brand-cream bg-white p-5 shadow-sm hover-card flex items-center gap-4">
          <div className="rounded-xl bg-brand-orange/15 p-3 text-brand-orange shrink-0">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-brand-dark">{userReports}</p>
            <p className="text-xs font-semibold text-brand-dark/50 uppercase">Missing Reports</p>
          </div>
        </div>

        {/* Stat 4 */}
        <div className="rounded-2xl border border-brand-cream bg-white p-5 shadow-sm hover-card flex items-center gap-4">
          <div className="rounded-xl bg-brand-green/15 p-3 text-brand-green shrink-0">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-brand-dark">{userRescues}</p>
            <p className="text-xs font-semibold text-brand-dark/50 uppercase">Active Rescues</p>
          </div>
        </div>
      </div>

      {/* Pet Header Action */}
      <div className="flex items-center justify-between border-b border-brand-cream/30 pb-4 mb-6">
        <h2 className="text-2xl font-bold text-brand-dark">My Furry Companions</h2>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand-orange px-4 py-2 text-sm font-bold text-white shadow-md shadow-brand-orange/15 hover:bg-brand-orange/90 transition-all"
        >
          <Plus className="h-4 w-4" />
          Add Pet
        </button>
      </div>

      {/* Pets Grid */}
      {pets.length === 0 ? (
        <div className="flex flex-col items-center justify-center border border-dashed border-brand-cream rounded-3xl p-12 text-center bg-white">
          <span className="text-5xl mb-4">🐶🐱</span>
          <h3 className="text-lg font-bold text-brand-dark">No pets registered yet</h3>
          <p className="text-sm text-brand-dark/60 max-w-sm mt-1.5 mb-6">
            Get started by adding your first pet to track their vaccinations and receive AI care suggestions.
          </p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand-orange px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-brand-orange/90 transition-all"
          >
            <Plus className="h-4 w-4" />
            Add First Pet
          </button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {pets.map((pet) => (
            <div
              key={pet._id || pet.id}
              onClick={() => openDetailModal(pet)}
              className="group relative flex flex-col rounded-2xl border border-brand-cream/40 bg-white overflow-hidden shadow-sm hover-card cursor-pointer"
            >
              {/* Image */}
              <div className="h-44 w-full bg-brand-cream/10 overflow-hidden relative">
                <img
                  src={pet.photo || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=500&auto=format&fit=crop&q=60'}
                  alt={pet.name}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                
                {/* Actions overlay */}
                <div className="absolute top-3 right-3 flex gap-2">
                  <button
                    onClick={(e) => openEditModal(pet, e)}
                    className="rounded-lg bg-white/90 backdrop-blur-sm p-1.5 text-brand-dark/80 border border-brand-cream hover:bg-white hover:text-brand-orange shadow-sm transition-colors"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => handleDeletePet(pet._id || pet.id, e)}
                    className="rounded-lg bg-white/90 backdrop-blur-sm p-1.5 text-brand-dark/80 border border-brand-cream hover:bg-white hover:text-red-500 shadow-sm transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold text-brand-dark group-hover:text-brand-orange transition-colors">
                    {pet.name}
                  </h3>
                  <p className="text-xs font-semibold text-brand-dark/50 mt-1 uppercase tracking-wider">{pet.breed}</p>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 border-t border-brand-cream/30 pt-3 text-sm">
                  <div>
                    <span className="text-xs text-brand-dark/45">Age</span>
                    <p className="font-semibold text-brand-dark">{pet.age}</p>
                  </div>
                  <div>
                    <span className="text-xs text-brand-dark/45">Weight</span>
                    <p className="font-semibold text-brand-dark">{pet.weight}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ----------------------------------------------------
          ADD / EDIT PET MODALS
      ---------------------------------------------------- */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-dark/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-brand-cream/60 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-brand-cream/30 p-5">
              <h3 className="text-lg font-bold text-brand-dark">
                {showAddModal ? 'Register New Pet' : `Edit ${selectedPet?.name}`}
              </h3>
              <button
                onClick={() => { setShowAddModal(false); setShowEditModal(false); }}
                className="rounded-lg p-1.5 text-brand-dark/50 hover:bg-brand-cream/40"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={(e) => handlePetSubmit(e, showAddModal ? 'add' : 'edit')}
              className="flex-1 overflow-y-auto p-6 space-y-4"
            >
              {formError && (
                <div className="flex gap-2.5 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700">
                  <Info className="h-4 w-4 shrink-0 text-red-500" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-brand-dark/80 mb-1">Pet Name *</label>
                  <input
                    type="text"
                    required
                    value={petForm.name}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    onBlur={() => handleFieldBlur('name')}
                    className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-1 ${
                      errors.name 
                        ? 'border-red-500 focus:ring-red-200 focus:border-red-500' 
                        : 'border-brand-cream focus:ring-brand-orange'
                    }`}
                    placeholder="e.g. Bella"
                  />
                  {errors.name && (
                    <p className="mt-1 text-[10px] text-red-500 font-medium">{errors.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-dark/80 mb-1">Breed / Species *</label>
                  <input
                    type="text"
                    required
                    value={petForm.breed}
                    onChange={(e) => handleFieldChange('breed', e.target.value)}
                    onBlur={() => handleFieldBlur('breed')}
                    className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-1 ${
                      errors.breed 
                        ? 'border-red-500 focus:ring-red-200 focus:border-red-500' 
                        : 'border-brand-cream focus:ring-brand-orange'
                    }`}
                    placeholder="e.g. Golden Retriever"
                  />
                  {errors.breed && (
                    <p className="mt-1 text-[10px] text-red-500 font-medium">{errors.breed}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-dark/80 mb-1">Age (years) *</label>
                  <input
                    type="text"
                    required
                    value={petForm.age}
                    onChange={(e) => handleFieldChange('age', e.target.value)}
                    onBlur={() => handleFieldBlur('age')}
                    className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-1 ${
                      errors.age 
                        ? 'border-red-500 focus:ring-red-200 focus:border-red-500' 
                        : 'border-brand-cream focus:ring-brand-orange'
                    }`}
                    placeholder="e.g. 2"
                  />
                  {errors.age && (
                    <p className="mt-1 text-[10px] text-red-500 font-medium">{errors.age}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-dark/80 mb-1">Weight (kg) *</label>
                  <input
                    type="text"
                    required
                    value={petForm.weight}
                    onChange={(e) => handleFieldChange('weight', e.target.value)}
                    onBlur={() => handleFieldBlur('weight')}
                    className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-1 ${
                      errors.weight 
                        ? 'border-red-500 focus:ring-red-200 focus:border-red-500' 
                        : 'border-brand-cream focus:ring-brand-orange'
                    }`}
                    placeholder="e.g. 12"
                  />
                  {errors.weight && (
                    <p className="mt-1 text-[10px] text-red-500 font-medium">{errors.weight}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-dark/80 mb-1">Pet Photo</label>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl bg-brand-orange px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-brand-orange/90 transition-colors">
                      <span>Upload Pet Photo</span>
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp"
                        onChange={handlePetFileChange}
                        className="hidden"
                      />
                    </label>
                    {selectedFileName && (
                      <span className="text-xs text-brand-dark/60 truncate max-w-[200px]">
                        Selected: {selectedFileName}
                      </span>
                    )}
                  </div>
                  {errors.photo && (
                    <p className="text-[10px] text-red-500 font-medium">{errors.photo}</p>
                  )}
                  
                  {petForm.photo && (
                    <div className="relative rounded-2xl border border-brand-cream/60 overflow-hidden h-32 w-full bg-brand-light/15 flex items-center justify-center">
                      <img src={petForm.photo} alt="Preview" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={handleRemovePetPhoto}
                        className="absolute top-2 right-2 rounded-full bg-brand-dark/70 backdrop-blur-sm p-1 text-white hover:bg-brand-dark transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-dark/80 mb-1">Medical & Behavior Notes</label>
                <textarea
                  value={petForm.medicalNotes}
                  onChange={(e) => handleFieldChange('medicalNotes', e.target.value)}
                  onBlur={() => handleFieldBlur('medicalNotes')}
                  rows="3"
                  className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-1 ${
                    errors.medicalNotes 
                      ? 'border-red-500 focus:ring-red-200 focus:border-red-500' 
                      : 'border-brand-cream focus:ring-brand-orange'
                  }`}
                  placeholder="Allergies, chronic conditions, vet logs, dietary alerts..."
                />
                {errors.medicalNotes && (
                  <p className="mt-1 text-[10px] text-red-500 font-medium">{errors.medicalNotes}</p>
                )}
              </div>

              <div className="pt-3 border-t border-brand-cream/30 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setShowEditModal(false); }}
                  className="px-4 py-2 border border-brand-cream bg-white text-xs font-bold text-brand-dark/80 rounded-xl hover:bg-brand-cream/35"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    !!errors.name || 
                    !!errors.breed || 
                    !!errors.age || 
                    !!errors.weight || 
                    !!errors.medicalNotes || 
                    !!errors.photo || 
                    !petForm.name || 
                    !petForm.breed || 
                    !petForm.age || 
                    !petForm.weight
                  }
                  className="px-5 py-2 bg-brand-orange text-xs font-bold text-white rounded-xl shadow-md hover:bg-brand-orange/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {showAddModal ? 'Register Pet' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          PET DETAIL SUMMARY VIEW MODAL
      ---------------------------------------------------- */}
      {showDetailModal && selectedPet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-dark/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-white rounded-3xl border border-brand-cream/60 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="relative h-56 bg-brand-cream/20 shrink-0">
              <img
                src={selectedPet.photo || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=500&auto=format&fit=crop&q=60'}
                alt={selectedPet.name}
                className="h-full w-full object-cover"
              />
              <button
                onClick={() => setShowDetailModal(false)}
                className="absolute top-4 right-4 rounded-full bg-brand-dark/60 backdrop-blur-sm p-2 text-white border border-white/20 hover:bg-brand-dark/80 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Pet Identity Header */}
              <div className="flex items-end justify-between border-b border-brand-cream/20 pb-4">
                <div>
                  <h2 className="text-3xl font-extrabold text-brand-dark">{selectedPet.name}</h2>
                  <p className="text-sm font-semibold text-brand-orange mt-0.5">{selectedPet.breed}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => { setShowDetailModal(false); openEditModal(selectedPet, e); }}
                    className="flex items-center gap-1 px-3 py-1.5 border border-brand-cream rounded-xl text-xs font-bold text-brand-dark hover:bg-brand-cream/20"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    Edit Profile
                  </button>
                  <button
                    onClick={(e) => handleDeletePet(selectedPet._id || selectedPet.id, e)}
                    className="flex items-center gap-1 px-3 py-1.5 border border-red-200 text-red-600 rounded-xl text-xs font-bold hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              </div>

              {/* Quick Details List */}
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-2xl border border-brand-cream/40 p-4 bg-brand-light/20 text-center">
                  <span className="text-xs text-brand-dark/50">Age</span>
                  <p className="text-lg font-bold text-brand-dark mt-1">{selectedPet.age}</p>
                </div>
                <div className="rounded-2xl border border-brand-cream/40 p-4 bg-brand-light/20 text-center">
                  <span className="text-xs text-brand-dark/50">Weight</span>
                  <p className="text-lg font-bold text-brand-dark mt-1">{selectedPet.weight}</p>
                </div>
                <div className="rounded-2xl border border-brand-cream/40 p-4 bg-brand-light/20 text-center">
                  <span className="text-xs text-brand-dark/50">Registration</span>
                  <p className="text-sm font-bold text-brand-dark mt-1.5">
                    {new Date(selectedPet.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Medical & Behavioral Notes */}
              <div>
                <h4 className="flex items-center gap-2 text-md font-bold text-brand-dark border-b border-brand-cream/20 pb-2 mb-3">
                  <Stethoscope className="h-5 w-5 text-brand-orange" />
                  Medical Log & Care Notes
                </h4>
                <div className="rounded-2xl bg-brand-light/30 border border-brand-cream/40 p-4 text-sm text-brand-dark/80 whitespace-pre-line leading-relaxed">
                  {selectedPet.medicalNotes || 'No specific medical conditions or dietary behavior rules recorded yet. You can log allergies or medical histories by editing this pet.'}
                </div>
              </div>

              {/* Vaccination Timeline summary for the pet */}
              <div>
                <h4 className="flex items-center gap-2 text-md font-bold text-brand-dark border-b border-brand-cream/20 pb-2 mb-3">
                  <Calendar className="h-5 w-5 text-brand-green" />
                  Vaccination Summary
                </h4>
                {vaccinations.filter(v => v.petId === (selectedPet._id || selectedPet.id)).length === 0 ? (
                  <p className="text-xs text-brand-dark/50">No vaccinations recorded for this pet. Go to the Vaccine Tracker to schedule one.</p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {vaccinations
                      .filter(v => v.petId === (selectedPet._id || selectedPet.id))
                      .map(v => (
                        <div key={v._id || v.id} className="flex justify-between items-center bg-brand-light/20 p-2.5 rounded-xl border border-brand-cream/20">
                          <div>
                            <p className="text-sm font-bold text-brand-dark">{v.name}</p>
                            <span className="text-xs text-brand-dark/50">Due: {v.dateDue}</span>
                          </div>
                          <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${
                            v.status === 'Completed' ? 'bg-brand-green/15 text-brand-green' : 'bg-brand-orange/15 text-brand-orange'
                          }`}>
                            {v.status}
                          </span>
                        </div>
                      ))
                    }
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
