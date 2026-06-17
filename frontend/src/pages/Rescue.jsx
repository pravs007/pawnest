import React, { useState } from 'react';
import { useAppData } from '../context/AppDataContext';
import { 
  Plus, 
  AlertOctagon, 
  MapPin, 
  Phone, 
  User, 
  Clock, 
  AlertCircle,
  X,
  Compass,
  LifeBuoy
} from 'lucide-react';

const Rescue = () => {
  const { rescues, submitRescueRequest } = useAppData();
  
  // Modals controller
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedRescue, setSelectedRescue] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Forms states
  const [formError, setFormError] = useState('');
  const [rescueForm, setRescueForm] = useState({
    reporterName: '',
    reporterPhone: '',
    species: 'Dog',
    description: '',
    location: '',
    severity: 'medium',
    photo: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { reporterName, reporterPhone, species, description, location } = rescueForm;

    if (!reporterName || !reporterPhone || !species || !description || !location) {
      setFormError('Please enter all required fields.');
      return;
    }

    try {
      await submitRescueRequest(rescueForm);
      setShowReportModal(false);
      setFormError('');
      alert('Rescue request submitted successfully! Our dispatch team is review and dispatching helpers.');
    } catch (err) {
      setFormError(err.message || 'Failed to submit report');
    }
  };

  // Status mapping UI
  const statusColors = {
    reported: 'bg-yellow-500 text-white',
    dispatched: 'bg-brand-orange text-white',
    rescued: 'bg-brand-green text-white',
    cancelled: 'bg-brand-dark/40 text-brand-dark'
  };

  const severityColors = {
    low: 'bg-blue-150 text-blue-700 border-blue-200',
    medium: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    high: 'bg-orange-50 text-orange-700 border-orange-200',
    critical: 'bg-red-50 text-red-700 border-red-200 animate-pulse'
  };

  const renderStatusTracker = (status) => {
    const steps = [
      { key: 'reported', label: '1. Incident Reported' },
      { key: 'dispatched', label: '2. Dispatch Team Enroute' },
      { key: 'rescued', label: '3. Animal Secured & Saved' }
    ];

    const currentIdx = steps.findIndex(s => s.key === status);
    
    return (
      <div className="space-y-4 pt-4 border-t border-brand-cream/35">
        <h5 className="text-xs font-bold text-brand-dark uppercase tracking-wider">Rescue Tracking Status Log</h5>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-brand-light/35 p-4 rounded-xl border border-brand-cream/15">
          {steps.map((step, idx) => {
            const isCompleted = idx <= currentIdx;
            const isActive = step.key === status;

            return (
              <div key={step.key} className="flex items-center gap-2">
                <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  isActive ? 'bg-brand-orange text-white animate-bounce' :
                  isCompleted ? 'bg-brand-green text-white' : 'bg-brand-cream text-brand-dark/50'
                }`}>
                  {isCompleted ? '✓' : idx + 1}
                </span>
                <span className={`text-xs font-semibold ${isCompleted ? 'text-brand-dark' : 'text-brand-dark/40'}`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full">
      {/* Emergency Header alert banner */}
      <div className="flex items-start gap-4 rounded-3xl bg-red-50 border-2 border-dashed border-red-200 p-6 mb-8 text-red-800 shadow-sm">
        <div className="rounded-2xl bg-red-100 p-3 text-red-600 shrink-0">
          <AlertOctagon className="h-7 w-7 animate-pulse" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-red-950">PawNest Emergency Rescue Platform</h2>
          <p className="text-sm mt-1 max-w-2xl text-red-900/80">
            If you see a stray animal that is severely injured, trapped, or in immediate danger, please file a report. 
            Our regional dispatcher assigns rescue volunteers to the coordinates immediately.
          </p>
          <button
            onClick={() => {
              setRescueForm({
                reporterName: '',
                reporterPhone: '',
                species: 'Dog',
                description: '',
                location: '',
                severity: 'medium',
                photo: ''
              });
              setFormError('');
              setShowReportModal(true);
            }}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-red-700 transition-colors"
          >
            <AlertCircle className="h-4 w-4" />
            File Rescue Report Now
          </button>
        </div>
      </div>

      {/* Ongoing Community Rescues tracking */}
      <div className="border-b border-brand-cream/30 pb-4 mb-6">
        <h3 className="text-2xl font-bold text-brand-dark flex items-center gap-2">
          <LifeBuoy className="h-6 w-6 text-brand-orange animate-spin" />
          Active Rescue Operations
        </h3>
        <p className="text-xs text-brand-dark/50 mt-0.5">Community tracker updates of dispatch crews enroute</p>
      </div>

      {rescues.length === 0 ? (
        <div className="flex flex-col items-center justify-center border border-dashed border-brand-cream rounded-3xl p-16 text-center bg-white">
          <span className="text-5xl mb-4">😇✨</span>
          <h3 className="text-lg font-bold text-brand-dark font-sans">No ongoing rescue reports</h3>
          <p className="text-sm text-brand-dark/60 max-w-sm mt-1.5">
            All animals are currently safe in this area! Volunteers remain on standby.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rescues.map((rescue) => (
            <div
              key={rescue._id || rescue.id}
              onClick={() => {
                setSelectedRescue(rescue);
                setShowDetailModal(true);
              }}
              className="group flex flex-col rounded-2xl border border-brand-cream/40 bg-white overflow-hidden shadow-sm hover-card cursor-pointer"
            >
              {/* Image banner */}
              <div className="h-48 w-full bg-brand-cream/15 overflow-hidden relative">
                <img
                  src={rescue.photo || 'https://images.unsplash.com/photo-1599113697920-562b76928e1d?w=500'}
                  alt={rescue.species}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* Badge Overlay */}
                <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
                  <span className={`px-2.5 py-0.5 text-[9px] font-extrabold rounded-full uppercase shadow-sm ${
                    statusColors[rescue.status]
                  }`}>
                    {rescue.status}
                  </span>
                  <span className={`px-2.5 py-0.5 text-[9px] font-extrabold rounded-full uppercase border shadow-sm ${
                    severityColors[rescue.severity]
                  }`}>
                    {rescue.severity}
                  </span>
                </div>
              </div>

              {/* Details summary */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-brand-dark group-hover:text-brand-orange transition-colors">
                    Emergency: {rescue.species} rescue
                  </h3>
                  <div className="flex items-center gap-1 text-xs text-brand-dark/50 mt-1.5">
                    <MapPin className="h-3.5 w-3.5 text-brand-orange" />
                    <span className="truncate">{rescue.location}</span>
                  </div>
                  <p className="text-xs text-brand-dark/75 mt-3 line-clamp-2">{rescue.description}</p>
                </div>

                <div className="mt-4 border-t border-brand-cream/35 pt-3 flex justify-between items-center text-[10px] text-brand-dark/50">
                  <span className="flex items-center gap-0.5">
                    <Clock className="h-3 w-3" />
                    {new Date(rescue.createdAt).toLocaleDateString()}
                  </span>
                  {rescue.assignedRescuer ? (
                    <span className="font-semibold text-brand-green">Rescuer: {rescue.assignedRescuer}</span>
                  ) : (
                    <span className="font-semibold text-brand-orange">Awaiting Dispatch</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ----------------------------------------------------
          SUBMIT RESCUE REPORT MODAL
      ---------------------------------------------------- */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-dark/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-brand-cream/60 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-brand-cream/30 p-5">
              <h3 className="text-lg font-bold text-brand-dark flex items-center gap-1.5">
                <AlertCircle className="h-5 w-5 text-red-500" />
                Emergency Rescue Form
              </h3>
              <button
                onClick={() => setShowReportModal(false)}
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

              {/* Reporter information */}
              <div className="grid grid-cols-2 gap-4 bg-brand-light/30 border border-brand-cream/15 p-4 rounded-2xl">
                <div className="col-span-2">
                  <h4 className="text-xs font-bold text-brand-dark uppercase tracking-wider mb-2">Reporter Information</h4>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-dark/80 mb-1">Your Name *</label>
                  <input
                    type="text"
                    required
                    value={rescueForm.reporterName}
                    onChange={(e) => setRescueForm({ ...rescueForm, reporterName: e.target.value })}
                    className="w-full px-3 py-2 border border-brand-cream rounded-xl text-sm focus:outline-none"
                    placeholder="Jane Smith"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-dark/80 mb-1">Your Phone *</label>
                  <input
                    type="tel"
                    required
                    value={rescueForm.reporterPhone}
                    onChange={(e) => setRescueForm({ ...rescueForm, reporterPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-brand-cream rounded-xl text-sm focus:outline-none"
                    placeholder="+1 (555) 018-3824"
                  />
                </div>
              </div>

              {/* Animal incident details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-dark/80 mb-1 font-sans">Animal / Species *</label>
                  <input
                    type="text"
                    required
                    value={rescueForm.species}
                    onChange={(e) => setRescueForm({ ...rescueForm, species: e.target.value })}
                    className="w-full px-3 py-2 border border-brand-cream rounded-xl text-sm focus:outline-none"
                    placeholder="e.g. Injured Dog, Trapped Kitten"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-dark/80 mb-1 font-sans">Severity Level *</label>
                  <select
                    value={rescueForm.severity}
                    onChange={(e) => setRescueForm({ ...rescueForm, severity: e.target.value })}
                    className="w-full px-3 py-2 border border-brand-cream rounded-xl text-sm focus:outline-none font-medium text-red-650"
                  >
                    <option value="low">Low (Stray in fence/nuisance)</option>
                    <option value="medium">Medium (Limping, dehydrated)</option>
                    <option value="high">High (Severe bleed, sick, trapped)</option>
                    <option value="critical">Critical (Hit-and-run, unresponsive)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-dark/80 mb-1 font-sans">Incident Coordinates / Location *</label>
                <input
                  type="text"
                  required
                  value={rescueForm.location}
                  onChange={(e) => setRescueForm({ ...rescueForm, location: e.target.value })}
                  className="w-full px-3 py-2 border border-brand-cream rounded-xl text-sm focus:outline-none"
                  placeholder="Street name, landmark details, city..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-dark/80 mb-1 font-sans">Animal Photo URL (if possible)</label>
                <input
                  type="text"
                  value={rescueForm.photo}
                  onChange={(e) => setRescueForm({ ...rescueForm, photo: e.target.value })}
                  className="w-full px-3 py-2 border border-brand-cream rounded-xl text-sm focus:outline-none"
                  placeholder="Paste image URL of the animal"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-dark/80 mb-1 font-sans">Incident Description & Danger context *</label>
                <textarea
                  required
                  value={rescueForm.description}
                  onChange={(e) => setRescueForm({ ...rescueForm, description: e.target.value })}
                  rows="3"
                  className="w-full px-3 py-2 border border-brand-cream rounded-xl text-sm focus:outline-none"
                  placeholder="Explain details: e.g. dog has bleeding leg, trapped in open drain, cannot stand..."
                />
              </div>

              <div className="pt-3 border-t border-brand-cream/30 flex justify-end gap-3 font-bold text-xs">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 border border-brand-cream bg-white text-brand-dark/80 rounded-xl hover:bg-brand-cream/35"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 text-white rounded-xl shadow-md hover:bg-red-700"
                >
                  File Dispatch Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          RESCUE DETAILS & LIVE TRACKING STATUS MODAL
      ---------------------------------------------------- */}
      {showDetailModal && selectedRescue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-dark/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-brand-cream/60 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="relative h-56 bg-brand-cream/20 shrink-0">
              <img
                src={selectedRescue.photo || 'https://images.unsplash.com/photo-1599113697920-562b76928e1d?w=500'}
                alt={selectedRescue.species}
                className="h-full w-full object-cover"
              />
              <button
                onClick={() => setShowDetailModal(false)}
                className="absolute top-4 right-4 rounded-full bg-brand-dark/60 backdrop-blur-sm p-2 text-white border border-white/20 hover:bg-brand-dark/80"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="flex justify-between items-start border-b border-brand-cream/20 pb-4">
                <div>
                  <h3 className="text-xl font-extrabold text-brand-dark">Rescue: {selectedRescue.species}</h3>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                      statusColors[selectedRescue.status]
                    }`}>
                      {selectedRescue.status}
                    </span>
                    <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase border ${
                      severityColors[selectedRescue.severity]
                    }`}>
                      {selectedRescue.severity} Severity
                    </span>
                  </div>
                </div>
              </div>

              {/* Coordinates location */}
              <div className="space-y-2.5 text-xs text-brand-dark/85">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-brand-orange" />
                  <div>
                    <p className="text-brand-dark/50 text-[10px] uppercase font-bold">Coordinates Location</p>
                    <p className="font-bold">{selectedRescue.location}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-brand-orange" />
                  <div>
                    <p className="text-brand-dark/50 text-[10px] uppercase font-bold">Reporter Contact Line</p>
                    <p className="font-bold">{selectedRescue.reporterPhone} (Reporter: {selectedRescue.reporterName})</p>
                  </div>
                </div>

                {selectedRescue.assignedRescuer && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-brand-green" />
                    <div>
                      <p className="text-brand-dark/50 text-[10px] uppercase font-bold">Assigned Dispatch Squad</p>
                      <p className="font-bold text-brand-green">{selectedRescue.assignedRescuer}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Danger context description */}
              <div>
                <h4 className="font-bold text-brand-dark mb-1 text-sm">Incident context description</h4>
                <p className="text-xs text-brand-dark/85 bg-brand-light/30 border border-brand-cream/20 p-3.5 rounded-xl whitespace-pre-line leading-relaxed">
                  {selectedRescue.description}
                </p>
              </div>

              {/* Status Tracker step list */}
              {renderStatusTracker(selectedRescue.status)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Rescue;
