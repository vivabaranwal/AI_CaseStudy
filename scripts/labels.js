/* labels.js — Shared display labels for preference values.
   Single source of truth so Review and Preview never disagree. */

export const CITATION_LABELS = {
  'general': 'General (No Citation)',
  'apa7':    'APA 7th Edition',
  'apa6':    'APA 6th Edition',
  'harvard': 'Harvard Referencing',
  'chicago': 'Chicago 17th',
  'mla':     'MLA 9th Edition'
};

export const LENGTH_LABELS = {
  short:    'Short (8 pages)',
  standard: 'Standard (15 pages)',
  long:     'Long (20+ pages)'
};

export const HOOK_LABELS = {
  cinematic:   'Cinematic',
  statistical: 'Statistical',
  question:    'Question'
};

export const TONE_LABELS = {
  'academic':       'Academic',
  'semi-academic':  'Semi-Academic',
  'consulting':     'Consulting',
  'business-style': 'Business Style',
  'none':           'None'
};

/** Look up a label, falling back to the raw value then a default. */
export function labelFor(map, value, fallback = '—') {
  if (!value) return fallback;
  return map[value] || value;
}
