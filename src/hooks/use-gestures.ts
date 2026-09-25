'use client'

import { useRef, useEffect, useCallback, useState } from 'react'

export interface GestureConfig {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  onPinchIn?: (scale: number) => void
  onPinchOut?: (scale: number) => void
  onDoubleTap?: () => void
  onLongPress?: () => void
  onPullToRefresh?: () => void
  swipeThreshold?: number
  longPressDelay?: number
  doubleTapDelay?: number
  pinchThreshold?: number
  pullToRefreshThreshold?: number
}

export interface GestureState {
  isGesturing: boolean
  gestureType: string | null
  swipeDirection: 'left' | 'right' | 'up' | 'down' | null
  isPulling: boolean
  pullDistance: number
}

interface TouchPoint {
  x: number
  y: number
  timestamp: number
}

export function useGestures(config: GestureConfig = {}) {
  const elementRef = useRef<HTMLElement>(null)
  const touchStartRef = useRef<TouchPoint | null>(null)
  const touchEndRef = useRef<TouchPoint | null>(null)
  const lastTapRef = useRef<number>(0)
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const initialPinchDistanceRef = useRef<number>(0)
  const pullStartYRef = useRef<number>(0)
  const gestureStateRef = useRef<GestureState>({
    isGesturing: false,
    gestureType: null,
    swipeDirection: null,
    isPulling: false,
    pullDistance: 0
  })

  const {
    swipeThreshold = 50,
    longPressDelay = 500,
    doubleTapDelay = 300,
    pinchThreshold = 0.2,
    pullToRefreshThreshold = 80
  } = config

  // Calculate distance between two points
  const getDistance = useCallback((touch1: Touch, touch2: Touch): number => {
    const dx = touch1.clientX - touch2.clientX
    const dy = touch1.clientY - touch2.clientY
    return Math.sqrt(dx * dx + dy * dy)
  }, [])

  // Handle touch start
  const handleTouchStart = useCallback((event: TouchEvent) => {
    const touch = event.touches[0]
    
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now()
    }

    gestureStateRef.current.isGesturing = true

    // Handle multi-touch (pinch)
    if (event.touches.length === 2) {
      initialPinchDistanceRef.current = getDistance(event.touches[0], event.touches[1])
      gestureStateRef.current.gestureType = 'pinch'
      return
    }

    // Handle pull-to-refresh detection
    if (touch.clientY <= 100 && window.scrollY <= 0) {
      pullStartYRef.current = touch.clientY
      gestureStateRef.current.gestureType = 'pull'
    }

    // Start long press timer
    if (config.onLongPress) {
      longPressTimerRef.current = setTimeout(() => {
        if (gestureStateRef.current.isGesturing) {
          gestureStateRef.current.gestureType = 'longpress'
          config.onLongPress!()
        }
      }, longPressDelay)
    }
  }, [config, longPressDelay, getDistance])

  // Handle touch move
  const handleTouchMove = useCallback((event: TouchEvent) => {
    if (!touchStartRef.current) return

    const touch = event.touches[0]
    
    // Handle pinch gesture
    if (event.touches.length === 2 && gestureStateRef.current.gestureType === 'pinch') {
      const currentDistance = getDistance(event.touches[0], event.touches[1])
      const scale = currentDistance / initialPinchDistanceRef.current
      
      if (Math.abs(scale - 1) > pinchThreshold) {
        if (scale > 1 && config.onPinchOut) {
          config.onPinchOut(scale)
        } else if (scale < 1 && config.onPinchIn) {
          config.onPinchIn(scale)
        }
      }
      return
    }

    // Handle pull-to-refresh
    if (gestureStateRef.current.gestureType === 'pull' && window.scrollY <= 0) {
      const pullDistance = Math.max(0, touch.clientY - pullStartYRef.current)
      gestureStateRef.current.pullDistance = pullDistance
      gestureStateRef.current.isPulling = pullDistance > 0
      
      if (pullDistance > pullToRefreshThreshold && config.onPullToRefresh) {
        // Prevent multiple triggers
        if (!gestureStateRef.current.isPulling) {
          gestureStateRef.current.isPulling = true
          config.onPullToRefresh()
        }
      }
      return
    }

    // Cancel long press if moving too much
    const dx = Math.abs(touch.clientX - touchStartRef.current.x)
    const dy = Math.abs(touch.clientY - touchStartRef.current.y)
    
    if (dx > 10 || dy > 10) {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
        longPressTimerRef.current = null
      }
    }
  }, [config, getDistance, pinchThreshold, pullToRefreshThreshold])

  // Handle touch end
  const handleTouchEnd = useCallback((event: TouchEvent) => {
    if (!touchStartRef.current) return

    const touch = event.changedTouches[0]
    touchEndRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now()
    }

    const dx = touchEndRef.current.x - touchStartRef.current.x
    const dy = touchEndRef.current.y - touchStartRef.current.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    const duration = touchEndRef.current.timestamp - touchStartRef.current.timestamp

    // Clear long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }

    // Handle swipe gestures
    if (distance > swipeThreshold && duration < 500) {
      gestureStateRef.current.gestureType = 'swipe'
      
      if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal swipe
        if (dx > 0) {
          gestureStateRef.current.swipeDirection = 'right'
          config.onSwipeRight?.()
        } else {
          gestureStateRef.current.swipeDirection = 'left'
          config.onSwipeLeft?.()
        }
      } else {
        // Vertical swipe
        if (dy > 0) {
          gestureStateRef.current.swipeDirection = 'down'
          config.onSwipeDown?.()
        } else {
          gestureStateRef.current.swipeDirection = 'up'
          config.onSwipeUp?.()
        }
      }
    }
    // Handle tap gestures
    else if (distance < 10 && duration < 200) {
      const now = Date.now()
      const timeSinceLastTap = now - lastTapRef.current
      
      if (timeSinceLastTap < doubleTapDelay) {
        // Double tap
        gestureStateRef.current.gestureType = 'doubletap'
        config.onDoubleTap?.()
        lastTapRef.current = 0 // Reset to prevent triple tap
      } else {
        // Single tap
        lastTapRef.current = now
      }
    }

    // Reset gesture state
    setTimeout(() => {
      gestureStateRef.current = {
        isGesturing: false,
        gestureType: null,
        swipeDirection: null,
        isPulling: false,
        pullDistance: 0
      }
    }, 100)

    touchStartRef.current = null
    touchEndRef.current = null
  }, [config, swipeThreshold, doubleTapDelay])

  // Prevent default behavior for certain gestures
  const handleTouchPreventDefault = useCallback((event: TouchEvent) => {
    // Prevent zoom on double tap for iOS Safari
    if (event.touches.length > 1) {
      event.preventDefault()
    }
    
    // Prevent pull-to-refresh default behavior
    if (gestureStateRef.current.gestureType === 'pull') {
      event.preventDefault()
    }
  }, [])

  // Set up event listeners
  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    // Add touch event listeners
    element.addEventListener('touchstart', handleTouchStart, { passive: false })
    element.addEventListener('touchmove', handleTouchMove, { passive: false })
    element.addEventListener('touchend', handleTouchEnd, { passive: false })
    element.addEventListener('touchmove', handleTouchPreventDefault, { passive: false })

    // Cleanup
    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
      element.removeEventListener('touchmove', handleTouchPreventDefault)
      
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
      }
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, handleTouchPreventDefault])

  return {
    ref: elementRef,
    gestureState: gestureStateRef.current
  }
}

// Hook for pull-to-refresh functionality
export function usePullToRefresh(onRefresh: () => Promise<void> | void) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  const handlePullToRefresh = useCallback(async () => {
    if (isRefreshing) return
    
    setIsRefreshing(true)
    try {
      await onRefresh()
    } finally {
      setIsRefreshing(false)
    }
  }, [onRefresh, isRefreshing])

  const { ref } = useGestures({
    onPullToRefresh: handlePullToRefresh,
    pullToRefreshThreshold: 80
  })

  return {
    ref,
    isRefreshing
  }
}

// Hook for swipe navigation
export function useSwipeNavigation(onSwipeLeft?: () => void, onSwipeRight?: () => void) {
  return useGestures({
    onSwipeLeft,
    onSwipeRight,
    swipeThreshold: 100
  })
}