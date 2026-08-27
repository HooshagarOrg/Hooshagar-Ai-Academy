/** @type {import('next').NextConfig} */
// standalone needs symlink support (Linux/Vercel). Windows local builds fail with EPERM.
const nextConfig = {
  ...(process.platform !== 'win32' || process.env.VERCEL ? { output: 'standalone' } : {}),

  // ESLint and TypeScript
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },

  // Security Headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.google.com https://www.gstatic.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data:",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://openrouter.ai https://api.anthropic.com https://*.workers.dev https://api.kavenegar.com https://*.arvanstorage.ir https://*.ingest.sentry.io https://*.ingest.de.sentry.io",
              "frame-src 'self' blob: https://www.google.com",
              "object-src 'self' blob:",
              "media-src 'self' blob:",
              "worker-src 'self' blob:",
            ].join('; '),
          },
        ],
      },
    ];
  },

  // Image Optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.arvanstorage.ir',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },

  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Experimental features
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'date-fns',
      'date-fns-jalali',
      'recharts',
      'framer-motion',
      '@react-three/drei',
      '@react-three/fiber',
    ],
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },

  // Performance optimizations
  swcMinify: true,
  reactStrictMode: true,
  poweredByHeader: false,

  // Webpack configuration
  webpack: (config, { dev, isServer }) => {
    // Production optimizations
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        sideEffects: true,
      };
    }

    return config;
  },
};

// Sentry — همیشه wrap می‌شود تا tunnel/source maps کار کنند.
// آپلود source map فقط وقتی auth token/org/project در بیلد موجود باشد.
// NEXT_PUBLIC_SENTRY_DSN باید در Vercel برای Production در زمان Build ست باشد (Sensitive خاموش).
const { withSentryConfig } = require('@sentry/nextjs');

const sentryUploadEnabled =
  Boolean(process.env.SENTRY_AUTH_TOKEN) &&
  Boolean(process.env.SENTRY_ORG) &&
  Boolean(process.env.SENTRY_PROJECT);

// در لاگ بیلد Vercel باید true ببینید؛ اگر false بود DSN به کلاینت نمی‌رسد.
console.log(
  `[Sentry] NEXT_PUBLIC_SENTRY_DSN at build: ${Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN)}`
);

module.exports = withSentryConfig(nextConfig, {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  sourcemaps: { disable: !sentryUploadEnabled },
  release: { create: false, finalize: false },
  widenClientFileUpload: true,
  tunnelRoute: '/monitoring',
  hideSourceMaps: true,
  disableLogger: true,
});
