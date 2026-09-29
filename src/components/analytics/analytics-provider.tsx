'use client'

import React, { createContext, useContext, useEffect, ReactNode } from 'react'
import { usePageTracking } from '@/hooks/use-analytics-tracking'
import { analytics } from '@/lib/analytics'

interface AnalyticsContextType {
  isEnabled: boolean
  enableAnalytics: () => void
  disableAnalytics: () => void
}

const AnalyticsContext = createContext<AnalyticsContextType>({
  isEnabled: true,
  enableAnalytics: () => {},
  disableAnalytics: () => {}
})

export function useAnalyticsContext() {
  return useContext(AnalyticsContext)
}

interface AnalyticsProviderProps {
  children: ReactNode
  userId?: string
  enableByDefault?: boolean
}

export function AnalyticsProvider({ 
  children, 
  userId, 
  enableByDefault = true 
}: AnalyticsProviderProps) {
  const [isEnabled, setIsEnabled] = React.useState(enableByDefault)

  // Set up automatic page tracking
  usePageTracking()

  // Set user ID when available
  useEffect(() => {
    if (userId && isEnabled) {
      analytics.setUserId(userId)
    }
  }, [userId, isEnabled])

  // Track app lifecycle events
  useEffect(() => {
    if (!isEnabled) return

    const handleAppStart = () => {
      analytics.track('app_start', {
        timestamp: Date.now(),
        userAgent: navigator.userAgent
      }, 'user_action')
    }

    const handleAppBackground = () => {
      analytics.track('app_background', {
        timestamp: Date.now()
      }, 'user_action')
    }

    const handleAppForeground = () => {
      analytics.track('app_foreground', {
        timestamp: Date.now()
      }, 'user_action')
    }

    // Initial app start
    handleAppStart()

    // Listen for visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        handleAppBackground()
      } else {
        handleAppForeground()
      }
    })

    // Track memory usage periodically
    const memoryInterval = setInterval(() => {
      analytics.trackMemoryUsage()
    }, 60000) // Every minute

    // Track network status
    analytics.trackNetworkStatus()
    
    return () => {
      clearInterval(memoryInterval)
    }
  }, [isEnabled])

  const enableAnalytics = () => {
    setIsEnabled(true)
    analytics.enable()
  }

  const disableAnalytics = () => {
    setIsEnabled(false)
    analytics.disable()
  }

  return (
    <AnalyticsContext.Provider value={{
      isEnabled,
      enableAnalytics,
      disableAnalytics
    }}>
      {children}
    </AnalyticsContext.Provider>
  )
}

// HOC for component tracking
export function withAnalytics<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string,
  metadata?: Record<string, any>
) {
  return function AnalyticsWrappedComponent(props: P) {
    useEffect(() => {
      analytics.trackFeatureUsage(componentName, 'rendered', metadata)
    }, [])

    return <Component {...props} />
  }
}

// Component for tracking specific sections
interface AnalyticsSectionProps {
  name: string
  metadata?: Record<string, any>
  children: ReactNode
}

export function AnalyticsSection({ name, metadata, children }: AnalyticsSectionProps) {
  useEffect(() => {
    const startTime = Date.now()
    analytics.trackFeatureUsage(name, 'section_viewed', metadata)

    return () => {
      const timeSpent = Date.now() - startTime
      analytics.trackFeatureUsage(name, 'section_left', { 
        ...metadata, 
        timeSpent 
      })
    }
  }, [name, metadata])

  return <>{children}</>
}

// Component for tracking button clicks
interface AnalyticsButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  trackingName: string
  trackingData?: Record<string, any>
  children: ReactNode
}

export function AnalyticsButton({ 
  trackingName, 
  trackingData, 
  onClick, 
  children, 
  ...props 
}: AnalyticsButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    analytics.trackUserAction('button_click', trackingName, trackingData)
    onClick?.(e)
  }

  return (
    <button onClick={handleClick} {...props}>
      {children}
    </button>
  )
}

// Component for tracking form interactions
interface AnalyticsFormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  formName: string
  children: ReactNode
}

export function AnalyticsForm({ formName, onSubmit, children, ...props }: AnalyticsFormProps) {
  useEffect(() => {
    analytics.trackFeatureUsage(formName, 'form_viewed')
  }, [formName])

  const handleSubmit: React.SubmitEventHandler<HTMLFormElement> = (e) => {
    analytics.trackUserAction('form_submit', formName)
    onSubmit?.(e)
  }

  return (
    <form onSubmit={handleSubmit} {...props}>
      {children}
    </form>
  )
}

// Performance boundary component
interface PerformanceBoundaryProps {
  name: string
  children: ReactNode
}

export function PerformanceBoundary({ name, children }: PerformanceBoundaryProps) {
  const renderStart = React.useRef<number | undefined>(undefined)

  useEffect(() => {
    renderStart.current = performance.now()
  })

  useEffect(() => {
    if (renderStart.current) {
      const renderTime = performance.now() - renderStart.current
      analytics.trackMetric(`${name}_render_time`, renderTime, 'ms')
    }
  })

  return <>{children}</>
}