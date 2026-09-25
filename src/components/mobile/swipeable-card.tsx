'use client'

import React, { useState, useRef, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronRight, Heart, MessageSquare, Star, Trash2 } from 'lucide-react'

export interface SwipeAction {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  color: 'red' | 'green' | 'blue' | 'yellow' | 'purple'
  side: 'left' | 'right'
  onAction: () => void
}

interface SwipeableCardProps {
  children: React.ReactNode
  actions?: SwipeAction[]
  className?: string
  swipeThreshold?: number
  onSwipe?: (actionId: string) => void
  disabled?: boolean
}

const colorClasses = {
  red: 'bg-red-500 text-white',
  green: 'bg-green-500 text-white',
  blue: 'bg-blue-500 text-white',
  yellow: 'bg-yellow-500 text-white',
  purple: 'bg-purple-500 text-white'
}

export function SwipeableCard({
  children,
  actions = [],
  className,
  swipeThreshold = 80,
  onSwipe,
  disabled = false
}: SwipeableCardProps) {
  const [translateX, setTranslateX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const startXRef = useRef(0)
  const currentXRef = useRef(0)

  const leftActions = actions.filter(action => action.side === 'left')
  const rightActions = actions.filter(action => action.side === 'right')

  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    if (disabled) return
    
    const touch = event.touches[0]
    startXRef.current = touch.clientX
    currentXRef.current = translateX
    setIsDragging(true)
  }, [disabled, translateX])

  const handleTouchMove = useCallback((event: React.TouchEvent) => {
    if (disabled || !isDragging) return
    
    const touch = event.touches[0]
    const deltaX = touch.clientX - startXRef.current
    const newTranslateX = currentXRef.current + deltaX
    
    // Limit swipe distance
    const maxSwipe = 200
    const clampedTranslateX = Math.max(-maxSwipe, Math.min(maxSwipe, newTranslateX))
    
    setTranslateX(clampedTranslateX)
    
    // Show actions when threshold is reached
    const shouldShowActions = Math.abs(clampedTranslateX) > swipeThreshold
    if (shouldShowActions !== showActions) {
      setShowActions(shouldShowActions)
    }
  }, [disabled, isDragging, swipeThreshold, showActions])

  const handleTouchEnd = useCallback(() => {
    if (disabled) return
    
    setIsDragging(false)
    
    // Determine if action should be triggered
    const absTranslateX = Math.abs(translateX)
    
    if (absTranslateX > swipeThreshold) {
      // Find the action to trigger
      const actionsToCheck = translateX > 0 ? leftActions : rightActions
      
      if (actionsToCheck.length > 0) {
        const actionIndex = Math.floor((absTranslateX - swipeThreshold) / (swipeThreshold / 2))
        const targetAction = actionsToCheck[Math.min(actionIndex, actionsToCheck.length - 1)]
        
        if (targetAction) {
          onSwipe?.(targetAction.id)
          targetAction.onAction()
        }
      }
    }
    
    // Reset position
    setTranslateX(0)
    setShowActions(false)
  }, [disabled, translateX, swipeThreshold, leftActions, rightActions, onSwipe])

  const handleMouseStart = useCallback((event: React.MouseEvent) => {
    if (disabled) return
    
    startXRef.current = event.clientX
    currentXRef.current = translateX
    setIsDragging(true)
  }, [disabled, translateX])

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (disabled || !isDragging) return
    
    const deltaX = event.clientX - startXRef.current
    const newTranslateX = currentXRef.current + deltaX
    
    const maxSwipe = 200
    const clampedTranslateX = Math.max(-maxSwipe, Math.min(maxSwipe, newTranslateX))
    
    setTranslateX(clampedTranslateX)
    
    const shouldShowActions = Math.abs(clampedTranslateX) > swipeThreshold
    if (shouldShowActions !== showActions) {
      setShowActions(shouldShowActions)
    }
  }, [disabled, isDragging, swipeThreshold, showActions])

  const handleMouseEnd = useCallback(() => {
    if (disabled) return
    
    handleTouchEnd()
  }, [disabled, handleTouchEnd])

  const renderActions = (actionsToRender: SwipeAction[], side: 'left' | 'right') => {
    if (actionsToRender.length === 0) return null
    
    const isVisible = showActions && ((side === 'left' && translateX > 0) || (side === 'right' && translateX < 0))
    
    return (
      <div
        className={`absolute top-0 bottom-0 flex items-center ${
          side === 'left' ? 'left-0' : 'right-0'
        } transition-opacity duration-200 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          width: Math.abs(translateX),
          zIndex: 0
        }}
      >
        <div className={`flex ${side === 'left' ? 'justify-start pl-4' : 'justify-end pr-4'} gap-2`}>
          {actionsToRender.map((action) => {
            const Icon = action.icon
            return (
              <Button
                key={action.id}
                size="sm"
                className={`${colorClasses[action.color]} rounded-full p-2 min-w-[40px] h-[40px]`}
                onClick={(e) => {
                  e.stopPropagation()
                  action.onAction()
                }}
              >
                <Icon className="h-4 w-4" />
                <span className="sr-only">{action.label}</span>
              </Button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Left actions */}
      {renderActions(leftActions, 'left')}
      
      {/* Right actions */}
      {renderActions(rightActions, 'right')}
      
      {/* Main card */}
      <div
        ref={cardRef}
        className={`relative z-10 transition-transform duration-200 ${
          isDragging ? '' : 'ease-out'
        } ${disabled ? 'pointer-events-none' : 'cursor-grab active:cursor-grabbing'}`}
        style={{
          transform: `translateX(${translateX}px)`,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseStart}
        onMouseMove={isDragging ? handleMouseMove : undefined}
        onMouseUp={handleMouseEnd}
        onMouseLeave={handleMouseEnd}
      >
        <Card className="shadow-sm">
          {children}
        </Card>
      </div>
      
      {/* Swipe hint */}
      {!isDragging && actions.length > 0 && (
        <div className="absolute top-1/2 right-4 transform -translate-y-1/2 z-20 pointer-events-none">
          <ChevronRight className="h-4 w-4 text-gray-400 animate-pulse" />
        </div>
      )}
    </div>
  )
}

// Predefined action sets for common use cases
export const taskCardActions = {
  favorite: {
    id: 'favorite',
    label: 'Favorite',
    icon: Heart,
    color: 'red' as const,
    side: 'right' as const,
    onAction: () => console.log('Favorited')
  },
  message: {
    id: 'message',
    label: 'Message',
    icon: MessageSquare,
    color: 'blue' as const,
    side: 'right' as const,
    onAction: () => console.log('Message')
  },
  rate: {
    id: 'rate',
    label: 'Rate',
    icon: Star,
    color: 'yellow' as const,
    side: 'left' as const,
    onAction: () => console.log('Rate')
  },
  delete: {
    id: 'delete',
    label: 'Delete',
    icon: Trash2,
    color: 'red' as const,
    side: 'left' as const,
    onAction: () => console.log('Delete')
  }
}

// Usage example component
export function TaskSwipeCard({ 
  task, 
  onFavorite, 
  onMessage, 
  onDelete,
  children 
}: {
  task: any
  onFavorite?: () => void
  onMessage?: () => void
  onDelete?: () => void
  children: React.ReactNode
}) {
  const actions: SwipeAction[] = [
    onFavorite && {
      ...taskCardActions.favorite,
      onAction: onFavorite
    },
    onMessage && {
      ...taskCardActions.message,
      onAction: onMessage
    },
    onDelete && {
      ...taskCardActions.delete,
      onAction: onDelete
    }
  ].filter(Boolean) as SwipeAction[]

  return (
    <SwipeableCard 
      actions={actions}
      onSwipe={(actionId) => {
        // Haptic feedback if available
        if ('vibrate' in navigator) {
          navigator.vibrate(50)
        }
      }}
    >
      {children}
    </SwipeableCard>
  )
}