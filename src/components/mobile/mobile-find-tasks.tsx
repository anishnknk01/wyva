"use client";

import { useState, useEffect, useMemo } from 'react';
import { 
  MapPin, 
  Clock, 
  DollarSign, 
  User,
  Filter,
  Search,
  Star,
  Calendar,
  RefreshCw,
  Mic,
  X
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { listAvailableTasks } from '@/lib/task-store';
import { taskCategories, taskAreas } from '@/lib/tasks';
import type { Task } from '@/lib/task-store';
import { useErrorHandler } from '@/hooks/use-error-handler';
import { LoadingPage, LoadingSkeleton } from '@/components/ui/loading-spinner';
import { TaskListLoading, InlineLoading, useAsyncOperation } from '@/components/mobile/loading-state-manager';
import { NearbyTasks } from '@/components/mobile/nearby-tasks';
import { PullToRefresh } from '@/components/mobile/pull-to-refresh';
import { SwipeableCard, taskCardActions } from '@/components/mobile/swipeable-card';
import { TouchFeedback } from '@/components/mobile/touch-feedback';
import { AdvancedSearch } from '@/components/mobile/advanced-search';
import { useSearch } from '@/hooks/use-search';
import type { SearchFilters } from '@/hooks/use-search';
import { useLocation } from '@/hooks/use-location';
import { calculateDistance, formatDistance, isValidCoordinates } from '@/lib/location-utils';
import { toast } from 'sonner';

export function MobileFindTasks() {
  const { handleAsyncError } = useErrorHandler();
  const { location } = useLocation();
  const { execute } = useAsyncOperation();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  
  const [searchQuery, setSearchQuery] = useState("");
  
  const { 
    searchResults, 
    isSearching, 
    suggestions, 
    startVoiceSearch,
    isVoiceSearchActive,
    facets 
  } = useSearch({
    query: searchQuery,
    filters: {
      categories: activeFilters.filter(f => f.startsWith("category:")).map(f => f.replace("category:", "")),
      location: activeFilters.find(f => f.startsWith("location:"))?.replace("location:", ""),
      budget: activeFilters.find(f => f.startsWith("budget:"))?.replace("budget:", ""),
      duration: activeFilters.find(f => f.startsWith("duration:"))?.replace("duration:", ""),
    }
  });

  const handleFilterAdd = (filter: string) => {
    if (!activeFilters.includes(filter)) {
      setActiveFilters([...activeFilters, filter]);
    }
  };

  const handleFilterRemove = (filter: string) => {
    setActiveFilters(activeFilters.filter(f => f !== filter));
  };

  const handleVoiceSearch = () => {
    startVoiceSearch((transcript) => {
      setSearchQuery(transcript);
    });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    
    await execute(
      'refresh-tasks',
      async () => {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        // In real app, reload tasks from API
        return true;
      },
      {
        loadingMessage: 'Refreshing tasks...',
        successMessage: 'Tasks refreshed',
        type: 'background'
      }
    );
    
    setRefreshing(false);
  };

  // Use search results when available, otherwise show all tasks
  const filteredTasks = searchQuery || activeFilters.length > 0 ? searchResults : tasks;

  // Load initial tasks on mount
  useEffect(() => {
    const loadInitialTasks = async () => {
      setLoading(true);
      
      await execute(
        'load-initial-tasks',
        async () => {
          const tasksData = await listAvailableTasks();
          setTasks(tasksData);
          return tasksData;
        },
        {
          loadingMessage: 'Loading available tasks...',
          type: 'page'
        }
      );
      
      setLoading(false);
    };
    
    loadInitialTasks();
  }, []);

  if (loading) {
    return <TaskListLoading />;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search and Filter Header */}
      <div className="p-4 bg-white border-b border-gray-200 space-y-3">
        <div className="relative flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 h-10"
            />
            <Button
              variant="ghost"
              size="sm"
              className={`absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 ${
                isVoiceSearchActive ? 'bg-red-100 text-red-600' : ''
              }`}
              onClick={handleVoiceSearch}
            >
              <Mic className="h-4 w-4" />
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
            className="px-3"
          >
            <Filter className="h-4 w-4" />
            {activeFilters.length > 0 && (
              <Badge className="ml-1 bg-teal-600 text-white text-xs px-1 py-0">
                {activeFilters.length}
              </Badge>
            )}
          </Button>
        </div>

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {activeFilters.map((filter) => (
              <Badge
                key={filter}
                variant="secondary"
                className="text-xs flex items-center gap-1"
              >
                {filter.split(":")[1]}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => handleFilterRemove(filter)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        )}

        {/* Search Suggestions */}
        {suggestions.length > 0 && searchQuery && (
          <div className="border-t pt-2">
            <div className="text-xs text-gray-500 mb-2">Suggestions:</div>
            <div className="flex flex-wrap gap-1">
              {suggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  className="text-xs h-6 px-2"
                  onClick={() => setSearchQuery(suggestion)}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <InlineLoading 
              isLoading={isSearching}
              loadingText="Searching..."
            >
              {`${filteredTasks.length} task${filteredTasks.length !== 1 ? 's' : ''} found`}
            </InlineLoading>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Advanced Search Panel */}
      {showAdvancedSearch && (
        <div className="bg-gray-50 border-b">
          <div className="p-4">
            <AdvancedSearch
              onSearch={(filters) => {
                // Convert filters to our filter format
                if (filters.category) handleFilterAdd(`category:${filters.category}`);
                if (filters.area) handleFilterAdd(`location:${filters.area}`);
                if (filters.minBudget || filters.maxBudget) {
                  const budgetStr = `${filters.minBudget || 0}-${filters.maxBudget || '∞'}`;
                  handleFilterAdd(`budget:${budgetStr}`);
                }
              }}
              initialFilters={{
                query: searchQuery
              }}
            />
            <div className="mt-4 flex justify-end">
              <Button onClick={() => setShowAdvancedSearch(false)} size="sm">
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tasks List */}
      <div className="flex-1 overflow-hidden">
        <PullToRefresh onRefresh={handleRefresh}>
          <div className="p-4">
            {/* Nearby Tasks Section */}
            <div className="mb-6">
              <NearbyTasks maxDistance={15} limit={5} />
            </div>

            {/* All Tasks Section */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">All Available Tasks</h3>
              
              {filteredTasks.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No tasks found</h3>
                  <p className="text-gray-600 text-sm">
                    Try adjusting your filters or search terms
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredTasks.map((task) => (
                    <TaskCard key={task.id} task={task} userLocation={location?.coordinates} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </PullToRefresh>
      </div>
    </div>
  );
}

function TaskCard({ task, userLocation }: { task: Task; userLocation?: { latitude: number; longitude: number } }) {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Flexible';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Calculate distance if both user location and task location are available
  const distance = useMemo(() => {
    if (!userLocation || !task.locationCoordinates || !isValidCoordinates(task.locationCoordinates)) {
      return null;
    }
    return calculateDistance(userLocation, task.locationCoordinates);
  }, [userLocation, task.locationCoordinates]);

  return (
    <SwipeableCard
      actions={[
        {
          ...taskCardActions.favorite,
          onAction: () => {
            // Handle favorite action
            if ('vibrate' in navigator) navigator.vibrate(50)
            // Add your favorite logic here
          }
        },
        {
          ...taskCardActions.message,
          onAction: () => {
            // Navigate to task detail
            window.location.href = `/mobile/tasks/${task.id}`
          }
        }
      ]}
    >
      <TouchFeedback 
        onClick={() => window.location.href = `/mobile/tasks/${task.id}`}
        className="block"
      >
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                {task.title}
              </h3>
              <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                {task.description}
              </p>
            </div>
            <div className="ml-3 text-right">
              <div className="bg-green-100 text-green-700 px-2 py-1 rounded-lg text-sm font-semibold">
                ₹{task.budget}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-3">
            <Badge variant="outline" className="text-xs">
              {task.category}
            </Badge>
            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
              {task.area}
            </Badge>
            {distance !== null && (
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                <MapPin className="h-3 w-3 mr-1" />
                {formatDistance(distance)}
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                {formatDate(task.date)}
              </div>
              {task.time && (
                <div className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatTime(task.time)}
                </div>
              )}
            </div>
            <div className="flex items-center">
              <User className="h-3 w-3 mr-1" />
              {task.interestedCount} interested
            </div>
          </div>

          <div className="flex space-x-2">
            <Button variant="outline" size="sm" className="flex-1">
              View Details
            </Button>
            <Button size="sm" className="flex-1 bg-teal-600 hover:bg-teal-700">
              Apply Now
            </Button>
          </div>
        </CardContent>
      </TouchFeedback>
    </SwipeableCard>
  );
}