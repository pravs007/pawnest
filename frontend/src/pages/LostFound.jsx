import React, { useState, useEffect } from 'react';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, 
  Search, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  CheckCircle,
  X,
  AlertCircle,
  FolderOpen
} from 'lucide-react';
import { validateName, validatePhone, validateDate, validateTextarea, validateSearch, validateFileUpload, sanitizeInput } from '../utils/validation';

const LostFound = () => {
  const { user } = useAuth();
  const { 
    reports, 
    addReport, 
    updateReport, 
    deleteReport, 
    fetchReports 
  } = useAppData();

  // Search & Filter state
  const [filterType, setFilterType] = useState('');
  const [filterSpecies, setFilterSpecies] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  
  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [formError, setFormError] = useState('');

  // File upload states
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  // Form state
  const [reportForm, setReportForm] = useState({
    type: 'lost',
    petName: '',
    species: 'Dog',
    breed: '',
    description: '',
    location: '',
    dateLostFound: '',
    contactPhone: ''
  });

  const [errors, setErrors] = useState({
    petName: '',
    breed: '',
    dateLostFound: '',
    contactPhone: '',
    location: '',
    description: '',
    photo: '',
    search: ''
  });

  const handleFieldChange = (field, val) => {
    setReportForm(prev => ({ ...prev, [field]: val }));
    let err = '';
    if (field === 'petName') {
      if (val.trim() !== '') {
        err = validateName(val, 'Pet Name');
      }
    } else if (field === 'breed') {
      if (val.trim() !== '') {
        err = validateName(val, 'Breed');
      }
    } else if (field === 'dateLostFound') {
      err = validateDate(val, false, 'Incident Date');
    } else if (field === 'contactPhone') {
      err = validatePhone(val, 'Contact Phone');
    } else if (field === 'location') {
      const trimmed = val.trim();
      if (!val || trimmed === '') {
        err = 'Location is required';
      } else if (trimmed.length < 2) {
        err = 'Location must be at least 2 characters';
      } else if (trimmed.length > 100) {
        err = 'Location must be at most 100 characters';
      }
    } else if (field === 'description') {
      err = validateTextarea(val, 10, 1000, 'Description');
    }
    setErrors(prev => ({ ...prev, [field]: err }));
  };

  const handleFieldBlur = (field) => {
    const val = reportForm[field];
    const trimmed = typeof val === 'string' ? val.trim() : val;
    setReportForm(prev => ({ ...prev, [field]: trimmed }));
    
    let err = '';
    if (field === 'petName') {
      if (trimmed !== '') {
        err = validateName(trimmed, 'Pet Name');
      }
    } else if (field === 'breed') {
      if (trimmed !== '') {
        err = validateName(trimmed, 'Breed');
      }
    } else if (field === 'dateLostFound') {
      err = validateDate(trimmed, false, 'Incident Date');
    } else if (field === 'contactPhone') {
      err = validatePhone(trimmed, 'Contact Phone');
    } else if (field === 'location') {
      if (!trimmed || trimmed === '') {
        err = 'Location is required';
      } else if (trimmed.length < 2) {
        err = 'Location must be at least 2 characters';
      } else if (trimmed.length > 100) {
        err = 'Location must be at most 100 characters';
      }
    } else if (field === 'description') {
      err = validateTextarea(trimmed, 10, 1000, 'Description');
    }
    setErrors(prev => ({ ...prev, [field]: err }));
  };

  const handleSearchChange = (val) => {
    setSearchLocation(val);
    const err = validateSearch(val);
    setErrors(prev => ({ ...prev, search: err }));
  };

  // Cleanup preview URL
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Re-fetch reports when filters change
  useEffect(() => {
    if (errors.search) return; // Prevent fetch if search pattern contains injection
    fetchReports({
      type: filterType,
      species: filterSpecies,
      location: searchLocation,
      status: 'active' // Show only active notices
    });
  }, [filterType, filterSpecies, searchLocation, errors.search]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileErr = validateFileUpload(file, 5);
    if (fileErr) {
      setErrors(prev => ({ ...prev, photo: fileErr }));
      setFormError(fileErr);
      return;
    }

    setErrors(prev => ({ ...prev, photo: '' }));
    setFormError('');
    setImageFile(file);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setErrors(prev => ({ ...prev, photo: '' }));
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
    }
  };

  const resetForm = () => {
    setReportForm({
      type: 'lost',
      petName: '',
      species: 'Dog',
      breed: '',
      description: '',
      location: '',
      dateLostFound: new Date().toISOString().split('T')[0],
      contactPhone: ''
    });
    setImageFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { type, petName, species, breed, description, location, dateLostFound, contactPhone } = reportForm;

    const petNameErr = petName && petName.trim() !== '' ? validateName(petName, 'Pet Name') : '';
    const breedErr = breed && breed.trim() !== '' ? validateName(breed, 'Breed') : '';
    const dateErr = validateDate(dateLostFound, false, 'Incident Date');
    const phoneErr = validatePhone(contactPhone, 'Contact Phone');
    const descErr = validateTextarea(description, 10, 1000, 'Description');
    
    let locErr = '';
    const trimmedLoc = (location || '').trim();
    if (!location || trimmedLoc === '') {
      locErr = 'Location is required';
    } else if (trimmedLoc.length < 2) {
      locErr = 'Location must be at least 2 characters';
    } else if (trimmedLoc.length > 100) {
      locErr = 'Location must be at most 100 characters';
    }

    if (petNameErr || breedErr || dateErr || phoneErr || descErr || locErr || errors.photo) {
      setErrors({
        petName: petNameErr,
        breed: breedErr,
        dateLostFound: dateErr,
        contactPhone: phoneErr,
        description: descErr,
        location: locErr,
        photo: errors.photo,
        search: errors.search
      });
      setFormError('Please resolve all validation errors before submitting.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('type', type);
      formData.append('petName', petName ? sanitizeInput(petName) : '');
      formData.append('species', species);
      formData.append('breed', breed ? sanitizeInput(breed) : '');
      formData.append('description', sanitizeInput(description));
      formData.append('location', sanitizeInput(location));
      formData.append('dateLostFound', sanitizeInput(dateLostFound));
      formData.append('contactPhone', sanitizeInput(contactPhone));
      if (imageFile) {
        formData.append('photo', imageFile);
      }

      await addReport(formData);
      setShowAddModal(false);
      setFormError('');
      resetForm();
    } catch (err) {
      setFormError(err.message || 'Failed to submit report');
    }
  };

  const handleResolve = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to mark this report as Resolved? It will be archived.')) {
      try {
        await updateReport(id, { status: 'resolved' });
        setShowDetailModal(false);
        // Refresh listings
        fetchReports({ type: filterType, species: filterSpecies, location: searchLocation, status: 'active' });
      } catch (err) {
        alert('Failed to resolve report');
      }
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this notice permanently?')) {
      try {
        await deleteReport(id);
        setShowDetailModal(false);
        fetchReports({ type: filterType, species: filterSpecies, location: searchLocation, status: 'active' });
      } catch (err) {
        alert('Failed to delete report');
      }
    }
  };

  return (
    <div className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full">
      {/* Header and description */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-brand-cream/30 pb-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-brand-dark tracking-tight">Lost & Found Pet Board</h1>
          <p className="text-brand-dark/70 mt-1">Submit sightings or missing reports to reunite pets with their owners.</p>
        </div>
        <button
          onClick={() => {
            if (!user) {
              alert('Please sign in to submit a report.');
              return;
            }
            resetForm();
            setErrors({
              petName: '',
              breed: '',
              dateLostFound: '',
              contactPhone: '',
              location: '',
              description: '',
              photo: '',
              search: ''
            });
            setFormError('');
            setShowAddModal(true);
          }}
          className="mt-4 sm:mt-0 inline-flex items-center gap-1.5 rounded-xl bg-brand-orange px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-brand-orange/15 hover:bg-brand-orange/90 transition-all"
        >
          <Plus className="h-4 w-4" />
          Create Notice
        </button>
      </div>

      {/* Query Filters Bar */}
      <div className="grid gap-4 sm:grid-cols-3 mb-8 bg-white p-4 rounded-2xl border border-brand-cream/40 shadow-sm">
        {/* Filter 1 */}
        <div>
          <label className="block text-[10px] font-bold text-brand-dark/50 uppercase tracking-wider mb-1">Notice Type</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full text-xs font-semibold border border-brand-cream rounded-xl p-2.5 bg-brand-light/10 focus:outline-none"
          >
            <option value="">All Notices</option>
            <option value="lost">🔍 Lost Pet reports</option>
            <option value="found">🐾 Found Stray sightings</option>
          </select>
        </div>

        {/* Filter 2 */}
        <div>
          <label className="block text-[10px] font-bold text-brand-dark/50 uppercase tracking-wider mb-1">Species</label>
          <select
            value={filterSpecies}
            onChange={(e) => setFilterSpecies(e.target.value)}
            className="w-full text-xs font-semibold border border-brand-cream rounded-xl p-2.5 bg-brand-light/10 focus:outline-none"
          >
            <option value="">All Animals</option>
            <option value="dog">Dogs</option>
            <option value="cat">Cats</option>
            <option value="bird">Birds</option>
            <option value="rabbit">Rabbits</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Search location */}
        <div>
          <label className="block text-[10px] font-bold text-brand-dark/50 uppercase tracking-wider mb-1">Location Search</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-brand-dark/40">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={searchLocation}
              onChange={(e) => handleSearchChange(e.target.value)}
              className={`w-full text-xs font-semibold border rounded-xl pl-9 pr-4 p-2.5 bg-brand-light/10 focus:outline-none ${
                errors.search ? 'border-red-500 focus:ring-1 focus:ring-red-200' : 'border-brand-cream'
              }`}
              placeholder="e.g. Central Park"
            />
            {errors.search && (
              <p className="absolute left-0 top-full mt-1 text-[10px] text-red-500 font-medium">{errors.search}</p>
            )}
          </div>
        </div>
      </div>

      {/* Notices Board Grid */}
      {reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center border border-dashed border-brand-cream rounded-3xl p-16 text-center bg-white">
          <span className="text-5xl mb-4">🔎</span>
          <h3 className="text-lg font-bold text-brand-dark">No notices match filters</h3>
          <p className="text-sm text-brand-dark/60 max-w-sm mt-1.5">
            Try adjusting your search criteria, or be the first to create a notice for this filter.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {reports.map((report) => (
            <div
              key={report._id || report.id}
              onClick={() => {
                setSelectedReport(report);
                setShowDetailModal(true);
              }}
              className="group flex flex-col rounded-2xl border border-brand-cream/40 bg-white overflow-hidden shadow-sm hover-card cursor-pointer"
            >
              {/* Image banner */}
              <div className="h-48 w-full bg-brand-cream/15 overflow-hidden relative">
                <img
                  src={report.photo || (report.type === 'lost' 
                    ? 'https://images.unsplash.com/photo-1537151608828-ea2b117b6281?w=500' 
                    : 'https://images.unsplash.com/photo-1444212477490-ca407925329e?w=500')}
                  alt={report.petName}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* Badge overlay */}
                <div className="absolute top-3 left-3">
                  <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase shadow-sm ${
                    report.type === 'lost' ? 'bg-red-500 text-white' : 'bg-brand-green text-white'
                  }`}>
                    {report.type === 'lost' ? 'Lost' : 'Found'}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-brand-dark group-hover:text-brand-orange transition-colors">
                    {report.type === 'lost' ? `Missing: ${report.petName}` : `Sighted: ${report.species}`}
                  </h3>
                  <div className="flex items-center gap-1 text-xs text-brand-dark/50 mt-1.5">
                    <MapPin className="h-3.5 w-3.5 text-brand-orange" />
                    <span className="truncate">{report.location}</span>
                  </div>
                  <p className="text-xs text-brand-dark/75 mt-3 line-clamp-2">{report.description}</p>
                </div>

                <div className="mt-4 border-t border-brand-cream/35 pt-3 flex justify-between items-center text-[10px] text-brand-dark/50">
                  <span className="flex items-center gap-0.5">
                    <Clock className="h-3 w-3" />
                    {report.dateLostFound}
                  </span>
                  <span className="font-semibold text-brand-orange">Click to Contact Owner</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ----------------------------------------------------
          ADD NOTICE REPORT MODAL
      ---------------------------------------------------- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-dark/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-brand-cream/60 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-brand-cream/30 p-5">
              <h3 className="text-lg font-bold text-brand-dark">Create Lost & Found Report</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1.5 text-brand-dark/50 hover:bg-brand-cream/40"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {formError && (
                <div className="flex gap-2 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-dark/80 mb-1 font-sans">Notice Type *</label>
                  <select
                    value={reportForm.type}
                    onChange={(e) => setReportForm({ ...reportForm, type: e.target.value })}
                    className="w-full px-3 py-2 border border-brand-cream rounded-xl text-sm focus:outline-none"
                  >
                    <option value="lost">Lost Pet (Missing)</option>
                    <option value="found">Found Pet (Sighted)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-dark/80 mb-1 font-sans">Pet Name (if known)</label>
                  <input
                    type="text"
                    value={reportForm.petName}
                    onChange={(e) => handleFieldChange('petName', e.target.value)}
                    onBlur={() => handleFieldBlur('petName')}
                    className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-1 ${
                      errors.petName 
                        ? 'border-red-500 focus:ring-red-200 focus:border-red-500' 
                        : 'border-brand-cream focus:ring-brand-orange'
                    }`}
                    placeholder="e.g. Max"
                  />
                  {errors.petName && (
                    <p className="mt-1 text-[10px] text-red-500 font-medium">{errors.petName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-dark/80 mb-1 font-sans">Species *</label>
                  <select
                    value={reportForm.species}
                    onChange={(e) => handleFieldChange('species', e.target.value)}
                    className="w-full px-3 py-2 border border-brand-cream rounded-xl text-sm focus:outline-none font-medium"
                  >
                    <option value="Dog">Dog</option>
                    <option value="Cat">Cat</option>
                    <option value="Bird">Bird</option>
                    <option value="Rabbit">Rabbit</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-dark/80 mb-1 font-sans">Breed (if known)</label>
                  <input
                    type="text"
                    value={reportForm.breed}
                    onChange={(e) => handleFieldChange('breed', e.target.value)}
                    onBlur={() => handleFieldBlur('breed')}
                    className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-1 ${
                      errors.breed 
                        ? 'border-red-500 focus:ring-red-200 focus:border-red-500' 
                        : 'border-brand-cream focus:ring-brand-orange'
                    }`}
                    placeholder="e.g. Beagle"
                  />
                  {errors.breed && (
                    <p className="mt-1 text-[10px] text-red-500 font-medium">{errors.breed}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-dark/80 mb-1 font-sans">Incident Date *</label>
                  <input
                    type="date"
                    required
                    value={reportForm.dateLostFound}
                    onChange={(e) => handleFieldChange('dateLostFound', e.target.value)}
                    onBlur={() => handleFieldBlur('dateLostFound')}
                    className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-1 ${
                      errors.dateLostFound 
                        ? 'border-red-500 focus:ring-red-200 focus:border-red-500' 
                        : 'border-brand-cream focus:ring-brand-orange'
                    }`}
                  />
                  {errors.dateLostFound && (
                    <p className="mt-1 text-[10px] text-red-500 font-medium">{errors.dateLostFound}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-dark/80 mb-1 font-sans">Contact Phone *</label>
                  <input
                    type="tel"
                    required
                    value={reportForm.contactPhone}
                    onChange={(e) => handleFieldChange('contactPhone', e.target.value)}
                    onBlur={() => handleFieldBlur('contactPhone')}
                    className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-1 ${
                      errors.contactPhone 
                        ? 'border-red-500 focus:ring-red-200 focus:border-red-500' 
                        : 'border-brand-cream focus:ring-brand-orange'
                    }`}
                    placeholder="10-digit number"
                  />
                  {errors.contactPhone && (
                    <p className="mt-1 text-[10px] text-red-500 font-medium">{errors.contactPhone}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-dark/80 mb-1 font-sans">Last Seen Location *</label>
                <input
                  type="text"
                  required
                  value={reportForm.location}
                  onChange={(e) => handleFieldChange('location', e.target.value)}
                  onBlur={() => handleFieldBlur('location')}
                  className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-1 ${
                    errors.location 
                      ? 'border-red-500 focus:ring-red-200 focus:border-red-500' 
                      : 'border-brand-cream focus:ring-brand-orange'
                  }`}
                  placeholder="e.g. 5th Ave near library, Seattle"
                />
                {errors.location && (
                  <p className="mt-1 text-[10px] text-red-500 font-medium">{errors.location}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-dark/80 mb-2 font-sans">Animal Photo *</label>
                {previewUrl ? (
                  <div className="relative rounded-2xl border border-brand-cream/60 overflow-hidden h-40 bg-brand-light/15 flex items-center justify-center">
                    <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 rounded-full bg-brand-dark/70 backdrop-blur-sm p-1.5 text-white hover:bg-brand-dark transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-brand-cream rounded-2xl p-6 text-center hover:bg-brand-light/10 transition-colors relative cursor-pointer group">
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">📷</span>
                      <p className="text-xs font-bold text-brand-dark">Click or Drag & Drop to Upload</p>
                      <p className="text-[10px] text-brand-dark/50 mt-1">Accepts JPG, JPEG, PNG, WEBP (Max 5 MB)</p>
                    </div>
                  </div>
                )}
                {errors.photo && (
                  <p className="mt-1 text-[10px] text-red-500 font-medium">{errors.photo}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-dark/80 mb-1 font-sans">Description *</label>
                <textarea
                  required
                  value={reportForm.description}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  onBlur={() => handleFieldBlur('description')}
                  rows="3"
                  className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-1 ${
                    errors.description 
                      ? 'border-red-500 focus:ring-red-200 focus:border-red-500' 
                      : 'border-brand-cream focus:ring-brand-orange'
                  }`}
                  placeholder="Describe markings, behavior, etc. (min 10 chars)"
                />
                {errors.description && (
                  <p className="mt-1 text-[10px] text-red-500 font-medium">{errors.description}</p>
                )}
              </div>

              <div className="pt-3 border-t border-brand-cream/30 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-brand-cream bg-white text-xs font-bold text-brand-dark/80 rounded-xl hover:bg-brand-cream/35"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    !!errors.petName || 
                    !!errors.breed || 
                    !!errors.dateLostFound || 
                    !!errors.contactPhone || 
                    !!errors.location || 
                    !!errors.description || 
                    !!errors.photo || 
                    !reportForm.location || 
                    !reportForm.dateLostFound || 
                    !reportForm.contactPhone || 
                    !reportForm.description
                  }
                  className="px-5 py-2 bg-brand-orange text-xs font-bold text-white rounded-xl shadow-md hover:bg-brand-orange/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Publish Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          REPORT DETAILS & OWNER CONTACT MODAL
      ---------------------------------------------------- */}
      {showDetailModal && selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-dark/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-brand-cream/60 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col" style={{ maxHeight: '85vh' }}>
            {/* Image banner */}
            <div className="relative h-60 bg-brand-cream/20 shrink-0">
              <img
                src={selectedReport.photo || (selectedReport.type === 'lost' 
                  ? 'https://images.unsplash.com/photo-1537151608828-ea2b117b6281?w=500' 
                  : 'https://images.unsplash.com/photo-1444212477490-ca407925329e?w=500')}
                alt={selectedReport.petName}
                className="h-full w-full object-cover"
              />
              <button
                onClick={() => setShowDetailModal(false)}
                className="absolute top-4 right-4 rounded-full bg-brand-dark/60 backdrop-blur-sm p-2 text-white border border-white/20 hover:bg-brand-dark/80 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Detail body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Header and status badge */}
              <div className="flex justify-between items-start border-b border-brand-cream/20 pb-4">
                <div>
                  <h3 className="text-2xl font-extrabold text-brand-dark">
                    {selectedReport.type === 'lost' ? `Missing: ${selectedReport.petName}` : `Found Stray`}
                  </h3>
                  <span className={`inline-flex items-center rounded-full mt-2 px-2.5 py-0.5 text-xs font-bold ${
                    selectedReport.type === 'lost' ? 'bg-red-500 text-white' : 'bg-brand-green text-white'
                  }`}>
                    {selectedReport.type === 'lost' ? 'Lost Report' : 'Found Report'}
                  </span>
                </div>

                {/* Owner controls */}
                {(selectedReport.userId === user?.id || user?.role === 'admin') && (
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => handleResolve(selectedReport._id || selectedReport.id, e)}
                      className="flex items-center gap-1 rounded-xl bg-brand-green/10 border border-brand-green/30 text-brand-green px-3 py-1.5 text-xs font-bold hover:bg-brand-green/20"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Resolve
                    </button>
                    <button
                      onClick={(e) => handleDelete(selectedReport._id || selectedReport.id, e)}
                      className="flex items-center gap-1 rounded-xl border border-red-200 text-red-600 px-3 py-1.5 text-xs font-bold hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                )}
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-4 text-sm bg-brand-light/35 p-4 rounded-2xl border border-brand-cream/20">
                <div>
                  <span className="text-xs text-brand-dark/50">Species & Breed</span>
                  <p className="font-semibold text-brand-dark mt-0.5">{selectedReport.species} ({selectedReport.breed || 'Unknown'})</p>
                </div>
                <div>
                  <span className="text-xs text-brand-dark/50">Date Lost/Seen</span>
                  <p className="font-semibold text-brand-dark mt-0.5">{selectedReport.dateLostFound}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-xs text-brand-dark/50">Last Known Location</span>
                  <p className="font-semibold text-brand-dark flex items-center gap-1 mt-1">
                    <MapPin className="h-4 w-4 text-brand-orange" />
                    {selectedReport.location}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="font-bold text-brand-dark mb-2 text-sm">Distinctive Details</h4>
                <p className="text-xs text-brand-dark/85 leading-relaxed whitespace-pre-line bg-brand-cream/10 p-3 rounded-xl border border-brand-cream/15">
                  {selectedReport.description}
                </p>
              </div>

              {/* Contact Panel */}
              <div className="border-t border-brand-cream/30 pt-4">
                <h4 className="font-bold text-brand-dark mb-3 text-sm">Contact Information</h4>
                <div className="space-y-2.5">
                  <div className="flex items-center gap-3 text-xs text-brand-dark/85">
                    <div className="rounded-lg bg-brand-orange/10 p-2 text-brand-orange">
                      <Phone className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-brand-dark/50 font-medium text-[10px] uppercase">Phone Line</p>
                      <a href={`tel:${selectedReport.contactPhone}`} className="font-bold hover:underline text-brand-orange">
                        {selectedReport.contactPhone}
                      </a>
                    </div>
                  </div>

                  {selectedReport.reporter && selectedReport.reporter.email && (
                    <div className="flex items-center gap-3 text-xs text-brand-dark/85">
                      <div className="rounded-lg bg-brand-orange/10 p-2 text-brand-orange">
                        <Mail className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-brand-dark/50 font-medium text-[10px] uppercase">Email Address</p>
                        <a href={`mailto:${selectedReport.reporter.email}`} className="font-bold hover:underline">
                          {selectedReport.reporter.email}
                        </a>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-xs text-brand-dark/85">
                    <div className="rounded-lg bg-brand-orange/10 p-2 text-brand-orange">
                      <FolderOpen className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-brand-dark/50 font-medium text-[10px] uppercase">Reporter Name</p>
                      <p className="font-bold">{selectedReport.reporter?.name || 'Community Member'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LostFound;
