/* config.js — Dynamic API Environment Configuration */

// Production backend (Render). Override at runtime by setting
// window.CASEIQ_API_URL before scripts/main.js loads.
const PRODUCTION_API_URL = 'https://caseiq-backend.onrender.com';

export const API_BASE_URL = (function () {
  if (window.CASEIQ_API_URL) {
    return String(window.CASEIQ_API_URL).replace(/\/+$/, '');
  }
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') {
    return 'http://127.0.0.1:8000';
  }
  // Static hosts (Vercel) serve no API — always use the deployed backend.
  return PRODUCTION_API_URL;
})();
