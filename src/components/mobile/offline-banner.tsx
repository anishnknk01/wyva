'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { WifiOff, Wifi, RefreshCw, CheckCircle } from 'lucide-react'
import { useOffline } from '@/hooks/use-offline'
import { toast } from 'sonner'

interface OfflineBannerProps {
  className?: string
}

export function OfflineBanner({ className }: OfflineBannerProps) {
  const { isOnline, isOffline, wasOffline, syncWhenOnline } = useOffline()

  const handleRetry = async () => {
    if (isOnline) {
      await syncWhenOnline()
      toast.success('Syncing data...')
    } else {
      toast.error('Still offline. Check your internet connection.')
    }
  }

  // Show reconnected banner briefly
  if (isOnline && wasOffline) {
    return (
      <Card className={`bg-green-50 border-green-200 ${className}`}>
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-800">
                Back online!
              </p>
              <p className="text-xs text-green-600">
                Syncing your data automatically
              </p>
            </div>
          </div>
          <Wifi className="h-5 w-5 text-green-600" />
        </div>
      </Card>
    )
  }

  // Show offline banner
  if (isOffline) {
    return (
      <Card className={`bg-yellow-50 border-yellow-200 ${className}`}>
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center space-x-3">
            <WifiOff className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="text-sm font-medium text-yellow-800">
                You're offline
              </p>
              <p className="text-xs text-yellow-600">
                Some features may be limited
              </p>
            </div>
          </div>
          
          <Button
            onClick={handleRetry}
            variant="outline"
            size="sm"
            className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        </div>
      </Card>
    )
  }

  // Don't show anything when online and never was offline
  return null
}

// Floating offline indicator for minimal UI impact
export function OfflineIndicator({ className }: OfflineBannerProps) {
  const { isOffline } = useOffline()

  if (!isOffline) return null

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      <Card className="bg-gray-900 text-white">
        <div className="flex items-center space-x-2 p-2 px-3">
          <WifiOff className="h-4 w-4" />
          <span className="text-sm font-medium">Offline</span>
        </div>
      </Card>
    </div>
  )
}

// Cache status component for debugging
export function CacheStatusCard({ className }: OfflineBannerProps) {
  const { getCacheStatus, clearExpiredCache } = useOffline()
  const [cacheStatus, setCacheStatus] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(false)

  const loadCacheStatus = async () => {
    setLoading(true)
    try {
      const status = await getCacheStatus()
      setCacheStatus(status)
    } catch (error) {
      console.error('Failed to load cache status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClearCache = async () => {
    try {
      await clearExpiredCache()
      toast.success('Cache cleared successfully')
      // Reload status
      setTimeout(loadCacheStatus, 1000)
    } catch (error) {
      toast.error('Failed to clear cache')
    }
  }

  React.useEffect(() => {
    loadCacheStatus()
  }, [])

  return (
    <Card className={className}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-900">
            Cache Status
          </h3>
          <div className="flex space-x-2">
            <Button
              onClick={loadCacheStatus}
              variant="outline"
              size="sm"
              disabled={loading}
            >
              {loading ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
            </Button>
            <Button
              onClick={handleClearCache}
              variant="outline"
              size="sm"
            >
              Clear
            </Button>
          </div>
        </div>

        {cacheStatus && (
          <div className="space-y-2">
            {Object.entries(cacheStatus).map(([cacheName, info]: [string, any]) => (
              <div key={cacheName} className="flex justify-between text-xs">
                <span className="font-medium text-gray-600">
                  {cacheName.replace('wyva-', '')}
                </span>
                <span className="text-gray-500">
                  {info.entries} items
                </span>
              </div>
            ))}
          </div>
        )}

        {!cacheStatus && !loading && (
          <p className="text-xs text-gray-500">
            No cache information available
          </p>
        )}
      </div>
    </Card>
  )
}