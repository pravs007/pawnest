import React, { useState } from 'react';
import { useAppData } from '../context/AppDataContext';
import { 
  Plus, 
  CalendarDays, 
  ChevronLeft, 
  ChevronRight, 
  Trash2, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  X,
  Sparkles
} from 'lucide-react';
import { validateName, validateDate, validateTextarea, sanitizeInput } from '../utils/validation';

const Vaccinations = () => {
  const { 
    pets, 
    vaccinations, 
    addVaccination, 
    updateVaccination, 
    deleteVaccination 
  } = useAppData();

  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayEvents, setSelectedDayEvents] = useState([]);
  const [showDayEventsModal, setShowDayEventsModal] = useState(false);
  
  // Add modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [formError, setFormError] = useState('');
  const [vaccineForm, setVaccineForm] = useState({
    petId: '',
    name: '',
    dateAdministered: '',
    dateDue: '',
    status: 'Pending',
    notes: ''
  });
  const [errors, setErrors] = useState({
    name: '',
    dateDue: '',
    dateAdministered: '',
    notes: ''
  });

  // Filter state
  const [statusFilter, setStatusFilter] = useState('all');

  const handleFieldChange = (field, val) => {
    setVaccineForm(prev => ({ ...prev, [field]: val }));
    let err = '';
    if (field === 'name') {
      const trimmedName = val.trim();
      if (!val || trimmedName === '') {
        err = 'Vaccine name is required';
      } else if (trimmedName.length < 2) {
        err = 'Vaccine name must be at least 2 characters';
      } else if (trimmedName.length > 50) {
        err = 'Vaccine name must be at most 50 characters';
      }
    } else if (field === 'dateDue') {
      err = validateDate(val, true, 'Due date');
    } else if (field === 'dateAdministered') {
      if (val) {
        err = validateDate(val, false, 'Administered date');
      }
    } else if (field === 'notes') {
      if (val.trim() !== '') {
        err = validateTextarea(val, 0, 1000, 'Notes');
      }
    }
    setErrors(prev => ({ ...prev, [field]: err }));
  };

  const handleFieldBlur = (field) => {
    const val = vaccineForm[field];
    const trimmed = typeof val === 'string' ? val.trim() : val;
    setVaccineForm(prev => ({ ...prev, [field]: trimmed }));
    
    let err = '';
    if (field === 'name') {
      if (!trimmed || trimmed === '') {
        err = 'Vaccine name is required';
      } else if (trimmed.length < 2) {
        err = 'Vaccine name must be at least 2 characters';
      } else if (trimmed.length > 50) {
        err = 'Vaccine name must be at most 50 characters';
      }
    } else if (field === 'dateDue') {
      err = validateDate(trimmed, true, 'Due date');
    } else if (field === 'dateAdministered') {
      if (trimmed) {
        err = validateDate(trimmed, false, 'Administered date');
      }
    } else if (field === 'notes') {
      if (trimmed !== '') {
        err = validateTextarea(trimmed, 0, 1000, 'Notes');
      }
    }
    setErrors(prev => ({ ...prev, [field]: err }));
  };

  // Calendar Calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Get vaccinations falling in this day
  const getDayEvents = (day) => {
    const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return vaccinations.filter(v => v.dateDue === formattedDate);
  };

  const handleDayClick = (day) => {
    const events = getDayEvents(day);
    if (events.length > 0) {
      setSelectedDayEvents(events);
      setShowDayEventsModal(true);
    }
  };

  // Submit new record
  const handleSubmit = async (e) => {
    e.preventDefault();
    const { petId, name, dateDue, dateAdministered, status, notes } = vaccineForm;

    let nameErr = '';
    const trimmedName = (name || '').trim();
    if (!name || trimmedName === '') {
      nameErr = 'Vaccine name is required';
    } else if (trimmedName.length < 2) {
      nameErr = 'Vaccine name must be at least 2 characters';
    } else if (trimmedName.length > 50) {
      nameErr = 'Vaccine name must be at most 50 characters';
    }

    const dateDueErr = validateDate(dateDue, true, 'Due date');
    const dateAdministeredErr = status === 'Completed' && dateAdministered ? validateDate(dateAdministered, false, 'Administered date') : '';
    const notesErr = notes && notes.trim() !== '' ? validateTextarea(notes, 0, 1000, 'Notes') : '';

    if (nameErr || dateDueErr || dateAdministeredErr || notesErr) {
      setErrors({
        name: nameErr,
        dateDue: dateDueErr,
        dateAdministered: dateAdministeredErr,
        notes: notesErr
      });
      setFormError('Please resolve all validation errors.');
      return;
    }

    try {
      const sanitizedForm = {
        petId,
        name: sanitizeInput(name),
        dateDue: sanitizeInput(dateDue),
        dateAdministered: dateAdministered ? sanitizeInput(dateAdministered) : '',
        status,
        notes: notes ? sanitizeInput(notes) : ''
      };
      await addVaccination(sanitizedForm);
      setShowAddModal(false);
      setFormError('');
    } catch (err) {
      setFormError(err.message || 'Failed to save vaccination');
    }
  };

  // Toggle Completed Status
  const handleToggleStatus = async (v) => {
    const newStatus = v.status === 'Completed' ? 'Pending' : 'Completed';
    const administeredDate = newStatus === 'Completed' ? new Date().toISOString().split('T')[0] : '';
    try {
      await updateVaccination(v._id || v.id, { status: newStatus, dateAdministered: administeredDate });
      
      // Update the day events modal list if currently open
      if (showDayEventsModal) {
        setSelectedDayEvents(prev => 
          prev.map(item => (item._id || item.id) === (v._id || v.id) ? { ...item, status: newStatus, dateAdministered: administeredDate } : item)
        );
      }
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this vaccination record?')) {
      try {
        await deleteVaccination(id);
        setShowDayEventsModal(false);
      } catch (err) {
        alert('Failed to delete vaccination');
      }
    }
  };

  // Filtered timeline records
  const filteredTimeline = vaccinations.filter(v => {
    if (statusFilter === 'all') return true;
    return v.status === statusFilter;
  });
  
  // Sort by dateDue (nearest first)
  filteredTimeline.sort((a, b) => new Date(a.dateDue) - new Date(b.dateDue));

  // Render Calendar Cells
  const renderCalendarCells = () => {
    const cells = [];
    
    // Blank padding for previous month offset
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push(<div key={`empty-${i}`} className="h-14 lg:h-20 bg-brand-cream/5 border border-brand-cream/10"></div>);
    }

    // Days in current month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayEvents = getDayEvents(day);
      const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;

      cells.push(
        <div
          key={day}
          onClick={() => handleDayClick(day)}
          className={`h-14 lg:h-20 border border-brand-cream/10 p-1.5 flex flex-col justify-between cursor-pointer hover:bg-brand-cream/20 calendar-day-transition ${
            isToday ? 'bg-brand-orange/5 font-extrabold border-brand-orange/30' : 'bg-white'
          }`}
        >
          <span className={`text-xs font-bold ${isToday ? 'text-brand-orange' : 'text-brand-dark/80'}`}>{day}</span>
          
          {/* Day events indicator dots */}
          {dayEvents.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {dayEvents.map(e => (
                <span
                  key={e._id || e.id}
                  title={`${e.petName}: ${e.name}`}
                  className={`h-2 w-2 rounded-full shrink-0 ${
                    e.status === 'Completed' ? 'bg-brand-green' : 'bg-brand-orange'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      );
    }

    return cells;
  };

  return (
    <div className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full flex flex-col lg:flex-row gap-8">
      {/* LEFT COLUMN: Calendar grid */}
      <div className="flex-1 bg-white p-6 rounded-3xl border border-brand-cream/40 shadow-sm flex flex-col">
        {/* Calendar Title & Header controls */}
        <div className="flex items-center justify-between pb-4 border-b border-brand-cream/20 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-brand-dark flex items-center gap-2">
              <CalendarDays className="h-6 w-6 text-brand-orange" />
              Vaccine Calendar
            </h2>
            <p className="text-xs text-brand-dark/50 mt-0.5">Click days with dots to view schedules</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={prevMonth}
              className="rounded-lg p-1.5 border border-brand-cream hover:bg-brand-cream/35 text-brand-dark/70"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-sm font-extrabold text-brand-dark min-w-[120px] text-center">
              {monthNames[month]} {year}
            </span>
            <button
              onClick={nextMonth}
              className="rounded-lg p-1.5 border border-brand-cream hover:bg-brand-cream/35 text-brand-dark/70"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Calendar Grid Header */}
        <div className="grid grid-cols-7 text-center font-bold text-xs text-brand-dark/65 bg-brand-light/45 py-2.5 rounded-xl border border-brand-cream/10 mb-2">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        {/* Days grid container */}
        <div className="grid grid-cols-7 border-l border-t border-brand-cream/10 rounded-lg overflow-hidden flex-1">
          {renderCalendarCells()}
        </div>
      </div>

      {/* RIGHT COLUMN: List Timeline & Adder */}
      <div className="w-full lg:w-96 flex flex-col gap-6 shrink-0">
        {/* Action Panel */}
        <div className="bg-white p-6 rounded-3xl border border-brand-cream/40 shadow-sm text-center">
          <span className="text-3xl">💉</span>
          <h3 className="text-lg font-bold text-brand-dark mt-2">Add Vaccination</h3>
          <p className="text-xs text-brand-dark/60 mt-1 mb-4">
            Log completed pet shots or queue upcoming schedule booster reminders.
          </p>
          <button
            onClick={() => {
              if (pets.length === 0) {
                alert('Please register a pet in the dashboard first before logging vaccines.');
                return;
              }
              setVaccineForm({ petId: pets[0]._id || pets[0].id, name: '', dateAdministered: '', dateDue: '', status: 'Pending', notes: '' });
              setErrors({ name: '', dateDue: '', dateAdministered: '', notes: '' });
              setFormError('');
              setShowAddModal(true);
            }}
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand-orange py-2.5 text-sm font-bold text-white shadow-md shadow-brand-orange/15 hover:bg-brand-orange/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Record Vaccine
          </button>
        </div>

        {/* Timeline Event Feed */}
        <div className="bg-white p-6 rounded-3xl border border-brand-cream/40 shadow-sm flex-1 flex flex-col min-h-[350px]">
          {/* Header Filters */}
          <div className="flex items-center justify-between border-b border-brand-cream/20 pb-3 mb-4">
            <h4 className="font-bold text-brand-dark">Schedules Feed</h4>
            
            {/* Status tags */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs font-bold border border-brand-cream rounded-lg px-2 py-1 focus:outline-none"
            >
              <option value="all">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          {/* Timeline Feed Container */}
          {filteredTimeline.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
              <span className="text-3xl mb-2 text-brand-dark/30">📅</span>
              <p className="text-xs text-brand-dark/50 font-semibold">No vaccine logs found matching filter</p>
            </div>
          ) : (
            <div className="space-y-4 overflow-y-auto max-h-[400px] pr-1.5 flex-1">
              {filteredTimeline.map((v) => (
                <div 
                  key={v._id || v.id} 
                  className={`flex gap-3 p-3 rounded-2xl border ${
                    v.status === 'Completed' ? 'border-brand-green/20 bg-brand-green/5' : 'border-brand-orange/20 bg-brand-orange/5'
                  }`}
                >
                  <div className={`rounded-xl p-2 h-9 w-9 shrink-0 flex items-center justify-center ${
                    v.status === 'Completed' ? 'bg-brand-green/15 text-brand-green' : 'bg-brand-orange/15 text-brand-orange'
                  }`}>
                    {v.status === 'Completed' ? <CheckCircle className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between items-start">
                      <h5 className="text-sm font-bold text-brand-dark truncate">{v.name}</h5>
                      <button 
                        onClick={() => handleDelete(v._id || v.id)}
                        className="text-brand-dark/40 hover:text-red-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="text-xs text-brand-dark/70 mt-0.5">Pet: <span className="font-semibold">{v.petName}</span></p>
                    <p className="text-[10px] text-brand-dark/50 mt-1">Due: {v.dateDue}</p>
                    
                    {v.notes && (
                      <p className="text-[10px] bg-white border border-brand-cream/30 p-1 rounded mt-1.5 text-brand-dark/75 italic">
                        Note: {v.notes}
                      </p>
                    )}

                    {/* Checkbox Trigger to resolve status */}
                    <button
                      onClick={() => handleToggleStatus(v)}
                      className="mt-2.5 text-[10px] font-bold text-brand-orange hover:underline block"
                    >
                      {v.status === 'Completed' ? '↩️ Mark Pending' : '✓ Mark Completed'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ----------------------------------------------------
          ADD VACCINATION RECORD MODAL
      ---------------------------------------------------- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-dark/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-3xl border border-brand-cream/60 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-brand-cream/30 p-5">
              <h3 className="text-lg font-bold text-brand-dark">Record Vaccine Shot</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1.5 text-brand-dark/50 hover:bg-brand-cream/40"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="flex gap-2 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-brand-dark/80 mb-1">Select Pet *</label>
                <select
                  value={vaccineForm.petId}
                  onChange={(e) => setVaccineForm({ ...vaccineForm, petId: e.target.value })}
                  className="w-full px-3 py-2 border border-brand-cream rounded-xl text-sm focus:outline-none"
                >
                  {pets.map(p => (
                    <option key={p._id || p.id} value={p._id || p.id}>{p.name} ({p.breed})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-dark/80 mb-1">Vaccine Name *</label>
                <input
                  type="text"
                  required
                  value={vaccineForm.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  onBlur={() => handleFieldBlur('name')}
                  className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-1 ${
                    errors.name 
                      ? 'border-red-500 focus:ring-red-200 focus:border-red-500' 
                      : 'border-brand-cream focus:ring-brand-orange'
                  }`}
                  placeholder="e.g. DHPP, Rabies booster"
                />
                {errors.name && (
                  <p className="mt-1 text-[10px] text-red-500 font-medium">{errors.name}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-brand-dark/80 mb-1">Upcoming Due Date *</label>
                  <input
                    type="date"
                    required
                    value={vaccineForm.dateDue}
                    onChange={(e) => handleFieldChange('dateDue', e.target.value)}
                    onBlur={() => handleFieldBlur('dateDue')}
                    className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-1 ${
                      errors.dateDue 
                        ? 'border-red-500 focus:ring-red-200 focus:border-red-500' 
                        : 'border-brand-cream focus:ring-brand-orange'
                    }`}
                  />
                  {errors.dateDue && (
                    <p className="mt-1 text-[10px] text-red-500 font-medium">{errors.dateDue}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-dark/80 mb-1">Status</label>
                  <select
                    value={vaccineForm.status}
                    onChange={(e) => handleFieldChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-brand-cream rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-brand-orange"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              {vaccineForm.status === 'Completed' && (
                <div>
                  <label className="block text-xs font-semibold text-brand-dark/80 mb-1">Date Administered</label>
                  <input
                    type="date"
                    value={vaccineForm.dateAdministered}
                    onChange={(e) => handleFieldChange('dateAdministered', e.target.value)}
                    onBlur={() => handleFieldBlur('dateAdministered')}
                    className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-1 ${
                      errors.dateAdministered 
                        ? 'border-red-500 focus:ring-red-200 focus:border-red-500' 
                        : 'border-brand-cream focus:ring-brand-orange'
                    }`}
                  />
                  {errors.dateAdministered && (
                    <p className="mt-1 text-[10px] text-red-500 font-medium">{errors.dateAdministered}</p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-brand-dark/80 mb-1">Notes</label>
                <textarea
                  value={vaccineForm.notes}
                  onChange={(e) => handleFieldChange('notes', e.target.value)}
                  onBlur={() => handleFieldBlur('notes')}
                  rows="2"
                  className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-1 ${
                    errors.notes 
                      ? 'border-red-500 focus:ring-red-200 focus:border-red-500' 
                      : 'border-brand-cream focus:ring-brand-orange'
                  }`}
                  placeholder="Dosage details, veterinarian info..."
                />
                {errors.notes && (
                  <p className="mt-1 text-[10px] text-red-500 font-medium">{errors.notes}</p>
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
                    !!errors.name || 
                    !!errors.dateDue || 
                    !!errors.dateAdministered || 
                    !!errors.notes || 
                    !vaccineForm.name || 
                    !vaccineForm.dateDue
                  }
                  className="px-5 py-2 bg-brand-orange text-xs font-bold text-white rounded-xl shadow-md hover:bg-brand-orange/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          DAY EVENTS PREVIEW DIALOG MODAL
      ---------------------------------------------------- */}
      {showDayEventsModal && selectedDayEvents.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-dark/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-3xl border border-brand-cream/60 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-brand-cream/30 p-5">
              <h3 className="text-lg font-bold text-brand-dark flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-brand-orange" />
                Schedule: {selectedDayEvents[0].dateDue}
              </h3>
              <button
                onClick={() => setShowDayEventsModal(false)}
                className="rounded-lg p-1.5 text-brand-dark/50 hover:bg-brand-cream/40"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* List */}
            <div className="p-6 space-y-4">
              {selectedDayEvents.map(e => (
                <div key={e._id || e.id} className="p-4 bg-brand-light/30 border border-brand-cream/20 rounded-2xl space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-bold text-brand-dark">{e.name}</h4>
                      <p className="text-xs text-brand-dark/60 mt-0.5">Pet: <span className="font-semibold text-brand-dark">{e.petName}</span></p>
                    </div>
                    <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${
                      e.status === 'Completed' ? 'bg-brand-green/15 text-brand-green' : 'bg-brand-orange/15 text-brand-orange'
                    }`}>
                      {e.status}
                    </span>
                  </div>

                  {e.notes && <p className="text-xs bg-white p-2 rounded border border-brand-cream/20 text-brand-dark/80 italic">{e.notes}</p>}

                  <div className="flex justify-between items-center border-t border-brand-cream/20 pt-2 text-xs">
                    <button
                      onClick={() => handleToggleStatus(e)}
                      className="font-bold text-brand-orange hover:underline"
                    >
                      {e.status === 'Completed' ? '↩️ Mark Pending' : '✓ Mark Completed'}
                    </button>
                    <button
                      onClick={() => handleDelete(e._id || e.id)}
                      className="font-bold text-red-500 hover:underline flex items-center gap-0.5"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vaccinations;
