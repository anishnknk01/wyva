// Enhanced Service Worker for Wyva - Offline Functionality & Caching
const CACHE_NAME = 'wyva-v2';
const STATIC_CACHE_NAME = 'wyva-static-v2';
const DYNAMIC_CACHE_NAME = 'wyva-dynamic-v2';
const IMAGE_CACHE_NAME = 'wyva-images-v2';
const API_CACHE_NAME = 'wyva-api-v2';

// Cache strategies configuration
const CACHE_STRATEGIES = {
  NETWORK_FIRST: 'network_first',
  CACHE_FIRST: 'cache_first',
  STALE_WHILE_REVALIDATE: 'stale_while_revalidate',
  NETWORK_ONLY: 'network_only',
  CACHE_ONLY: 'cache_only'
};

// Static resources to cache immediately
const STATIC_URLS = [
  '/',
  '/mobile',
  '/mobile/find-tasks',
  '/mobile/create-task', 
  '/mobile/my-tasks',
  '/mobile/messages',
  '/mobile/profile',
  '/mobile/settings',
  '/wysa-logo.png',
  '/favicon.ico',
  // Add common UI assets
  '/globals.css',
];

// Route patterns and their cache strategies
const CACHE_ROUTES = [
  // Static assets - cache first
  { 
    pattern: /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/,
    strategy: CACHE_STRATEGIES.CACHE_FIRST,
    cacheName: STATIC_CACHE_NAME,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    maxEntries: 100
  },
  
  // Images - cache first with longer expiry
  {
    pattern: /\/api\/tasks\/.*\/photos/,
    strategy: CACHE_STRATEGIES.CACHE_FIRST,
    cacheName: IMAGE_CACHE_NAME,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    maxEntries: 200
  },
  
  // API reads - stale while revalidate
  {
    pattern: /\/api\/tasks$/,
    strategy: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE,
    cacheName: API_CACHE_NAME,
    maxAge: 5 * 60 * 1000, // 5 minutes
    maxEntries: 50
  },
  
  // Task details - stale while revalidate
  {
    pattern: /\/api\/tasks\/[^\/]+$/,
    strategy: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE,
    cacheName: API_CACHE_NAME,
    maxAge: 10 * 60 * 1000, // 10 minutes
    maxEntries: 100
  },
  
  // Messages - network first (prefer fresh)
  {
    pattern: /\/api\/messages/,
    strategy: CACHE_STRATEGIES.NETWORK_FIRST,
    cacheName: API_CACHE_NAME,
    maxAge: 1 * 60 * 1000, // 1 minute
    maxEntries: 50
  },
  
  // Nearby tasks - stale while revalidate
  {
    pattern: /\/api\/tasks\/nearby/,
    strategy: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE,
    cacheName: API_CACHE_NAME,
    maxAge: 2 * 60 * 1000, // 2 minutes
    maxEntries: 20
  },
  
  // Navigation pages - network first with fallback
  {
    pattern: /^https?:\/\/[^\/]+\/mobile/,
    strategy: CACHE_STRATEGIES.NETWORK_FIRST,
    cacheName: DYNAMIC_CACHE_NAME,
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    maxEntries: 50
  }
];

// Install event - cache static resources
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache static resources
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        console.log('Caching static resources');
        return cache.addAll(STATIC_URLS);
      }),
      
      // Initialize other caches
      caches.open(DYNAMIC_CACHE_NAME),
      caches.open(IMAGE_CACHE_NAME),
      caches.open(API_CACHE_NAME)
    ]).then(() => {
      console.log('Service Worker installed successfully');
      // Force activation of new service worker
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  const currentCaches = [STATIC_CACHE_NAME, DYNAMIC_CACHE_NAME, IMAGE_CACHE_NAME, API_CACHE_NAME];
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!currentCaches.includes(cacheName)) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Take control of all clients
      self.clients.claim()
    ]).then(() => {
      console.log('Service Worker activated successfully');
    })
  );
});

// Enhanced fetch event with intelligent caching
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Skip chrome extension requests
  if (event.request.url.startsWith('chrome-extension://')) {
    return;
  }
  
  event.respondWith(handleFetchWithStrategy(event.request));
});

// Main fetch handler with caching strategies
async function handleFetchWithStrategy(request) {
  const url = new URL(request.url);
  
  // Find matching cache strategy
  const route = CACHE_ROUTES.find(route => route.pattern.test(request.url));
  
  if (!route) {
    // Default strategy for unmatched routes
    return handleNetworkFirst(request, DYNAMIC_CACHE_NAME);
  }
  
  switch (route.strategy) {
    case CACHE_STRATEGIES.CACHE_FIRST:
      return handleCacheFirst(request, route);
      
    case CACHE_STRATEGIES.NETWORK_FIRST:
      return handleNetworkFirst(request, route.cacheName, route);
      
    case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
      return handleStaleWhileRevalidate(request, route);
      
    case CACHE_STRATEGIES.NETWORK_ONLY:
      return fetch(request);
      
    case CACHE_STRATEGIES.CACHE_ONLY:
      return caches.match(request);
      
    default:
      return handleNetworkFirst(request, route.cacheName);
  }
}

// Cache-first strategy
async function handleCacheFirst(request, route) {
  const cache = await caches.open(route.cacheName);
  const cached = await cache.match(request);
  
  if (cached) {
    // Check if cached response is still valid
    if (route.maxAge) {
      const cachedDate = new Date(cached.headers.get('sw-cached-date'));
      const now = new Date();
      
      if (now - cachedDate > route.maxAge) {
        // Cache expired, fetch new version in background
        fetchAndCache(request, route.cacheName, route);
        // But return cached version for speed
        return cached;
      }
    }
    
    return cached;
  }
  
  // Not in cache, fetch and cache
  return fetchAndCache(request, route.cacheName, route);
}

// Network-first strategy
async function handleNetworkFirst(request, cacheName, route = null) {
  try {
    const response = await fetch(request);
    
    // Cache successful responses
    if (response.ok) {
      const cache = await caches.open(cacheName);
      const responseToCache = response.clone();
      
      // Add cache metadata
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cached-date', new Date().toISOString());
      
      const modifiedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers
      });
      
      cache.put(request, modifiedResponse);
      
      // Manage cache size
      if (route && route.maxEntries) {
        manageCacheSize(cacheName, route.maxEntries);
      }
    }
    
    return response;
  } catch (error) {
    console.log('Network failed, trying cache:', request.url);
    
    // Network failed, try cache
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    
    // No cache available, return offline fallback
    return getOfflineFallback(request);
  }
}

// Stale-while-revalidate strategy
async function handleStaleWhileRevalidate(request, route) {
  const cache = await caches.open(route.cacheName);
  const cached = await cache.match(request);
  
  // Always fetch in background to update cache
  const fetchPromise = fetchAndCache(request, route.cacheName, route);
  
  // Return cached version immediately if available
  if (cached) {
    return cached;
  }
  
  // No cache, wait for network
  return fetchPromise;
}

// Utility function to fetch and cache
async function fetchAndCache(request, cacheName, route = null) {
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(cacheName);
      const responseToCache = response.clone();
      
      // Add cache metadata
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cached-date', new Date().toISOString());
      
      const modifiedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers
      });
      
      cache.put(request, modifiedResponse);
      
      // Manage cache size
      if (route && route.maxEntries) {
        manageCacheSize(cacheName, route.maxEntries);
      }
    }
    
    return response;
  } catch (error) {
    console.error('Fetch failed:', request.url, error);
    return getOfflineFallback(request);
  }
}

// Manage cache size by removing oldest entries
async function manageCacheSize(cacheName, maxEntries) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    
    if (keys.length > maxEntries) {
      // Sort by cache date and remove oldest
      const keysWithDates = await Promise.all(
        keys.map(async (key) => {
          const response = await cache.match(key);
          const date = response.headers.get('sw-cached-date');
          return { key, date: new Date(date || 0) };
        })
      );
      
      keysWithDates.sort((a, b) => a.date - b.date);
      
      const keysToDelete = keysWithDates.slice(0, keys.length - maxEntries);
      
      await Promise.all(
        keysToDelete.map(({ key }) => cache.delete(key))
      );
      
      console.log(`Cleaned up ${keysToDelete.length} old cache entries from ${cacheName}`);
    }
  } catch (error) {
    console.error('Cache management failed:', error);
  }
}

// Offline fallback responses
function getOfflineFallback(request) {
  const url = new URL(request.url);
  
  // Return different fallbacks based on request type
  if (request.headers.get('accept')?.includes('text/html')) {
    // HTML page fallback
    return new Response(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Offline - Wyva</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, sans-serif;
              text-align: center;
              padding: 2rem;
              background: #f3f4f6;
            }
            .offline-container {
              max-width: 400px;
              margin: 4rem auto;
              padding: 2rem;
              background: white;
              border-radius: 8px;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            }
            .offline-icon {
              width: 64px;
              height: 64px;
              margin: 0 auto 1rem;
              background: #ef4444;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 24px;
            }
            h1 { color: #374151; margin-bottom: 0.5rem; }
            p { color: #6b7280; margin-bottom: 1.5rem; }
            button {
              background: #0ea5e9;
              color: white;
              border: none;
              padding: 0.75rem 1.5rem;
              border-radius: 6px;
              font-size: 16px;
              cursor: pointer;
            }
            button:hover { background: #0284c7; }
          </style>
        </head>
        <body>
          <div class="offline-container">
            <div class="offline-icon">📵</div>
            <h1>You're offline</h1>
            <p>Please check your internet connection and try again.</p>
            <button onclick="window.location.reload()">Retry</button>
          </div>
        </body>
      </html>
      `,
      {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store'
        }
      }
    );
  }
  
  // JSON API fallback
  if (request.headers.get('accept')?.includes('application/json')) {
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'No internet connection available',
        offline: true
      }),
      {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        }
      }
    );
  }
  
  // Generic fallback
  return new Response('Offline - No internet connection', {
    status: 503,
    statusText: 'Service Unavailable'
  });
}

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);
  
  let notificationData = {
    title: 'Wyva Notification',
    body: 'You have a new update',
    icon: '/wysa-logo.png',
    badge: '/wysa-logo.png',
    tag: 'default',
    data: {},
    actions: []
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      notificationData = { ...notificationData, ...payload };
    } catch (error) {
      console.error('Error parsing push data:', error);
      notificationData.body = event.data.text() || notificationData.body;
    }
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    tag: notificationData.tag,
    data: notificationData.data,
    actions: notificationData.actions,
    requireInteraction: true,
    vibrate: [200, 100, 200, 100, 200],
    silent: false,
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

// Notification click event - handle user interaction
self.addEventListener('notificationclick', (event) => {
  console.log('Notification click received:', event);
  
  event.notification.close();
  
  const data = event.notification.data || {};
  const action = event.action;
  
  let url = '/mobile';
  
  // Determine URL based on notification data
  if (data.url) {
    url = data.url;
  } else if (data.taskId) {
    if (data.type === 'message') {
      url = `/mobile/messages/${data.taskId}`;
    } else {
      url = `/mobile/my-tasks/${data.taskId}`;
    }
  }
  
  // Handle specific actions
  if (action === 'view' && data.taskId) {
    url = `/mobile/my-tasks/${data.taskId}`;
  } else if (action === 'message' && data.taskId) {
    url = `/mobile/messages/${data.taskId}`;
  } else if (action === 'reply' && data.taskId) {
    url = `/mobile/messages/${data.taskId}`;
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Background sync for offline functionality
self.addEventListener('sync', (event) => {
  console.log('Background sync event:', event);
  
  switch (event.tag) {
    case 'send-message':
      event.waitUntil(handleOfflineMessageSend());
      break;
      
    case 'sync-tasks':
      event.waitUntil(handleTaskSync());
      break;
      
    case 'upload-photos':
      event.waitUntil(handlePhotoUpload());
      break;
      
    default:
      console.log('Unknown sync tag:', event.tag);
  }
});

// Enhanced offline message handling
async function handleOfflineMessageSend() {
  try {
    const pendingMessages = await getPendingMessages();
    console.log(`Processing ${pendingMessages.length} pending messages`);
    
    for (const message of pendingMessages) {
      try {
        const response = await sendMessage(message);
        if (response.ok) {
          await removePendingMessage(message.id);
          console.log('Successfully sent pending message:', message.id);
        }
      } catch (error) {
        console.error('Failed to send pending message:', message.id, error);
      }
    }
  } catch (error) {
    console.error('Background message sync failed:', error);
  }
}

// Sync task data when back online
async function handleTaskSync() {
  try {
    // Fetch latest task updates
    const response = await fetch('/api/tasks');
    if (response.ok) {
      const tasks = await response.json();
      
      // Update cache with fresh data
      const cache = await caches.open(API_CACHE_NAME);
      const responseToCache = response.clone();
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cached-date', new Date().toISOString());
      
      const modifiedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers
      });
      
      await cache.put('/api/tasks', modifiedResponse);
      console.log('Task data synchronized successfully');
    }
  } catch (error) {
    console.error('Task sync failed:', error);
  }
}

// Handle pending photo uploads
async function handlePhotoUpload() {
  try {
    const pendingUploads = await getPendingPhotoUploads();
    console.log(`Processing ${pendingUploads.length} pending photo uploads`);
    
    for (const upload of pendingUploads) {
      try {
        const formData = new FormData();
        formData.append('photos', upload.file);
        
        const response = await fetch(`/api/tasks/${upload.taskId}/photos`, {
          method: 'POST',
          body: formData
        });
        
        if (response.ok) {
          await removePendingPhotoUpload(upload.id);
          console.log('Successfully uploaded pending photo:', upload.id);
        }
      } catch (error) {
        console.error('Failed to upload pending photo:', upload.id, error);
      }
    }
  } catch (error) {
    console.error('Background photo upload failed:', error);
  }
}

// IndexedDB helpers for offline data
async function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('WyvaOfflineDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create object stores for offline data
      if (!db.objectStoreNames.contains('pendingMessages')) {
        db.createObjectStore('pendingMessages', { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains('pendingPhotos')) {
        db.createObjectStore('pendingPhotos', { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains('offlineData')) {
        db.createObjectStore('offlineData', { keyPath: 'key' });
      }
    };
  });
}

async function getPendingMessages() {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(['pendingMessages'], 'readonly');
    const store = transaction.objectStore('pendingMessages');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  } catch (error) {
    console.error('Failed to get pending messages:', error);
    return [];
  }
}

async function removePendingMessage(messageId) {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(['pendingMessages'], 'readwrite');
    const store = transaction.objectStore('pendingMessages');
    
    return new Promise((resolve, reject) => {
      const request = store.delete(messageId);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  } catch (error) {
    console.error('Failed to remove pending message:', error);
  }
}

async function getPendingPhotoUploads() {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(['pendingPhotos'], 'readonly');
    const store = transaction.objectStore('pendingPhotos');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  } catch (error) {
    console.error('Failed to get pending photo uploads:', error);
    return [];
  }
}

async function removePendingPhotoUpload(uploadId) {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(['pendingPhotos'], 'readwrite');
    const store = transaction.objectStore('pendingPhotos');
    
    return new Promise((resolve, reject) => {
      const request = store.delete(uploadId);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  } catch (error) {
    console.error('Failed to remove pending photo upload:', error);
  }
}

async function sendMessage(message) {
  return fetch('/api/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });
}

// Network status detection
self.addEventListener('online', (event) => {
  console.log('Device is back online');
  
  // Trigger background sync for pending operations
  self.registration.sync.register('sync-tasks').catch(console.error);
  self.registration.sync.register('send-message').catch(console.error);
  self.registration.sync.register('upload-photos').catch(console.error);
  
  // Notify all clients about online status
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'NETWORK_STATUS',
        online: true
      });
    });
  });
});

self.addEventListener('offline', (event) => {
  console.log('Device went offline');
  
  // Notify all clients about offline status
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'NETWORK_STATUS',
        online: false
      });
    });
  });
});

// Periodic cache cleanup
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEANUP_CACHES') {
    event.waitUntil(cleanupExpiredCaches());
  }
  
  if (event.data && event.data.type === 'GET_CACHE_STATUS') {
    event.waitUntil(getCacheStatus().then(status => {
      event.ports[0].postMessage(status);
    }));
  }
});

async function cleanupExpiredCaches() {
  const cacheNames = await caches.keys();
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    
    for (const key of keys) {
      const response = await cache.match(key);
      const cachedDate = response.headers.get('sw-cached-date');
      
      if (cachedDate) {
        const age = Date.now() - new Date(cachedDate).getTime();
        const route = CACHE_ROUTES.find(r => r.pattern.test(key.url));
        const maxAge = route?.maxAge || (7 * 24 * 60 * 60 * 1000); // Default 7 days
        
        if (age > maxAge) {
          await cache.delete(key);
          console.log('Removed expired cache entry:', key.url);
        }
      }
    }
  }
}

async function getCacheStatus() {
  const cacheNames = await caches.keys();
  const status = {};
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    status[cacheName] = {
      entries: keys.length,
      urls: keys.map(key => key.url)
    };
  }
  
  return status;
}