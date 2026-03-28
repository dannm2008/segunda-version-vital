// ==========================================
// SERVICE WORKER - CACHÉ Y RENDIMIENTO
// ==========================================
const CACHE_NAME = 'vital-market-v5';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/style.css',
    '/app.js',
    '/manifest.json'
];

// ✅ INSTALL: Caché de activos estáticos
self.addEventListener('install', (event) => {
    console.log('🔧 Service Worker instalándose...');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('✅ Caché creada');
            return cache.addAll(STATIC_ASSETS).catch(err => {
                console.warn('⚠️ Algunos activos no pudieron caquearse:', err);
            });
        })
    );
    self.skipWaiting();
});

// ✅ ACTIVATE: Limpiar cachés antiguas
self.addEventListener('activate', (event) => {
    console.log('🚀 Service Worker activándose...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ Eliminando caché antigua:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// ✅ FETCH: Estrategia de caché inteligente
self.addEventListener('fetch', (event) => {
    // Solo GET requests
    if (event.request.method !== 'GET') return;

    const url = new URL(event.request.url);
    const isFirebaseRequest = url.hostname.includes('firebaseio.com') || url.hostname.includes('googleapis.com');

    // No interceptar Firebase/API para evitar lecturas viejas desde cache.
    if (isFirebaseRequest) {
        return;
    }

    const isAppShell =
        event.request.mode === 'navigate' ||
        url.pathname.endsWith('/index.html') ||
        url.pathname.endsWith('/app.js') ||
        url.pathname.endsWith('/style.css');

    // App shell: Network first para evitar JS/HTML desactualizados.
    if (isAppShell) {
        event.respondWith(networkFirstStrategy(event.request));
        return;
    }

    // Otros: Cache first, fallback to network
    event.respondWith(cacheFirstStrategy(event.request));
});

// ✅ NETWORK FIRST (para API/Firebase)
async function networkFirstStrategy(request) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        const cached = await caches.match(request);
        if (cached) {
            console.log('📦 Usando caché (sin conexión):', request.url);
            return cached;
        }
        return new Response('Sin conexión a internet', {
            status: 503,
            statusText: 'Service Unavailable'
        });
    }
}

// ✅ CACHE FIRST (para assets estáticos)
async function cacheFirstStrategy(request) {
    const cached = await caches.match(request);
    if (cached) return cached;

    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        return new Response('Recurso no disponible', {
            status: 404,
            statusText: 'Not Found'
        });
    }
}

// ✅ BACKGROUND SYNC (para acciones offline)
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-cart') {
        event.waitUntil(syncCart());
    }
});

async function syncCart() {
    console.log('🔄 Sincronizando carrito...');
    // Implementar sincronización de carrito cuando vuelve conexión
}

console.log('✅ Service Worker cargado');
