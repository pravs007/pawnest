import React, { useState } from 'react';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, 
  Heart, 
  Calendar, 
  Trash2, 
  Check, 
  XCircle, 
  Info,
  X,
  Mail,
  User,
  HeartHandshake
} from 'lucide-react';

const Adoption = () => {
  const { user } = useAuth();
  const { 
    adoptions, 
    addAdoptionListing, 
    deleteAdoptionListing, 
    submitAdoptionRequest, 
    handleAdoptionRequestReview 
  } = useAppData();

  // Modals controller
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  
  // Forms states
  const [formError, setFormError] = useState('');
  const [listingForm, setListingForm] = useState({
    petName: '',
    species: 'Dog',
    breed: '',
    age: '',
    description: '',
    photo: ''
  });

  const [applyNote, setApplyNote] = useState('I would love to give this beautiful pet a warm home.');

  // Create Listing Submit
  const handleCreateListing = async (e) => {
    e.preventDefault();
    const { petName, species, breed, age, description } = listingForm;
    
    if (!petName || !species || !breed || !age || !description) {
      setFormError('Please fill in all required fields.');
      return;
    }

    try {
      await addAdoptionListing(listingForm);
      setShowAddModal(false);
      setFormError('');
    } catch (err) {
      setFormError(err.message || 'Failed to list pet');
    }
  };

  // Submit adoption application
  const handleApplySubmit = async (e) => {
    e.preventDefault();
    try {
      const updated = await submitAdoptionRequest(selectedListing._id || selectedListing.id, applyNote);
      setSelectedListing(updated);
      setShowApplyModal(false);
      alert('Your adoption request has been submitted successfully! The owner will review your application.');
    } catch (err) {
      alert(err.message || 'Failed to submit application');
    }
  };

  // Review Application (Approve / Reject)
  const handleReview = async (requestId, status) => {
    const confirmMsg = status === 'approved' 
      ? 'Are you sure you want to approve this applicant? Doing so will mark this pet as Adopted and automatically reject other pending requests.'
      : 'Are you sure you want to reject this applicant?';
    
    if (window.confirm(confirmMsg)) {
      try {
        const updated = await handleAdoptionRequestReview(selectedListing._id || selectedListing.id, requestId, status);
        setSelectedListing(updated);
      } catch (err) {
        alert(err.message || 'Failed to update request status');
      }
    }
  };

  // Delete Listing
  const handleDeleteListing = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this adoption listing permanently?')) {
      try {
        await deleteAdoptionListing(id);
        setShowDetailModal(false);
      } catch (err) {
        alert('Failed to delete listing');
      }
    }
  };

  // Check if current user has already applied for this pet
  const userHasApplied = (listing) => {
    return user && listing.requests.some(r => r.userId === user.id);
  };

  return (
    <div className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full">
      {/* Header banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-brand-cream/30 pb-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-brand-dark tracking-tight">Adoption Network</h1>
          <p className="text-brand-dark/70 mt-1">Browse adoptable animals or list a rescue pet seeking a loving home.</p>
        </div>
        <button
          onClick={() => {
            if (!user) {
              alert('Please sign in to list a pet for adoption.');
              return;
            }
            setListingForm({ petName: '', species: 'Dog', breed: '', age: '', description: '', photo: '' });
            setFormError('');
            setShowAddModal(true);
          }}
          className="mt-4 sm:mt-0 inline-flex items-center gap-1.5 rounded-xl bg-brand-orange px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-brand-orange/15 hover:bg-brand-orange/90 transition-all"
        >
          <Plus className="h-4 w-4" />
          List Pet for Adoption
        </button>
      </div>

      {/* Grid of Listings */}
      {adoptions.length === 0 ? (
        <div className="flex flex-col items-center justify-center border border-dashed border-brand-cream rounded-3xl p-16 text-center bg-white">
          <span className="text-5xl mb-4">🏠🐾</span>
          <h3 className="text-lg font-bold text-brand-dark">No adoptable pets listed yet</h3>
          <p className="text-sm text-brand-dark/60 max-w-sm mt-1.5">
            Be the first to list an animal needing a warm household!
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {adoptions.map((listing) => {
            const isAdopted = listing.status === 'adopted';
            const isOwner = listing.submittedBy === user?.id;

            return (
              <div
                key={listing._id || listing.id}
                onClick={() => {
                  setSelectedListing(listing);
                  setShowDetailModal(true);
                }}
                className="group flex flex-col rounded-2xl border border-brand-cream/40 bg-white overflow-hidden shadow-sm hover-card cursor-pointer relative"
              >
                {/* Image panel */}
                <div className="h-48 w-full bg-brand-cream/10 overflow-hidden relative">
                  <img
                    src={listing.photo || 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500'}
                    alt={listing.petName}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Status Overlay */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase shadow-sm ${
                      isAdopted ? 'bg-brand-green text-white' : 'bg-brand-orange text-white'
                    }`}>
                      {isAdopted ? 'Adopted 🎉' : 'Available'}
                    </span>
                    {isOwner && (
                      <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase bg-brand-dark text-white shadow-sm">
                        My Listing
                      </span>
                    )}
                  </div>
                </div>

                {/* Body details */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-brand-dark group-hover:text-brand-orange transition-colors">
                      {listing.petName}
                    </h3>
                    <p className="text-xs font-semibold text-brand-dark/50 mt-1 uppercase tracking-wider">
                      {listing.breed} • {listing.age}
                    </p>
                    <p className="text-xs text-brand-dark/75 mt-3 line-clamp-2">{listing.description}</p>
                  </div>

                  <div className="mt-4 border-t border-brand-cream/35 pt-3 flex justify-between items-center text-[10px] font-bold text-brand-orange">
                    <span>Applications: {listing.requests.length}</span>
                    <span>Click to View details</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ----------------------------------------------------
          ADD ADOPTION LISTING MODAL
      ---------------------------------------------------- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-dark/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-brand-cream/60 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-brand-cream/30 p-5">
              <h3 className="text-lg font-bold text-brand-dark">List Pet for Adoption</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1.5 text-brand-dark/50 hover:bg-brand-cream/40"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateListing} className="flex-1 overflow-y-auto p-6 space-y-4">
              {formError && (
                <div className="flex gap-2 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700">
                  <XCircle className="h-4 w-4 shrink-0 text-red-500" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-dark/80 mb-1">Pet Name *</label>
                  <input
                    type="text"
                    required
                    value={listingForm.petName}
                    onChange={(e) => setListingForm({ ...listingForm, petName: e.target.value })}
                    className="w-full px-3 py-2 border border-brand-cream rounded-xl text-sm focus:outline-none"
                    placeholder="e.g. Luna"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-dark/80 mb-1">Species *</label>
                  <select
                    value={listingForm.species}
                    onChange={(e) => setListingForm({ ...listingForm, species: e.target.value })}
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
                  <label className="block text-xs font-semibold text-brand-dark/80 mb-1">Breed *</label>
                  <input
                    type="text"
                    required
                    value={listingForm.breed}
                    onChange={(e) => setListingForm({ ...listingForm, breed: e.target.value })}
                    className="w-full px-3 py-2 border border-brand-cream rounded-xl text-sm focus:outline-none"
                    placeholder="e.g. Siamese"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-dark/80 mb-1">Age *</label>
                  <input
                    type="text"
                    required
                    value={listingForm.age}
                    onChange={(e) => setListingForm({ ...listingForm, age: e.target.value })}
                    className="w-full px-3 py-2 border border-brand-cream rounded-xl text-sm focus:outline-none"
                    placeholder="e.g. 1 year old"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-dark/80 mb-1">Photo URL</label>
                <input
                  type="text"
                  value={listingForm.photo}
                  onChange={(e) => setListingForm({ ...listingForm, photo: e.target.value })}
                  className="w-full px-3 py-2 border border-brand-cream rounded-xl text-sm focus:outline-none"
                  placeholder="Paste Unsplash image URL or leave empty"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-dark/80 mb-1">Pet Description & Personality *</label>
                <textarea
                  required
                  value={listingForm.description}
                  onChange={(e) => setListingForm({ ...listingForm, description: e.target.value })}
                  rows="4"
                  className="w-full px-3 py-2 border border-brand-cream rounded-xl text-sm focus:outline-none"
                  placeholder="Temperament, activity level, medical vaccine records, reasons for rehoming, compatibility with kids/other dogs..."
                />
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
                  className="px-5 py-2 bg-brand-orange text-xs font-bold text-white rounded-xl shadow-md hover:bg-brand-orange/90"
                >
                  Publish Listing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          ADOPTION LISTING DETAIL MODAL
      ---------------------------------------------------- */}
      {showDetailModal && selectedListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-dark/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-white rounded-3xl border border-brand-cream/60 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Image banner */}
            <div className="relative h-60 bg-brand-cream/20 shrink-0">
              <img
                src={selectedListing.photo || 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500'}
                alt={selectedListing.petName}
                className="h-full w-full object-cover"
              />
              <button
                onClick={() => setShowDetailModal(false)}
                className="absolute top-4 right-4 rounded-full bg-brand-dark/60 backdrop-blur-sm p-2 text-white border border-white/20 hover:bg-brand-dark/80 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Details panel */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Core description */}
              <div className="flex justify-between items-start border-b border-brand-cream/20 pb-4">
                <div>
                  <h3 className="text-2xl font-extrabold text-brand-dark">{selectedListing.petName}</h3>
                  <p className="text-sm font-semibold text-brand-orange mt-0.5">
                    {selectedListing.breed} • {selectedListing.age}
                  </p>
                </div>

                <div className="flex gap-2">
                  {/* Delete listing for owner/admin */}
                  {(selectedListing.submittedBy === user?.id || user?.role === 'admin') && (
                    <button
                      onClick={(e) => handleDeleteListing(selectedListing._id || selectedListing.id, e)}
                      className="flex items-center gap-1 border border-red-200 text-red-600 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Listing
                    </button>
                  )}
                </div>
              </div>

              {/* Bio summary */}
              <div>
                <h4 className="font-bold text-brand-dark mb-2 text-sm flex items-center gap-1.5">
                  <Info className="h-4.5 w-4.5 text-brand-orange" />
                  Pet Information & Personality
                </h4>
                <p className="text-xs text-brand-dark/85 bg-brand-light/30 border border-brand-cream/20 p-4 rounded-2xl whitespace-pre-line leading-relaxed">
                  {selectedListing.description}
                </p>
              </div>

              {/* Adoption application trigger */}
              {selectedListing.status === 'available' && !userHasApplied(selectedListing) && selectedListing.submittedBy !== user?.id && (
                <div className="rounded-2xl border-2 border-dashed border-brand-orange/30 p-5 bg-brand-orange/5 text-center">
                  <h4 className="text-md font-bold text-brand-dark flex items-center justify-center gap-1.5">
                    <Heart className="h-5 w-5 text-brand-orange animate-pulse" />
                    Interested in adopting {selectedListing.petName}?
                  </h4>
                  <p className="text-xs text-brand-dark/60 mt-1 mb-4">
                    Submit a quick letter introducing yourself, and the listing reviewer will contact you.
                  </p>
                  <button
                    onClick={() => {
                      if (!user) {
                        alert('Please sign in to apply for adoption.');
                        return;
                      }
                      setApplyNote('I would love to give this beautiful pet a warm home. I have plenty of space and experience with pets.');
                      setShowApplyModal(true);
                    }}
                    className="inline-flex items-center gap-1 rounded-xl bg-brand-orange px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-brand-orange/95"
                  >
                    Apply for Adoption
                  </button>
                </div>
              )}

              {/* Applied Confirmation */}
              {userHasApplied(selectedListing) && (
                <div className="rounded-2xl border border-brand-green/20 p-4 bg-brand-green/5 text-center text-xs font-bold text-brand-green">
                  ✓ Your adoption application has been submitted and is currently pending review.
                </div>
              )}

              {/* Listing Owner application reviewer dashboard */}
              {selectedListing.submittedBy === user?.id && (
                <div className="border-t border-brand-cream/30 pt-6">
                  <h4 className="font-extrabold text-brand-dark mb-4 text-sm flex items-center gap-1.5">
                    <HeartHandshake className="h-5 w-5 text-brand-orange" />
                    Adoption Applications Review Dashboard
                  </h4>

                  {selectedListing.requests.length === 0 ? (
                    <p className="text-xs text-brand-dark/50 italic bg-brand-light/25 border border-brand-cream/15 p-4 rounded-xl text-center">
                      No applications submitted for this listing yet.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {selectedListing.requests.map((req, idx) => (
                        <div key={idx} className="p-4 bg-brand-light/35 rounded-2xl border border-brand-cream/25 space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-bold text-brand-dark flex items-center gap-1">
                                <User className="h-4 w-4 text-brand-dark/55" />
                                {req.name}
                              </p>
                              <p className="text-xs text-brand-dark/50 flex items-center gap-1.5 mt-0.5">
                                <Mail className="h-3.5 w-3.5 text-brand-dark/40" />
                                {req.email}
                              </p>
                            </div>
                            <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full capitalize shadow-sm ${
                              req.status === 'approved' ? 'bg-brand-green text-white' : 
                              req.status === 'rejected' ? 'bg-red-500 text-white' : 'bg-brand-yellow text-brand-dark'
                            }`}>
                              {req.status}
                            </span>
                          </div>

                          <p className="text-xs bg-white p-3 rounded-xl border border-brand-cream/20 text-brand-dark/80 italic whitespace-pre-line leading-relaxed">
                            "{req.note}"
                          </p>

                          {req.status === 'pending' && selectedListing.status === 'available' && (
                            <div className="flex gap-2 justify-end pt-1.5 border-t border-brand-cream/15">
                              <button
                                onClick={() => handleReview(req._id || req.id || req.userId, 'rejected')}
                                className="flex items-center gap-1 rounded-xl border border-brand-cream text-brand-dark/70 bg-white px-3 py-1.5 text-xs font-bold hover:bg-brand-cream/35"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                                Reject
                              </button>
                              <button
                                onClick={() => handleReview(req._id || req.id || req.userId, 'approved')}
                                className="flex items-center gap-1 rounded-xl bg-brand-green text-white px-3 py-1.5 text-xs font-bold shadow-sm hover:bg-brand-green/95"
                              >
                                <Check className="h-3.5 w-3.5" />
                                Approve Adoption
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          APPLY FOR ADOPTION MODAL
      ---------------------------------------------------- */}
      {showApplyModal && selectedListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-dark/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-3xl border border-brand-cream/60 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-brand-cream/30 p-5">
              <h3 className="text-lg font-bold text-brand-dark">Adoption Application</h3>
              <button
                onClick={() => setShowApplyModal(false)}
                className="rounded-lg p-1.5 text-brand-dark/50 hover:bg-brand-cream/40"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleApplySubmit} className="p-6 space-y-4">
              <div>
                <p className="text-xs font-semibold text-brand-dark/60">
                  Introduce yourself to the owner of <span className="font-bold text-brand-dark">{selectedListing.petName}</span>:
                </p>
                <textarea
                  required
                  value={applyNote}
                  onChange={(e) => setApplyNote(e.target.value)}
                  rows="4"
                  className="w-full px-3 py-2 border border-brand-cream rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-brand-orange mt-2.5"
                  placeholder="Share details about your house (yard size, other pets, free time)..."
                />
              </div>

              <div className="pt-3 border-t border-brand-cream/30 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2 border border-brand-cream bg-white text-xs font-bold text-brand-dark/80 rounded-xl hover:bg-brand-cream/35"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-orange text-xs font-bold text-white rounded-xl shadow-md hover:bg-brand-orange/90"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Adoption;
