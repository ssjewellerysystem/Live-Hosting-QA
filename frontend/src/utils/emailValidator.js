/**
 * Utility functions for email validation & normalization across SSJewellery.
 */

export const normalizeEmail = (email) => {
  if (!email || typeof email !== 'string') return email;
  return email.trim().toLowerCase();
};

export const isAllowedEmailDomain = (email) => {
  if (!email || typeof email !== 'string') return false;
  const cleanEmail = normalizeEmail(email);
  const parts = cleanEmail.split('@');
  if (parts.length !== 2) return false;
  const domain = '@' + parts[1];
  return domain === '@gmail.com' || domain === '@outlook.com';
};

export const ALLOWED_EMAIL_DOMAIN_ERROR = "Only Gmail (@gmail.com) and Outlook (@outlook.com) email addresses are supported.";
