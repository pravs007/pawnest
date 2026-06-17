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

  // Form state
  const [reportForm, setReportForm] = useState({
    type: 'lost',
    petName: '',
    species: 'Dog',
    breed: '',
    description: '',
    location: '',
    dateLostFound: '',
    contactPhone: '',
    photo: ''
  });

  // Re-fetch reports when filters change
  useEffect(() => {
    fetchReports({
      type: filterType,
      species: filterSpecies,
      location: searchLocation,
      status: 'active' // Show only active notices
    });
  }, [filterType, filterSpecies, searchLocation]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { type, species, description, location, dateLostFound, contactPhone } = reportForm;

    if (!type || !species || !description || !location || !dateLostFound || !contactPhone) {
      setFormError('Please enter all required fields.');
      return;
    }

    try {
      await addReport(reportForm);
      setShowAddModal(false);
      setFormError('');
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
            setReportForm({
              type: 'lost',
              petName: '',
              species: 'Dog',
              breed: '',
              description: '',
              location: '',
              dateLostFound: new Date().toISOString().split('T')[0],
              contactPhone: '',
              photo: ''
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
              onChange={(e) => setSearchLocation(e.target.value)}
              className="w-full text-xs font-semibold border border-brand-cream rounded-xl pl-9 pr-4 p-2.5 bg-brand-light/10 focus:outline-none"
              placeholder="e.g. Central Park"
            />
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
                    onChange={(e) => setReportForm({ ...reportForm, petName: e.target.value })}
                    className="w-full px-3 py-2 border border-brand-cream rounded-xl text-sm focus:outline-none"
                    placeholder="e.g. Max"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-dark/80 mb-1 font-sans">Species *</label>
                  <select
                    value={reportForm.species}
                    onChange={(e) => setReportForm({ ...reportForm, species: e.target.value })}
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
                    onChange={(e) => setReportForm({ ...reportForm, breed: e.target.value })}
                    className="w-full px-3 py-2 border border-brand-cream rounded-xl text-sm focus:outline-none"
                    placeholder="e.g. Beagle"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-dark/80 mb-1 font-sans">Incident Date *</label>
                  <input
                    type="date"
                    required
                    value={reportForm.dateLostFound}
                    onChange={(e) => setReportForm({ ...reportForm, dateLostFound: e.target.value })}
                    className="w-full px-3 py-2 border border-brand-cream rounded-xl text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-dark/80 mb-1 font-sans">Contact Phone *</label>
                  <input
                    type="tel"
                    required
                    value={reportForm.contactPhone}
                    onChange={(e) => setReportForm({ ...reportForm, contactPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-brand-cream rounded-xl text-sm focus:outline-none"
                    placeholder="+1 (555) 019-2834"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-dark/80 mb-1 font-sans">Last Seen Location *</label>
                <input
                  type="text"
                  required
                  value={reportForm.location}
                  onChange={(e) => setReportForm({ ...reportForm, location: e.target.value })}
                  className="w-full px-3 py-2 border border-brand-cream rounded-xl text-sm focus:outline-none"
                  placeholder="e.g. 5th Ave near library, Seattle"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-dark/80 mb-1 font-sans">Photo URL</label>
                <input
                  type="text"
                  value={reportForm.photo}
                  onChange={(e) => setReportForm({ ...reportForm, photo: e.target.value })}
                  className="w-full px-3 py-2 border border-brand-cream rounded-xl text-sm focus:outline-none"
                  placeholder="Paste Unsplash image URL or leave empty"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-dark/80 mb-1 font-sans">Description *</label>
                <textarea
                  required
                  value={reportForm.description}
                  onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                  rows="3"
                  className="w-full px-3 py-2 border border-brand-cream rounded-xl text-sm focus:outline-none"
                  placeholder="Describe distinct markings, collar detail, tag details, behavioral signals (e.g. scared, friendly)..."
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
          <div className="w-full max-w-lg bg-white rounded-3xl border border-brand-cream/60 shadow-2xl overflow-hidden max-h-[95vh] flex flex-col">
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
