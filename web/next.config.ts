import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: true,
  async rewrites() {
    return [
      // Legacy Vite client path (cached bundles) → Next API
      { source: '/__umd_log', destination: '/api/umd-log' },
    ]
  },
}

export default nextConfig
