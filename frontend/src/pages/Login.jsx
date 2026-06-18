import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, ShieldAlert, ArrowLeft } from 'lucide-react';
import { validateEmail, validatePassword, sanitizeInput } from '../utils/validation';

const Login = () => {
  const { login, error: authError } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    
    setEmail(trimmedEmail);
    setPassword(trimmedPassword);

    const emailErr = validateEmail(trimmedEmail);
    const passwordErr = validatePassword(trimmedPassword);

    if (emailErr || passwordErr) {
      setErrors({ email: emailErr, password: passwordErr });
      setError('Please correct the validation errors before signing in.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const sanitizedEmail = sanitizeInput(trimmedEmail);
      const sanitizedPassword = sanitizeInput(trimmedPassword);
      await login(sanitizedEmail, sanitizedPassword);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to log in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const isFormInvalid = !!errors.email || !!errors.password || !email || !password;

  return (
    <div className="flex min-h-screen flex-col bg-brand-light items-center justify-center px-4 py-12 sm:px-6 lg:px-8 selection:bg-brand-orange selection:text-white">
      {/* Return button */}
      <Link to="/" className="absolute top-6 left-6 flex items-center gap-2 text-sm font-semibold text-brand-dark/70 hover:text-brand-orange transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </Link>

      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-3xl border border-brand-cream/40 shadow-xl">
        <div className="text-center">
          <span className="text-4xl">🐾</span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-brand-dark">
            Welcome Back!
          </h2>
          <p className="mt-2 text-sm text-brand-dark/60">
            Sign in to check on your pets and manage care.
          </p>
        </div>

        {/* Error Banners */}
        {(error || authError) && (
          <div className="flex items-start gap-2.5 rounded-2xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
            <ShieldAlert className="h-5 w-5 shrink-0 text-red-500" />
            <span>{error || authError}</span>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
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
                  placeholder="you@example.com"
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
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || isFormInvalid}
              className="group relative flex w-full justify-center rounded-2xl bg-brand-orange py-3.5 px-4 text-sm font-bold text-white shadow-md shadow-brand-orange/15 hover:bg-brand-orange/95 focus:outline-none focus:ring-2 focus:ring-brand-orange/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : (
                'Sign In'
              )}
            </button>
          </div>
        </form>

        <div className="text-center text-sm">
          <span className="text-brand-dark/60">Don't have an account? </span>
          <Link to="/register" className="font-bold text-brand-orange hover:underline">
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
