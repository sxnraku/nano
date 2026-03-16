/**
 * Safe ID generation with fallback for non-secure contexts (HTTP)
 * where crypto.randomUUID() is not available.
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  
  // Fallback to timestamp + random string
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}
