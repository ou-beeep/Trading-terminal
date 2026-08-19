import type { MetadataRoute } from 'next';

// Replace with your real domain (must match what's verified in Google Search Console).
const BASE_URL = 'https://your-domain-here.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
