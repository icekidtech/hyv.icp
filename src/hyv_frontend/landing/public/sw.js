/* Minimal Service-Worker for Next.js preview */
/* It immediately takes control and does no caching/offline work */

self.addEventListener("install", (event) => {
  /* Skip waiting so the SW becomes active immediately */
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  /* Claim clients so the page is controlled without reload */
  event.waitUntil(self.clients.claim())
})
