'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useOptimisticAction } from '@/hooks/use-optimistic'
import { 
  CheckCircle2, 
  X, 
  MessageCircle, 
  Heart, 
  Share2, 
  Clock,
  AlertTriangle 
} from 'lucide-react'
import { toast } from 'sonner'
import type { Task } from '@/lib/task-store'

interface OptimisticTaskActionsProps {
  task: Task
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => Promise<void>
  onInterestToggle: (taskId: string, interested: boolean) => Promise<void>
  onFavoriteToggle: (taskId: string, favorited: boolean) => Promise<void>
  className?: string
}

export function OptimisticTaskActions({
  task,
  onTaskUpdate,
  onInterestToggle,
  onFavoriteToggle,
  className
}: OptimisticTaskActionsProps) {
  const [localTask, setLocalTask] = useState(task)
  const [isInterested, setIsInterested] = useState(false)
  const [isFavorited, setIsFavorited] = useState(false)

  const { execute: executeInterest, isPending: interestPending } = useOptimisticAction(
    async (interested: boolean) => {
      // Optimistically update local state
      setIsInterested(interested)
      setLocalTask(prev => ({
        ...prev,
        interestedCount: prev.interestedCount + (interested ? 1 : -1)
      }))
      
      // Perform actual API call
      await onInterestToggle(task.id, interested)
    },
    {
      showToasts: true,
      successMessage: isInterested ? 'Removed from interested' : 'Added to interested',
      onError: () => {
        // Rollback on error
        setIsInterested(!isInterested)
        setLocalTask(task)
      }
    }
  )

  const { execute: executeFavorite, isPending: favoritePending } = useOptimisticAction(
    async (favorited: boolean) => {
      // Optimistically update local state
      setIsFavorited(favorited)
      
      // Perform actual API call
      await onFavoriteToggle(task.id, favorited)
    },
    {
      showToasts: true,
      successMessage: isFavorited ? 'Removed from favorites' : 'Added to favorites',
      onError: () => {
        // Rollback on error
        setIsFavorited(!isFavorited)
      }
    }
  )

  const { execute: executeStatusUpdate, isPending: statusPending } = useOptimisticAction(
    async (newStatus: string) => {
      // Optimistically update local state
      const previousStatus = localTask.status
      setLocalTask(prev => ({ ...prev, status: newStatus as any }))
      
      // Perform actual API call
      await onTaskUpdate(task.id, { status: newStatus })
    },
    {
      showToasts: true,
      successMessage: 'Task status updated',
      onError: () => {
        // Rollback on error
        setLocalTask(task)
      }
    }
  )

  const handleInterestClick = () => {
    executeInterest(!isInterested)
  }

  const handleFavoriteClick = () => {
    executeFavorite(!isFavorited)
  }

  const handleStatusUpdate = (status: string) => {
    executeStatusUpdate(status)
  }

  const canTakeAction = !interestPending && !favoritePending && !statusPending

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Task Status Badge with Optimistic Updates */}
      <div className="flex items-center justify-between">
        <Badge 
          variant={localTask.status === 'completed' ? 'default' : 'outline'}
          className={`
            transition-all duration-200 
            ${localTask.status === 'completed' ? 'bg-green-100 text-green-800' : ''}
            ${localTask.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : ''}
            ${statusPending ? 'opacity-70' : ''}
          `}
        >
          {statusPending && <LoadingSpinner size="sm" className="mr-1" />}
          {localTask.status.replace('_', ' ').toUpperCase()}
        </Badge>
        
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>{localTask.interestedCount} interested</span>
          {(interestPending || favoritePending) && (
            <LoadingSpinner size="sm" />
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant={isInterested ? "default" : "outline"}
          size="sm"
          onClick={handleInterestClick}
          disabled={!canTakeAction}
          className={`
            transition-all duration-200 
            ${isInterested ? 'bg-teal-600 hover:bg-teal-700 text-white' : ''}
            ${interestPending ? 'opacity-70' : ''}
          `}
        >
          {interestPending ? (
            <LoadingSpinner size="sm" className="mr-2" />
          ) : (
            <CheckCircle2 className="h-4 w-4 mr-2" />
          )}
          {isInterested ? 'Interested' : 'Show Interest'}
        </Button>

        <Button
          variant={isFavorited ? "default" : "outline"}
          size="sm"
          onClick={handleFavoriteClick}
          disabled={!canTakeAction}
          className={`
            transition-all duration-200
            ${isFavorited ? 'bg-red-500 hover:bg-red-600 text-white' : ''}
            ${favoritePending ? 'opacity-70' : ''}
          `}
        >
          {favoritePending ? (
            <LoadingSpinner size="sm" className="mr-2" />
          ) : (
            <Heart className={`h-4 w-4 mr-2 ${isFavorited ? 'fill-current' : ''}`} />
          )}
          {isFavorited ? 'Favorited' : 'Favorite'}
        </Button>
      </div>

      {/* Status Update Buttons (for demo purposes) */}
      {localTask.status !== 'completed' && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700">Quick Actions:</div>
          <div className="flex gap-2">
            {localTask.status !== 'in_progress' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusUpdate('in_progress')}
                disabled={!canTakeAction}
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                {statusPending ? (
                  <LoadingSpinner size="sm" className="mr-1" />
                ) : (
                  <Clock className="h-3 w-3 mr-1" />
                )}
                Start Task
              </Button>
            )}
            
            {localTask.status === 'in_progress' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusUpdate('completed')}
                disabled={!canTakeAction}
                className="text-green-600 border-green-200 hover:bg-green-50"
              >
                {statusPending ? (
                  <LoadingSpinner size="sm" className="mr-1" />
                ) : (
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                )}
                Complete Task
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Optimistic Loading Overlay */}
      {(interestPending || favoritePending || statusPending) && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-lg">
          <div className="bg-white p-3 rounded-lg shadow-lg flex items-center gap-2">
            <LoadingSpinner size="sm" />
            <span className="text-sm text-gray-600">
              {interestPending && 'Updating interest...'}
              {favoritePending && 'Updating favorite...'}
              {statusPending && 'Updating status...'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

// Demo component showing optimistic list updates
export function OptimisticTaskList() {
  const [tasks, setTasks] = useState<Task[]>([
    // Mock tasks for demo
  ])

  const { execute: addTask, isPending: isAdding } = useOptimisticAction(
    async (newTask: Omit<Task, 'id'>) => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const task: Task = {
        ...newTask,
        id: Date.now().toString(),
      }
      
      setTasks(prev => [task, ...prev])
      return task
    },
    {
      showToasts: true,
      successMessage: 'Task created successfully!'
    }
  )

  const { execute: removeTask, isPending: isRemoving } = useOptimisticAction(
    async (taskId: string) => {
      // Optimistically remove from UI
      setTasks(prev => prev.filter(t => t.id !== taskId))
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
    },
    {
      showToasts: true,
      successMessage: 'Task removed',
      onError: () => {
        // In a real app, you'd reload the tasks here
        toast.error('Failed to remove task')
      }
    }
  )

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Tasks</h3>
        <Button
          onClick={() => addTask({
            title: 'New Task',
            description: 'A new task created optimistically',
            // Add other required fields
          } as any)}
          disabled={isAdding}
          className="relative"
        >
          {isAdding && (
            <div className="absolute inset-0 flex items-center justify-center bg-teal-600 rounded">
              <LoadingSpinner size="sm" className="text-white" />
            </div>
          )}
          Add Task
        </Button>
      </div>

      <div className="space-y-3">
        {tasks.map((task, index) => (
          <div 
            key={task.id}
            className={`
              p-4 border rounded-lg transition-all duration-300
              ${isRemoving ? 'opacity-50 scale-95' : ''}
              ${index === 0 && isAdding ? 'animate-slideIn' : ''}
            `}
          >
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium">{task.title}</h4>
                <p className="text-sm text-gray-600">{task.description}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeTask(task.id)}
                disabled={isRemoving}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {tasks.length === 0 && !isAdding && (
        <div className="text-center py-8 text-gray-500">
          No tasks yet. Add one to get started!
        </div>
      )}
    </div>
  )
}