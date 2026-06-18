/**
 * PawNest — Environment Variable Startup Validator
 * -------------------------------------------------
 * Run this at the very start of server.js to catch missing/invalid
 * environment variables before the server binds to a port.
 *
 * Usage: import './utils/validateEnv.js' as the FIRST import in server.js
 */

import dotenv from 'dotenv';
dotenv.config();

// ─── Variable Definitions ────────────────────────────────────────────────────

const REQUIRED = [
  {
    key: 'JWT_SECRET',
    description: 'Secret key used to sign and verify JWT tokens',
    minLength: 20,
    fatal: true,   // Server refuses to start if missing
  },
];

const RECOMMENDED = [
  {
    key: 'MONGO_URI',
    description: 'MongoDB Atlas connection string (required when USE_LOCAL_DB=false)',
    fatal: false,
  },
  {
    key: 'GROQ_API_KEY',
    description: 'Groq API key for the AI Assistant feature',
    fatal: false,
  },
  {
    key: 'EMAIL_USER',
    description: 'Gmail address used for sending transactional emails',
    fatal: false,
  },
  {
    key: 'EMAIL_APP_PASSWORD',
    description: 'Gmail App Password (not your regular Gmail password)',
    fatal: false,
    minLength: 16,
  },
];

// ─── Validator ────────────────────────────────────────────────────────────────

const RESET  = '\x1b[0m';
const RED    = '\x1b[31m';
const YELLOW = '\x1b[33m';
const GREEN  = '\x1b[32m';
const BOLD   = '\x1b[1m';
const DIM    = '\x1b[2m';

let hasErrors   = false;
let hasWarnings = false;

console.log(`\n${BOLD}🔍 [Env Validator] Checking environment variables...${RESET}`);

// Check required vars
for (const def of REQUIRED) {
  const val = process.env[def.key];
  if (!val || val.trim() === '') {
    console.error(`${RED}${BOLD}  ✗ MISSING  ${def.key}${RESET}${RED} — ${def.description}${RESET}`);
    hasErrors = true;
  } else if (def.minLength && val.length < def.minLength) {
    console.error(`${RED}${BOLD}  ✗ TOO SHORT ${def.key}${RESET}${RED} — must be at least ${def.minLength} characters (got ${val.length})${RESET}`);
    hasErrors = true;
  } else {
    console.log(`${GREEN}  ✓ OK        ${def.key}${RESET}${DIM} — set (${val.length} chars)${RESET}`);
  }
}

// Check recommended vars
for (const def of RECOMMENDED) {
  const val = process.env[def.key];

  // Special case: MONGO_URI only required when not using local DB
  if (def.key === 'MONGO_URI' && process.env.USE_LOCAL_DB === 'true') {
    console.log(`${DIM}  –  SKIPPED  ${def.key} (USE_LOCAL_DB=true)${RESET}`);
    continue;
  }

  if (!val || val.trim() === '') {
    console.warn(`${YELLOW}  ⚠ MISSING  ${def.key}${RESET}${YELLOW} — ${def.description}${RESET}`);
    hasWarnings = true;
  } else if (def.minLength && val.length < def.minLength) {
    console.warn(`${YELLOW}  ⚠ SHORT    ${def.key}${RESET}${YELLOW} — expected ≥${def.minLength} chars, got ${val.length}${RESET}`);
    hasWarnings = true;
  } else {
    console.log(`${GREEN}  ✓ OK        ${def.key}${RESET}${DIM} — set (${val.length} chars)${RESET}`);
  }
}

// Detect placeholder values left from .env.example
const PLACEHOLDER_PATTERNS = [
  /^your[-_]/i,
  /^<.*>$/,
  /^REPLACE_ME/i,
  /^example/i,
  /^changeme/i,
];

for (const key of ['JWT_SECRET', 'MONGO_URI', 'GROQ_API_KEY', 'EMAIL_USER', 'EMAIL_APP_PASSWORD']) {
  const val = process.env[key];
  if (val && PLACEHOLDER_PATTERNS.some(p => p.test(val.trim()))) {
    console.warn(`${YELLOW}  ⚠ PLACEHOLDER detected for ${key} — looks like an example value, not a real secret!${RESET}`);
    hasWarnings = true;
  }
}

// Summary
if (hasErrors) {
  console.error(`\n${RED}${BOLD}✗ Environment validation FAILED — server will not start.${RESET}`);
  console.error(`${RED}  Create backend/.env from backend/.env.example and fill in the required values.${RESET}\n`);
  process.exit(1);
} else if (hasWarnings) {
  console.warn(`\n${YELLOW}⚠  Environment validation passed with warnings — some features may be disabled.${RESET}\n`);
} else {
  console.log(`\n${GREEN}${BOLD}✓ All environment variables OK.${RESET}\n`);
}
