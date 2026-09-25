'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useAnalytics } from '@/lib/analytics'

// Hook for automatic page view tracking
export function usePageTracking() {
  const pathname = usePathname()
  const { trackPageView } = useAnalytics()
  const previousPath = useRef<string>()

  useEffect(() => {
    // Don't track initial load (already tracked by analytics manager)
    if (previousPath.current && pathname !== previousPath.current) {
      trackPageView(pathname, {
        previousPath: previousPath.current
      })
    }
    previousPath.current = pathname
  }, [pathname, trackPageView])
}

// Hook for component mount/unmount tracking
export function useComponentTracking(componentName: string, metadata?: Record<string, any>) {
  const { trackFeatureUsage } = useAnalytics()
  const startTime = useRef<number>()

  useEffect(() => {
    startTime.current = Date.now()
    trackFeatureUsage(componentName, 'mounted', metadata)

    return () => {
      const timeSpent = startTime.current ? Date.now() - startTime.current : 0
      trackFeatureUsage(componentName, 'unmounted', {
        ...metadata,
        timeSpent
      })
    }
  }, [componentName, trackFeatureUsage, metadata])
}

// Hook for error boundary tracking
export function useErrorTracking() {
  const { trackError } = useAnalytics()

  return {
    captureError: (error: Error, errorInfo?: Record<string, any>) => {
      trackError(error, {
        errorBoundary: true,
        ...errorInfo
      })
    }
  }
}

// Hook for form analytics
export function useFormAnalytics(formName: string) {
  const { trackUserAction, trackFunnelStep } = useAnalytics()

  return {
    trackFormStart: () => {
      trackFunnelStep('form_completion', `${formName}_started`)
      trackUserAction('form_start', formName)
    },
    
    trackFieldFocus: (fieldName: string) => {
      trackUserAction('field_focus', fieldName, { form: formName })
    },
    
    trackFieldBlur: (fieldName: string, hasValue: boolean) => {
      trackUserAction('field_blur', fieldName, { 
        form: formName, 
        hasValue 
      })
    },
    
    trackValidationError: (fieldName: string, errorType: string) => {
      trackUserAction('validation_error', fieldName, { 
        form: formName, 
        errorType 
      })
    },
    
    trackFormSubmit: (isValid: boolean, errors?: string[]) => {
      if (isValid) {
        trackFunnelStep('form_completion', `${formName}_submitted`)
        trackUserAction('form_submit_success', formName)
      } else {
        trackUserAction('form_submit_error', formName, { errors })
      }
    },
    
    trackFormAbandonment: (completedFields: string[]) => {
      trackUserAction('form_abandonment', formName, { 
        completedFields,
        completionRate: completedFields.length 
      })
    }
  }
}

// Hook for search analytics
export function useSearchAnalytics() {
  const { trackUserAction, trackBusinessEvent } = useAnalytics()

  return {
    trackSearchQuery: (query: string, filters?: Record<string, any>) => {
      trackUserAction('search_query', 'search_box', { query, filters })
    },
    
    trackSearchResults: (query: string, resultCount: number, filters?: Record<string, any>) => {
      trackBusinessEvent('search_results', { 
        query, 
        resultCount, 
        filters,
        hasResults: resultCount > 0 
      })
    },
    
    trackSearchResultClick: (query: string, resultIndex: number, itemId: string) => {
      trackUserAction('search_result_click', 'search_result', { 
        query, 
        resultIndex, 
        itemId 
      })
    },
    
    trackFilterUsage: (filterType: string, filterValue: string) => {
      trackUserAction('filter_applied', filterType, { filterValue })
    },
    
    trackVoiceSearchUsage: (query?: string, success?: boolean) => {
      trackFeatureUsage('voice_search', 'used', { query, success })
    }
  }
}

// Hook for task-specific analytics
export function useTaskAnalytics() {
  const { trackBusinessEvent, trackFunnelStep, trackUserAction } = useAnalytics()

  return {
    // Task creation funnel
    trackTaskCreationStart: () => {
      trackFunnelStep('task_creation', 'started')
    },
    
    trackTaskCreationStep: (step: string, data?: Record<string, any>) => {
      trackFunnelStep('task_creation', step, data)
    },
    
    trackTaskCreated: (taskId: string, category: string, budget: number) => {
      trackBusinessEvent('task_created', { taskId, category, budget })
      trackFunnelStep('task_creation', 'completed', { taskId })
    },
    
    trackTaskCreationAbandoned: (step: string, reason?: string) => {
      trackFunnelStep('task_creation', 'abandoned', { step, reason })
    },
    
    // Task interaction
    trackTaskView: (taskId: string, viewType: 'list' | 'detail') => {
      trackUserAction('task_view', viewType, { taskId })
    },
    
    trackTaskInterest: (taskId: string, action: 'add' | 'remove') => {
      trackBusinessEvent('task_interest', { taskId, action })
    },
    
    trackTaskApplication: (taskId: string, success: boolean) => {
      trackBusinessEvent('task_application', { taskId, success })
    },
    
    trackTaskCompletion: (taskId: string, rating?: number) => {
      trackBusinessEvent('task_completed', { taskId, rating })
    },
    
    // Payment tracking
    trackPaymentInitiated: (taskId: string, amount: number, method: string) => {
      trackFunnelStep('payment', 'initiated', { taskId, amount, method })
    },
    
    trackPaymentCompleted: (taskId: string, amount: number, method: string) => {
      trackBusinessEvent('payment_completed', { taskId, amount, method })
      trackFunnelStep('payment', 'completed', { taskId })
    },
    
    trackPaymentFailed: (taskId: string, error: string) => {
      trackFunnelStep('payment', 'failed', { taskId, error })
    }
  }
}

// Hook for user behavior analytics
export function useUserBehaviorAnalytics() {
  const { trackUserAction, trackFeatureUsage } = useAnalytics()

  return {
    trackScroll: (scrollDepth: number, maxScroll: number) => {
      const scrollPercentage = Math.round((scrollDepth / maxScroll) * 100)
      if (scrollPercentage % 25 === 0) { // Track at 25%, 50%, 75%, 100%
        trackUserAction('scroll_depth', 'page', { scrollPercentage })
      }
    },
    
    trackTimeOnPage: (timeSpent: number) => {
      trackUserAction('time_on_page', 'page', { timeSpent })
    },
    
    trackButtonClick: (buttonName: string, context?: string) => {
      trackUserAction('button_click', buttonName, { context })
    },
    
    trackLinkClick: (linkUrl: string, linkText?: string) => {
      trackUserAction('link_click', 'link', { url: linkUrl, text: linkText })
    },
    
    trackFeatureDiscovery: (feature: string, discoveryMethod: string) => {
      trackFeatureUsage(feature, 'discovered', { method: discoveryMethod })
    },
    
    trackGestureUsage: (gestureType: string, element: string) => {
      trackFeatureUsage('gestures', gestureType, { element })
    },
    
    trackOfflineUsage: (action: string, success: boolean) => {
      trackFeatureUsage('offline_mode', action, { success })
    },
    
    trackNotificationInteraction: (action: 'received' | 'clicked' | 'dismissed', type: string) => {
      trackFeatureUsage('notifications', action, { type })
    }
  }
}

// Hook for performance tracking
export function usePerformanceTracking() {
  const { track } = useAnalytics()

  return {
    trackComponentRender: (componentName: string, renderTime: number) => {
      track('component_render', {
        component: componentName,
        renderTime
      }, 'performance')
    },
    
    trackApiCall: (endpoint: string, duration: number, status: number) => {
      track('api_call', {
        endpoint,
        duration,
        status,
        success: status >= 200 && status < 300
      }, 'performance')
    },
    
    trackImageLoad: (imageUrl: string, loadTime: number, success: boolean) => {
      track('image_load', {
        url: imageUrl,
        loadTime,
        success
      }, 'performance')
    }
  }
}