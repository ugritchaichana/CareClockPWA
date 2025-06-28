const { injectManifest } = require('workbox-build');

const workboxConfig = {
  // swSrc คือไฟล์ Service Worker ต้นทางที่เราเขียนเอง
  swSrc: 'public/sw-src.js',
  // swDest คือไฟล์ Service Worker ปลายทางที่จะถูกสร้างขึ้นมาในโฟลเดอร์ public
  swDest: 'public/sw.js',
  // globDirectory คือโฟลเดอร์หลักที่เราจะค้นหาไฟล์ (root ของโปรเจกต์)
  globDirectory: '.',
  // globPatterns บอกให้ Workbox รู้ว่าต้อง precache ไฟล์อะไรบ้าง
  globPatterns: [
    // ไฟล์ public assets
    'public/asset/**/*',
    'public/manifest.json',
    'public/offline.html',
    'public/sounds/**/*'
  ],
  // แก้ไข URL prefix ให้ถูกต้องตามที่ Next.js serve
  modifyURLPrefix: {
    'public/': '/'
  },
  // injectionPoint คือจุดที่จะแทรก manifest ใน sw-src.js
  injectionPoint: 'self.__WB_MANIFEST',
  // ไฟล์และโฟลเดอร์ที่ไม่ต้องการให้ precache
  globIgnores: [
    '**/node_modules/**',
    'public/sw.js',
    'public/sw-src.js',
    'next.config.js',
    'public/uploads/**'
  ]
};

console.log('📦 Starting Workbox build process...');

injectManifest(workboxConfig).then(({ count, size, warnings }) => {
  if (warnings.length > 0) {
    console.warn('Workbox build warnings:', warnings);
  }
  console.log(`✅ Workbox build complete. Pre-cached ${count} files, totaling ${Math.round(size / 1024)} KB.`);
}).catch(error => {
    console.error('❌ Workbox build failed:', error);
    process.exit(1);
});
