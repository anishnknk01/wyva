'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { RefreshCw, ArrowDown } from 'lucide-react'

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void
  children: React.ReactNode
  threshold?: number
  className?: string
  disabled?: boolean
  refreshingText?: string
  pullText?: string
  releaseText?: string
}

export function PullToRefresh({
  onRefresh,
  children,
  threshold = 80,
  className = '',
  disabled = false,
  refreshingText = 'Refreshing...',
  pullText = 'Pull to refresh',
  releaseText = 'Release to refresh'
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isPulling, setIsPulling] = useState(false)
  const [canPull, setCanPull] = useState(false)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const startYRef = useRef(0)
  const currentYRef = useRef(0)
  const lastScrollYRef = useRef(0)

  // Check if we can pull (at top of scroll)
  const checkCanPull = useCallback(() => {
    if (!containerRef.current) return false
    
    const scrollTop = containerRef.current.scrollTop
    const canPullNow = scrollTop <= 0 && !disabled
    setCanPull(canPullNow)
    return canPullNow
  }, [disabled])

  // Handle scroll events to determine if we can pull
  const handleScroll = useCallback(() => {
    checkCanPull()
  }, [checkCanPull])

  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    if (!checkCanPull()) return
    
    const touch = event.touches[0]
    startYRef.current = touch.clientY
    currentYRef.current = 0
    lastScrollYRef.current = containerRef.current?.scrollTop || 0
  }, [checkCanPull])

  const handleTouchMove = useCallback((event: React.TouchEvent) => {
    if (!canPull || isRefreshing) return
    
    const touch = event.touches[0]
    const deltaY = touch.clientY - startYRef.current
    
    // Only handle downward movement when at the top
    if (deltaY > 0 && (containerRef.current?.scrollTop || 0) <= 0) {
      event.preventDefault() // Prevent default scroll behavior
      
      // Apply resistance curve (gets harder to pull the further you go)
      const resistance = Math.max(0, 1 - (deltaY / (threshold * 3)))
      const adjustedDelta = deltaY * resistance
      
      setPullDistance(Math.min(adjustedDelta, threshold * 1.5))
      setIsPulling(adjustedDelta > 10)
      currentYRef.current = adjustedDelta
    }
  }, [canPull, isRefreshing, threshold])

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling || isRefreshing) {
      setPullDistance(0)
      setIsPulling(false)
      return
    }
    
    if (pullDistance >= threshold) {
      setIsRefreshing(true)
      
      try {
        // Add haptic feedback if available
        if ('vibrate' in navigator) {
          navigator.vibrate(100)
        }
        
        await onRefresh()
      } catch (error) {
        console.error('Refresh failed:', error)
      } finally {
        setIsRefreshing(false)
      }
    }
    
    setPullDistance(0)
    setIsPulling(false)
  }, [isPulling, isRefreshing, pullDistance, threshold, onRefresh])

  // Reset state when disabled
  useEffect(() => {
    if (disabled) {
      setPullDistance(0)
      setIsPulling(false)
      setIsRefreshing(false)
    }
  }, [disabled])

  // Calculate pull progress
  const pullProgress = Math.min(pullDistance / threshold, 1)
  const shouldShowIcon = pullDistance > 20
  const shouldRelease = pullDistance >= threshold && !isRefreshing

  return (
    <div
      ref={containerRef}
      className={`relative overflow-auto ${className}`}
      onScroll={handleScroll}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: `translateY(${isRefreshing ? threshold : pullDistance}px)`,
        transition: isPulling ? 'none' : 'transform 0.3s ease-out'
      }}
    >
      {/* Pull to refresh indicator */}
      <div
        className={`absolute top-0 left-0 right-0 flex items-center justify-center transition-opacity duration-200 ${
          shouldShowIcon ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          height: `${threshold}px`,
          transform: `translateY(-${threshold}px)`,
          background: 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,1) 100%)'
        }}
      >
        <div className="flex flex-col items-center space-y-1">
          {/* Refresh icon */}
          <div
            className={`transition-transform duration-200 ${
              isRefreshing ? 'animate-spin' : ''
            }`}
            style={{
              transform: `rotate(${shouldRelease && !isRefreshing ? '180deg' : '0deg'})`
            }}
          >
            {isRefreshing ? (
              <RefreshCw className="h-5 w-5 text-gray-600" />
            ) : (
              <ArrowDown className="h-5 w-5 text-gray-600" />
            )}
          </div>
          
          {/* Status text */}
          <span className="text-xs text-gray-600 font-medium">
            {isRefreshing
              ? refreshingText
              : shouldRelease
              ? releaseText
              : pullText
            }
          </span>
          
          {/* Progress indicator */}
          <div className="w-8 h-1 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-500 transition-all duration-150"
              style={{ width: `${pullProgress * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="min-h-full">
        {children}
      </div>
    </div>
  )
}

// Simplified hook version for easier integration
export function usePullToRefresh(onRefresh: () => Promise<void> | void) {
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return
    
    setIsRefreshing(true)
    try {
      await onRefresh()
    } finally {
      setTimeout(() => {
        setIsRefreshing(false)
      }, 500) // Minimum refresh time for better UX
    }
  }, [onRefresh, isRefreshing])

  return {
    isRefreshing,
    refreshProps: {
      onRefresh: handleRefresh
    }
  }
}