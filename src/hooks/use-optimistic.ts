'use client'

import { useState, useCallback, useRef } from 'react'
import { toast } from 'sonner'

export interface OptimisticState<T> {
  data: T
  isOptimistic: boolean
  isPending: boolean
  error: Error | null
}

export interface OptimisticUpdate<T> {
  id: string | number
  type: 'create' | 'update' | 'delete'
  payload: Partial<T>
  rollback?: () => void
}

export function useOptimistic<T>(
  initialData: T,
  options?: {
    onSuccess?: (data: T) => void
    onError?: (error: Error) => void
    showToasts?: boolean
  }
) {
  const [state, setState] = useState<OptimisticState<T>>({
    data: initialData,
    isOptimistic: false,
    isPending: false,
    error: null
  })
  
  const rollbackRef = useRef<(() => void) | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const updateOptimistically = useCallback(
    (updater: (current: T) => T, rollbackFn?: () => void) => {
      const previousData = state.data
      const optimisticData = updater(previousData)
      
      // Store rollback function
      rollbackRef.current = rollbackFn || (() => {
        setState(prev => ({
          ...prev,
          data: previousData,
          isOptimistic: false,
          error: new Error('Operation failed')
        }))
      })

      // Apply optimistic update
      setState(prev => ({
        ...prev,
        data: optimisticData,
        isOptimistic: true,
        isPending: true,
        error: null
      }))

      // Auto-rollback after timeout (30 seconds)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      
      timeoutRef.current = setTimeout(() => {
        if (state.isOptimistic) {
          rollbackRef.current?.()
          if (options?.showToasts) {
            toast.error('Operation timed out')
          }
        }
      }, 30000)

      return optimisticData
    },
    [state.data, options?.showToasts]
  )

  const confirmUpdate = useCallback((finalData: T) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    
    setState({
      data: finalData,
      isOptimistic: false,
      isPending: false,
      error: null
    })
    
    options?.onSuccess?.(finalData)
    rollbackRef.current = null
  }, [options])

  const rollback = useCallback((error?: Error) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    
    const errorInstance = error || new Error('Operation failed')
    
    if (rollbackRef.current) {
      rollbackRef.current()
      rollbackRef.current = null
    } else {
      setState(prev => ({
        ...prev,
        isOptimistic: false,
        isPending: false,
        error: errorInstance
      }))
    }
    
    options?.onError?.(errorInstance)
    
    if (options?.showToasts) {
      toast.error(errorInstance.message || 'Operation failed')
    }
  }, [options])

  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    
    setState({
      data: initialData,
      isOptimistic: false,
      isPending: false,
      error: null
    })
    
    rollbackRef.current = null
  }, [initialData])

  return {
    state,
    updateOptimistically,
    confirmUpdate,
    rollback,
    reset
  }
}

// Hook for optimistic lists (arrays)
export function useOptimisticList<T extends { id: string | number }>(
  initialItems: T[],
  options?: {
    onSuccess?: (items: T[]) => void
    onError?: (error: Error) => void
    showToasts?: boolean
  }
) {
  const {
    state,
    updateOptimistically,
    confirmUpdate,
    rollback,
    reset
  } = useOptimistic(initialItems, options)

  const addItem = useCallback(
    (item: T) => {
      return updateOptimistically(
        (items) => [item, ...items],
        () => updateOptimistically((items) => items.filter(i => i.id !== item.id))
      )
    },
    [updateOptimistically]
  )

  const updateItem = useCallback(
    (id: string | number, updates: Partial<T>) => {
      const originalItem = state.data.find(item => item.id === id)
      
      return updateOptimistically(
        (items) => items.map(item => 
          item.id === id ? { ...item, ...updates } : item
        ),
        originalItem ? () => updateOptimistically((items) => 
          items.map(item => item.id === id ? originalItem : item)
        ) : undefined
      )
    },
    [updateOptimistically, state.data]
  )

  const removeItem = useCallback(
    (id: string | number) => {
      const originalItem = state.data.find(item => item.id === id)
      
      return updateOptimistically(
        (items) => items.filter(item => item.id !== id),
        originalItem ? () => updateOptimistically((items) => {
          const index = initialItems.findIndex(item => item.id === id)
          if (index !== -1) {
            const newItems = [...items]
            newItems.splice(index, 0, originalItem)
            return newItems
          }
          return [originalItem, ...items]
        }) : undefined
      )
    },
    [updateOptimistically, state.data, initialItems]
  )

  const moveItem = useCallback(
    (fromIndex: number, toIndex: number) => {
      return updateOptimistically(
        (items) => {
          const newItems = [...items]
          const [movedItem] = newItems.splice(fromIndex, 1)
          newItems.splice(toIndex, 0, movedItem)
          return newItems
        }
      )
    },
    [updateOptimistically]
  )

  return {
    items: state.data,
    isOptimistic: state.isOptimistic,
    isPending: state.isPending,
    error: state.error,
    addItem,
    updateItem,
    removeItem,
    moveItem,
    confirmUpdate,
    rollback,
    reset
  }
}

// Hook for optimistic actions with loading states
export function useOptimisticAction<TArgs extends any[], TResult>(
  action: (...args: TArgs) => Promise<TResult>,
  options?: {
    onSuccess?: (result: TResult) => void
    onError?: (error: Error) => void
    showToasts?: boolean
    successMessage?: string
    errorMessage?: string
  }
) {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const execute = useCallback(
    async (...args: TArgs): Promise<TResult | null> => {
      setIsPending(true)
      setError(null)

      try {
        const result = await action(...args)
        
        options?.onSuccess?.(result)
        
        if (options?.showToasts && options?.successMessage) {
          toast.success(options.successMessage)
        }
        
        return result
      } catch (error) {
        const errorInstance = error instanceof Error ? error : new Error('Action failed')
        setError(errorInstance)
        
        options?.onError?.(errorInstance)
        
        if (options?.showToasts) {
          toast.error(options?.errorMessage || errorInstance.message || 'Action failed')
        }
        
        return null
      } finally {
        setIsPending(false)
      }
    },
    [action, options]
  )

  const reset = useCallback(() => {
    setError(null)
    setIsPending(false)
  }, [])

  return {
    execute,
    isPending,
    error,
    reset
  }
}