import type { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://hooshagar.ir'

export default function sitemap(): MetadataRoute.Sitemap {
  const publicPaths = ['', '/login', '/register', '/terms', '/privacy', '/forgot-password']

  return publicPaths.map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: path === '' ? 'weekly' : 'monthly',
    priority: path === '' ? 1 : 0.5,
  }))
}
