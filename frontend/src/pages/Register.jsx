import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, ShieldAlert, ArrowLeft } from 'lucide-react';
import { validateName, validateEmail, validatePassword, sanitizeInput } from '../utils/validation';

const Register = () => {
  const { register, error: authError } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [avatarSeed, setAvatarSeed] = useState(Math.random().toString(36).substring(7));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const avatarUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(avatarSeed)}`;

  const regenerateAvatar = () => {
    setAvatarSeed(Math.random().toString(36).substring(7));
  };

  const handleNameChange = (val) => {
    if (val.trim() === '' && val !== '') {
      setErrors(prev => ({ ...prev, name: 'Name cannot contain only spaces' }));
      setName(val);
      return;
    }
    setName(val);
    const err = validateName(val, 'Full Name');
    setErrors(prev => ({ ...prev, name: err }));
  };

  const handleEmailChange = (val) => {
    if (val.trim() === '' && val !== '') {
      setErrors(prev => ({ ...prev, email: 'Email cannot contain only spaces' }));
      setEmail(val);
      return;
    }
    setEmail(val);
    const err = validateEmail(val);
    setErrors(prev => ({ ...prev, email: err }));
  };

  const handlePasswordChange = (val) => {
    if (val.trim() === '' && val !== '') {
      setErrors(prev => ({ ...prev, password: 'Password cannot contain only spaces' }));
      setPassword(val);
      return;
    }
    setPassword(val);
    const err = validatePassword(val);
    setErrors(prev => ({ ...prev, password: err }));
    
    // Also validate confirm password when password changes
    if (confirmPassword && val !== confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
    } else if (confirmPassword && val === confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: '' }));
    }
  };

  const handleConfirmPasswordChange = (val) => {
    if (val.trim() === '' && val !== '') {
      setErrors(prev => ({ ...prev, confirmPassword: 'Confirm password cannot contain only spaces' }));
      setConfirmPassword(val);
      return;
    }
    setConfirmPassword(val);
    let err = '';
    if (val !== password) {
      err = 'Passwords do not match';
    }
    setErrors(prev => ({ ...prev, confirmPassword: err }));
  };

  const handleNameBlur = () => {
    const trimmed = name.trim();
    setName(trimmed);
    const err = validateName(trimmed, 'Full Name');
    setErrors(prev => ({ ...prev, name: err }));
  };

  const handleEmailBlur = () => {
    const trimmed = email.trim();
    setEmail(trimmed);
    const err = validateEmail(trimmed);
    setErrors(prev => ({ ...prev, email: err }));
  };

  const handlePasswordBlur = () => {
    const trimmed = password.trim();
    setPassword(trimmed);
    const err = validatePassword(trimmed);
    setErrors(prev => ({ ...prev, password: err }));
  };

  const handleConfirmPasswordBlur = () => {
    const trimmed = confirmPassword.trim();
    setConfirmPassword(trimmed);
    let err = '';
    if (trimmed !== password) {
      err = 'Passwords do not match';
    }
    setErrors(prev => ({ ...prev, confirmPassword: err }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    const trimmedConfirm = confirmPassword.trim();

    setName(trimmedName);
    setEmail(trimmedEmail);
    setPassword(trimmedPassword);
    setConfirmPassword(trimmedConfirm);

    const nameErr = validateName(trimmedName, 'Full Name');
    const emailErr = validateEmail(trimmedEmail);
    const passwordErr = validatePassword(trimmedPassword);
    const confirmErr = trimmedConfirm !== trimmedPassword ? 'Passwords do not match' : '';

    if (nameErr || emailErr || passwordErr || confirmErr) {
      setErrors({
        name: nameErr,
        email: emailErr,
        password: passwordErr,
        confirmPassword: confirmErr
      });
      setError('Please resolve all validation errors before creating your account.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const sanitizedName = sanitizeInput(trimmedName);
      const sanitizedEmail = sanitizeInput(trimmedEmail);
      const sanitizedPassword = sanitizeInput(trimmedPassword);
      await register(sanitizedName, sanitizedEmail, sanitizedPassword, avatarUrl);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed. Email might already be taken.');
    } finally {
      setLoading(false);
    }
  };

  const isFormInvalid = 
    !!errors.name || 
    !!errors.email || 
    !!errors.password || 
    !!errors.confirmPassword || 
    !name || 
    !email || 
    !password || 
    !confirmPassword;

  return (
    <div className="flex min-h-screen flex-col bg-brand-light items-center justify-center px-4 py-12 sm:px-6 lg:px-8 selection:bg-brand-orange selection:text-white">
      {/* Return button */}
      <Link to="/" className="absolute top-6 left-6 flex items-center gap-2 text-sm font-semibold text-brand-dark/70 hover:text-brand-orange transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </Link>

      <div className="w-full max-w-md space-y-6 bg-white p-8 rounded-3xl border border-brand-cream/40 shadow-xl">
        <div className="text-center">
          <span className="text-4xl">🐾</span>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-brand-dark">
            Join PawNest
          </h2>
          <p className="mt-1.5 text-sm text-brand-dark/60">
            Create an account to start managing your pets' wellness.
          </p>
        </div>

        {/* Error Banners */}
        {(error || authError) && (
          <div className="flex items-start gap-2.5 rounded-2xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
            <ShieldAlert className="h-5 w-5 shrink-0 text-red-500" />
            <span>{error || authError}</span>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Avatar Selector */}
          <div className="flex flex-col items-center gap-2 mb-4 bg-brand-cream/10 p-4 rounded-2xl border border-brand-cream/20">
            <img
              src={avatarUrl}
              alt="Avatar Preview"
              className="h-16 w-16 rounded-full border-2 border-brand-orange/50 bg-white object-cover"
            />
            <button
              type="button"
              onClick={regenerateAvatar}
              className="text-xs font-bold text-brand-orange hover:underline focus:outline-none"
            >
              🎲 Roll Avatar Choice
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-brand-dark/80 mb-1">
                Your Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-brand-dark/40">
                  <User className="h-5 w-5" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  onBlur={handleNameBlur}
                  className={`block w-full pl-11 pr-4 py-3 border bg-brand-light/20 rounded-2xl text-brand-dark placeholder-brand-dark/40 focus:outline-none focus:ring-2 text-sm font-medium transition-all ${
                    errors.name 
                      ? 'border-red-500 focus:ring-red-200 focus:border-red-500' 
                      : 'border-brand-cream focus:ring-brand-orange/20 focus:border-brand-orange'
                  }`}
                  placeholder="John Doe"
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-xs text-red-500 font-medium">{errors.name}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-brand-dark/80 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-brand-dark/40">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  onBlur={handleEmailBlur}
                  className={`block w-full pl-11 pr-4 py-3 border bg-brand-light/20 rounded-2xl text-brand-dark placeholder-brand-dark/40 focus:outline-none focus:ring-2 text-sm font-medium transition-all ${
                    errors.email 
                      ? 'border-red-500 focus:ring-red-200 focus:border-red-500' 
                      : 'border-brand-cream focus:ring-brand-orange/20 focus:border-brand-orange'
                  }`}
                  placeholder="john@example.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-red-500 font-medium">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-brand-dark/80 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-brand-dark/40">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  onBlur={handlePasswordBlur}
                  className={`block w-full pl-11 pr-4 py-3 border bg-brand-light/20 rounded-2xl text-brand-dark placeholder-brand-dark/40 focus:outline-none focus:ring-2 text-sm font-medium transition-all ${
                    errors.password 
                      ? 'border-red-500 focus:ring-red-200 focus:border-red-500' 
                      : 'border-brand-cream focus:ring-brand-orange/20 focus:border-brand-orange'
                  }`}
                  placeholder="••••••••"
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-500 font-medium">{errors.password}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-brand-dark/80 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-brand-dark/40">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                  onBlur={handleConfirmPasswordBlur}
                  className={`block w-full pl-11 pr-4 py-3 border bg-brand-light/20 rounded-2xl text-brand-dark placeholder-brand-dark/40 focus:outline-none focus:ring-2 text-sm font-medium transition-all ${
                    errors.confirmPassword 
                      ? 'border-red-500 focus:ring-red-200 focus:border-red-500' 
                      : 'border-brand-cream focus:ring-brand-orange/20 focus:border-brand-orange'
                  }`}
                  placeholder="••••••••"
                />
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-500 font-medium">{errors.confirmPassword}</p>
              )}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || isFormInvalid}
              className="group relative flex w-full justify-center rounded-2xl bg-brand-orange py-3.5 px-4 text-sm font-bold text-white shadow-md shadow-brand-orange/15 hover:bg-brand-orange/95 focus:outline-none focus:ring-2 focus:ring-brand-orange/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : (
                'Create Account'
              )}
            </button>
          </div>
        </form>

        <div className="text-center text-sm">
          <span className="text-brand-dark/60">Already have an account? </span>
          <Link to="/login" className="font-bold text-brand-orange hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
