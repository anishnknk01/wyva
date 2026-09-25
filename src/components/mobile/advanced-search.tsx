'use client'

import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { 
  Search, 
  Filter, 
  Mic, 
  X, 
  Clock, 
  Bookmark, 
  TrendingUp,
  MapPin,
  DollarSign,
  Calendar,
  SlidersHorizontal
} from 'lucide-react'
import { useSearch, useSavedSearches, type SearchFilters } from '@/hooks/use-search'
import { taskCategories, taskAreas } from '@/lib/tasks'
import { TouchFeedback } from './touch-feedback'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface AdvancedSearchProps {
  onSearch: (filters: SearchFilters) => void
  onResultsChange?: (count: number) => void
  initialFilters?: Partial<SearchFilters>
  className?: string
}

export function AdvancedSearch({
  onSearch,
  onResultsChange,
  initialFilters = {},
  className
}: AdvancedSearchProps) {
  const [showFilters, setShowFilters] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [saveSearchName, setSaveSearchName] = useState('')
  
  const {
    filters,
    results,
    isLoading,
    searchHistory,
    voiceSearchSupported,
    isVoiceSearching,
    popularSearches,
    smartSuggestions,
    updateFilter,
    updateFilters,
    clearFilters,
    startVoiceSearch
  } = useSearch(async (searchFilters) => {
    // This would be replaced with actual API call
    onSearch(searchFilters)
    return {
      items: [],
      total: 0,
      hasMore: false,
      facets: {
        categories: [],
        areas: [],
        budgetRanges: [],
        dateRanges: []
      },
      suggestions: [],
      queryTime: 0
    }
  })

  const { savedSearches, saveSearch, removeSavedSearch } = useSavedSearches()

  const hasActiveFilters = !!(
    filters.category ||
    filters.area ||
    filters.minBudget ||
    filters.maxBudget ||
    filters.dateRange ||
    filters.location
  )

  const handleSaveSearch = () => {
    if (saveSearchName.trim() && (filters.query || hasActiveFilters)) {
      saveSearch(saveSearchName.trim(), filters)
      setSaveSearchName('')
    }
  }

  const handleLoadSavedSearch = (savedFilters: SearchFilters) => {
    updateFilters(savedFilters)
    setShowHistory(false)
  }

  const handleSuggestionClick = (suggestion: string) => {
    updateFilter('query', suggestion)
    setShowSuggestions(false)
  }

  return (
    <div className={className}>
      {/* Main Search Bar */}
      <div className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          
          <Input
            value={filters.query}
            onChange={(e) => updateFilter('query', e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder="Search for tasks, services..."
            className="pl-10 pr-20 h-12"
          />
          
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
            {/* Voice Search */}
            {voiceSearchSupported && (
              <TouchFeedback
                onClick={startVoiceSearch}
                disabled={isVoiceSearching}
                className={`p-2 rounded-full ${
                  isVoiceSearching ? 'bg-red-100 text-red-600' : 'hover:bg-gray-100'
                }`}
              >
                <Mic className={`h-4 w-4 ${isVoiceSearching ? 'animate-pulse' : ''}`} />
              </TouchFeedback>
            )}
            
            {/* Clear Search */}
            {filters.query && (
              <TouchFeedback
                onClick={() => updateFilter('query', '')}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </TouchFeedback>
            )}
            
            {/* History/Suggestions */}
            <TouchFeedback
              onClick={() => setShowHistory(!showHistory)}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <Clock className="h-4 w-4" />
            </TouchFeedback>
          </div>
        </div>

        {/* Search Suggestions */}
        {showSuggestions && (filters.query || popularSearches.length > 0) && (
          <Card className="absolute top-full left-0 right-0 z-20 mt-1 max-h-64 overflow-y-auto">
            <CardContent className="p-2">
              {/* Smart Suggestions */}
              {smartSuggestions.length > 0 && (
                <div className="mb-3">
                  <h4 className="text-xs font-medium text-gray-600 mb-2">Suggestions</h4>
                  {smartSuggestions.map((suggestion, index) => (
                    <TouchFeedback
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full p-2 text-left hover:bg-gray-50 rounded flex items-center"
                    >
                      <Search className="h-3 w-3 text-gray-400 mr-2" />
                      <span className="text-sm">{suggestion}</span>
                    </TouchFeedback>
                  ))}
                </div>
              )}
              
              {/* Popular Searches */}
              {!filters.query && popularSearches.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-gray-600 mb-2 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Popular Searches
                  </h4>
                  {popularSearches.slice(0, 5).map((search, index) => (
                    <TouchFeedback
                      key={index}
                      onClick={() => handleSuggestionClick(search)}
                      className="w-full p-2 text-left hover:bg-gray-50 rounded flex items-center"
                    >
                      <TrendingUp className="h-3 w-3 text-gray-400 mr-2" />
                      <span className="text-sm">{search}</span>
                    </TouchFeedback>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* History and Saved Searches */}
        {showHistory && (
          <Card className="absolute top-full left-0 right-0 z-20 mt-1 max-h-80 overflow-y-auto">
            <CardContent className="p-3">
              {/* Saved Searches */}
              {savedSearches.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Bookmark className="h-4 w-4 mr-1" />
                    Saved Searches
                  </h4>
                  {savedSearches.map((saved) => (
                    <div key={saved.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                      <TouchFeedback
                        onClick={() => handleLoadSavedSearch(saved.filters)}
                        className="flex-1 text-left"
                      >
                        <span className="text-sm font-medium">{saved.name}</span>
                        {saved.filters.query && (
                          <p className="text-xs text-gray-500 truncate">{saved.filters.query}</p>
                        )}
                      </TouchFeedback>
                      <TouchFeedback
                        onClick={() => removeSavedSearch(saved.id)}
                        className="p-1 rounded hover:bg-red-100"
                      >
                        <X className="h-3 w-3 text-red-600" />
                      </TouchFeedback>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Recent Searches */}
              {searchHistory.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    Recent Searches
                  </h4>
                  {searchHistory.map((search, index) => (
                    <TouchFeedback
                      key={index}
                      onClick={() => updateFilter('query', search)}
                      className="w-full p-2 text-left hover:bg-gray-50 rounded flex items-center"
                    >
                      <Clock className="h-3 w-3 text-gray-400 mr-2" />
                      <span className="text-sm">{search}</span>
                    </TouchFeedback>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center space-x-2">
          {/* Quick Filters */}
          <Sheet open={showFilters} onOpenChange={setShowFilters}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="relative">
                <Filter className="h-4 w-4 mr-1" />
                Filters
                {hasActiveFilters && (
                  <Badge className="absolute -top-2 -right-2 bg-teal-600 text-white text-xs px-1 py-0 min-w-[16px] h-4">
                    !
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            
            <SheetContent side="bottom" className="h-[70vh]">
              <SheetHeader>
                <SheetTitle>Search Filters</SheetTitle>
              </SheetHeader>
              
              <FilterPanel 
                filters={filters}
                updateFilter={updateFilter}
                updateFilters={updateFilters}
                onClear={clearFilters}
              />
            </SheetContent>
          </Sheet>

          {/* Sort */}
          <Select value={filters.sortBy} onValueChange={(value: any) => updateFilter('sortBy', value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Relevance</SelectItem>
              <SelectItem value="budget_high">Budget: High</SelectItem>
              <SelectItem value="budget_low">Budget: Low</SelectItem>
              <SelectItem value="date_newest">Newest</SelectItem>
              <SelectItem value="date_oldest">Oldest</SelectItem>
              <SelectItem value="distance">Distance</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Save Search */}
        {(filters.query || hasActiveFilters) && (
          <div className="flex items-center space-x-2">
            <Input
              value={saveSearchName}
              onChange={(e) => setSaveSearchName(e.target.value)}
              placeholder="Save as..."
              className="w-24 h-8 text-xs"
            />
            <Button
              onClick={handleSaveSearch}
              disabled={!saveSearchName.trim()}
              size="sm"
              variant="outline"
            >
              <Bookmark className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 mt-3">
          {filters.category && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {filters.category}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => updateFilter('category', undefined)}
              />
            </Badge>
          )}
          
          {filters.area && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {filters.area}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => updateFilter('area', undefined)}
              />
            </Badge>
          )}
          
          {(filters.minBudget || filters.maxBudget) && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              ₹{filters.minBudget || 0} - ₹{filters.maxBudget || '∞'}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => updateFilters({ minBudget: undefined, maxBudget: undefined })}
              />
            </Badge>
          )}
          
          <Button
            onClick={clearFilters}
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <LoadingSpinner className="mr-2" />
          <span className="text-sm text-gray-600">Searching...</span>
        </div>
      )}
    </div>
  )
}

// Filter Panel Component
function FilterPanel({ 
  filters, 
  updateFilter, 
  updateFilters, 
  onClear 
}: {
  filters: SearchFilters
  updateFilter: (key: keyof SearchFilters, value: any) => void
  updateFilters: (filters: Partial<SearchFilters>) => void
  onClear: () => void
}) {
  const [budgetRange, setBudgetRange] = useState([
    filters.minBudget || 0,
    filters.maxBudget || 5000
  ])

  const handleBudgetChange = (values: number[]) => {
    setBudgetRange(values)
    updateFilters({
      minBudget: values[0] > 0 ? values[0] : undefined,
      maxBudget: values[1] < 5000 ? values[1] : undefined
    })
  }

  return (
    <div className="space-y-6 mt-6">
      {/* Category Filter */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-3 block">
          Category
        </label>
        <div className="grid grid-cols-2 gap-2">
          {taskCategories.map((category) => (
            <TouchFeedback
              key={category}
              onClick={() => updateFilter('category', 
                filters.category === category ? undefined : category
              )}
              className={`p-3 rounded-lg border text-center ${
                filters.category === category
                  ? 'bg-teal-600 text-white border-teal-600'
                  : 'bg-white border-gray-200'
              }`}
            >
              <span className="text-sm font-medium">{category}</span>
            </TouchFeedback>
          ))}
        </div>
      </div>

      {/* Area Filter */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-3 block">
          Area
        </label>
        <div className="grid grid-cols-2 gap-2">
          {taskAreas.map((area) => (
            <TouchFeedback
              key={area}
              onClick={() => updateFilter('area', 
                filters.area === area ? undefined : area
              )}
              className={`p-3 rounded-lg border text-center ${
                filters.area === area
                  ? 'bg-teal-600 text-white border-teal-600'
                  : 'bg-white border-gray-200'
              }`}
            >
              <span className="text-sm font-medium">{area}</span>
            </TouchFeedback>
          ))}
        </div>
      </div>

      {/* Budget Filter */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-3 block">
          Budget Range
        </label>
        <div className="px-3">
          <Slider
            value={budgetRange}
            onValueChange={handleBudgetChange}
            max={5000}
            min={0}
            step={100}
            className="mb-4"
          />
          <div className="flex justify-between text-sm text-gray-600">
            <span>₹{budgetRange[0]}</span>
            <span>₹{budgetRange[1]}</span>
          </div>
        </div>
      </div>

      {/* Clear Button */}
      <Button onClick={onClear} variant="outline" className="w-full">
        Clear All Filters
      </Button>
    </div>
  )
}