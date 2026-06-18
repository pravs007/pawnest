import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Sparkles, 
  CalendarDays, 
  MapPin, 
  AlertTriangle, 
  ShieldCheck, 
  LogOut, 
  Menu, 
  X,
  Compass
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { to: '/dashboard', label: 'Pet Dashboard', icon: LayoutDashboard, authRequired: true },
    { to: '/ai-assistant', label: 'AI Assistant', icon: Sparkles, authRequired: true },
    { to: '/vaccinations', label: 'Vaccine Tracker', icon: CalendarDays, authRequired: true },
    { to: '/lost-found', label: 'Lost & Found', icon: MapPin },
    { to: '/rescue', label: 'Rescue Module', icon: AlertTriangle },
  ];

  // If admin, show admin dashboard option
  if (user && user.role === 'admin') {
    navItems.push({ to: '/admin', label: 'Admin Panel', icon: ShieldCheck });
  }

  const renderNavLinks = () => (
    <nav className="space-y-1.5 px-3 py-4">
      {navItems.map((item) => {
        if (item.authRequired && !user) return null;
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setIsOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3.5 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-brand-orange text-white shadow-md shadow-brand-orange/20 scale-[1.02]'
                  : 'text-brand-dark/80 hover:bg-brand-cream/60 hover:text-brand-brown hover:translate-x-1'
              }`
            }
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="flex h-16 items-center justify-between border-b border-brand-cream/50 bg-brand-light px-4 lg:hidden">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-xl font-extrabold text-brand-orange">🐾 PawNest</span>
        </Link>
        <button
          onClick={toggleSidebar}
          className="rounded-lg p-2 text-brand-dark/80 hover:bg-brand-cream/50 focus:outline-none"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-brand-dark/30 backdrop-blur-sm lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-brand-cream/40 bg-brand-light transition-all duration-300 lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center gap-2 border-b border-brand-cream/30 px-6">
          <Link to="/" className="flex items-center gap-2 hover:opacity-90">
            <span className="text-2xl font-extrabold tracking-wide text-brand-orange">🐾 PawNest</span>
          </Link>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 overflow-y-auto">
          {renderNavLinks()}
        </div>

        {/* User Profile / Auth Actions Footer */}
        <div className="border-t border-brand-cream/30 p-4 bg-brand-cream/20">
          {user ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <img
                  src={user.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.name}`}
                  alt={user.name}
                  className="h-10 w-10 rounded-full border border-brand-orange/40 object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-brand-dark">{user.name}</p>
                  <span className="inline-flex items-center rounded-full bg-brand-orange/15 px-2 py-0.5 text-xs font-semibold text-brand-orange capitalize">
                    {user.role}
                  </span>
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-brand-orange/30 bg-transparent px-4 py-2 text-xs font-bold text-brand-orange hover:bg-brand-orange hover:text-white transition-all duration-300"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-center font-medium text-brand-dark/60 mb-1">Access pet care tools</p>
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="flex w-full items-center justify-center rounded-xl bg-brand-orange py-2 text-center text-sm font-bold text-white shadow-md shadow-brand-orange/10 hover:bg-brand-orange/90 transition-all duration-200"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setIsOpen(false)}
                className="flex w-full items-center justify-center rounded-xl border border-brand-cream bg-white py-2 text-center text-sm font-bold text-brand-dark/80 hover:bg-brand-cream/40 transition-all duration-200"
              >
                Create Account
              </Link>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
