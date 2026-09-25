'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useDebounce } from './use-debounce'
import { useErrorHandler } from './use-error-handler'

export interface SearchFilters {
  query: string
  category?: string
  area?: string
  minBudget?: number
  maxBudget?: number
  dateRange?: {
    start: string
    end: string
  }
  sortBy: 'relevance' | 'budget_high' | 'budget_low' | 'date_newest' | 'date_oldest' | 'distance'
  location?: {
    latitude: number
    longitude: number
    radius: number
  }
}

export interface SearchResult<T> {
  items: T[]
  total: number
  hasMore: boolean
  facets: SearchFacets
  suggestions: string[]
  queryTime: number
}

export interface SearchFacets {
  categories: Array<{ name: string; count: number }>
  areas: Array<{ name: string; count: number }>
  budgetRanges: Array<{ range: string; min: number; max: number; count: number }>
  dateRanges: Array<{ range: string; count: number }>
}

export interface SearchOptions {
  enableFacets?: boolean
  enableSuggestions?: boolean
  enableHistory?: boolean
  maxResults?: number
  debounceMs?: number
}


export function useSearch<T = any>(
  searchFunction: (filters: SearchFilters, options: SearchOptions) => Promise<SearchResult<T>>,
  options: SearchOptions = {}
) {
  const {
    enableFacets = true,
    enableSuggestions = true,
    enableHistory = true,
    maxResults = 20,
    debounceMs = 300
  } = options

  const { handleAsyncError } = useErrorHandler()
  
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    sortBy: 'relevance'
  })
  
  const [results, setResults] = useState<SearchResult<T> | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [voiceSearchSupported, setVoiceSearchSupported] = useState(false)
  const [isVoiceSearching, setIsVoiceSearching] = useState(false)

  // Debounce the search query
  const debouncedQuery = useDebounce(filters.query, debounceMs)

  // Check voice search support
  useEffect(() => {
    setVoiceSearchSupported('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)
  }, [])

  // Load search history from localStorage
  useEffect(() => {
    if (enableHistory) {
      try {
        const history = JSON.parse(localStorage.getItem('wyva_search_history') || '[]')
        setSearchHistory(history.slice(0, 10)) // Keep last 10 searches
      } catch (error) {
        console.error('Failed to load search history:', error)
      }
    }
  }, [enableHistory])

  // Save search to history
  const saveToHistory = useCallback((query: string) => {
    if (!enableHistory || !query.trim()) return
    
    setSearchHistory(prev => {
      const newHistory = [query, ...prev.filter(h => h !== query)].slice(0, 10)
      try {
        localStorage.setItem('wyva_search_history', JSON.stringify(newHistory))
      } catch (error) {
        console.error('Failed to save search history:', error)
      }
      return newHistory
    })
  }, [enableHistory])

  // Perform search
  const performSearch = useCallback(async (searchFilters: SearchFilters) => {
    if (!searchFilters.query.trim() && !searchFilters.category && !searchFilters.area) {
      setResults(null)
      return
    }

    setIsLoading(true)
    
    await handleAsyncError(async () => {
      const startTime = Date.now()
      const searchResults = await searchFunction(searchFilters, {
        enableFacets,
        enableSuggestions,
        maxResults
      })
      
      searchResults.queryTime = Date.now() - startTime
      setResults(searchResults)
      
      // Save successful searches to history
      if (searchFilters.query.trim()) {
        saveToHistory(searchFilters.query)
      }
    }, {
      title: 'Search failed',
      description: 'Please try again with different search terms'
    })
    
    setIsLoading(false)
  }, [searchFunction, enableFacets, enableSuggestions, maxResults, handleAsyncError, saveToHistory])

  // Auto-search when debounced query changes
  useEffect(() => {
    if (debouncedQuery !== filters.query) {
      setFilters(prev => ({ ...prev, query: debouncedQuery }))
    }
  }, [debouncedQuery, filters.query])

  // Trigger search when filters change
  useEffect(() => {
    performSearch(filters)
  }, [filters, performSearch])

  // Update specific filter
  const updateFilter = useCallback(<K extends keyof SearchFilters>(
    key: K,
    value: SearchFilters[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  // Update multiple filters at once
  const updateFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }, [])

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({
      query: '',
      sortBy: 'relevance'
    })
    setResults(null)
  }, [])

  // Clear search history
  const clearHistory = useCallback(() => {
    setSearchHistory([])
    try {
      localStorage.removeItem('wyva_search_history')
    } catch (error) {
      console.error('Failed to clear search history:', error)
    }
  }, [])

  // Voice search functionality
  const startVoiceSearch = useCallback(() => {
    if (!voiceSearchSupported) {
      console.warn('Voice search not supported')
      return
    }

    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition
    const recognition = new SpeechRecognition()
    
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'

    recognition.onstart = () => {
      setIsVoiceSearching(true)
    }

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      updateFilter('query', transcript)
    }

    recognition.onerror = (event) => {
      console.error('Voice search error:', event.error)
      setIsVoiceSearching(false)
    }

    recognition.onend = () => {
      setIsVoiceSearching(false)
    }

    recognition.start()
  }, [voiceSearchSupported, updateFilter])

  // Get popular searches (mock implementation)
  const popularSearches = useMemo(() => [
    'Home cleaning',
    'Grocery shopping',
    'Pet walking',
    'Furniture assembly',
    'Tutoring',
    'Delivery service'
  ], [])

  // Get smart suggestions based on current query
  const smartSuggestions = useMemo(() => {
    if (!filters.query.trim()) return []
    
    const query = filters.query.toLowerCase()
    const suggestions = [
      ...popularSearches.filter(s => s.toLowerCase().includes(query)),
      ...searchHistory.filter(h => h.toLowerCase().includes(query) && h !== filters.query)
    ]
    
    return [...new Set(suggestions)].slice(0, 5)
  }, [filters.query, popularSearches, searchHistory])

  return {
    // State
    filters,
    results,
    isLoading,
    searchHistory,
    voiceSearchSupported,
    isVoiceSearching,
    popularSearches,
    smartSuggestions,
    
    // Actions
    updateFilter,
    updateFilters,
    clearFilters,
    clearHistory,
    startVoiceSearch,
    performSearch: () => performSearch(filters)
  }
}

// Hook for saved searches/favorites
export function useSavedSearches() {
  const [savedSearches, setSavedSearches] = useState<Array<{ id: string; name: string; filters: SearchFilters }>>([])

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('wyva_saved_searches') || '[]')
      setSavedSearches(saved)
    } catch (error) {
      console.error('Failed to load saved searches:', error)
    }
  }, [])

  const saveSearch = useCallback((name: string, filters: SearchFilters) => {
    const newSearch = {
      id: Date.now().toString(),
      name,
      filters
    }
    
    setSavedSearches(prev => {
      const updated = [...prev, newSearch].slice(0, 20) // Max 20 saved searches
      try {
        localStorage.setItem('wyva_saved_searches', JSON.stringify(updated))
      } catch (error) {
        console.error('Failed to save search:', error)
      }
      return updated
    })
  }, [])

  const removeSavedSearch = useCallback((id: string) => {
    setSavedSearches(prev => {
      const updated = prev.filter(s => s.id !== id)
      try {
        localStorage.setItem('wyva_saved_searches', JSON.stringify(updated))
      } catch (error) {
        console.error('Failed to remove saved search:', error)
      }
      return updated
    })
  }, [])

  return {
    savedSearches,
    saveSearch,
    removeSavedSearch
  }
}