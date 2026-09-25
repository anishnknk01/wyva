'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Navigation, Search, X } from 'lucide-react'
import { useLocation, type LocationCoordinates, type LocationAddress } from '@/hooks/use-location'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { toast } from 'sonner'

interface LocationPickerProps {
  onLocationSelect?: (location: { coordinates: LocationCoordinates; address?: LocationAddress }) => void
  onAddressChange?: (address: string) => void
  initialAddress?: string
  className?: string
  showCurrentLocation?: boolean
  placeholder?: string
}

interface LocationSuggestion {
  id: string
  address: string
  coordinates?: LocationCoordinates
  type: 'current' | 'search' | 'saved'
}

export function LocationPicker({
  onLocationSelect,
  onAddressChange,
  initialAddress = '',
  className,
  showCurrentLocation = true,
  placeholder = 'Enter location or address'
}: LocationPickerProps) {
  const [address, setAddress] = useState(initialAddress)
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  
  const {
    location,
    isLoading: locationLoading,
    isSupported,
    getCurrentLocation,
    geocodeAddress,
    calculateDistance
  } = useLocation()

  useEffect(() => {
    if (onAddressChange) {
      onAddressChange(address)
    }
  }, [address, onAddressChange])

  const handleGetCurrentLocation = async () => {
    if (!isSupported) {
      toast.error('Location services not supported')
      return
    }

    try {
      const locationData = await getCurrentLocation()
      if (locationData) {
        const formattedAddress = locationData.address?.formattedAddress || 
          `${locationData.coordinates.latitude.toFixed(4)}, ${locationData.coordinates.longitude.toFixed(4)}`
        
        setAddress(formattedAddress)
        
        if (onLocationSelect) {
          onLocationSelect(locationData)
        }

        toast.success('Current location found')
      }
    } catch (error) {
      console.error('Failed to get current location:', error)
    }
  }

  const handleSearchAddress = async (query: string) => {
    if (!query.trim()) {
      setSuggestions([])
      return
    }

    setSearchLoading(true)
    
    try {
      // Add current location suggestion if available
      const newSuggestions: LocationSuggestion[] = []
      
      if (showCurrentLocation && location && isSupported) {
        newSuggestions.push({
          id: 'current',
          address: location.address?.formattedAddress || 'Current Location',
          coordinates: location.coordinates,
          type: 'current'
        })
      }

      // Search for addresses (simplified - in production use a real geocoding API)
      const coordinates = await geocodeAddress(query)
      if (coordinates) {
        newSuggestions.push({
          id: `search-${query}`,
          address: query,
          coordinates,
          type: 'search'
        })
      }

      // Add some predefined locations for Mangalore
      const commonLocations = [
        'City Centre Mall, Mangalore',
        'Mangalore Central Railway Station',
        'Mangalore International Airport',
        'Lalbagh, Mangalore',
        'Kadri Park, Mangalore',
        'Forum Fiza Mall, Mangalore'
      ].filter(loc => loc.toLowerCase().includes(query.toLowerCase()))

      commonLocations.forEach((loc, index) => {
        if (!newSuggestions.find(s => s.address.includes(loc))) {
          newSuggestions.push({
            id: `common-${index}`,
            address: loc,
            type: 'search'
          })
        }
      })

      setSuggestions(newSuggestions.slice(0, 5)) // Limit to 5 suggestions
    } catch (error) {
      console.error('Address search failed:', error)
    } finally {
      setSearchLoading(false)
    }
  }

  const handleSelectSuggestion = async (suggestion: LocationSuggestion) => {
    setAddress(suggestion.address)
    setShowSuggestions(false)
    setSearchQuery('')

    if (onLocationSelect && suggestion.coordinates) {
      onLocationSelect({
        coordinates: suggestion.coordinates,
        address: {
          formattedAddress: suggestion.address
        }
      })
    } else if (onLocationSelect && !suggestion.coordinates) {
      // Try to geocode the address
      try {
        const coordinates = await geocodeAddress(suggestion.address)
        if (coordinates) {
          onLocationSelect({
            coordinates,
            address: {
              formattedAddress: suggestion.address
            }
          })
        }
      } catch (error) {
        console.error('Failed to geocode selected address:', error)
      }
    }
  }

  const handleInputChange = (value: string) => {
    setAddress(value)
    setSearchQuery(value)
    if (value.trim()) {
      setShowSuggestions(true)
      handleSearchAddress(value)
    } else {
      setShowSuggestions(false)
      setSuggestions([])
    }
  }

  return (
    <div className={className}>
      <div className="space-y-3">
        <div className="relative">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={address}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder={placeholder}
              className="h-12 pl-10 pr-12"
            />
            {address && (
              <Button
                onClick={() => {
                  setAddress('')
                  setShowSuggestions(false)
                  setSuggestions([])
                }}
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Suggestions Dropdown */}
          {showSuggestions && (suggestions.length > 0 || searchLoading) && (
            <Card className="absolute top-full left-0 right-0 z-10 mt-1 max-h-64 overflow-y-auto">
              <CardContent className="p-0">
                {searchLoading && (
                  <div className="flex items-center justify-center p-4">
                    <LoadingSpinner size="sm" className="mr-2" />
                    <span className="text-sm text-gray-600">Searching...</span>
                  </div>
                )}
                
                {!searchLoading && suggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    onClick={() => handleSelectSuggestion(suggestion)}
                    className="w-full p-3 text-left hover:bg-gray-50 flex items-center space-x-3 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex-shrink-0">
                      {suggestion.type === 'current' ? (
                        <Navigation className="h-4 w-4 text-teal-600" />
                      ) : (
                        <Search className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {suggestion.address}
                      </p>
                      {suggestion.type === 'current' && (
                        <Badge variant="secondary" className="mt-1 text-xs">
                          Current Location
                        </Badge>
                      )}
                    </div>
                    {suggestion.coordinates && location && (
                      <div className="text-xs text-gray-500">
                        {calculateDistance(
                          location.coordinates.latitude,
                          location.coordinates.longitude,
                          suggestion.coordinates.latitude,
                          suggestion.coordinates.longitude
                        ).toFixed(1)} km
                      </div>
                    )}
                  </button>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Current Location Button */}
        {showCurrentLocation && isSupported && (
          <Button
            onClick={handleGetCurrentLocation}
            variant="outline"
            disabled={locationLoading}
            className="w-full"
          >
            {locationLoading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Getting location...
              </>
            ) : (
              <>
                <Navigation className="h-4 w-4 mr-2" />
                Use Current Location
              </>
            )}
          </Button>
        )}

        {/* Location Info */}
        {location && (
          <Card className="bg-green-50">
            <CardContent className="p-3">
              <div className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-800">
                    Current Location Available
                  </p>
                  <p className="text-xs text-green-600">
                    Accuracy: ±{Math.round(location.coordinates.accuracy)}m
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!isSupported && (
          <Card className="bg-yellow-50">
            <CardContent className="p-3">
              <div className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    Location services not available
                  </p>
                  <p className="text-xs text-yellow-600">
                    Please enter your location manually
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}