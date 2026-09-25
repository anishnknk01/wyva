'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { LoadingPage, LoadingSpinner } from '@/components/ui/loading-spinner'
import { Skeleton, TaskCardSkeleton, ProfileSkeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

interface LoadingState {
  id: string
  message: string
  progress?: number
  type: 'page' | 'action' | 'background'
}

interface LoadingContextType {
  loadingStates: LoadingState[]
  startLoading: (id: string, message: string, type?: 'page' | 'action' | 'background') => void
  updateLoading: (id: string, updates: Partial<LoadingState>) => void
  stopLoading: (id: string) => void
  isLoading: (id?: string) => boolean
  clearAll: () => void
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined)

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [loadingStates, setLoadingStates] = useState<LoadingState[]>([])

  const startLoading = useCallback((id: string, message: string, type: 'page' | 'action' | 'background' = 'action') => {
    setLoadingStates(prev => {
      const existing = prev.find(state => state.id === id)
      if (existing) {
        return prev.map(state => 
          state.id === id 
            ? { ...state, message, type }
            : state
        )
      }
      return [...prev, { id, message, type }]
    })
  }, [])

  const updateLoading = useCallback((id: string, updates: Partial<LoadingState>) => {
    setLoadingStates(prev => 
      prev.map(state => 
        state.id === id 
          ? { ...state, ...updates }
          : state
      )
    )
  }, [])

  const stopLoading = useCallback((id: string) => {
    setLoadingStates(prev => prev.filter(state => state.id !== id))
  }, [])

  const isLoading = useCallback((id?: string) => {
    if (id) {
      return loadingStates.some(state => state.id === id)
    }
    return loadingStates.length > 0
  }, [loadingStates])

  const clearAll = useCallback(() => {
    setLoadingStates([])
  }, [])

  return (
    <LoadingContext.Provider value={{
      loadingStates,
      startLoading,
      updateLoading,
      stopLoading,
      isLoading,
      clearAll
    }}>
      {children}
      <GlobalLoadingOverlay />
    </LoadingContext.Provider>
  )
}

export function useLoading() {
  const context = useContext(LoadingContext)
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider')
  }
  return context
}

// Global loading overlay for page-level loading states
function GlobalLoadingOverlay() {
  const { loadingStates } = useLoading()
  
  const pageLoadingState = loadingStates.find(state => state.type === 'page')
  
  if (!pageLoadingState) return null

  return (
    <div className="fixed inset-0 z-50 bg-white/80 backdrop-blur-sm flex items-center justify-center">
      <LoadingPage 
        message={pageLoadingState.message}
        progress={pageLoadingState.progress}
      />
    </div>
  )
}

// Hook for managing async operations with loading states
export function useAsyncOperation() {
  const { startLoading, stopLoading, updateLoading } = useLoading()

  const execute = useCallback(async (
    id: string,
    operation: () => Promise<any>,
    options?: {
      loadingMessage?: string
      successMessage?: string
      errorMessage?: string
      type?: 'page' | 'action' | 'background'
      showProgress?: boolean
    }
  ): Promise<any> => {
    const {
      loadingMessage = 'Processing...',
      successMessage,
      errorMessage,
      type = 'action',
      showProgress = false
    } = options || {}

    try {
      startLoading(id, loadingMessage, type)

      if (showProgress) {
        // Simulate progress for demo
        let progress = 0
        const interval = setInterval(() => {
          progress += 10
          updateLoading(id, { progress })
          if (progress >= 90) {
            clearInterval(interval)
          }
        }, 100)
      }

      const result = await operation()

      if (showProgress) {
        updateLoading(id, { progress: 100 })
        await new Promise(resolve => setTimeout(resolve, 200))
      }

      stopLoading(id)

      if (successMessage) {
        toast.success(successMessage)
      }

      return result
    } catch (error) {
      stopLoading(id)
      
      const message = error instanceof Error ? error.message : 'Operation failed'
      toast.error(errorMessage || message)
      
      return null
    }
  }, [startLoading, stopLoading, updateLoading])

  return { execute }
}

// Component for inline loading states
interface InlineLoadingProps {
  isLoading: boolean
  children: ReactNode
  skeleton?: ReactNode
  loadingText?: string
  className?: string
}

export function InlineLoading({
  isLoading,
  children,
  skeleton,
  loadingText,
  className
}: InlineLoadingProps) {
  if (isLoading) {
    if (skeleton) {
      return <div className={className}>{skeleton}</div>
    }
    
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <LoadingSpinner className="mr-2" />
        <span className="text-gray-600">{loadingText || 'Loading...'}</span>
      </div>
    )
  }

  return <div className={className}>{children}</div>
}

// Loading states for common scenarios
export function TaskListLoading({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <TaskCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function ProfileLoading() {
  return <ProfileSkeleton />
}

export function ChatLoading({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4 p-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
          <div className={`flex items-start space-x-2 max-w-xs ${i % 2 !== 0 ? 'flex-row-reverse space-x-reverse' : ''}`}>
            <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
            <div className="space-y-2">
              <Skeleton className={`h-4 ${i % 2 === 0 ? 'w-32' : 'w-24'}`} />
              <Skeleton className={`h-4 ${i % 2 === 0 ? 'w-20' : 'w-28'}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function SearchLoading() {
  return (
    <div className="space-y-4">
      {/* Search bar skeleton */}
      <div className="bg-white rounded-lg p-4 shadow-sm border space-y-3">
        <Skeleton className="h-12 w-full rounded-lg" />
        <div className="flex justify-between">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>
      
      {/* Results skeleton */}
      <TaskListLoading />
    </div>
  )
}

// Hook for button loading states
export function useButtonLoading() {
  const [loadingButtons, setLoadingButtons] = useState<Set<string>>(new Set())

  const setLoading = useCallback((buttonId: string, loading: boolean) => {
    setLoadingButtons(prev => {
      const newSet = new Set(prev)
      if (loading) {
        newSet.add(buttonId)
      } else {
        newSet.delete(buttonId)
      }
      return newSet
    })
  }, [])

  const isButtonLoading = useCallback((buttonId: string) => {
    return loadingButtons.has(buttonId)
  }, [loadingButtons])

  return { setLoading, isButtonLoading }
}