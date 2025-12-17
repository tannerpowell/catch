/**
 * Converts a string to a URL-friendly slug.
 * - Lowercases the input
 * - Normalizes unicode characters
 * - Replaces non-alphanumeric characters with hyphens
 * - Removes leading/trailing hyphens
 *
 * @param input - The string to slugify (null/undefined returns empty string)
 * @returns A URL-friendly slug, or empty string if input is invalid
 */
export function slugify(input: string | null | undefined): string {
  if (input == null) return '';

  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)/g, '');
}
