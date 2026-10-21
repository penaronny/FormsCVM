/**
 * Generates the full public URL for a given form slug,
 * supporting deployment at root ('/') or in subdirectories (e.g. '/forms/').
 */
export function getPublicFormUrl(slug: string): string {
  if (typeof window === 'undefined') return `/f/${slug}`;

  // Extract base path by removing any trailing '/f/...' or '/'
  let pathname = window.location.pathname;
  const fIndex = pathname.indexOf('/f/');
  if (fIndex !== -1) {
    pathname = pathname.substring(0, fIndex);
  }
  const cleanBasePath = pathname.replace(/\/$/, '');

  return `${window.location.origin}${cleanBasePath}/f/${slug}`;
}
