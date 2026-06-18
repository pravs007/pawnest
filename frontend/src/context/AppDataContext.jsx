import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const AppDataContext = createContext();

export const useAppData = () => useContext(AppDataContext);

export const AppDataProvider = ({ children }) => {
  const { token, user } = useAuth();
  
  // Dashboard states
  const [pets, setPets] = useState([]);
  const [vaccinations, setVaccinations] = useState([]);
  const [reports, setReports] = useState([]);
  const [rescues, setRescues] = useState([]);
  
  // Admin stats and lists
  const [adminStats, setAdminStats] = useState(null);
  const [adminUsers, setAdminUsers] = useState([]);

  // Loadings and errors
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Common fetch utility
  const fetchWithAuth = async (url, options = {}) => {
    const headers = { ...options.headers };
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(url, { ...options, headers });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'API request failed');
    }
    return data;
  };

  // ----------------------------------------------------
  // PET METHODS
  // ----------------------------------------------------
  const fetchPets = async () => {
    if (!token) return;
    try {
      const data = await fetchWithAuth('/api/pets');
      setPets(data);
    } catch (err) {
      console.error('Fetch pets failed:', err);
    }
  };

  const addPet = async (petData) => {
    try {
      const newPet = await fetchWithAuth('/api/pets', {
        method: 'POST',
        body: JSON.stringify(petData)
      });
      setPets(prev => [...prev, newPet]);
      return newPet;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updatePet = async (id, petData) => {
    try {
      const updatedPet = await fetchWithAuth(`/api/pets/${id}`, {
        method: 'PUT',
        body: JSON.stringify(petData)
      });
      setPets(prev => prev.map(p => p._id === id ? updatedPet : p));
      return updatedPet;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deletePet = async (id) => {
    try {
      await fetchWithAuth(`/api/pets/${id}`, { method: 'DELETE' });
      setPets(prev => prev.filter(p => p._id !== id));
      // Refresh vaccinations as they cascade delete
      fetchVaccinations();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // ----------------------------------------------------
  // VACCINATION METHODS
  // ----------------------------------------------------
  const fetchVaccinations = async () => {
    if (!token) return;
    try {
      const data = await fetchWithAuth('/api/vaccinations');
      setVaccinations(data);
    } catch (err) {
      console.error('Fetch vaccinations failed:', err);
    }
  };

  const addVaccination = async (vaccineData) => {
    try {
      const newVaccine = await fetchWithAuth('/api/vaccinations', {
        method: 'POST',
        body: JSON.stringify(vaccineData)
      });
      fetchVaccinations(); // Refresh to ensure name bindings
      return newVaccine;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateVaccination = async (id, vaccineData) => {
    try {
      const updated = await fetchWithAuth(`/api/vaccinations/${id}`, {
        method: 'PUT',
        body: JSON.stringify(vaccineData)
      });
      setVaccinations(prev => prev.map(v => v._id === id ? { ...v, ...updated } : v));
      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deleteVaccination = async (id) => {
    try {
      await fetchWithAuth(`/api/vaccinations/${id}`, { method: 'DELETE' });
      setVaccinations(prev => prev.filter(v => v._id !== id));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // ----------------------------------------------------
  // LOST & FOUND METHODS (PUBLIC INDEX)
  // ----------------------------------------------------
  const fetchReports = async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const url = `/api/reports?${queryParams}`;
      const data = await fetchWithAuth(url);
      setReports(data);
    } catch (err) {
      console.error('Fetch reports failed:', err);
    }
  };

  const addReport = async (reportData) => {
    try {
      const newReport = await fetchWithAuth('/api/reports', {
        method: 'POST',
        body: reportData instanceof FormData ? reportData : JSON.stringify(reportData)
      });
      setReports(prev => [newReport, ...prev]);
      return newReport;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateReport = async (id, reportData) => {
    try {
      const updated = await fetchWithAuth(`/api/reports/${id}`, {
        method: 'PUT',
        body: JSON.stringify(reportData)
      });
      setReports(prev => prev.map(r => r._id === id ? { ...r, ...updated } : r));
      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deleteReport = async (id) => {
    try {
      await fetchWithAuth(`/api/reports/${id}`, { method: 'DELETE' });
      setReports(prev => prev.filter(r => r._id !== id));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // ----------------------------------------------------
  // RESCUE METHODS (COMMUNITY INDEX)
  // ----------------------------------------------------
  const fetchRescues = async () => {
    try {
      const data = await fetchWithAuth('/api/rescues');
      setRescues(data);
    } catch (err) {
      console.error('Fetch rescues failed:', err);
    }
  };

  const submitRescueRequest = async (rescueData) => {
    try {
      const newRescue = await fetchWithAuth('/api/rescues', {
        method: 'POST',
        body: rescueData instanceof FormData ? rescueData : JSON.stringify(rescueData)
      });
      setRescues(prev => [newRescue, ...prev]);
      return newRescue;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateRescueStatus = async (id, statusData) => {
    try {
      const updated = await fetchWithAuth(`/api/rescues/${id}`, {
        method: 'PUT',
        body: JSON.stringify(statusData)
      });
      setRescues(prev => prev.map(r => r._id === id ? updated : r));
      // Refresh admin stats
      if (user && user.role === 'admin') fetchAdminStats();
      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // ----------------------------------------------------
  // ADMIN DASHBOARD METHODS
  // ----------------------------------------------------
  const fetchAdminStats = async () => {
    if (!token || user?.role !== 'admin') return;
    try {
      const data = await fetchWithAuth('/api/admin/stats');
      setAdminStats(data);
    } catch (err) {
      console.error('Fetch admin stats failed:', err);
    }
  };

  const fetchAdminUsers = async () => {
    if (!token || user?.role !== 'admin') return;
    try {
      const data = await fetchWithAuth('/api/admin/users');
      setAdminUsers(data);
    } catch (err) {
      console.error('Fetch admin users failed:', err);
    }
  };

  const toggleUserRole = async (userId) => {
    try {
      const updated = await fetchWithAuth(`/api/admin/users/${userId}/role`, {
        method: 'PUT'
      });
      setAdminUsers(prev => prev.map(u => u.id === userId ? { ...u, role: updated.role } : u));
      fetchAdminStats(); // Refresh general counts
      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deleteUserByAdmin = async (userId) => {
    try {
      await fetchWithAuth(`/api/admin/users/${userId}`, { method: 'DELETE' });
      setAdminUsers(prev => prev.filter(u => u.id !== userId));
      fetchAdminStats(); // Refresh global numbers
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // ----------------------------------------------------
  // DYNAMIC RE-FITCHING ON SESSION LOAD
  // ----------------------------------------------------
  useEffect(() => {
    if (token) {
      fetchPets();
      fetchVaccinations();
      if (user?.role === 'admin') {
        fetchAdminStats();
        fetchAdminUsers();
      }
    } else {
      setPets([]);
      setVaccinations([]);
      setAdminStats(null);
      setAdminUsers([]);
    }
    // Load public datasets regardless
    fetchReports();
    fetchRescues();
  }, [token, user]);

  const value = {
    pets,
    vaccinations,
    reports,
    rescues,
    adminStats,
    adminUsers,
    loading,
    error,
    setError,
    fetchPets,
    addPet,
    updatePet,
    deletePet,
    fetchVaccinations,
    addVaccination,
    updateVaccination,
    deleteVaccination,
    fetchReports,
    addReport,
    updateReport,
    deleteReport,
    fetchRescues,
    submitRescueRequest,
    updateRescueStatus,
    fetchAdminStats,
    fetchAdminUsers,
    toggleUserRole,
    deleteUserByAdmin
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
};
