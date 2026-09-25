'use client'

export interface AnalyticsEvent {
  name: string
  properties?: Record<string, any>
  userId?: string
  sessionId?: string
  timestamp?: number
  category?: 'user_action' | 'navigation' | 'performance' | 'error' | 'business'
}

export interface PerformanceMetric {
  name: string
  value: number
  unit: 'ms' | 'bytes' | 'count' | 'percentage'
  timestamp?: number
  context?: Record<string, any>
}

export interface UserSession {
  sessionId: string
  userId?: string
  deviceInfo: {
    userAgent: string
    screen: { width: number; height: number }
    connection?: string
    platform: string
  }
  startTime: number
  lastActivity: number
  pageViews: string[]
  events: AnalyticsEvent[]
}

class AnalyticsManager {
  private events: AnalyticsEvent[] = []
  private session: UserSession | null = null
  private performanceObserver: PerformanceObserver | null = null
  private isEnabled: boolean = true
  private batchSize: number = 10
  private flushInterval: number = 30000 // 30 seconds
  private flushTimer: NodeJS.Timeout | null = null

  constructor() {
    if (typeof window !== 'undefined') {
      this.initSession()
      this.setupPerformanceMonitoring()
      this.setupPageVisibility()
      this.startFlushTimer()
    }
  }

  private initSession() {
    if (typeof window === 'undefined') return

    const sessionId = this.generateSessionId()
    
    this.session = {
      sessionId,
      deviceInfo: {
        userAgent: navigator.userAgent,
        screen: {
          width: window.screen.width,
          height: window.screen.height
        },
        connection: (navigator as any).connection?.effectiveType || 'unknown',
        platform: navigator.platform
      },
      startTime: Date.now(),
      lastActivity: Date.now(),
      pageViews: [window.location.pathname],
      events: []
    }

    // Track initial page load
    this.track('page_view', {
      path: window.location.pathname,
      referrer: document.referrer,
      loadTime: performance.now()
    }, 'navigation')
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private setupPerformanceMonitoring() {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return

    try {
      // Monitor navigation timing
      this.trackNavigationTiming()
      
      // Monitor resource timing
      this.performanceObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          this.trackPerformanceEntry(entry)
        })
      })

      this.performanceObserver.observe({ 
        entryTypes: ['navigation', 'resource', 'paint', 'largest-contentful-paint', 'layout-shift'] 
      })

      // Monitor Core Web Vitals
      this.setupCoreWebVitals()
    } catch (error) {
      console.warn('Performance monitoring setup failed:', error)
    }
  }

  private trackNavigationTiming() {
    if (typeof window === 'undefined') return

    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        
        if (navigation) {
          this.trackMetric('page_load_time', navigation.loadEventEnd - navigation.navigationStart, 'ms')
          this.trackMetric('dom_content_loaded', navigation.domContentLoadedEventEnd - navigation.navigationStart, 'ms')
          this.trackMetric('first_byte', navigation.responseStart - navigation.navigationStart, 'ms')
          this.trackMetric('dom_interactive', navigation.domInteractive - navigation.navigationStart, 'ms')
        }
      }, 0)
    })
  }

  private trackPerformanceEntry(entry: PerformanceEntry) {
    switch (entry.entryType) {
      case 'paint':
        if (entry.name === 'first-paint') {
          this.trackMetric('first_paint', entry.startTime, 'ms')
        } else if (entry.name === 'first-contentful-paint') {
          this.trackMetric('first_contentful_paint', entry.startTime, 'ms')
        }
        break
        
      case 'largest-contentful-paint':
        this.trackMetric('largest_contentful_paint', entry.startTime, 'ms')
        break
        
      case 'layout-shift':
        const cls = entry as any
        if (!cls.hadRecentInput) {
          this.trackMetric('cumulative_layout_shift', cls.value, 'count')
        }
        break
        
      case 'resource':
        const resource = entry as PerformanceResourceTiming
        if (resource.duration > 1000) { // Track slow resources
          this.trackMetric('slow_resource_load', resource.duration, 'ms', {
            name: resource.name,
            type: resource.initiatorType
          })
        }
        break
    }
  }

  private setupCoreWebVitals() {
    // First Input Delay (FID)
    if ('PerformanceEventTiming' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.name === 'first-input') {
            const fid = entry.processingStart - entry.startTime
            this.trackMetric('first_input_delay', fid, 'ms')
          }
        })
      })
      
      try {
        observer.observe({ type: 'first-input', buffered: true })
      } catch (e) {
        // Fallback for browsers that don't support first-input
      }
    }
  }

  private setupPageVisibility() {
    if (typeof document === 'undefined') return

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.track('page_hidden', {
          timeOnPage: Date.now() - (this.session?.lastActivity || Date.now())
        }, 'navigation')
        this.flush() // Send events before page becomes hidden
      } else {
        this.track('page_visible', {}, 'navigation')
        this.updateLastActivity()
      }
    })

    // Track beforeunload
    window.addEventListener('beforeunload', () => {
      this.flush()
    })
  }

  private startFlushTimer() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
    }
    
    this.flushTimer = setInterval(() => {
      this.flush()
    }, this.flushInterval)
  }

  private updateLastActivity() {
    if (this.session) {
      this.session.lastActivity = Date.now()
    }
  }

  // Public API
  track(eventName: string, properties: Record<string, any> = {}, category: AnalyticsEvent['category'] = 'user_action') {
    if (!this.isEnabled || !this.session) return

    const event: AnalyticsEvent = {
      name: eventName,
      properties: {
        ...properties,
        sessionId: this.session.sessionId,
        path: typeof window !== 'undefined' ? window.location.pathname : undefined
      },
      sessionId: this.session.sessionId,
      timestamp: Date.now(),
      category
    }

    this.events.push(event)
    this.session.events.push(event)
    this.updateLastActivity()

    // Auto-flush if batch size reached
    if (this.events.length >= this.batchSize) {
      this.flush()
    }
  }

  trackMetric(name: string, value: number, unit: PerformanceMetric['unit'], context?: Record<string, any>) {
    this.track('performance_metric', {
      metricName: name,
      value,
      unit,
      context
    }, 'performance')
  }

  trackError(error: Error, context?: Record<string, any>) {
    this.track('error', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      context
    }, 'error')
  }

  trackPageView(path: string, additionalData?: Record<string, any>) {
    if (this.session && !this.session.pageViews.includes(path)) {
      this.session.pageViews.push(path)
    }

    this.track('page_view', {
      path,
      referrer: typeof document !== 'undefined' ? document.referrer : undefined,
      ...additionalData
    }, 'navigation')
  }

  trackUserAction(action: string, element?: string, additionalData?: Record<string, any>) {
    this.track('user_action', {
      action,
      element,
      ...additionalData
    }, 'user_action')
  }

  trackBusinessEvent(event: string, data?: Record<string, any>) {
    this.track(event, data, 'business')
  }

  setUserId(userId: string) {
    if (this.session) {
      this.session.userId = userId
    }

    this.track('user_identified', { userId }, 'user_action')
  }

  // Memory and performance utilities
  getMemoryInfo() {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit
      }
    }
    return null
  }

  trackMemoryUsage() {
    const memInfo = this.getMemoryInfo()
    if (memInfo) {
      this.trackMetric('memory_used', memInfo.usedJSHeapSize, 'bytes')
      this.trackMetric('memory_total', memInfo.totalJSHeapSize, 'bytes')
      this.trackMetric('memory_limit', memInfo.jsHeapSizeLimit, 'bytes')
    }
  }

  // Network monitoring
  trackNetworkStatus() {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const connection = (navigator as any).connection
      this.track('network_info', {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData
      }, 'performance')
    }
  }

  private async flush() {
    if (this.events.length === 0) return

    const eventsToSend = [...this.events]
    this.events = []

    try {
      // Send to analytics endpoint
      await this.sendEvents(eventsToSend)
    } catch (error) {
      console.warn('Failed to send analytics events:', error)
      // Add events back to queue for retry
      this.events.unshift(...eventsToSend.slice(0, 5)) // Only retry first 5 events
    }
  }

  private async sendEvents(events: AnalyticsEvent[]) {
    if (typeof window === 'undefined') return

    const payload = {
      events,
      session: this.session,
      timestamp: Date.now()
    }

    // Use sendBeacon if available (for page unload scenarios)
    if (navigator.sendBeacon && document.visibilityState === 'hidden') {
      navigator.sendBeacon('/api/analytics', JSON.stringify(payload))
      return
    }

    // Regular fetch for normal scenarios
    await fetch('/api/analytics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
  }

  // Feature usage tracking
  trackFeatureUsage(feature: string, action: string = 'used', metadata?: Record<string, any>) {
    this.track('feature_usage', {
      feature,
      action,
      ...metadata
    }, 'user_action')
  }

  // Conversion funnel tracking
  trackFunnelStep(funnel: string, step: string, metadata?: Record<string, any>) {
    this.track('funnel_step', {
      funnel,
      step,
      ...metadata
    }, 'business')
  }

  // A/B testing support
  trackExperiment(experimentId: string, variant: string, metadata?: Record<string, any>) {
    this.track('experiment_exposure', {
      experimentId,
      variant,
      ...metadata
    }, 'user_action')
  }

  // Public control methods
  enable() {
    this.isEnabled = true
  }

  disable() {
    this.isEnabled = false
  }

  destroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
    }
    
    if (this.performanceObserver) {
      this.performanceObserver.disconnect()
    }
    
    this.flush() // Send remaining events
  }
}

// Singleton instance
const analytics = new AnalyticsManager()

export { analytics }

// React hooks for analytics
export function useAnalytics() {
  return {
    track: analytics.track.bind(analytics),
    trackPageView: analytics.trackPageView.bind(analytics),
    trackUserAction: analytics.trackUserAction.bind(analytics),
    trackBusinessEvent: analytics.trackBusinessEvent.bind(analytics),
    trackError: analytics.trackError.bind(analytics),
    trackFeatureUsage: analytics.trackFeatureUsage.bind(analytics),
    trackFunnelStep: analytics.trackFunnelStep.bind(analytics),
    trackExperiment: analytics.trackExperiment.bind(analytics),
    setUserId: analytics.setUserId.bind(analytics)
  }
}