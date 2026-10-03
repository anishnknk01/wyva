'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MapPin, Clock, DollarSign, Navigation, Filter } from 'lucide-react'
import { useLocation } from '@/hooks/use-location'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { toast } from 'sonner'
import Link from 'next/link'

interface TaskLocation {
  id: string
  title: string
  description: string
  category: string
  area: string
  budget: number
  date: string
  time: string
  distance?: number
  coordinates?: {
    latitude: number
    longitude: number
  }
}

interface NearbyTasksProps {
  maxDistance?: number // in kilometers
  limit?: number
  className?: string
  /** Opens the shared filter sheet on Find Tasks — lets the compact empty
   * state's "Adjust filters" action reuse the one real filter UI instead
   * of a second, local one. */
  onAdjustFilters?: () => void
}

// Mock task data with coordinates (in production, this would come from your API)
const mockNearbyTasks: TaskLocation[] = [
  {
    id: 'TSK-12345',
    title: 'Help with grocery shopping',
    description: 'Need someone to help with weekly grocery shopping at Big Bazaar',
    category: 'Errands',
    area: 'Lalbagh',
    budget: 300,
    date: '2026-09-01',
    time: '10:00',
    coordinates: { latitude: 12.8697, longitude: 74.8840 }
  },
  {
    id: 'TSK-12346',
    title: 'Dog walking service',
    description: 'Looking for someone to walk my dog for 30 minutes',
    category: 'Pet Care',
    area: 'Kadri',
    budget: 200,
    date: '2026-09-01',
    time: '18:00',
    coordinates: { latitude: 12.8758, longitude: 74.8431 }
  },
  {
    id: 'TSK-12347',
    title: 'Furniture assembly',
    description: 'Need help assembling IKEA furniture in my apartment',
    category: 'Home Services',
    area: 'Bejai',
    budget: 800,
    date: '2026-09-02',
    time: '14:00',
    coordinates: { latitude: 12.8406, longitude: 74.8356 }
  },
  {
    id: 'TSK-12348',
    title: 'Tutoring for Math',
    description: 'Need a tutor for 10th grade mathematics',
    category: 'Education',
    area: 'Car Street',
    budget: 500,
    date: '2026-09-03',
    time: '16:00',
    coordinates: { latitude: 12.8731, longitude: 74.8447 }
  }
]

export function NearbyTasks({ maxDistance = 10, limit = 10, className, onAdjustFilters }: NearbyTasksProps) {
  const [tasks, setTasks] = useState<TaskLocation[]>([])
  const [loading, setLoading] = useState(false)
  const [sortBy, setSortBy] = useState<'distance' | 'budget' | 'date'>('distance')
  
  const {
    location,
    isLoading: locationLoading,
    getCurrentLocation,
    calculateDistance
  } = useLocation()

  useEffect(() => {
    if (location) {
      loadNearbyTasks()
    }
  }, [location, maxDistance, sortBy])

  const loadNearbyTasks = async () => {
    if (!location) return

    setLoading(true)
    try {
      const response = await fetch('/api/tasks/nearby', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          latitude: location.coordinates.latitude,
          longitude: location.coordinates.longitude,
          maxDistance,
          limit
        })
      })

      if (!response.ok) {
        throw new Error('Failed to fetch nearby tasks')
      }

      const data = await response.json()
      
      // Sort tasks based on selected criteria
      let sortedTasks = [...(data.tasks || [])]
      switch (sortBy) {
        case 'distance':
          sortedTasks.sort((a, b) => (a.distance || 0) - (b.distance || 0))
          break
        case 'budget':
          sortedTasks.sort((a, b) => b.budget - a.budget)
          break
        case 'date':
          sortedTasks.sort((a, b) => new Date(a.date + ' ' + a.time).getTime() - new Date(b.date + ' ' + b.time).getTime())
          break
      }

      setTasks(sortedTasks)
    } catch (error) {
      console.error('Failed to load nearby tasks:', error)
      toast.error('Failed to load nearby tasks')
      
      // Fallback to mock data for development
      const tasksWithDistance = mockNearbyTasks.map(task => {
        if (task.coordinates) {
          const distance = calculateDistance(
            location.coordinates.latitude,
            location.coordinates.longitude,
            task.coordinates.latitude,
            task.coordinates.longitude
          )
          return { ...task, distance }
        }
        return task
      }).filter(task => !task.distance || task.distance <= maxDistance)

      setTasks(tasksWithDistance.slice(0, limit))
    } finally {
      setLoading(false)
    }
  }

  const handleGetLocation = async () => {
    try {
      const locationData = await getCurrentLocation()
      if (locationData) {
        toast.success('Location found! Loading nearby tasks...')
      }
    } catch (error) {
      console.error('Failed to get location:', error)
    }
  }

  const formatDistance = (distance?: number) => {
    if (!distance) return 'Unknown distance'
    if (distance < 1) return `${Math.round(distance * 1000)}m away`
    return `${distance.toFixed(1)}km away`
  }

  const formatTime = (date: string, time: string) => {
    const taskDate = new Date(date + 'T' + time)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const taskDay = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate())
    
    const daysDiff = Math.floor((taskDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    let dayLabel = ''
    if (daysDiff === 0) dayLabel = 'Today'
    else if (daysDiff === 1) dayLabel = 'Tomorrow'
    else if (daysDiff < 7) dayLabel = taskDate.toLocaleDateString('en-US', { weekday: 'long' })
    else dayLabel = taskDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    
    const timeLabel = taskDate.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    })
    
    return `${dayLabel} at ${timeLabel}`
  }

  if (!location && !locationLoading) {
    return (
      <div className={className}>
        <Card>
          <CardContent className="p-6 text-center">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Enable Location to See Nearby Tasks
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Allow location access to find tasks near you and see how far they are
            </p>
            <Button onClick={handleGetLocation}>
              <Navigation className="h-4 w-4 mr-2" />
              Get My Location
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="space-y-3">
        {/* Header with Sort Options */}
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">
            Nearby Tasks
          </h3>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setSortBy(sortBy === 'distance' ? 'budget' : sortBy === 'budget' ? 'date' : 'distance')}
          >
            <Filter className="h-3.5 w-3.5 mr-1" />
            {sortBy === 'distance' ? 'Distance' : sortBy === 'budget' ? 'Budget' : 'Time'}
          </Button>
        </div>

        {/* Loading State */}
        {(loading || locationLoading) && (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner className="mr-2" />
            <span className="text-sm text-gray-600">
              {locationLoading ? 'Getting your location...' : 'Loading nearby tasks...'}
            </span>
          </div>
        )}

        {/* Tasks List */}
        {!loading && !locationLoading && (
          <>
            {tasks.length === 0 ? (
              <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-5 text-center">
                <MapPin className="mx-auto mb-1.5 h-5 w-5 text-gray-400" />
                <p className="text-sm font-medium text-gray-900">No tasks nearby</p>
                <p className="mt-0.5 text-xs text-gray-500">
                  Try increasing your distance or changing your location.
                </p>
                <div className="mt-2.5 flex items-center justify-center gap-3">
                  {onAdjustFilters && (
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onAdjustFilters}>
                      Adjust filters
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => loadNearbyTasks()}>
                    Refresh
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <Card key={task.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <Link 
                            href={`/mobile/tasks/${task.id}`}
                            className="font-medium text-gray-900 hover:text-teal-600 transition-colors"
                          >
                            {task.title}
                          </Link>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {task.description}
                          </p>
                        </div>
                        <Badge variant="secondary" className="ml-2">
                          {task.category}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-4 text-gray-500">
                          <div className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {task.distance ? formatDistance(task.distance) : task.area}
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatTime(task.date, task.time)}
                          </div>
                        </div>
                        <div className="flex items-center text-teal-600 font-medium">
                          <DollarSign className="h-3 w-3" />
                          ₹{task.budget}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <Button variant="ghost" className="w-full" onClick={() => loadNearbyTasks()}>
                  Refresh Tasks
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}