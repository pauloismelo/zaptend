import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@zaptend/ui', '@zaptend/types'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.zaptend.com.br' },
      { protocol: 'https', hostname: '**.cloudfront.net' },
    ],
  },
  experimental: {
    serverActions: { allowedOrigins: ['*.zaptend.com.br'] },
  },
}

export default nextConfig
