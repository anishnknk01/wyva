'use client'

import { useState, useEffect, useCallback } from 'react'

export interface OfflineCapabilities {
  isOnline: boolean
  isOffline: boolean
  wasOffline: boolean
  saveForLater: (key: string, data: any) => Promise<void>
  getOfflineData: (key: string) => Promise<any>
  removeOfflineData: (key: string) => Promise<void>
  syncWhenOnline: () => Promise<void>
  getCacheStatus: () => Promise<any>
  clearExpiredCache: () => Promise<void>
}

interface PendingOperation {
  id: string
  type: 'message' | 'photo' | 'task_update'
  data: any
  timestamp: number
  retries: number
}

export function useOffline(): OfflineCapabilities {
  const [isOnline, setIsOnline] = useState(true)
  const [wasOffline, setWasOffline] = useState(false)

  useEffect(() => {
    // Set initial online status
    setIsOnline(navigator.onLine)

    // Listen for online/offline events
    const handleOnline = () => {
      console.log('App is back online')
      setIsOnline(true)
      if (wasOffline) {
        syncWhenOnline()
        setWasOffline(false)
      }
    }

    const handleOffline = () => {
      console.log('App went offline')
      setIsOnline(false)
      setWasOffline(true)
    }

    // Listen for service worker messages
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data?.type === 'NETWORK_STATUS') {
        setIsOnline(event.data.online)
        if (!event.data.online) {
          setWasOffline(true)
        }
      }
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    navigator.serviceWorker?.addEventListener('message', handleServiceWorkerMessage)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      navigator.serviceWorker?.removeEventListener('message', handleServiceWorkerMessage)
    }
  }, [wasOffline])

  // Save data for offline use
  const saveForLater = useCallback(async (key: string, data: any): Promise<void> => {
    try {
      if ('indexedDB' in window) {
        await saveToIndexedDB(key, data)
      } else {
        // Fallback to localStorage
        localStorage.setItem(`wyva_offline_${key}`, JSON.stringify({
          data,
          timestamp: Date.now()
        }))
      }
      console.log('Saved data for offline use:', key)
    } catch (error) {
      console.error('Failed to save offline data:', error)
    }
  }, [])

  // Get offline data
  const getOfflineData = useCallback(async (key: string): Promise<any> => {
    try {
      if ('indexedDB' in window) {
        return await getFromIndexedDB(key)
      } else {
        // Fallback to localStorage
        const stored = localStorage.getItem(`wyva_offline_${key}`)
        return stored ? JSON.parse(stored).data : null
      }
    } catch (error) {
      console.error('Failed to get offline data:', error)
      return null
    }
  }, [])

  // Remove offline data
  const removeOfflineData = useCallback(async (key: string): Promise<void> => {
    try {
      if ('indexedDB' in window) {
        await removeFromIndexedDB(key)
      } else {
        localStorage.removeItem(`wyva_offline_${key}`)
      }
    } catch (error) {
      console.error('Failed to remove offline data:', error)
    }
  }, [])

  // Trigger sync when back online
  const syncWhenOnline = useCallback(async (): Promise<void> => {
    if (!isOnline) return

    try {
      // Trigger service worker background sync
      if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        const registration = await navigator.serviceWorker.ready
        
        await Promise.all([
          registration.sync.register('sync-tasks'),
          registration.sync.register('send-message'),
          registration.sync.register('upload-photos')
        ])
        
        console.log('Background sync registered successfully')
      }
    } catch (error) {
      console.error('Failed to register background sync:', error)
    }
  }, [isOnline])

  // Get cache status from service worker
  const getCacheStatus = useCallback(async (): Promise<any> => {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready
        
        return new Promise((resolve) => {
          const messageChannel = new MessageChannel()
          
          messageChannel.port1.onmessage = (event) => {
            resolve(event.data)
          }
          
          registration.active?.postMessage(
            { type: 'GET_CACHE_STATUS' },
            [messageChannel.port2]
          )
          
          // Timeout after 5 seconds
          setTimeout(() => resolve({}), 5000)
        })
      }
      
      return {}
    } catch (error) {
      console.error('Failed to get cache status:', error)
      return {}
    }
  }, [])

  // Clear expired cache entries
  const clearExpiredCache = useCallback(async (): Promise<void> => {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready
        registration.active?.postMessage({ type: 'CLEANUP_CACHES' })
        console.log('Cache cleanup initiated')
      }
    } catch (error) {
      console.error('Failed to clear expired cache:', error)
    }
  }, [])

  return {
    isOnline,
    isOffline: !isOnline,
    wasOffline,
    saveForLater,
    getOfflineData,
    removeOfflineData,
    syncWhenOnline,
    getCacheStatus,
    clearExpiredCache
  }
}

// IndexedDB helpers
async function openOfflineDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('WyvaOfflineData', 1)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      
      if (!db.objectStoreNames.contains('offlineData')) {
        db.createObjectStore('offlineData', { keyPath: 'key' })
      }
    }
  })
}

async function saveToIndexedDB(key: string, data: any): Promise<void> {
  const db = await openOfflineDB()
  const transaction = db.transaction(['offlineData'], 'readwrite')
  const store = transaction.objectStore('offlineData')
  
  return new Promise((resolve, reject) => {
    const request = store.put({
      key,
      data,
      timestamp: Date.now()
    })
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

async function getFromIndexedDB(key: string): Promise<any> {
  const db = await openOfflineDB()
  const transaction = db.transaction(['offlineData'], 'readonly')
  const store = transaction.objectStore('offlineData')
  
  return new Promise((resolve, reject) => {
    const request = store.get(key)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const result = request.result
      resolve(result ? result.data : null)
    }
  })
}

async function removeFromIndexedDB(key: string): Promise<void> {
  const db = await openOfflineDB()
  const transaction = db.transaction(['offlineData'], 'readwrite')
  const store = transaction.objectStore('offlineData')
  
  return new Promise((resolve, reject) => {
    const request = store.delete(key)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

// Helper to queue operations for when back online
export async function queueOfflineOperation(operation: Omit<PendingOperation, 'id' | 'timestamp' | 'retries'>) {
  try {
    const db = await navigator.serviceWorker?.ready
    if (!db) return

    const pendingOp: PendingOperation = {
      ...operation,
      id: `${operation.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retries: 0
    }

    // Store in appropriate IndexedDB store based on type
    switch (operation.type) {
      case 'message':
        await storePendingMessage(pendingOp)
        break
      case 'photo':
        await storePendingPhoto(pendingOp)
        break
      default:
        console.warn('Unknown operation type:', operation.type)
    }

    console.log('Queued offline operation:', pendingOp.id)
  } catch (error) {
    console.error('Failed to queue offline operation:', error)
  }
}

async function storePendingMessage(operation: PendingOperation) {
  const db = await openOfflineDB()
  const transaction = db.transaction(['pendingMessages'], 'readwrite')
  const store = transaction.objectStore('pendingMessages')
  
  return new Promise<void>((resolve, reject) => {
    const request = store.put(operation)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

async function storePendingPhoto(operation: PendingOperation) {
  const db = await openOfflineDB()
  const transaction = db.transaction(['pendingPhotos'], 'readwrite')
  const store = transaction.objectStore('pendingPhotos')
  
  return new Promise<void>((resolve, reject) => {
    const request = store.put(operation)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}