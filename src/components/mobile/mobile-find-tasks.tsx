"use client";

import { useState, useEffect, useMemo } from 'react';
import {
  MapPin,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Mic,
  X,
  ChevronRight,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { listAvailableTasks } from '@/lib/task-store';
import { taskCategories, taskAreas } from '@/lib/tasks';
import type { Task } from '@/lib/task-store';
import { useErrorHandler } from '@/hooks/use-error-handler';
import { TaskListLoading, InlineLoading, useAsyncOperation } from '@/components/mobile/loading-state-manager';
import { NearbyTasks } from '@/components/mobile/nearby-tasks';
import { PullToRefresh } from '@/components/mobile/pull-to-refresh';
import { SwipeableCard, taskCardActions } from '@/components/mobile/swipeable-card';
import { TouchFeedback } from '@/components/mobile/touch-feedback';
import { TaskThumbnail } from '@/components/mobile/mobile-dashboard';
import { useLocation } from '@/hooks/use-location';
import { calculateDistance, isValidCoordinates } from '@/lib/location-utils';
import { toast } from 'sonner';

type SortOption = 'relevance' | 'budget_high' | 'budget_low' | 'date_newest' | 'date_oldest' | 'distance';

const sortLabels: Record<SortOption, string> = {
  relevance: 'Relevance',
  budget_high: 'Budget: High',
  budget_low: 'Budget: Low',
  date_newest: 'Newest',
  date_oldest: 'Oldest',
  distance: 'Distance',
};

export function MobileFindTasks() {
  const { location } = useLocation();
  const { execute } = useAsyncOperation();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('relevance');

  const [searchQuery, setSearchQuery] = useState("");
  const [isVoiceSearchActive, setIsVoiceSearchActive] = useState(false);

  // Draft filter values edited inside the sheet — only committed to the
  // real activeFilters (and thus the visible list) when the user taps
  // "Apply filters", so adjusting the budget slider doesn't re-filter the
  // list on every drag tick.
  const [draftCategory, setDraftCategory] = useState<string | undefined>();
  const [draftArea, setDraftArea] = useState<string | undefined>();
  const [draftBudget, setDraftBudget] = useState<[number, number]>([0, 5000]);

  // Pick up an initial category filter from the URL (e.g. ?category=Shopping),
  // used when arriving here from the Home screen's category row. Read via
  // window.location rather than useSearchParams() — this component is used
  // on a client-rendered page, but the rest of this codebase deliberately
  // avoids useSearchParams() since it previously broke static prerendering
  // on other routes; same pattern kept here for consistency.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const category = params.get("category");
    if (category) {
      setActiveFilters((prev) => (prev.includes(`category:${category}`) ? prev : [...prev, `category:${category}`]));
      setDraftCategory(category);
    }
    // "More" from the Home screen's category row — open the filter sheet
    // directly instead of a separate category picker, since it already
    // lists every real category.
    if (params.get("more") === "1") {
      setFiltersOpen(true);
    }
  }, []);

  // Local, client-side filtering of the already-loaded `tasks` list — this
  // screen doesn't hit a server search endpoint, it filters what's already
  // in memory by query text + the active category/location/budget chips,
  // then sorts the result.
  const searchResults = useMemo(() => {
    let list = tasks;

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (t) =>
          t.title?.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          t.category?.toLowerCase().includes(q)
      );
    }

    const categoryFilters = activeFilters
      .filter((f) => f.startsWith("category:"))
      .map((f) => f.replace("category:", ""));
    if (categoryFilters.length > 0) {
      list = list.filter((t) => categoryFilters.includes(t.category));
    }

    const locationFilter = activeFilters.find((f) => f.startsWith("location:"))?.replace("location:", "");
    if (locationFilter) {
      list = list.filter((t) => t.area === locationFilter);
    }

    const budgetFilter = activeFilters.find((f) => f.startsWith("budget:"))?.replace("budget:", "");
    if (budgetFilter) {
      const [minStr, maxStr] = budgetFilter.split("-");
      const min = Number(minStr) || 0;
      const max = maxStr === "∞" ? Infinity : Number(maxStr) || Infinity;
      list = list.filter((t) => t.budget >= min && t.budget <= max);
    }

    // Sort — same real fields already shown on the cards, no fabricated
    // relevance score. "Relevance" keeps the server's own ordering
    // (newest-first, from listAvailableTasks) when no text query is
    // active, matching how search results normally read.
    const sorted = [...list];
    switch (sortBy) {
      case 'budget_high':
        sorted.sort((a, b) => b.budget - a.budget);
        break;
      case 'budget_low':
        sorted.sort((a, b) => a.budget - b.budget);
        break;
      case 'date_newest':
        sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'date_oldest':
        sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'distance':
        if (location?.coordinates) {
          sorted.sort((a, b) => {
            const da = isValidCoordinates(a.locationCoordinates) ? calculateDistance(location.coordinates, a.locationCoordinates) : Infinity;
            const db = isValidCoordinates(b.locationCoordinates) ? calculateDistance(location.coordinates, b.locationCoordinates) : Infinity;
            return da - db;
          });
        }
        break;
      case 'relevance':
      default:
        break;
    }

    return sorted;
  }, [tasks, searchQuery, activeFilters, sortBy, location?.coordinates]);

  const isSearching = false;
  const filteredTasks = searchResults;

  const handleFilterAdd = (filter: string) => {
    setActiveFilters((prev) => {
      const prefix = filter.split(":")[0];
      return [...prev.filter((f) => !f.startsWith(`${prefix}:`)), filter];
    });
  };

  const handleFilterRemove = (filter: string) => {
    setActiveFilters((prev) => prev.filter((f) => f !== filter));
    const prefix = filter.split(":")[0];
    if (prefix === "category") setDraftCategory(undefined);
    if (prefix === "location") setDraftArea(undefined);
    if (prefix === "budget") setDraftBudget([0, 5000]);
  };

  function openFilterSheet() {
    // Seed the sheet's draft state from whatever's currently active, so
    // reopening it shows the real applied filters rather than resetting.
    setDraftCategory(activeFilters.find((f) => f.startsWith("category:"))?.replace("category:", ""));
    setDraftArea(activeFilters.find((f) => f.startsWith("location:"))?.replace("location:", ""));
    const budgetFilter = activeFilters.find((f) => f.startsWith("budget:"))?.replace("budget:", "");
    if (budgetFilter) {
      const [minStr, maxStr] = budgetFilter.split("-");
      setDraftBudget([Number(minStr) || 0, maxStr === "∞" ? 5000 : Number(maxStr) || 5000]);
    } else {
      setDraftBudget([0, 5000]);
    }
    setFiltersOpen(true);
  }

  function applyFilters() {
    const next: string[] = [];
    if (draftCategory) next.push(`category:${draftCategory}`);
    if (draftArea) next.push(`location:${draftArea}`);
    if (draftBudget[0] > 0 || draftBudget[1] < 5000) {
      next.push(`budget:${draftBudget[0]}-${draftBudget[1] >= 5000 ? '∞' : draftBudget[1]}`);
    }
    setActiveFilters(next);
    setFiltersOpen(false);
  }

  function clearDraftFilters() {
    setDraftCategory(undefined);
    setDraftArea(undefined);
    setDraftBudget([0, 5000]);
  }

  const handleVoiceSearch = () => {
    const SpeechRecognitionCtor =
      (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognitionCtor) {
      toast.error("Voice search isn't supported on this device.");
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => setIsVoiceSearchActive(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
    };
    recognition.onerror = () => setIsVoiceSearchActive(false);
    recognition.onend = () => setIsVoiceSearchActive(false);

    recognition.start();
  };

  const handleRefresh = async () => {
    setRefreshing(true);

    await execute(
      'refresh-tasks',
      async () => {
        const tasksData = await listAvailableTasks();
        setTasks(tasksData);
        return tasksData;
      },
      {
        loadingMessage: 'Refreshing tasks...',
        successMessage: 'Tasks refreshed',
        type: 'background'
      }
    );

    setRefreshing(false);
  };

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
      {/* Compact header: one search bar + Filters/Sort row */}
      <div className="shrink-0 space-y-2 border-b border-gray-200 bg-white p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 pl-10 pr-10"
          />
          <Button
            variant="ghost"
            size="sm"
            className={`absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 ${
              isVoiceSearchActive ? 'bg-red-100 text-red-600' : ''
            }`}
            onClick={handleVoiceSearch}
            aria-label="Voice search"
          >
            <Mic className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={openFilterSheet}>
            <Filter className="h-3.5 w-3.5" />
            Filters
            {activeFilters.length > 0 && (
              <Badge className="h-4 min-w-4 px-1 bg-teal-600 text-white text-[11px]">
                {activeFilters.length}
              </Badge>
            )}
          </Button>

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="h-9 w-[150px] text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(sortLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="ml-auto flex items-center gap-2 text-xs text-gray-500">
            <InlineLoading isLoading={isSearching} loadingText="Searching...">
              {`${filteredTasks.length} found`}
            </InlineLoading>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={handleRefresh}
              disabled={refreshing}
              aria-label="Refresh tasks"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Active filter chips */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {activeFilters.map((filter) => (
              <Badge key={filter} variant="secondary" className="flex items-center gap-1 text-xs">
                {filter.split(":")[1]}
                <button type="button" onClick={() => handleFilterRemove(filter)} aria-label="Remove filter">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Filters — compact bottom sheet instead of a permanent on-page block */}
      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>

          <div className="mt-4 space-y-6 pb-4">
            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">Category</p>
              <div className="grid grid-cols-2 gap-2">
                {taskCategories.map((category) => (
                  <TouchFeedback
                    key={category}
                    onClick={() => setDraftCategory(draftCategory === category ? undefined : category)}
                    className={`rounded-lg border p-2.5 text-center text-sm font-medium ${
                      draftCategory === category
                        ? 'border-teal-600 bg-teal-600 text-white'
                        : 'border-gray-200 bg-white text-gray-700'
                    }`}
                  >
                    {category}
                  </TouchFeedback>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">Area</p>
              <div className="grid grid-cols-2 gap-2">
                {taskAreas.map((area) => (
                  <TouchFeedback
                    key={area}
                    onClick={() => setDraftArea(draftArea === area ? undefined : area)}
                    className={`rounded-lg border p-2.5 text-center text-sm font-medium ${
                      draftArea === area
                        ? 'border-teal-600 bg-teal-600 text-white'
                        : 'border-gray-200 bg-white text-gray-700'
                    }`}
                  >
                    {area}
                  </TouchFeedback>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">Budget</p>
              <div className="px-1">
                <Slider
                  value={draftBudget}
                  onValueChange={(v) => setDraftBudget(v as [number, number])}
                  max={5000}
                  min={0}
                  step={100}
                  className="mb-3"
                />
                <div className="flex justify-between text-sm text-gray-600">
                  <span>₹{draftBudget[0]}</span>
                  <span>₹{draftBudget[1] >= 5000 ? '5000+' : draftBudget[1]}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 border-t border-gray-100 pt-4">
            <Button variant="outline" className="flex-1" onClick={clearDraftFilters}>
              Clear all
            </Button>
            <Button className="flex-1 bg-teal-600 hover:bg-teal-700" onClick={applyFilters}>
              Apply filters
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Tasks List */}
      <div className="flex-1 overflow-hidden">
        <PullToRefresh onRefresh={handleRefresh}>
          <div className="space-y-5 p-3">
            {/* Nearby Tasks Section */}
            <NearbyTasks
              maxDistance={15}
              limit={5}
              onAdjustFilters={openFilterSheet}
            />

            {/* All Tasks Section */}
            <div className="space-y-3 border-t border-gray-100 pt-4">
              <h3 className="text-base font-semibold text-gray-900">All Available Tasks</h3>

              {filteredTasks.length === 0 ? (
                <div className="rounded-xl border border-gray-100 bg-gray-50 py-8 text-center">
                  <Search className="mx-auto mb-2 h-6 w-6 text-gray-400" />
                  <p className="text-sm font-medium text-gray-900">No tasks found</p>
                  <p className="text-xs text-gray-500">Try adjusting your filters or search terms</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredTasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
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

function TaskCard({ task }: { task: Task }) {
  return (
    <SwipeableCard
      actions={[
        {
          ...taskCardActions.favorite,
          onAction: () => {
            if ('vibrate' in navigator) navigator.vibrate(50);
          }
        },
        {
          ...taskCardActions.message,
          onAction: () => {
            window.location.href = `/mobile/tasks/${task.id}`;
          }
        }
      ]}
    >
      {/* Same compact row layout as Home's task cards — thumbnail, title/
          description, area/date, price/chevron — so Find Tasks reads
          consistently with the rest of the app instead of a heavier,
          differently-styled card. */}
      <TouchFeedback
        onClick={() => window.location.href = `/mobile/tasks/${task.id}`}
        className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm"
      >
        <TaskThumbnail task={task} />

        <div className="min-w-0 flex-1">
          <h4 className="truncate text-sm font-semibold text-gray-900">{task.title}</h4>
          <p className="truncate text-xs text-gray-500">{task.description}</p>
          <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {task.area}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {task.date ? new Date(task.date).toLocaleDateString() : 'Flexible'}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="text-sm font-semibold text-teal-600">₹{task.budget}</span>
          <ChevronRight className="h-4 w-4 text-gray-400" />
        </div>
      </TouchFeedback>
    </SwipeableCard>
  );
}
