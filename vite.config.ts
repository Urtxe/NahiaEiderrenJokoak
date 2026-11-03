import { defineConfig } from 'vite';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const base = '/NahiaEiderrenJokoak/';

const offlineCache: Plugin = {
  name: 'offline-cache',
  generateBundle(_, bundle) {
    const assets = Object.keys(bundle).filter((file) => /\.(js|css)$/.test(file));
    const urls = [
      base,
      `${base}index.html`,
      `${base}manifest.webmanifest`,
      `${base}icon.svg`,
      `${base}icon-192.png`,
      `${base}icon-512.png`,
      ...assets.map((file) => `${base}${file}`),
    ];

    this.emitFile({
      type: 'asset',
      fileName: 'sw.js',
      source: `const CACHE = 'nahia-eider-jokoak-${assets.join('-')}';
const APP_URLS = ${JSON.stringify(urls)};
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(APP_URLS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith('nahia-eider-jokoak-') && key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('${base}index.html')));
    return;
  }
  event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => {
    if (response.ok) caches.open(CACHE).then((cache) => cache.put(request, response.clone()));
    return response;
  })));
});`,
    });
  },
};

export default defineConfig({ base, plugins: [react(), offlineCache] });
