/**
 * Utility to sanitize arrays of IDs before sending to the backend.
 * Removes null, undefined, and non-numeric/empty values.
 * 
 * @param ids Array of IDs (can be strings or numbers)
 * @returns Clean array of numbers
 */
export function sanitizeIds(ids: any[] | null | undefined): number[] {
  if (!ids || !Array.isArray(ids)) return [];
  
  return ids
    .filter(id => id !== null && id !== undefined && id !== '')
    .map(id => typeof id === 'string' ? parseInt(id, 10) : id)
    .filter(id => !isNaN(id));
}
