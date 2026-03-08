/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    instrumentationHook: true,
    serverComponentsExternalPackages: ['bullmq', 'ioredis', 'better-sqlite3', 'bcrypt'],
  },
};

export default nextConfig;
