// public/sw-src.js

// Import Workbox (จะถูกเติมให้โดย workbox-cli)
importScripts("https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js");

// ----------------- Workbox Precaching -----------------
// จุดนี้ Workbox จะแทรกรายชื่อไฟล์ทั้งหมดที่ Next.js build ให้โดยอัตโนมัติ
// ทำให้แอปฯ สามารถทำงาน offline ได้
workbox.precaching.precacheAndRoute([{"revision":"21f085c83eaf2001f3779ba8fe4cb972","url":"chunks/484-4f6b9229b56b749e.js"},{"revision":"e2810e002e16a33119c8b0d12c2e5851","url":"chunks/558-b294b0b63fd2678c.js"},{"revision":"0f5c0445017f353ccafc4dd9bd74adf4","url":"chunks/78-94098e1819f9e520.js"},{"revision":"b9386121596a038e34ab6c11475c9828","url":"chunks/98-bd0765237bc408af.js"},{"revision":"5d068f9424d5e9ec0f078df8618a42be","url":"chunks/app/_not-found/page-cecb9328cb5afcbd.js"},{"revision":"5c6a5004ba7b006c7772b1acaf64f1e2","url":"chunks/app/layout-45a8bbdcc1b51649.js"},{"revision":"a1b7c86a198b9d01d0320a4ebbc900e3","url":"chunks/app/page-fa8aefe483344841.js"},{"revision":"9042f4e08165871e1a9d282dc314f5db","url":"chunks/app/test/app-test/page-4a27c0e4072fbda7.js"},{"revision":"adb1ed70a4edbba4e6726b49e4502b1f","url":"chunks/app/test/ios-notification/page-7845c20a58a17a11.js"},{"revision":"17c42aac2051b8a3c907aadf37cf052f","url":"chunks/app/test/loading-demo/page-68ddc76694da994a.js"},{"revision":"80e7ad42d950169f82facc3f2e91294d","url":"chunks/app/test/page-64c95374f0344dde.js"},{"revision":"2338aa711e24415dc3a90e1d1d29ebc5","url":"chunks/app/test/pwa-ios/page-71bc29429482a75a.js"},{"revision":"d0b942ff2f99774e00da1ec895ab591b","url":"chunks/b12a3ad9-d8fa792c12afc0be.js"},{"revision":"84671865b4868b7d3afd0ee74ebb10ff","url":"chunks/framework-6e06c675866dc992.js"},{"revision":"2668c235b27e7f3daa83b0c087060cfd","url":"chunks/main-0488a9b24217f6c4.js"},{"revision":"66481e549aceb75c5f304f6f1ade239c","url":"chunks/main-app-b5b5a8433fa83742.js"},{"revision":"5a9d2c26d61aabe64c28a3df59110d35","url":"chunks/pages/_app-5cd67824448d21f3.js"},{"revision":"af6e7475f243d955a5250d414084b1de","url":"chunks/pages/_error-705823641673651d.js"},{"revision":"79330112775102f91e1010318bae2bd3","url":"chunks/polyfills-78c92fac7aa8fdd8.js"},{"revision":"e183df961260ddd90814133e2d863aa5","url":"chunks/webpack-7685a6792b21f17a.js"},{"revision":"0fe2c6688c830a3f850dc82e782edc7f","url":"css/3c752c5cc96e2e88.css"},{"revision":"adf6863b7340a916a9cd770587af887d","url":"css/7b1e77852b1d1f2d.css"},{"revision":"52947a514853fc45b448b81489913100","url":"ikFZmCLl62ybfDZ4_ZCf0/_buildManifest.js"},{"revision":"b404e23d62d95bafd03ad7747cc0e88b","url":"ikFZmCLl62ybfDZ4_ZCf0/_ssgManifest.js"},{"revision":"84011f1fb1577e6a6cd48e4a8668f1a8","url":"media/080efd099f83c5d9-s.woff2"},{"revision":"0d03c0520a8bb486f89cddb46d0e5426","url":"media/08a7b51ede334cf3-s.woff2"},{"revision":"da20a3c4df135154c0c6a9c9841964e0","url":"media/0afd001a2eef0854-s.p.woff2"},{"revision":"be09f0830e27a9c29e74a36ff820b004","url":"media/0ea91a71ff4dd659-s.woff2"},{"revision":"d9166fa10f96015678df3ed8f0cd634a","url":"media/1864acfc92371d36-s.woff2"},{"revision":"f69f269723e791f372a98101300f29b0","url":"media/18de9ea35ff2acd7-s.woff2"},{"revision":"17b5c6ecac5cd1e500a2685b64cd512e","url":"media/1a0dc92ae365ecef-s.p.woff2"},{"revision":"937d62dadf095deeccfdd2ec7e95d3b9","url":"media/1c08f7c327f325b7-s.p.woff2"},{"revision":"7770c1d3b799dcd6c243210f8ab2b2e7","url":"media/1ce1ffaf105af326-s.woff2"},{"revision":"caae161d6704c5a551a4aa72cfbc2a45","url":"media/1e5cdc818e052272-s.woff2"},{"revision":"732d22560999364be5bd04d395ba9734","url":"media/2472d8148f5fb3e1-s.p.woff2"},{"revision":"98f1ada90874dc85a959a99cadd42046","url":"media/2716077c9ea51874-s.p.woff2"},{"revision":"ae49e88736ba8881dee96b212565e03b","url":"media/2936b51b2e5714fe-s.p.woff2"},{"revision":"77d338939b177ffc7ce38bcf23c2f254","url":"media/2b37bac3230fc3dd-s.p.woff2"},{"revision":"f5cb431ad30af05a67f0662c0dc92fd3","url":"media/34ea902976aaca91-s.woff2"},{"revision":"972b4becbfe271adfeb082e79b282b87","url":"media/381ef99eada06d71-s.p.woff2"},{"revision":"34a2e275767d6e145113a110a8ec80ad","url":"media/39d36ea661d162b7-s.p.woff2"},{"revision":"f3d1ec70ec2d0e326be3267213bfe941","url":"media/3c365cdafe49b4eb-s.p.woff2"},{"revision":"75607dc6e7594084f5af1e9139869d63","url":"media/3d2d27a4cad47329-s.p.woff2"},{"revision":"2eac85f0187546127343d0d773405284","url":"media/4642fe567cc45cd6-s.p.woff2"},{"revision":"f66fda3299606420c3ebbd96a30e3856","url":"media/4c6c71ecf798bcc0-s.p.woff2"},{"revision":"85f07719d0f6a8e3e8d125a53d00e366","url":"media/5084e176e02368e5-s.woff2"},{"revision":"c8a9ed8a1601e4311797d32aae049bc4","url":"media/55190bc973e13381-s.p.woff2"},{"revision":"faf9b3ae52cebafaa6da48dd12028bfb","url":"media/5ba6339fa8c3ef7b-s.woff2"},{"revision":"05005b5f73627508d158bbd823a545c4","url":"media/61abf483825109ac-s.woff2"},{"revision":"27beee8be9559a264ab6872f2e5641c2","url":"media/61bb9d49a71fe00b-s.woff2"},{"revision":"459ad1fc6f39388d0765884ec1483aef","url":"media/6dfb0de2daced060-s.woff2"},{"revision":"a8d9983bb5c20e9f017df945704ccb1b","url":"media/70c6212c0873ede2-s.woff2"},{"revision":"b33596f5b3df1e3c2578537bf7423d10","url":"media/725593178767aadb-s.woff2"},{"revision":"2ff6d6c69ec3d3a2131901080584f700","url":"media/7510f746b21ae7c3-s.woff2"},{"revision":"7821133fd8de6d1c7abee0370652b402","url":"media/78e502340dd8c813-s.p.woff2"},{"revision":"be91f7d7bd26311cebd343cd9ee08762","url":"media/7c401bf5c82b898b-s.p.woff2"},{"revision":"0dddbd13adb25c89a36f2ed1b67be2de","url":"media/7fd57ce862c5637e-s.p.woff2"},{"revision":"c0f51d2e9a14c9977667b2e7ecc77f56","url":"media/805e8973a142bb62-s.woff2"},{"revision":"e9754d586f2f0c4fc8285ffd32fe4f45","url":"media/82099b10433b91d1-s.woff2"},{"revision":"e6f3e429120037c2564c0e895be922d2","url":"media/858b2cdd0d7af439-s.woff2"},{"revision":"7f29fccedc246b38997511a7ac3a5302","url":"media/873bdeebe058916b-s.woff2"},{"revision":"20125638de4fc4377accdbd7e3618d80","url":"media/8a065f9879e59329-s.woff2"},{"revision":"5c384a65d6e4438fa74419ff2b75e7f2","url":"media/8d0ffaba4bd77024-s.woff2"},{"revision":"96b5a7b87a41c515d8fe71373528ef67","url":"media/8daa8be81dccba23-s.woff2"},{"revision":"ad16878722b7608fa54a4f0957010573","url":"media/8f216480a1174989-s.p.woff2"},{"revision":"c5444e24c0394786af6bc4cbf10125cf","url":"media/925ae5d307f44ad6-s.woff2"},{"revision":"b1299fcca3272eb73e431ea0d7d64298","url":"media/9759834640a8c876-s.p.woff2"},{"revision":"bbfac10c143caee596db8973990c060e","url":"media/998fe24807a535a8-s.p.woff2"},{"revision":"a7a6dfca7bbe38f3500d18ca9ca3ec9b","url":"media/a2f9dcde03fa81a6-s.p.woff2"},{"revision":"f69b74c89bba7a5ff7e6e33906658286","url":"media/a78db9cc4ec15a37-s.p.woff2"},{"revision":"22a345411693faa019fad4613b753d75","url":"media/a9352a6fbf6bd0bb-s.woff2"},{"revision":"e52c017287bd8a2848f2e87eb9694a36","url":"media/ac9533dbb8535e79-s.woff2"},{"revision":"0658d8b927bc869ecebc7e692068f12d","url":"media/acd5fc73cb239d38-s.p.woff2"},{"revision":"4b082ff83bb460bc3c6a907044e24b07","url":"media/b47a43ab1ca14f74-s.p.woff2"},{"revision":"f26ffd302bd24c5c6a080354092a888d","url":"media/bb001b813e61c05f-s.woff2"},{"revision":"d9c3a1f816bb405c68073600ad4e27ef","url":"media/c97ac8f3fc2f31ba-s.woff2"},{"revision":"9d121bd357a696ca1b6803c4c1699310","url":"media/ca8221cae4ed3b4b-s.p.woff2"},{"revision":"353a1a029849238aa3bf0d789e5f5d9d","url":"media/cace2fa548203d15-s.woff2"},{"revision":"25f493b49980d72c9225a7bdbd9c3c42","url":"media/cc9a5f10ece852e7-s.p.woff2"},{"revision":"e76535dd1e6f85d323a773e830f6bc00","url":"media/cdca6fff670edd4c-s.woff2"},{"revision":"186750895aa7f7ad951941bca7ebb1e9","url":"media/d536ec48f0acd73b-s.p.woff2"},{"revision":"023c8de5e5ffc03a1325eb047f5bf249","url":"media/d96d6f132d480db9-s.p.woff2"},{"revision":"f34bec62c3e23f83209d673ae664826c","url":"media/ded56dc8aa59b419-s.woff2"},{"revision":"0b7e9a4b03429c41a9a0b41105ec2d7b","url":"media/e14a0bed3772c231-s.p.woff2"},{"revision":"1d8a18c714eac62968e291102e0e4e3a","url":"media/e9fcf2a736cc2865-s.p.woff2"},{"revision":"a4e9c43cbe093eac5bac2f276a030428","url":"media/ebab2c13e3ad7a3e-s.p.woff2"},{"revision":"d25d11bf49248d003ba37670fad43622","url":"media/efb1d0d3266e2361-s.woff2"},{"revision":"14ae1ebadf0975072eb9a61357d96d8c","url":"media/f03ffc16b6959a02-s.p.woff2"},{"revision":"31bd1fb5587ef34eda4b73a8f64756a3","url":"media/f33795ed882e5728-s.p.woff2"},{"revision":"261500876113b0917a8ff44c294bb38a","url":"media/f418c8dfe6aa75f6-s.woff2"},{"revision":"17be7cffbccd4a42c0c2552b1a4bb572","url":"media/f492cb29a696c19e-s.woff2"},{"revision":"59f96320a27b08b6c6486179a9ff01a4","url":"media/f773842945696be2-s.p.woff2"},{"revision":"9e46f29debffec453bb6d529da404a82","url":"media/f9c7a19c91a12b77-s.p.woff2"},{"revision":"17cffed4e61936828540bd55606860c3","url":"media/fba85063576c67d4-s.woff2"},{"revision":"68dd96cb7a7435ac326a3c0cf99af4b9","url":"media/fc47418b0a262e70-s.p.woff2"},{"revision":"d7589ee501ec7f290ee27b2793fdba14","url":"media/fd89c990b5cb0144-s.woff2"},{"revision":null,"url":"/manifest.json"},{"revision":null,"url":"/offline.html"},{"revision":null,"url":"/asset/CareClockLOGO.PNG"}]);

// ----------------- Workbox Runtime Caching Strategies -----------------

// Cache a Google Fonts
workbox.routing.registerRoute(
  ({url}) => url.origin === 'https://fonts.googleapis.com',
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'google-fonts-stylesheets',
  })
);

// Cache a Supabase Images
workbox.routing.registerRoute(
  ({url}) => url.hostname === 'fcktqdzssxqvuzgdlemo.supabase.co',
  new workbox.strategies.CacheFirst({
    cacheName: 'supabase-images',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
      }),
    ],
  })
);

// Cache API calls (Network First)
workbox.routing.registerRoute(
  ({url}) => url.pathname.startsWith('/api/'),
  new workbox.strategies.NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 24 * 60 * 60, // 1 Day
      }),
    ],
  })
);

// ----------------- Custom Push & Notification Logic (จากโค้ดเดิมของคุณ) -----------------

// Enhanced push event for notifications
self.addEventListener('push', (event) => {
  // ... (โค้ด push event handler เดิมของคุณ) ...
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  // ... (โค้ด notificationclick event handler เดิมของคุณ) ...
});

// ----------------- Other Service Worker Events -----------------
self.addEventListener('install', (event) => {
  console.log('Service Worker: Install');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activate');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('sync', (event) => {
  // ... (โค้ด sync event handler เดิมของคุณ) ...
});