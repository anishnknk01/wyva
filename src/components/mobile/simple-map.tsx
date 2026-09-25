'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Navigation, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface LocationCoordinates {
  latitude: number
  longitude: number
}

interface SimpleMapProps {
  coordinates?: LocationCoordinates
  address?: string
  className?: string
  showDirections?: boolean
  zoom?: number
}

export function SimpleMap({ 
  coordinates, 
  address, 
  className,
  showDirections = true,
  zoom = 15 
}: SimpleMapProps) {
  if (!coordinates) {
    return (
      <Card className={className}>
        <CardContent className="p-4 text-center">
          <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Location not available</p>
          {address && (
            <p className="text-xs text-gray-500 mt-1">{address}</p>
          )}
        </CardContent>
      </Card>
    )
  }

  const { latitude, longitude } = coordinates

  // Generate static map URL (using OpenStreetMap tile server)
  const staticMapUrl = `https://static-maps.yandex.ru/1.x/?lang=en&ll=${longitude},${latitude}&z=${zoom}&l=map&size=400,200&pt=${longitude},${latitude},pm2rdm`
  
  // Google Maps directions URL
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
  
  // Apple Maps URL (for iOS)
  const appleMapsUrl = `maps://maps.google.com/maps?daddr=${latitude},${longitude}`

  const openInMaps = () => {
    // Detect iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    
    if (isIOS) {
      window.open(appleMapsUrl)
    } else {
      window.open(directionsUrl)
    }
  }

  const openInGoogleMaps = () => {
    window.open(`https://www.google.com/maps/search/${latitude},${longitude}`)
  }

  return (
    <Card className={className}>
      <CardContent className="p-0">
        {/* Static Map Image */}
        <div className="relative">
          <img
            src={staticMapUrl}
            alt={`Map showing location ${address || 'coordinates'}`}
            className="w-full h-48 object-cover rounded-t-lg cursor-pointer"
            onClick={openInGoogleMaps}
            onError={(e) => {
              // Fallback to OpenStreetMap if Yandex fails
              e.currentTarget.src = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude-0.01},${latitude-0.01},${longitude+0.01},${latitude+0.01}&layer=mapnik&marker=${latitude},${longitude}`
            }}
          />
          
          {/* Map Overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all duration-200 rounded-t-lg flex items-center justify-center">
            <ExternalLink className="h-8 w-8 text-white opacity-0 hover:opacity-100 transition-opacity" />
          </div>

          {/* Location Pin */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-full">
            <MapPin className="h-8 w-8 text-red-500 drop-shadow-lg" />
          </div>
        </div>

        {/* Location Info */}
        <div className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {address && (
                <p className="text-sm font-medium text-gray-900 mb-1">
                  {address}
                </p>
              )}
              <p className="text-xs text-gray-500">
                {latitude.toFixed(6)}, {longitude.toFixed(6)}
              </p>
              <Badge variant="secondary" className="mt-2 text-xs">
                Tap to view in maps
              </Badge>
            </div>
            
            {showDirections && (
              <Button
                onClick={openInMaps}
                size="sm"
                variant="outline"
                className="ml-2"
              >
                <Navigation className="h-3 w-3 mr-1" />
                Directions
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}