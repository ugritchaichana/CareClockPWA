/** @type {import('next').NextConfig} */
const nextConfig = {
  // Mobile optimization
  compiler: {
    // ลบคอนโซลล็อกออกเมื่อ build สำหรับ production
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Images optimization for mobile
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // อนุญาตให้ใช้รูปภาพจาก Supabase Storage ได้
    remotePatterns: [
        {
          protocol: 'https',
          hostname: 'fcktqdzssxqvuzgdlemo.supabase.co',
          port: '',
          pathname: '/storage/v1/object/public/**',
        },
      ],
  },
};

module.exports = nextConfig;
