// --- 1. VERSION CONTROL ---
// CHANGE THIS (v1 -> v2) whenever you update index.html
const CACHE_NAME = 'rbi-system-v2';

// --- 2. ASSETS TO CACHE ---
const CRITICAL_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.png'
];

const OPTIONAL_ASSETS = [
  // These are external files. If the internet is bad, we don't want them to break the installation.
  'https://cdn.jsdelivr.net/npm/xlsx/dist/xlsx.full.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
  // FontAwesome actually loads font files internally, which can be tricky to cache perfectly,
  // but caching the CSS helps.
];

// --- 3. INSTALL EVENT (Caching) ---
self.addEventListener('install', (event) => {
  // This forces the SW to activate immediately, instead of waiting for the user to close the tab
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log(`[SW] Installing ${CACHE_NAME}`);

      // A. Cache Critical Files (Must succeed)
      await cache.addAll(CRITICAL_ASSETS);

      // B. Cache Optional Files (If these fail, we ignore the error so the app still installs)
      try {
        await cache.addAll(OPTIONAL_ASSETS);
      } catch (err) {
        console.warn('[SW] Some external assets failed to download, but proceeding anyway.');
      }
    })
  );
});

// --- 4. ACTIVATE EVENT (Cleanup) ---
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          // If the cache name doesn't match the current version, DELETE IT
          if (key !== CACHE_NAME) {
            console.log(`[SW] Deleting old cache: ${key}`);
            return caches.delete(key);
          }
        })
      );
    }).then(() => {
      // Tell the SW to take control of all open tabs immediately
      console.log(`[SW] ${CACHE_NAME} is now active`);
      return self.clients.claim();
    })
  );
});

// --- 5. FETCH EVENT (Serving Files) ---
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached file if found, otherwise try network
      return response || fetch(event.request).catch(() => {
        // Optional: If both fail (offline & not in cache), you could show a fallback page here
        // But for your app, we just let it fail silently if not cached.
      });
    })
  );
});

// --- 6. LISTEN FOR MESSAGES (Compatibility) ---
// This handles the message sent from the index.html script
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
