/**
 * Utility functions for handling images safely
 */

// List of allowed external domains for images
const ALLOWED_EXTERNAL_DOMAINS = [
  'lh3.googleusercontent.com',
  'platform-lookaside.fbsbx.com', 
  'scontent.xx.fbcdn.net',
  'taphoammo.net',
];

/**
 * Check if an image URL is from an allowed external domain
 */
export function isAllowedExternalImage(url: string): boolean {
  if (!url) return false;
  
  try {
    const urlObj = new URL(url);
    return ALLOWED_EXTERNAL_DOMAINS.includes(urlObj.hostname);
  } catch {
    return false;
  }
}

/**
 * Check if an image URL is a local/relative path
 */
export function isLocalImage(url: string): boolean {
  if (!url) return false;
  
  // Local paths start with / or are relative
  return url.startsWith('/') || !url.includes('://');
}

/**
 * Validate if an image URL can be safely used with Next.js Image component
 */
export function isValidImageUrl(url: string): boolean {
  if (!url) return false;
  
  return isLocalImage(url) || isAllowedExternalImage(url);
}

/**
 * Get a safe image URL for use with Next.js Image component
 * Returns the original URL if valid, or null if invalid
 */
export function getSafeImageUrl(url: string): string | null {
  if (!url) return null;
  
  if (isValidImageUrl(url)) {
    return url;
  }
  
  console.warn('Invalid image URL detected:', url);
  return null;
}

/**
 * Get fallback emoji for a product category
 */
export function getCategoryEmoji(category: string): string {
  const emojiMap: Record<string, string> = {
    gaming: '🎮',
    social: '📱',
    productivity: '💼',
    tools: '🔧',
    entertainment: '🎬',
    education: '📚',
  };
  
  return emojiMap[category] || '📦';
}
