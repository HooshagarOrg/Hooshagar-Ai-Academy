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
              process.env.NODE_ENV === 'production'
                ? "script-src 'self' 'unsafe-inline' https://www.google.com https://www.gstatic.com"
                : "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.google.com https://www.gstatic.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data:",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://openrouter.ai https://api.anthropic.com https://*.workers.dev https://api.kavenegar.com https://*.arvanstorage.ir https://*.ingest.sentry.io https://*.ingest.de.sentry.io",
              "frame-src 'self' blob: https://www.google.com",
              "frame-ancestors 'self'",
              "object-src 'self' blob:",
              "media-src 'self' blob:",
              "worker-src 'self' blob:",
              'upgrade-insecure-requests',
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
    dangerouslyAllowSVG: false,
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
      'gsap',
      '@gsap/react',
      '@react-three/drei',
      '@react-three/fiber',
    ],
    optimizeCss: true,
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },

  // Performance optimizations
  swcMinify: true,
  reactStrictMode: true,
  poweredByHeader: false,
  staticPageGenerationTimeout: 180,

  // Webpack configuration
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        sideEffects: true,
        splitChunks: {
          ...config.optimization.splitChunks,
          cacheGroups: {
            ...(config.optimization.splitChunks && typeof config.optimization.splitChunks === 'object'
              ? config.optimization.splitChunks.cacheGroups
              : {}),
            sentry: {
              test: /[\\/]node_modules[\\/]@sentry[\\/]/,
              name: 'sentry',
              chunks: 'async',
              enforce: true,
              priority: 30,
              reuseExistingChunk: true,
            },
            three: {
              test: /[\\/]node_modules[\\/](three|@react-three)[\\/]/,
              name: 'three',
              chunks: 'async',
              enforce: true,
              priority: 25,
              reuseExistingChunk: true,
            },
            gsap: {
              test: /[\\/]node_modules[\\/](gsap|@gsap)[\\/]/,
              name: 'gsap',
              chunks: 'async',
              enforce: true,
              priority: 25,
              reuseExistingChunk: true,
            },
          },
        },
      }
    }

    return config
  },
};

const withBundleAnalyzer =
  process.env.ANALYZE === 'true'
    ? require('@next/bundle-analyzer')({ enabled: true, openAnalyzer: false })
    : (config) => config;

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

module.exports = withSentryConfig(withBundleAnalyzer(nextConfig), {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  sourcemaps: { disable: !sentryUploadEnabled },
  release: { create: false, finalize: false },
  widenClientFileUpload: true,
  tunnelRoute: '/monitoring',
  hideSourceMaps: true,
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
  },
  bundleSizeOptimizations: {
    excludeDebugStatements: true,
    excludeReplayIframe: true,
    excludeReplayShadowDom: true,
    excludeReplayWorker: true,
  },
});
