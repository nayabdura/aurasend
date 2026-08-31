/** @type {import('next').NextConfig} */
const nextConfig = {
  // ─── Deployment: standalone mode for VPS/Docker (uncomment for production) ─
  // output: 'standalone',

  // ─── Native Node module externals (SQLite, bcrypt, IMAP, etc.) ───────────
  experimental: {
    serverComponentsExternalPackages: [
      'better-sqlite3',
      'bcrypt',
      'bcryptjs',
      'nodemailer',
      'imap',
      'mailparser',
    ],

    // Optimize package imports — smaller client bundles (tree-shakes submodules)
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      'framer-motion',
    ],
  },

  // ─── Response compression (brotli/gzip) ──────────────────────────────────
  compress: true,

  // ─── Security: remove fingerprinting header ───────────────────────────────
  poweredByHeader: false,

  // ─── Image optimization ───────────────────────────────────────────────────
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 3600,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    // Allow self-hosted images only
    remotePatterns: [],
  },

  // ─── HTTP Security Headers ────────────────────────────────────────────────
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          // HSTS: enforce HTTPS for 1 year (only safe in production)
          ...(process.env.NODE_ENV === 'production'
            ? [{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' }]
            : []),
        ],
      },
      {
        // Aggressive caching for immutable static assets
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // API routes — no caching by default
        source: '/api/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store' },
        ],
      },
      {
        // Track pixel endpoint — no-cache, no-store
        source: '/api/track/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache' },
          { key: 'Pragma', value: 'no-cache' },
        ],
      },
      {
        // SSE stream endpoint — no buffering, keep-alive
        source: '/api/events/stream',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-transform' },
          { key: 'X-Accel-Buffering', value: 'no' }, // nginx: disable proxy buffering
          { key: 'Connection', value: 'keep-alive' },
        ],
      },
      {
        // Public pages — moderate caching
        source: '/(about|features|pricing|contact|use-cases|integrations|blog|email-verifier|spam-checker|tools)(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=300, stale-while-revalidate=600' },
        ],
      },
    ];
  },

  // ─── Redirects ────────────────────────────────────────────────────────────
  async redirects() {
    return [
      // Redirect /home → /
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ];
  },

  // ─── Webpack: production bundle optimizations ─────────────────────────────
  webpack(config, { isServer, dev, nextRuntime }) {
    // Server-side: prevent heavy node modules from being bundled twice
    if (isServer) {
      // Avoid including binary modules in the server bundle
      config.externals = [...(config.externals || [])];
    }

    // Client-side: stub out ALL node: URI scheme imports so that server-only
    // modules accidentally referenced in the client graph produce a clean
    // "false" fallback (empty module) rather than crashing with
    // UnhandledSchemeError → HierarchyRequestError.
    if (!isServer) {
      config.resolve = config.resolve || {};
      config.resolve.fallback = {
        ...config.resolve.fallback,
        // Core node: built-ins — set to false = empty shim on client
        stream: false,
        crypto: false,
        path: false,
        fs: false,
        os: false,
        net: false,
        tls: false,
        dns: false,
        http: false,
        https: false,
        zlib: false,
        events: false,
        assert: false,
        url: false,
        buffer: false,
        util: false,
        querystring: false,
        child_process: false,
        worker_threads: false,
        readline: false,
        timers: false,
      };
    }
    
    if (!dev && !isServer) {
      // Deterministic chunk IDs for long-term caching
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic',
        splitChunks: {
          chunks: 'all',
          maxInitialRequests: 25,
          minSize: 20_000,
          cacheGroups: {
            // Separate large vendor bundles for better cache efficiency
            recharts: {
              test: /[\\/]node_modules[\\/]recharts/,
              name: 'vendor-recharts',
              chunks: 'all',
              priority: 30,
            },
            framerMotion: {
              test: /[\\/]node_modules[\\/]framer-motion/,
              name: 'vendor-framer',
              chunks: 'all',
              priority: 25,
            },
            jodit: {
              test: /[\\/]node_modules[\\/]jodit/,
              name: 'vendor-jodit',
              chunks: 'all',
              priority: 25,
            },
            lucide: {
              test: /[\\/]node_modules[\\/]lucide-react/,
              name: 'vendor-lucide',
              chunks: 'all',
              priority: 20,
            },
            // All other node_modules
            vendors: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
            },
            default: {
              minChunks: 2,
              priority: -20,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }

    return config;
  },
};

export default nextConfig;
