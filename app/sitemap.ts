import type { MetadataRoute } from 'next';

// Replace with your real domain (must match what's verified in Google Search Console).
const BASE_URL = 'https://your-domain-here.com';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE_URL, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE_URL}/reports`, changeFrequency: 'weekly', priority: 0.5 },
  ];
}
