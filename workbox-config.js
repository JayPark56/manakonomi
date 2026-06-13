/**
 * Workbox service-worker config for the exported web build.
 *
 * Run AFTER `expo export -p web` (see the "build:web" npm script):
 *   npx workbox-cli generateSW workbox-config.js
 *
 * Precaches the app shell, JS bundle, fonts and icons so the app launches
 * offline; AniList requests use runtime caching so data refreshes online.
 */
module.exports = {
  globDirectory: 'dist/',
  globPatterns: ['**/*.{html,js,css,json,ttf,otf,woff,woff2,png,ico,svg,jpg,jpeg,webp}'],
  globIgnores: [
    // Build metadata is irrelevant to the runtime shell.
    'metadata.json',
    // @expo/vector-icons ships ~18 icon-font families (~3.5MB); the app only
    // uses Ionicons (UI/heart) and Octicons (rating star), so precache those
    // two and skip the rest.
    'assets/node_modules/@expo/vector-icons/**/Fonts/!(Ionicons*|Octicons*).ttf',
  ],
  swDest: 'dist/sw.js',
  // A new service worker activates and claims clients immediately, so a fresh
  // deploy never gets stuck behind a stale cached worker.
  skipWaiting: true,
  clientsClaim: true,
  cleanupOutdatedCaches: true,
  // SPA navigations fall back to the precached shell when offline.
  navigateFallback: '/index.html',
  // Largest precached file is the JS bundle (~1.3MB); lift the 2MB default.
  maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
  runtimeCaching: [
    {
      // AniList GraphQL API. NOTE: every query is a POST and Workbox runtime
      // strategies only cache GET, so this route is effectively a network
      // passthrough — offline replay of GraphQL data is handled at the app
      // layer instead (see src/api/cache.ts). Kept for any future GET traffic.
      urlPattern: ({ url }) => url.href.startsWith('https://graphql.anilist.co'),
      handler: 'NetworkFirst',
      options: {
        cacheName: 'anilist-api',
        networkTimeoutSeconds: 10,
        expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 },
        cacheableResponse: { statuses: [0, 200] },
      },
    },
    {
      // Cover-image CDN: stale-while-revalidate keeps previously seen covers
      // instant and available offline while refreshing in the background.
      urlPattern: ({ url }) =>
        url.hostname.endsWith('anilist.co') && url.pathname.includes('/file/'),
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'anilist-covers',
        expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 7 },
        cacheableResponse: { statuses: [0, 200] },
      },
    },
  ],
};
