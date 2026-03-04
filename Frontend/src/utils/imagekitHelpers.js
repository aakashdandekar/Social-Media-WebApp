/**
 * Extracts the imagekit path from a full URL
 * 
 * IKImage requires a `path` prop to correctly apply transformations
 * based on the IKContext urlEndpoint.
 */
export function getIKPath(url) {
  if (!url) return '';
  const endpoint = 'https://ik.imagekit.io/22starmaster';
  if (url.startsWith(endpoint)) {
    return url.replace(endpoint, '');
  }
  
  try {
    const urlObj = new URL(url);
    return urlObj.pathname;
  } catch {
    return url; // fallback to returning the raw string (might be a relative path already)
  }
}
