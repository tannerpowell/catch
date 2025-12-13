/**
 * Converts a string to a URL-friendly slug.
 * - Lowercases the input
 * - Normalizes unicode characters
 * - Replaces non-alphanumeric characters with hyphens
 * - Removes leading/trailing hyphens
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)/g, '');
}
