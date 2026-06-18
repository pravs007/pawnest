/**
 * Backend Validation Utility for PawNest
 */

/**
 * Basic XSS sanitization for strings
 */
export const sanitizeInput = (val) => {
  if (typeof val !== 'string') return val;
  return val
    .trim()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
};

/**
 * Validates a person's name or a pet's name
 */
export const validateName = (name, fieldLabel = 'Name') => {
  const trimmed = (name || '').trim();
  if (!name || trimmed === '') {
    return `${fieldLabel} is required`;
  }
  if (trimmed.length < 2) {
    return `${fieldLabel} must be at least 2 characters`;
  }
  if (trimmed.length > 50) {
    return `${fieldLabel} must be at most 50 characters`;
  }
  if (!/^[a-zA-Z\s]+$/.test(trimmed)) {
    return `${fieldLabel} must contain only letters and spaces`;
  }
  if (/\s{2,}/.test(trimmed)) {
    return `${fieldLabel} must not contain consecutive spaces`;
  }
  return '';
};

/**
 * Validates email addresses
 */
export const validateEmail = (email) => {
  const trimmed = (email || '').trim();
  if (!email || trimmed === '') {
    return 'Email is required';
  }
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmed)) {
    return 'Please enter a valid email address';
  }
  return '';
};

/**
 * Validates password strength
 */
export const validatePassword = (password) => {
  if (!password) {
    return 'Password is required';
  }
  if (password.length < 8) {
    return 'Password must be at least 8 characters long';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number';
  }
  if (!/[!@#$%^&*(),.?":{}|<>_\-=\[\]]/.test(password)) {
    return 'Password must contain at least one special character';
  }
  return '';
};

/**
 * Validates phone numbers (must be exactly 10 digits)
 */
export const validatePhone = (phone, fieldLabel = 'Phone number') => {
  const trimmed = (phone || '').trim();
  if (!phone || trimmed === '') {
    return `${fieldLabel} is required`;
  }
  if (!/^\d+$/.test(trimmed)) {
    return `${fieldLabel} must contain only digits`;
  }
  if (trimmed.length !== 10) {
    return `${fieldLabel} must be exactly 10 digits`;
  }
  return '';
};

/**
 * Validates general numeric fields
 */
export const validateNumber = (value, min, max, fieldLabel = 'Value') => {
  const trimmed = String(value || '').trim();
  if (trimmed === '') {
    return `${fieldLabel} is required`;
  }
  const num = Number(trimmed);
  if (isNaN(num)) {
    return `${fieldLabel} must be a valid number`;
  }
  if (num < 0) {
    return `${fieldLabel} cannot be negative`;
  }
  if (min !== undefined && num < min) {
    return `${fieldLabel} must be at least ${min}`;
  }
  if (max !== undefined && num > max) {
    return `${fieldLabel} must be at most ${max}`;
  }
  return '';
};

/**
 * Validates general textareas (spam protection, character limits)
 */
export const validateTextarea = (text, min, max, fieldLabel = 'Description') => {
  const trimmed = (text || '').trim();
  if (!text || trimmed === '') {
    return `${fieldLabel} is required`;
  }
  if (trimmed.length < min) {
    return `${fieldLabel} must be at least ${min} characters`;
  }
  if (trimmed.length > max) {
    return `${fieldLabel} must be at most ${max} characters`;
  }
  if (/^[^a-zA-Z0-9\s]+$/.test(trimmed)) {
    return `${fieldLabel} cannot contain only symbols`;
  }
  if (/(.)\1{3,}/.test(trimmed)) {
    return `${fieldLabel} contains too many repeated characters (potential spam)`;
  }
  if (/\b(\w+)\b(?:\s+\1\b){2,}/i.test(trimmed)) {
    return `${fieldLabel} contains too many repeated words (potential spam)`;
  }
  return '';
};

/**
 * Validates dates (past/future checks)
 */
export const validateDate = (dateString, allowFuture = false, fieldLabel = 'Date') => {
  const trimmed = (dateString || '').trim();
  if (!dateString || trimmed === '') {
    return `${fieldLabel} is required`;
  }
  
  const selectedDate = new Date(trimmed);
  if (isNaN(selectedDate.getTime())) {
    return `${fieldLabel} is an invalid date`;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  selectedDate.setHours(0, 0, 0, 0);

  if (!allowFuture && selectedDate > today) {
    return `${fieldLabel} cannot be in the future`;
  }

  const minDate = new Date('1900-01-01');
  if (selectedDate < minDate) {
    return `${fieldLabel} must be after January 1, 1900`;
  }

  return '';
};

/**
 * Validates search fields and prevents script injection
 */
export const validateSearch = (query) => {
  const trimmed = (query || '').trim();
  if (/<script|javascript:|on\w+=/i.test(trimmed)) {
    return 'Potential script injection detected';
  }
  return '';
};
