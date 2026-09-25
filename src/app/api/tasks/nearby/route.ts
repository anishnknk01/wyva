import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lat = parseFloat(searchParams.get('lat') || '0')
    const lng = parseFloat(searchParams.get('lng') || '0')
    const maxDistance = parseFloat(searchParams.get('maxDistance') || '10')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!lat || !lng) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      )
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return NextResponse.json(
        { error: 'Invalid coordinates' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Use the get_nearby_tasks function we created in the migration
    const { data, error } = await supabase.rpc('get_nearby_tasks', {
      user_lat: lat,
      user_lng: lng,
      max_distance_km: maxDistance,
      task_limit: Math.min(limit, 50) // Cap at 50 tasks
    })

    if (error) {
      console.error('Nearby tasks query error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch nearby tasks' },
        { status: 500 }
      )
    }

    // Transform the data to match our expected format
    const transformedTasks = (data || []).map((task: any) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      category: task.category,
      area: task.area,
      budget: task.budget,
      date: task.task_date,
      time: task.task_time,
      distance: Math.round(task.distance_km * 10) / 10, // Round to 1 decimal place
      coordinates: task.location_coordinates ? {
        latitude: parseFloat(task.location_coordinates.lat || task.location_coordinates.latitude),
        longitude: parseFloat(task.location_coordinates.lng || task.location_coordinates.longitude)
      } : null
    }))

    return NextResponse.json({
      tasks: transformedTasks,
      count: transformedTasks.length,
      userLocation: { lat, lng },
      searchRadius: maxDistance
    })

  } catch (error) {
    console.error('Nearby tasks API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { latitude, longitude, maxDistance = 10, limit = 20 } = body

    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      )
    }

    // Same logic as GET but with POST body
    const supabase = await createClient()

    const { data, error } = await supabase.rpc('get_nearby_tasks', {
      user_lat: latitude,
      user_lng: longitude,
      max_distance_km: maxDistance,
      task_limit: Math.min(limit, 50)
    })

    if (error) {
      console.error('Nearby tasks query error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch nearby tasks' },
        { status: 500 }
      )
    }

    const transformedTasks = (data || []).map((task: any) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      category: task.category,
      area: task.area,
      budget: task.budget,
      date: task.task_date,
      time: task.task_time,
      distance: Math.round(task.distance_km * 10) / 10,
      coordinates: task.location_coordinates ? {
        latitude: parseFloat(task.location_coordinates.lat || task.location_coordinates.latitude),
        longitude: parseFloat(task.location_coordinates.lng || task.location_coordinates.longitude)
      } : null
    }))

    return NextResponse.json({
      tasks: transformedTasks,
      count: transformedTasks.length,
      userLocation: { lat: latitude, lng: longitude },
      searchRadius: maxDistance
    })

  } catch (error) {
    console.error('Nearby tasks API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}