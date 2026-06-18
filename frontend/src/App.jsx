import React from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppDataProvider } from './context/AppDataContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AIAssistant from './pages/AIAssistant';
import Vaccinations from './pages/Vaccinations';
import LostFound from './pages/LostFound';
import Rescue from './pages/Rescue';
import AdminDashboard from './pages/AdminDashboard';

// Layout wrapper for routes featuring the Sidebar navigation
const SidebarLayout = () => {
  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-brand-light">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto max-h-screen">
        <Outlet />
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppDataProvider>
        <Routes>
          {/* Standalone Full-screen Pages */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Layout Pages featuring the Sidebar */}
          <Route element={<SidebarLayout />}>
            {/* Public details boards */}
            <Route path="/lost-found" element={<LostFound />} />
            <Route path="/rescue" element={<Rescue />} />

            {/* Protected dashboard zones */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ai-assistant"
              element={
                <ProtectedRoute>
                  <AIAssistant />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vaccinations"
              element={
                <ProtectedRoute>
                  <Vaccinations />
                </ProtectedRoute>
              }
            />

            {/* Admin Controls */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute adminOnly={true}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </AppDataProvider>
    </AuthProvider>
  );
}

export default App;
