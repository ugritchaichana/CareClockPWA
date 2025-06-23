/** @type {import('next').NextConfig} */
const nextConfig = {
  // PWA configuration
  experimental: {
    appDir: true,
  },
  // Mobile optimization
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Images optimization for mobile
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // PWA Service Worker
  async headers() {
    return [
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
