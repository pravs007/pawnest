import React, { useState, useEffect } from 'react';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  FolderHeart, 
  AlertTriangle, 
  HeartHandshake, 
  Trash2, 
  ShieldAlert, 
  Check, 
  Activity,
  UserCheck,
  ClipboardList
} from 'lucide-react';

const AdminDashboard = () => {
  const { user: currentUser } = useAuth();
  const { 
    adminStats, 
    adminUsers, 
    adoptions, 
    rescues, 
    fetchAdminStats, 
    fetchAdminUsers, 
    toggleUserRole, 
    deleteUserByAdmin, 
    deleteAdoptionListing,
    updateRescueStatus
  } = useAppData();

  // Selected tab state
  const [activeTab, setActiveTab] = useState('users');
  const [editingRescuerId, setEditingRescuerId] = useState(null);
  const [rescuerInput, setRescuerInput] = useState('');

  // Re-fetch stats on mount
  useEffect(() => {
    fetchAdminStats();
    fetchAdminUsers();
  }, []);

  const handleToggleRole = async (userId) => {
    try {
      await toggleUserRole(userId);
      alert('User role toggled successfully!');
    } catch (err) {
      alert(err.message || 'Failed to toggle user role');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('WARNING: Deleting this user will permanently erase their profile, all their registered pets, vaccine files, adoption listings, and lost reports. Proceed?')) {
      try {
        await deleteUserByAdmin(userId);
        alert('User and all associated data deleted successfully.');
      } catch (err) {
        alert(err.message || 'Failed to delete user');
      }
    }
  };

  const handleDeleteAdoption = async (id) => {
    if (window.confirm('Delete this adoption listing permanently?')) {
      try {
        await deleteAdoptionListing(id);
      } catch (err) {
        alert('Failed to delete listing');
      }
    }
  };

  const handleRescueStatusChange = async (id, status) => {
    try {
      await updateRescueStatus(id, { status });
      alert('Rescue request status updated!');
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleRescuerSubmit = async (id) => {
    try {
      await updateRescueStatus(id, { assignedRescuer: rescuerInput });
      setEditingRescuerId(null);
      alert('Rescuer squad assigned!');
    } catch (err) {
      alert('Failed to assign rescuer');
    }
  };

  return (
    <div className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full">
      {/* Greeting Header */}
      <div className="mb-8 border-b border-brand-cream/30 pb-4">
        <h1 className="text-3xl font-extrabold text-brand-dark tracking-tight">Admin Operations Console</h1>
        <p className="text-brand-dark/70 mt-1">Platform analytics, user access controls, and emergency dispatches.</p>
      </div>

      {/* Analytics Cards Row */}
      {adminStats && (
        <div className="grid gap-5 grid-cols-2 lg:grid-cols-4 mb-10">
          <div className="rounded-2xl border border-brand-cream bg-white p-5 shadow-sm flex items-center gap-4">
            <div className="rounded-xl bg-brand-orange/10 p-3 text-brand-orange">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-brand-dark">{adminStats.totalUsers}</p>
              <p className="text-xs font-semibold text-brand-dark/50 uppercase">Active Users</p>
            </div>
          </div>

          <div className="rounded-2xl border border-brand-cream bg-white p-5 shadow-sm flex items-center gap-4">
            <div className="rounded-xl bg-brand-green/10 p-3 text-brand-green">
              <FolderHeart className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-brand-dark">{adminStats.totalPets}</p>
              <p className="text-xs font-semibold text-brand-dark/50 uppercase">Total Pets</p>
            </div>
          </div>

          <div className="rounded-2xl border border-brand-cream bg-white p-5 shadow-sm flex items-center gap-4">
            <div className="rounded-xl bg-red-100 p-3 text-red-500">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-brand-dark">{adminStats.totalRescues}</p>
              <p className="text-xs font-semibold text-brand-dark/50 uppercase">Rescue Reports</p>
            </div>
          </div>

          <div className="rounded-2xl border border-brand-cream bg-white p-5 shadow-sm flex items-center gap-4">
            <div className="rounded-xl bg-brand-orange/10 p-3 text-brand-orange">
              <HeartHandshake className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-brand-dark">{adminStats.totalAdoptions}</p>
              <p className="text-xs font-semibold text-brand-dark/50 uppercase">Adoption Ads</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs list selector */}
      <div className="flex border-b border-brand-cream/30 mb-6 font-bold text-sm">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-5 py-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'users' 
              ? 'border-brand-orange text-brand-orange' 
              : 'border-transparent text-brand-dark/60 hover:text-brand-dark hover:border-brand-cream'
          }`}
        >
          <Users className="h-4.5 w-4.5" />
          Manage Users ({adminUsers.length})
        </button>

        <button
          onClick={() => setActiveTab('adoptions')}
          className={`px-5 py-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'adoptions' 
              ? 'border-brand-orange text-brand-orange' 
              : 'border-transparent text-brand-dark/60 hover:text-brand-dark hover:border-brand-cream'
          }`}
        >
          <ClipboardList className="h-4.5 w-4.5" />
          Adoption Listings ({adoptions.length})
        </button>

        <button
          onClick={() => setActiveTab('rescues')}
          className={`px-5 py-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'rescues' 
              ? 'border-brand-orange text-brand-orange' 
              : 'border-transparent text-brand-dark/60 hover:text-brand-dark hover:border-brand-cream'
          }`}
        >
          <Activity className="h-4.5 w-4.5" />
          Rescue Dispatcher ({rescues.length})
        </button>
      </div>

      {/* ----------------------------------------------------
          TAB 1: USER CONTROLS TABLE
      ---------------------------------------------------- */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl border border-brand-cream/40 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-brand-light/45 font-extrabold text-brand-dark/70 border-b border-brand-cream/20">
                <tr>
                  <th className="p-4">Avatar</th>
                  <th className="p-4">Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Role</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-cream/15 text-brand-dark/85 font-medium">
                {adminUsers.map(u => (
                  <tr key={u.id} className="hover:bg-brand-light/20">
                    <td className="p-4">
                      <img src={u.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${u.name}`} alt={u.name} className="h-8 w-8 rounded-full border bg-brand-light object-cover" />
                    </td>
                    <td className="p-4 font-bold text-brand-dark">{u.name}</td>
                    <td className="p-4">{u.email}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[9px] ${
                        u.role === 'admin' ? 'bg-brand-orange/15 text-brand-orange' : 'bg-brand-cream text-brand-dark/65'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      {u.id !== currentUser?.id && (
                        <>
                          <button
                            onClick={() => handleToggleRole(u.id)}
                            className="inline-flex items-center gap-0.5 rounded-lg border border-brand-cream bg-white px-2.5 py-1.5 font-bold hover:bg-brand-cream/30"
                          >
                            <UserCheck className="h-3.5 w-3.5" />
                            Toggle Role
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="inline-flex items-center gap-0.5 rounded-lg border border-red-200 text-red-650 bg-white px-2.5 py-1.5 font-bold hover:bg-red-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          TAB 2: ADOPTIONS VERIFICATION
      ---------------------------------------------------- */}
      {activeTab === 'adoptions' && (
        <div className="bg-white rounded-3xl border border-brand-cream/40 shadow-sm overflow-hidden">
          {adoptions.length === 0 ? (
            <div className="p-8 text-center text-xs text-brand-dark/50">No adoption listings found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-brand-light/45 font-extrabold text-brand-dark/70 border-b border-brand-cream/20">
                  <tr>
                    <th className="p-4">Pet Photo</th>
                    <th className="p-4">Pet Name</th>
                    <th className="p-4">Breed</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Applications</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-cream/15 text-brand-dark/85 font-medium">
                  {adoptions.map(ad => (
                    <tr key={ad._id || ad.id} className="hover:bg-brand-light/20">
                      <td className="p-4">
                        <img src={ad.photo} alt={ad.petName} className="h-10 w-16 object-cover rounded-lg border" />
                      </td>
                      <td className="p-4 font-bold text-brand-dark">{ad.petName}</td>
                      <td className="p-4">{ad.breed} ({ad.species})</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[9px] ${
                          ad.status === 'adopted' ? 'bg-brand-green/15 text-brand-green' : 'bg-brand-orange/15 text-brand-orange'
                        }`}>
                          {ad.status}
                        </span>
                      </td>
                      <td className="p-4 font-bold">{ad.requests.length} applicants</td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDeleteAdoption(ad._id || ad.id)}
                          className="inline-flex items-center gap-0.5 rounded-lg border border-red-200 text-red-650 bg-white px-2.5 py-1.5 font-bold hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete listing
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ----------------------------------------------------
          TAB 3: RESCUES DISPATCH DISPATCHER
      ---------------------------------------------------- */}
      {activeTab === 'rescues' && (
        <div className="bg-white rounded-3xl border border-brand-cream/40 shadow-sm overflow-hidden">
          {rescues.length === 0 ? (
            <div className="p-8 text-center text-xs text-brand-dark/50">No rescue reports submitted.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-brand-light/45 font-extrabold text-brand-dark/70 border-b border-brand-cream/20">
                  <tr>
                    <th className="p-4">Species</th>
                    <th className="p-4">Location</th>
                    <th className="p-4">Severity</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Assigned Rescuer</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-cream/15 text-brand-dark/85 font-medium">
                  {rescues.map(res => (
                    <tr key={res._id || res.id} className="hover:bg-brand-light/20">
                      <td className="p-4 font-bold text-brand-dark">{res.species}</td>
                      <td className="p-4 max-w-[200px] truncate">{res.location}</td>
                      <td className="p-4 font-bold uppercase">{res.severity}</td>
                      <td className="p-4">
                        <select
                          value={res.status}
                          onChange={(e) => handleRescueStatusChange(res._id || res.id, e.target.value)}
                          className="border border-brand-cream bg-white text-xs font-bold rounded-lg px-2 py-1 focus:outline-none"
                        >
                          <option value="reported">Reported</option>
                          <option value="dispatched">Dispatched</option>
                          <option value="rescued">Rescued</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="p-4">
                        {editingRescuerId === (res._id || res.id) ? (
                          <div className="flex gap-1.5 max-w-[150px]">
                            <input
                              type="text"
                              value={rescuerInput}
                              onChange={(e) => setRescuerInput(e.target.value)}
                              className="px-2 py-1 border border-brand-cream rounded text-xs focus:outline-none flex-1"
                            />
                            <button
                              onClick={() => handleRescuerSubmit(res._id || res.id)}
                              className="bg-brand-green text-white p-1 rounded hover:bg-brand-green/95"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-brand-dark/75">
                              {res.assignedRescuer || 'None Assigned'}
                            </span>
                            <button
                              onClick={() => {
                                setEditingRescuerId(res._id || res.id);
                                setRescuerInput(res.assignedRescuer || '');
                              }}
                              className="text-brand-orange font-bold text-[10px] hover:underline"
                            >
                              Edit
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        {/* We could add delete, but update status is primary */}
                        <span className="text-[10px] text-brand-dark/45 font-sans">
                          {new Date(res.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
