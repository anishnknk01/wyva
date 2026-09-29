'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Activity, 
  Users, 
  Clock, 
  Zap, 
  AlertTriangle, 
  TrendingUp,
  Smartphone,
  Wifi,
  Database
} from 'lucide-react'
import { analytics } from '@/lib/analytics'

interface PerformanceData {
  memoryUsage: {
    used: number
    total: number
    limit: number
  } | null
  networkInfo: {
    effectiveType: string
    downlink: number
    rtt: number
  } | null
  vitals: {
    fcp: number // First Contentful Paint
    lcp: number // Largest Contentful Paint
    fid: number // First Input Delay
    cls: number // Cumulative Layout Shift
  }
  pageLoadTime: number
  apiResponseTimes: Array<{
    endpoint: string
    averageTime: number
    callCount: number
  }>
}

export function AnalyticsDashboard() {
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Only show in development or to admin users
    const isDev = process.env.NODE_ENV === 'development'
    const isAdmin = localStorage.getItem('admin_mode') === 'true'
    
    if (isDev || isAdmin) {
      setIsVisible(true)
      loadPerformanceData()
    }
  }, [])

  const loadPerformanceData = () => {
    const memoryInfo = analytics.getMemoryInfo()
    
    // Get performance metrics
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    const paintEntries = performance.getEntriesByType('paint')
    
    const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0
    const lcp = performance.getEntriesByType('largest-contentful-paint').pop()?.startTime || 0
    
    setPerformanceData({
      memoryUsage: memoryInfo
        ? {
            used: memoryInfo.usedJSHeapSize,
            total: memoryInfo.totalJSHeapSize,
            limit: memoryInfo.jsHeapSizeLimit,
          }
        : null,
      networkInfo: (navigator as any).connection || null,
      vitals: {
        fcp,
        lcp,
        fid: 0, // Will be updated when available
        cls: 0  // Will be updated when available
      },
      // Navigation Timing Level 2: loadEventEnd is already relative to the
      // navigation start, so it doesn't need `navigationStart` subtracted
      // (that field was removed from the modern PerformanceNavigationTiming type).
      pageLoadTime: navigation?.loadEventEnd || 0,
      apiResponseTimes: [] // Would be populated from stored metrics
    })
  }

  const getPerformanceScore = (value: number, thresholds: { good: number; poor: number }) => {
    if (value <= thresholds.good) return { score: 'good', color: 'text-green-600' }
    if (value <= thresholds.poor) return { score: 'needs improvement', color: 'text-yellow-600' }
    return { score: 'poor', color: 'text-red-600' }
  }

  const formatBytes = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  if (!isVisible || !performanceData) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-80 max-h-96 overflow-y-auto shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Performance Monitor
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsVisible(false)}
              className="ml-auto h-6 w-6 p-0"
            >
              ×
            </Button>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Core Web Vitals */}
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
              <Zap className="h-3 w-3" />
              Core Web Vitals
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span>FCP:</span>
                <Badge 
                  variant="outline" 
                  className={getPerformanceScore(performanceData.vitals.fcp, { good: 1800, poor: 3000 }).color}
                >
                  {Math.round(performanceData.vitals.fcp)}ms
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>LCP:</span>
                <Badge 
                  variant="outline"
                  className={getPerformanceScore(performanceData.vitals.lcp, { good: 2500, poor: 4000 }).color}
                >
                  {Math.round(performanceData.vitals.lcp)}ms
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Page Load:</span>
                <Badge variant="outline">
                  {Math.round(performanceData.pageLoadTime)}ms
                </Badge>
              </div>
            </div>
          </div>

          {/* Memory Usage */}
          {performanceData.memoryUsage && (
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                <Database className="h-3 w-3" />
                Memory Usage
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Used:</span>
                  <span>{formatBytes(performanceData.memoryUsage.used)}</span>
                </div>
                <Progress 
                  value={(performanceData.memoryUsage.used / performanceData.memoryUsage.limit) * 100}
                  className="h-2"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Total: {formatBytes(performanceData.memoryUsage.total)}</span>
                  <span>Limit: {formatBytes(performanceData.memoryUsage.limit)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Network Information */}
          {performanceData.networkInfo && (
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                <Wifi className="h-3 w-3" />
                Network
              </h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Type:</span>
                  <Badge variant="outline" className="text-xs">
                    {performanceData.networkInfo.effectiveType}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Downlink:</span>
                  <span>{performanceData.networkInfo.downlink} Mbps</span>
                </div>
                <div className="flex justify-between">
                  <span>RTT:</span>
                  <span>{performanceData.networkInfo.rtt}ms</span>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={loadPerformanceData}
              className="flex-1 text-xs"
            >
              Refresh
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => {
                analytics.trackMemoryUsage()
                analytics.trackNetworkStatus()
              }}
              className="flex-1 text-xs"
            >
              Send Metrics
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Floating performance indicator
export function PerformanceIndicator() {
  const [isVisible, setIsVisible] = useState(false)
  const [metrics, setMetrics] = useState({
    memory: 0,
    network: 'unknown',
    performance: 'good'
  })

  useEffect(() => {
    const isDev = process.env.NODE_ENV === 'development'
    if (isDev) {
      setIsVisible(true)
      
      const interval = setInterval(() => {
        const memInfo = analytics.getMemoryInfo()
        const networkInfo = (navigator as any).connection
        
        setMetrics({
          memory: memInfo ? Math.round((memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit) * 100) : 0,
          network: networkInfo?.effectiveType || 'unknown',
          performance: memInfo && memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit > 0.8 ? 'poor' : 'good'
        })
      }, 5000)
      
      return () => clearInterval(interval)
    }
  }, [])

  if (!isVisible) return null

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-black/80 text-white text-xs px-2 py-1 rounded-md flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${
          metrics.performance === 'good' ? 'bg-green-400' : 'bg-red-400'
        }`} />
        <span>MEM: {metrics.memory}%</span>
        <span>NET: {metrics.network}</span>
      </div>
    </div>
  )
}