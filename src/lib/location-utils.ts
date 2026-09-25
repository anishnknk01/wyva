// Location utility functions

export interface Coordinates {
  latitude: number
  longitude: number
}

/**
 * Calculate distance between two points using the Haversine formula
 * @param point1 First coordinate point
 * @param point2 Second coordinate point
 * @returns Distance in kilometers
 */
export function calculateDistance(point1: Coordinates, point2: Coordinates): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = toRadians(point2.latitude - point1.latitude)
  const dLon = toRadians(point2.longitude - point1.longitude)
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.latitude)) * Math.cos(toRadians(point2.latitude)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Format distance for display
 */
export function formatDistance(distance: number): string {
  if (distance < 0.1) return 'Very close'
  if (distance < 1) return `${Math.round(distance * 1000)}m`
  if (distance < 10) return `${distance.toFixed(1)}km`
  return `${Math.round(distance)}km`
}

/**
 * Check if coordinates are valid
 */
export function isValidCoordinates(coords: Coordinates | null | undefined): coords is Coordinates {
  if (!coords) return false
  const { latitude, longitude } = coords
  return (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  )
}

/**
 * Get user's current location
 */
export function getCurrentPosition(options?: PositionOptions): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported'))
      return
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000, // 5 minutes
      ...options
    })
  })
}

/**
 * Generate Google Maps URL for directions
 */
export function getDirectionsUrl(destination: Coordinates, origin?: Coordinates): string {
  const baseUrl = 'https://www.google.com/maps/dir/'
  
  if (origin) {
    return `${baseUrl}${origin.latitude},${origin.longitude}/${destination.latitude},${destination.longitude}`
  }
  
  return `${baseUrl}?api=1&destination=${destination.latitude},${destination.longitude}`
}

/**
 * Generate Apple Maps URL for iOS devices
 */
export function getAppleMapsUrl(destination: Coordinates, origin?: Coordinates): string {
  if (origin) {
    return `maps://?saddr=${origin.latitude},${origin.longitude}&daddr=${destination.latitude},${destination.longitude}`
  }
  
  return `maps://?daddr=${destination.latitude},${destination.longitude}`
}

/**
 * Open maps app based on device platform
 */
export function openInMaps(destination: Coordinates, origin?: Coordinates): void {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
  
  const url = isIOS 
    ? getAppleMapsUrl(destination, origin)
    : getDirectionsUrl(destination, origin)
  
  window.open(url)
}

/**
 * Calculate bearing between two points
 */
export function calculateBearing(start: Coordinates, end: Coordinates): number {
  const dLon = toRadians(end.longitude - start.longitude)
  const y = Math.sin(dLon) * Math.cos(toRadians(end.latitude))
  const x = Math.cos(toRadians(start.latitude)) * Math.sin(toRadians(end.latitude)) -
            Math.sin(toRadians(start.latitude)) * Math.cos(toRadians(end.latitude)) * Math.cos(dLon)
  
  let bearing = Math.atan2(y, x)
  bearing = (bearing * 180 / Math.PI + 360) % 360
  
  return bearing
}

/**
 * Get compass direction from bearing
 */
export function getCompassDirection(bearing: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                     'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
  
  const index = Math.round(bearing / 22.5) % 16
  return directions[index]
}

/**
 * Check if location is within a certain radius
 */
export function isWithinRadius(
  center: Coordinates,
  point: Coordinates,
  radiusKm: number
): boolean {
  const distance = calculateDistance(center, point)
  return distance <= radiusKm
}

/**
 * Find the nearest location from a list of locations
 */
export function findNearest(
  origin: Coordinates,
  locations: Array<{ coordinates: Coordinates; [key: string]: any }>
): { location: any; distance: number } | null {
  if (locations.length === 0) return null
  
  let nearest = locations[0]
  let minDistance = calculateDistance(origin, nearest.coordinates)
  
  for (let i = 1; i < locations.length; i++) {
    const distance = calculateDistance(origin, locations[i].coordinates)
    if (distance < minDistance) {
      minDistance = distance
      nearest = locations[i]
    }
  }
  
  return { location: nearest, distance: minDistance }
}