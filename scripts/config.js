/* config.js — Dynamic API Environment Configuration */
export const API_BASE_URL = (function() {
  if (window.CASEIQ_API_URL) {
    return window.CASEIQ_API_URL;
  }
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') {
    return 'http://127.0.0.1:8000';
  }
  // Fallback to origin or backend service in production
  return window.location.origin;
})();
