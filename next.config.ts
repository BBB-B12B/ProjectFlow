import type { NextConfig } from 'next';

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/.*\.r2\.dev\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'r2-images',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
        },
      }
    }
  ]
});

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: false, // Disabling strict mode to resolve dnd issue
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'pub-*.r2.dev',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.r2.dev',
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['*.pages.dev', 'project-management-system.pages.dev', 'f0d039b5.project-management-system.pages.dev', 'localhost:3000'],
    },
  },
};

export default withPWA(nextConfig);


