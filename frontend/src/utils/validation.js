/**
 * Frontend Validation Utility for PawNest
 */

/**
 * Basic XSS sanitization for strings
 */
export const sanitizeInput = (val) => {
  if (typeof val !== 'string') return val;
  // Don't escape slashes in data URLs, http(s) URLs, or upload paths — they must remain intact
  if (
    val.startsWith('data:image/') ||
    val.startsWith('http://') ||
    val.startsWith('https://') ||
    val.startsWith('/uploads/') ||
    val.startsWith('uploads/')
  ) {
    return val.trim();
  }
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
  // Letters, spaces, apostrophes, and hyphens only
  if (!/^[a-zA-Z\s'-]+$/.test(trimmed)) {
    return `${fieldLabel} must contain only letters, spaces, apostrophes, and hyphens`;
  }
  // Prevent repeated special characters
  if (/[\s'-]{2,}/.test(trimmed)) {
    return `${fieldLabel} must not contain consecutive special characters`;
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
  // Standard RFC 5322 email regex
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
  // Reject inputs containing only symbols
  if (/^[^a-zA-Z0-9\s]+$/.test(trimmed)) {
    return `${fieldLabel} cannot contain only symbols`;
  }
  // Prevent spam submissions: repeated character clusters (4+ repeated characters, like "aaaa")
  if (/(.)\1{3,}/.test(trimmed)) {
    return `${fieldLabel} contains too many repeated characters (potential spam)`;
  }
  // Prevent repeating consecutive duplicate words (e.g. "word word word")
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
  // Set time to midnight for simple date comparison
  today.setHours(0, 0, 0, 0);
  selectedDate.setHours(0, 0, 0, 0);

  if (!allowFuture && selectedDate > today) {
    return `${fieldLabel} cannot be in the future`;
  }

  // Prevent unrealistic dates
  const minDate = new Date('1900-01-01');
  if (selectedDate < minDate) {
    return `${fieldLabel} must be after January 1, 1900`;
  }

  return '';
};

/**
 * Validates search fields
 */
export const validateSearch = (query) => {
  const trimmed = (query || '').trim();
  // Block potential script tags/inline JS
  if (/<script|javascript:|on\w+=/i.test(trimmed)) {
    return 'Potential script injection detected';
  }
  return '';
};

/**
 * Validates file uploads (types and size)
 */
export const validateFileUpload = (file, maxSizeMB = 5) => {
  if (!file) return 'File is required';
  
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return 'Invalid file format. Only JPG, JPEG, PNG, or WEBP are allowed';
  }

  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return `File size exceeds the ${maxSizeMB} MB limit`;
  }

  return '';
};

/**
 * Validates pet age
 */
export const validatePetAge = (age) => {
  const trimmed = String(age || '').trim();
  if (trimmed === '') {
    return 'Please enter a valid age between 0 and 30 years.';
  }
  // Must be numeric only, no negative values, no alphabets/specials (only digits and decimal point)
  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    return 'Please enter a valid age between 0 and 30 years.';
  }
  const num = Number(trimmed);
  if (num < 0 || num > 30) {
    return 'Please enter a valid age between 0 and 30 years.';
  }
  return '';
};

/**
 * Validates pet weight
 */
export const validatePetWeight = (weight) => {
  const trimmed = String(weight || '').trim();
  if (trimmed === '') {
    return 'Please enter a valid weight between 0.1 kg and 200 kg.';
  }
  // Must be numeric only, no negative values, no alphabets/specials (only digits and decimal point)
  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    return 'Please enter a valid weight between 0.1 kg and 200 kg.';
  }
  const num = Number(trimmed);
  if (num < 0.1 || num > 200) {
    return 'Please enter a valid weight between 0.1 kg and 200 kg.';
  }
  return '';
};

/**
 * Validates pet breed/species
 */
export const validatePetBreed = (breed) => {
  const trimmed = (breed || '').trim();
  if (!breed || trimmed === '') {
    return 'Breed / Species is required';
  }
  if (trimmed.length < 2) {
    return 'Breed / Species must be at least 2 characters';
  }
  if (trimmed.length > 50) {
    return 'Breed / Species must be at most 50 characters';
  }
  return '';
};
