// List of common US and Canada TLDs for educational institutions
const US_CANADA_EDU_TLDS = [
  // US TLDs
  '.edu',
  '.edu.us',
  '.k12.[state].us', // Will be replaced with state codes
  '.cc.[state].us',
  '.pvt.k12.[state].us',
  
  // Canada TLDs
  '.ca',
  '.on.ca',
  '.qc.ca',
  '.bc.ca',
  '.ab.ca',
  '.mb.ca',
  '.sk.ca',
  '.ns.ca',
  '.nb.ca',
  '.nl.ca',
  '.pe.ca',
  '.nt.ca',
  '.nu.ca',
  '.yt.ca',
];

// US state and territory codes for dynamic TLD generation
const US_STATE_CODES = [
  'al', 'ak', 'az', 'ar', 'ca', 'co', 'ct', 'de', 'fl', 'ga',
  'hi', 'id', 'il', 'in', 'ia', 'ks', 'ky', 'la', 'me', 'md',
  'ma', 'mi', 'mn', 'ms', 'mo', 'mt', 'ne', 'nv', 'nh', 'nj',
  'nm', 'ny', 'nc', 'nd', 'oh', 'ok', 'or', 'pa', 'ri', 'sc',
  'sd', 'tn', 'tx', 'ut', 'vt', 'va', 'wa', 'wv', 'wi', 'wy',
  'dc', 'as', 'gu', 'mp', 'pr', 'vi'
];

// Generate all possible US state-based TLDs
const generateStateBasedTlds = (tldPattern: string): string[] => {
  return US_STATE_CODES.map(state => tldPattern.replace('[state]', state));
};

// Generate all possible TLDs
const ALL_EDU_TLDS = [
  ...US_CANADA_EDU_TLDS.filter(tld => !tld.includes('[state]')),
  ...generateStateBasedTlds('.k12.[state].us'),
  ...generateStateBasedTlds('.cc.[state].us'),
  ...generateStateBasedTlds('.pvt.k12.[state].us')
];

/**
 * Validates if an email is from a US or Canadian educational institution
 * @param email The email address to validate
 * @returns boolean indicating if the email is from a valid educational institution
 */
export const isValidUniversityEmail = (email: string): boolean => {
  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return false;
  }

  // Extract the domain part of the email
  const domain = email.split('@')[1]?.toLowerCase() || '';
  
  // Check if the domain ends with any of the valid TLDs
  return ALL_EDU_TLDS.some(tld => domain.endsWith(tld));
};

/**
 * Gets a user-friendly error message for invalid email domains
 */
export const getEmailValidationError = (email: string): string | null => {
  if (!email) return 'Please enter an email address';
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address';
  }
  
  if (!isValidUniversityEmail(email)) {
    return 'Please use a valid US or Canadian university email address';
  }
  
  return null;
};
