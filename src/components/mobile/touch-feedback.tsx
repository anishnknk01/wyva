'use client'

import React, { useState, useRef, useCallback } from 'react'

interface TouchRipple {
  id: string
  x: number
  y: number
  startTime: number
}

interface TouchFeedbackProps {
  children: React.ReactNode
  className?: string
  disabled?: boolean
  rippleColor?: string
  rippleDuration?: number
  scaleOnPress?: boolean
  hapticFeedback?: boolean
  onClick?: (event: React.MouseEvent | React.TouchEvent) => void
}

export function TouchFeedback({
  children,
  className = '',
  disabled = false,
  rippleColor = 'rgba(0, 0, 0, 0.1)',
  rippleDuration = 600,
  scaleOnPress = true,
  hapticFeedback = true,
  onClick
}: TouchFeedbackProps) {
  const [ripples, setRipples] = useState<TouchRipple[]>([])
  const [isPressed, setIsPressed] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const createRipple = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    if (disabled || !containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    
    let clientX: number
    let clientY: number
    
    if ('touches' in event && event.touches.length > 0) {
      clientX = event.touches[0].clientX
      clientY = event.touches[0].clientY
    } else if ('clientX' in event) {
      clientX = event.clientX
      clientY = event.clientY
    } else {
      return
    }
    
    const x = clientX - rect.left
    const y = clientY - rect.top
    
    const newRipple: TouchRipple = {
      id: `ripple-${Date.now()}-${Math.random()}`,
      x,
      y,
      startTime: Date.now()
    }
    
    setRipples(prev => [...prev, newRipple])
    
    // Remove ripple after animation completes
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id))
    }, rippleDuration)
    
    // Haptic feedback
    if (hapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate(10)
    }
  }, [disabled, rippleDuration, hapticFeedback])

  const handleInteractionStart = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return
    
    setIsPressed(true)
    createRipple(event)
  }, [disabled, createRipple])

  const handleInteractionEnd = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    setIsPressed(false)
    onClick?.(event)
  }, [onClick])

  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    handleInteractionStart(event)
  }, [handleInteractionStart])

  const handleTouchEnd = useCallback((event: React.TouchEvent) => {
    handleInteractionEnd(event)
  }, [handleInteractionEnd])

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    // Only handle mouse events if not on touch device
    if ('ontouchstart' in window) return
    handleInteractionStart(event)
  }, [handleInteractionStart])

  const handleMouseUp = useCallback((event: React.MouseEvent) => {
    if ('ontouchstart' in window) return
    handleInteractionEnd(event)
  }, [handleInteractionEnd])

  const handleMouseLeave = useCallback(() => {
    setIsPressed(false)
  }, [])

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden select-none transition-transform duration-75 ${
        scaleOnPress && isPressed && !disabled ? 'scale-95' : 'scale-100'
      } ${disabled ? 'pointer-events-none opacity-60' : 'cursor-pointer'} ${className}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      
      {/* Ripple effects */}
      {ripples.map((ripple) => (
        <RippleEffect
          key={ripple.id}
          x={ripple.x}
          y={ripple.y}
          color={rippleColor}
          duration={rippleDuration}
          startTime={ripple.startTime}
        />
      ))}
    </div>
  )
}

interface RippleEffectProps {
  x: number
  y: number
  color: string
  duration: number
  startTime: number
}

function RippleEffect({ x, y, color, duration }: RippleEffectProps) {
  return (
    <div
      className="absolute pointer-events-none animate-ping"
      style={{
        left: x - 10,
        top: y - 10,
        width: 20,
        height: 20,
        backgroundColor: color,
        borderRadius: '50%',
        animationDuration: `${duration}ms`,
        animationFillMode: 'forwards'
      }}
    />
  )
}

// Enhanced button with touch feedback
export function TouchButton({
  children,
  onClick,
  className = '',
  variant = 'default',
  size = 'default',
  disabled = false,
  ...props
}: {
  children: React.ReactNode
  onClick?: () => void
  className?: string
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'default' | 'lg'
  disabled?: boolean
} & React.HTMLAttributes<HTMLButtonElement>) {
  
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'
  
  const variantClasses = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    primary: 'bg-teal-600 text-white hover:bg-teal-700',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
    ghost: 'hover:bg-accent hover:text-accent-foreground'
  }
  
  const sizeClasses = {
    sm: 'h-9 px-3 text-sm',
    default: 'h-10 px-4 py-2',
    lg: 'h-11 px-8'
  }

  return (
    <TouchFeedback
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      rippleColor={variant === 'primary' ? 'rgba(255, 255, 255, 0.3)' : undefined}
      {...props}
    >
      {children}
    </TouchFeedback>
  )
}

// Enhanced card with touch feedback
export function TouchCard({
  children,
  onClick,
  className = '',
  disabled = false,
  ...props
}: {
  children: React.ReactNode
  onClick?: () => void
  className?: string
  disabled?: boolean
} & React.HTMLAttributes<HTMLDivElement>) {
  
  return (
    <TouchFeedback
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`}
      scaleOnPress={true}
      {...props}
    >
      {children}
    </TouchFeedback>
  )
}