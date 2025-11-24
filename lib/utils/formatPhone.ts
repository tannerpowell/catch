/**
 * Format a phone number to (XXX) XXX-XXXX format
 * Handles 10-digit and 11-digit (with leading 1) numbers
 *
 * @param phone - Raw phone number string (can be null or undefined)
 * @returns Formatted phone number, original if format doesn't match, or empty string if null/undefined
 */
export function formatPhone(phone: string | null | undefined): string {
  // Guard against null/undefined inputs
  if (!phone) return '';

  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');

  // Format as (XXX) XXX-XXXX
  if (digits.length === 11 && digits[0] === '1') {
    // Remove leading 1 for US numbers
    const areaCode = digits.slice(1, 4);
    const prefix = digits.slice(4, 7);
    const lineNumber = digits.slice(7, 11);
    return `(${areaCode}) ${prefix}-${lineNumber}`;
  } else if (digits.length === 10) {
    const areaCode = digits.slice(0, 3);
    const prefix = digits.slice(3, 6);
    const lineNumber = digits.slice(6, 10);
    return `(${areaCode}) ${prefix}-${lineNumber}`;
  }

  // Return original if format doesn't match
  return phone;
}
