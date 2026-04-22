const fallbackProductionUrl = 'https://app.quantis.workers.dev';

export function getAuthCallbackUrl() {
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');

  if (configuredSiteUrl) {
    return `${configuredSiteUrl}/auth/callback`;
  }

  if (typeof window !== 'undefined' && window.location.origin) {
    return `${window.location.origin}/auth/callback`;
  }

  return `${fallbackProductionUrl}/auth/callback`;
}
