import type { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://app.quantis.workers.dev';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/auth/',
          '/dashboard',
          '/discover',
          '/editor',
          '/leaderboard',
          '/login',
          '/markets',
          '/signup',
          '/strategies',
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
