// workbox-config.js
module.exports = {
  // swSrc คือไฟล์ Service Worker ต้นทางที่เราเขียนเอง
  swSrc: 'public/sw-src.js',
  // swDest คือไฟล์ Service Worker ปลายทางที่จะถูกสร้างขึ้นมาในโฟลเดอร์ public
  swDest: 'public/sw.js',
  // globDirectory คือโฟลเดอร์หลักที่ Workbox จะค้นหาไฟล์เพื่อนำไป precache
  // เราตั้งค่าเป็น .next/static เพื่อให้มันหาไฟล์ JS, CSS ที่ Next.js สร้างขึ้นเจอ
  globDirectory: '.next/static',
  // globPatterns คือรูปแบบของไฟล์ที่เราต้องการให้ cache
  globPatterns: [
    '**/*.{js,css,woff2}'
  ],
  // injectionPoint คือตัวแปรใน swSrc ที่จะถูกแทนที่ด้วยรายชื่อไฟล์ (manifest)
  injectionPoint: 'self.__WB_MANIFEST',
  // workbox จะทำการ generate ไฟล์ sw.js ในโฟลเดอร์ public
  // เราจึงไม่ต้องให้มัน copy ไฟล์จากที่อื่นมาอีก
  // แต่เราสามารถเพิ่มไฟล์จากโฟลเดอร์ public เข้าไปใน manifest ได้
  additionalManifestEntries: [
    { url: '/manifest.json', revision: null },
    { url: '/offline.html', revision: null },
    { url: '/asset/CareClockLOGO.PNG', revision: null }
    // เพิ่มไฟล์อื่นๆ ใน public ที่ต้องการให้ offline ได้ที่นี่
  ],
  // ไม่ต้อง cache ไฟล์เหล่านี้
  globIgnores: [
    '**/node_modules/**/*',
    'sw.js',
    'sw-src.js'
  ]
};