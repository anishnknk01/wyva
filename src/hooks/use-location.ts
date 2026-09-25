'use client'

import { useState, useEffect, useCallback } from 'react'
import { useErrorHandler } from './use-error-handler'

export interface LocationCoordinates {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: number
}

export interface LocationAddress {
  street?: string
  city?: string
  state?: string
  country?: string
  postalCode?: string
  formattedAddress: string
}

export interface LocationData {
  coordinates: LocationCoordinates
  address?: LocationAddress
}

export interface UseLocationReturn {
  location: LocationData | null
  isLoading: boolean
  isSupported: boolean
  error: string | null
  getCurrentLocation: () => Promise<LocationData | null>
  watchLocation: () => () => void
  calculateDistance: (lat1: number, lon1: number, lat2: number, lon2: number) => number
  geocodeAddress: (address: string) => Promise<LocationCoordinates | null>
  reverseGeocode: (lat: number, lon: number) => Promise<LocationAddress | null>
}

// Haversine formula to calculate distance between two coordinates
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371 // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c // Distance in kilometers
}

export function useLocation(): UseLocationReturn {
  const { handleAsyncError } = useErrorHandler()
  const [location, setLocation] = useState<LocationData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    setIsSupported(!!navigator.geolocation)
  }, [])

  const getCurrentLocation = useCallback(async (): Promise<LocationData | null> => {
    if (!isSupported) {
      const errorMsg = 'Geolocation is not supported by this browser'
      setError(errorMsg)
      return null
    }

    setIsLoading(true)
    setError(null)

    return handleAsyncError(async () => {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes
          }
        )
      })

      const coordinates: LocationCoordinates = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: Date.now()
      }

      const locationData: LocationData = { coordinates }
      
      // Try to get address for the coordinates
      try {
        const address = await reverseGeocode(coordinates.latitude, coordinates.longitude)
        if (address) {
          locationData.address = address
        }
      } catch (error) {
        console.warn('Failed to reverse geocode:', error)
      }

      setLocation(locationData)
      setIsLoading(false)
      return locationData
    }, {
      title: 'Location access failed',
      description: 'Please allow location access to find nearby tasks'
    })
  }, [isSupported, handleAsyncError])

  const watchLocation = useCallback((): (() => void) => {
    if (!isSupported) {
      return () => {}
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const coordinates: LocationCoordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: Date.now()
        }

        setLocation(prev => ({ 
          ...prev,
          coordinates 
        }))
      },
      (error) => {
        setError(error.message)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000 // 1 minute
      }
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [isSupported])

  const geocodeAddress = useCallback(async (address: string): Promise<LocationCoordinates | null> => {
    return handleAsyncError(async () => {
      // For production, use a real geocoding service like Google Maps or Mapbox
      // For now, we'll use a mock implementation
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`)
      
      if (!response.ok) {
        throw new Error('Geocoding failed')
      }

      const data = await response.json()
      
      if (!data || data.length === 0) {
        return null
      }

      const result = data[0]
      return {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        accuracy: 1000, // Approximate accuracy for geocoded addresses
        timestamp: Date.now()
      }
    }, {
      title: 'Address lookup failed',
      description: 'Could not find the specified address'
    })
  }, [handleAsyncError])

  const reverseGeocode = useCallback(async (lat: number, lon: number): Promise<LocationAddress | null> => {
    return handleAsyncError(async () => {
      // For production, use a real reverse geocoding service
      // For now, we'll use OpenStreetMap Nominatim (free but rate-limited)
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`)
      
      if (!response.ok) {
        throw new Error('Reverse geocoding failed')
      }

      const data = await response.json()
      
      if (!data || !data.address) {
        return null
      }

      const addr = data.address
      return {
        street: addr.road || addr.street,
        city: addr.city || addr.town || addr.village,
        state: addr.state || addr.county,
        country: addr.country,
        postalCode: addr.postcode,
        formattedAddress: data.display_name
      }
    }, {
      title: 'Address lookup failed',
      description: 'Could not determine address for the location'
    })
  }, [handleAsyncError])

  return {
    location,
    isLoading,
    isSupported,
    error,
    getCurrentLocation,
    watchLocation,
    calculateDistance,
    geocodeAddress,
    reverseGeocode
  }
}