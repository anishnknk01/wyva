import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { SearchFilters } from '@/hooks/use-search'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse search parameters
    const query = searchParams.get('query') || ''
    const category = searchParams.get('category')
    const area = searchParams.get('area')
    const minBudget = searchParams.get('minBudget') ? parseInt(searchParams.get('minBudget')!) : undefined
    const maxBudget = searchParams.get('maxBudget') ? parseInt(searchParams.get('maxBudget')!) : undefined
    const sortBy = searchParams.get('sortBy') || 'relevance'
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
    const offset = parseInt(searchParams.get('offset') || '0')
    const enableFacets = searchParams.get('facets') === 'true'
    
    // Location filters
    const latitude = searchParams.get('latitude') ? parseFloat(searchParams.get('latitude')!) : undefined
    const longitude = searchParams.get('longitude') ? parseFloat(searchParams.get('longitude')!) : undefined
    const radius = searchParams.get('radius') ? parseFloat(searchParams.get('radius')!) : undefined

    const supabase = await createClient()

    // Build the base query
    let queryBuilder = supabase
      .from('tasks')
      .select(`
        id,
        title,
        description,
        category,
        area,
        budget,
        task_date,
        task_time,
        interested_count,
        status,
        location_coordinates,
        created_at
      `)
      .eq('status', 'waiting_for_wysa') // Only show available tasks

    // Apply text search
    if (query.trim()) {
      // Use full-text search if supported, otherwise use ILIKE
      queryBuilder = queryBuilder.or(`
        title.ilike.%${query}%,
        description.ilike.%${query}%,
        category.ilike.%${query}%
      `)
    }

    // Apply filters
    if (category) {
      queryBuilder = queryBuilder.eq('category', category)
    }

    if (area) {
      queryBuilder = queryBuilder.eq('area', area)
    }

    if (minBudget !== undefined) {
      queryBuilder = queryBuilder.gte('budget', minBudget)
    }

    if (maxBudget !== undefined) {
      queryBuilder = queryBuilder.lte('budget', maxBudget)
    }

    // Apply location filtering using PostGIS functions
    if (latitude && longitude && radius) {
      // This would require PostGIS extension and proper location handling
      // For now, we'll use a simple bounding box approximation
      const latDelta = radius / 111 // Rough conversion: 1 degree ≈ 111 km
      const lngDelta = radius / (111 * Math.cos(latitude * Math.PI / 180))
      
      queryBuilder = queryBuilder
        .gte('location_coordinates->lat', latitude - latDelta)
        .lte('location_coordinates->lat', latitude + latDelta)
        .gte('location_coordinates->lng', longitude - lngDelta)
        .lte('location_coordinates->lng', longitude + lngDelta)
    }

    // Apply sorting
    switch (sortBy) {
      case 'budget_high':
        queryBuilder = queryBuilder.order('budget', { ascending: false })
        break
      case 'budget_low':
        queryBuilder = queryBuilder.order('budget', { ascending: true })
        break
      case 'date_newest':
        queryBuilder = queryBuilder.order('created_at', { ascending: false })
        break
      case 'date_oldest':
        queryBuilder = queryBuilder.order('created_at', { ascending: true })
        break
      case 'relevance':
      default:
        // For relevance, we could implement a scoring system
        queryBuilder = queryBuilder.order('created_at', { ascending: false })
        break
    }

    // Apply pagination
    queryBuilder = queryBuilder.range(offset, offset + limit - 1)

    const { data: tasks, error, count } = await queryBuilder

    if (error) {
      console.error('Task search error:', error)
      return NextResponse.json({ error: 'Search failed' }, { status: 500 })
    }

    // Calculate distances if location is provided
    const tasksWithDistance = tasks?.map(task => {
      let distance = null
      
      if (latitude && longitude && task.location_coordinates?.lat && task.location_coordinates?.lng) {
        // Haversine formula for distance calculation
        const R = 6371 // Earth's radius in kilometers
        const dLat = (task.location_coordinates.lat - latitude) * Math.PI / 180
        const dLng = (task.location_coordinates.lng - longitude) * Math.PI / 180
        
        const a = 
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(latitude * Math.PI / 180) * Math.cos(task.location_coordinates.lat * Math.PI / 180) *
          Math.sin(dLng / 2) * Math.sin(dLng / 2)
        
        distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      }
      
      return {
        ...task,
        distance: distance ? Math.round(distance * 10) / 10 : null
      }
    }) || []

    // Generate facets if requested
    let facets = null
    if (enableFacets) {
      const [categoriesResult, areasResult, budgetStats] = await Promise.all([
        // Category facets
        supabase
          .from('tasks')
          .select('category')
          .eq('status', 'waiting_for_wysa')
          .not('category', 'is', null),
        
        // Area facets
        supabase
          .from('tasks')
          .select('area')
          .eq('status', 'waiting_for_wysa')
          .not('area', 'is', null),
        
        // Budget statistics
        supabase
          .from('tasks')
          .select('budget')
          .eq('status', 'waiting_for_wysa')
      ])

      // Process category facets
      const categoryMap = new Map()
      categoriesResult.data?.forEach(item => {
        const count = categoryMap.get(item.category) || 0
        categoryMap.set(item.category, count + 1)
      })

      // Process area facets
      const areaMap = new Map()
      areasResult.data?.forEach(item => {
        const count = areaMap.get(item.area) || 0
        areaMap.set(item.area, count + 1)
      })

      // Process budget ranges
      const budgets = budgetStats.data?.map(item => item.budget) || []
      const budgetRanges = [
        { range: '₹0 - ₹500', min: 0, max: 500, count: budgets.filter(b => b >= 0 && b <= 500).length },
        { range: '₹501 - ₹1000', min: 501, max: 1000, count: budgets.filter(b => b >= 501 && b <= 1000).length },
        { range: '₹1001 - ₹2000', min: 1001, max: 2000, count: budgets.filter(b => b >= 1001 && b <= 2000).length },
        { range: '₹2001+', min: 2001, max: Infinity, count: budgets.filter(b => b >= 2001).length }
      ].filter(range => range.count > 0)

      facets = {
        categories: Array.from(categoryMap.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count),
        areas: Array.from(areaMap.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count),
        budgetRanges,
        dateRanges: [] // Could implement date range facets
      }
    }

    // Generate search suggestions based on query
    const suggestions = query.trim() ? await generateSuggestions(query, supabase) : []

    return NextResponse.json({
      items: tasksWithDistance,
      total: count || 0,
      hasMore: (count || 0) > offset + limit,
      facets,
      suggestions,
      queryTime: 0 // This would be calculated in a real implementation
    })

  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function generateSuggestions(query: string, supabase: any): Promise<string[]> {
  try {
    // Get similar task titles and categories
    const { data: suggestions } = await supabase
      .from('tasks')
      .select('title, category')
      .or(`title.ilike.%${query}%, category.ilike.%${query}%`)
      .limit(10)

    const suggestionSet = new Set<string>()
    
    suggestions?.forEach((item: any) => {
      // Add similar titles
      if (item.title.toLowerCase().includes(query.toLowerCase())) {
        suggestionSet.add(item.title)
      }
      
      // Add matching categories
      if (item.category?.toLowerCase().includes(query.toLowerCase())) {
        suggestionSet.add(item.category)
      }
    })

    return Array.from(suggestionSet).slice(0, 5)
  } catch (error) {
    console.error('Suggestion generation failed:', error)
    return []
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      query = '',
      category,
      area,
      minBudget,
      maxBudget,
      sortBy = 'relevance',
      location,
      limit = 20,
      offset = 0,
      facets = false
    } = body

    // Convert to URL parameters and call GET
    const searchParams = new URLSearchParams()
    
    if (query) searchParams.set('query', query)
    if (category) searchParams.set('category', category)
    if (area) searchParams.set('area', area)
    if (minBudget !== undefined) searchParams.set('minBudget', minBudget.toString())
    if (maxBudget !== undefined) searchParams.set('maxBudget', maxBudget.toString())
    if (sortBy) searchParams.set('sortBy', sortBy)
    if (location?.latitude) searchParams.set('latitude', location.latitude.toString())
    if (location?.longitude) searchParams.set('longitude', location.longitude.toString())
    if (location?.radius) searchParams.set('radius', location.radius.toString())
    searchParams.set('limit', limit.toString())
    searchParams.set('offset', offset.toString())
    searchParams.set('facets', facets.toString())

    const url = new URL(request.url)
    url.search = searchParams.toString()

    return GET(new NextRequest(url))
  } catch (error) {
    console.error('Search POST error:', error)
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}