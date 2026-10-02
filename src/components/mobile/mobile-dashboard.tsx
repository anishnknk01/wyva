"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  ChevronRight,
  Search,
  ShoppingCart,
  Truck,
  HeartHandshake,
  Baby,
  Utensils,
  PartyPopper,
  Compass,
  MoreHorizontal,
  ImageIcon,
} from 'lucide-react';
import type { TaskCategory } from '@/lib/tasks';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { listAvailableTasks, listAllTasksForCustomer } from '@/lib/task-store';
import type { Task } from '@/lib/task-store';
import type { User } from '@supabase/supabase-js';

// Real task categories from src/lib/tasks.ts (taskCategories) — a
// representative subset of 6, each with the same icon already used
// elsewhere for that category (see CATEGORY_ICONS in
// src/components/tasks/task-detail-page.tsx), plus "More" linking to the
// full category list via the existing advanced search panel on Find Tasks.
// Each has its own tint color (matching the reference design's varied
// pastel icon backgrounds) instead of a single repeated teal.
// Tapping one navigates to /mobile/find-tasks?category=<name>, which
// MobileFindTasks reads on mount and applies as a real filter against the
// actual task data — not a decorative label.
const homeCategories: { label: string; icon: React.ElementType; category?: TaskCategory; bg: string; fg: string }[] = [
  { label: 'Errands', icon: Truck, category: 'Errands', bg: 'bg-amber-50', fg: 'text-amber-600' },
  { label: 'Shopping', icon: ShoppingCart, category: 'Shopping', bg: 'bg-emerald-50', fg: 'text-emerald-600' },
  { label: 'Elder Care', icon: HeartHandshake, category: 'Elder assistance', bg: 'bg-rose-50', fg: 'text-rose-600' },
  { label: 'Companion', icon: Baby, category: 'Companion', bg: 'bg-sky-50', fg: 'text-sky-600' },
  { label: 'Food', icon: Utensils, category: 'Food', bg: 'bg-orange-50', fg: 'text-orange-600' },
  { label: 'Events', icon: PartyPopper, category: 'Events', bg: 'bg-violet-50', fg: 'text-violet-600' },
  { label: 'Explore', icon: Compass, category: 'Local exploration', bg: 'bg-cyan-50', fg: 'text-cyan-600' },
  { label: 'More', icon: MoreHorizontal, bg: 'bg-gray-100', fg: 'text-gray-500' },
];

// Same category → icon mapping, used as a fallback thumbnail on task cards
// when a task has no uploaded photo — keeps the card's image slot filled
// without inventing stock photography for real task data.
const taskCategoryIcons: Record<string, React.ElementType> = {
  Shopping: ShoppingCart,
  Errands: Truck,
  'Elder assistance': HeartHandshake,
  Companion: Baby,
  Food: Utensils,
  Events: PartyPopper,
  'Local exploration': Compass,
};

export function MobileDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const [available, my] = await Promise.all([
          listAvailableTasks(),
          listAllTasksForCustomer(user.id)
        ]);
        setAvailableTasks(available.slice(0, 3)); // Show only first 3
        setMyTasks(my.slice(0, 3)); // Show only first 3
      }
      setLoading(false);
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Location row + search bar. The greeting + "Post a Task" button
          now live in the header itself (see MobileLayout/page.tsx), so
          this section starts directly with location → search, matching
          the reference layout. */}
      <div className="space-y-3">
        <button
          type="button"
          className="flex w-full items-center gap-1.5 text-sm text-gray-600"
        >
          <MapPin className="h-4 w-4 text-teal-600" />
          <span>Mangalore</span>
          <ChevronRight className="h-4 w-4 text-gray-400" />
        </button>

        <button
          type="button"
          onClick={() => router.push('/mobile/find-tasks')}
          className="flex w-full items-center gap-2.5 rounded-full border border-gray-200 bg-gray-50 px-4 py-3 text-left text-sm text-gray-500 transition-colors hover:bg-gray-100"
        >
          <Search className="h-4 w-4 shrink-0 text-gray-400" />
          <span>What do you need help with?</span>
        </button>
      </div>

      {/* Popular Services — compact icon-over-label cards, horizontally
          scrollable, each with its own tint color. Each tap routes to
          Find Tasks with a real category filter pre-applied (see
          MobileFindTasks' category query param handling); "More" opens
          Find Tasks' existing advanced search panel, which already lists
          every category. */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">Popular Services</h3>
          <button
            type="button"
            onClick={() => router.push('/mobile/find-tasks?more=1')}
            className="flex items-center text-sm font-medium text-teal-600"
          >
            See all
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-1 scrollbar-hide">
          {homeCategories.map(({ label, icon: Icon, category, bg, fg }) => (
            <button
              key={label}
              type="button"
              onClick={() =>
                router.push(
                  category
                    ? `/mobile/find-tasks?category=${encodeURIComponent(category)}`
                    : '/mobile/find-tasks?more=1'
                )
              }
              className="flex shrink-0 flex-col items-center gap-1.5"
            >
              <span className={`flex h-12 w-12 items-center justify-center rounded-full ${bg} ${fg}`}>
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-xs font-medium text-gray-700">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Nearby Tasks — real available tasks, each as an image+detail
          card (photo if the task has one, otherwise a category-tinted
          icon tile — no invented stock photography). */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">Nearby Tasks</h3>
          <Link href="/mobile/find-tasks" className="flex items-center text-sm font-medium text-teal-600">
            See all
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="space-y-3">
          {availableTasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>

        {availableTasks.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No tasks available right now</p>
          </div>
        )}
      </div>

      {/* Your Recent Tasks */}
      {myTasks.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900">Your Recent Tasks</h3>
            <Link href="/mobile/my-tasks" className="flex items-center text-sm font-medium text-teal-600">
              See all
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="space-y-3">
            {myTasks.map((task) => (
              <MyTaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** Image slot shared by both task cards: the task's own uploaded photo if
 * it has one, otherwise a tinted icon tile for its category. Never a
 * fabricated stock photo. */
function TaskThumbnail({ task }: { task: Task }) {
  const photo = task.photos?.[0];
  if (photo) {
    return (
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-gray-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo} alt="" className="h-full w-full object-cover" />
      </div>
    );
  }

  const Icon = taskCategoryIcons[task.category] ?? ImageIcon;
  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
      <Icon className="h-6 w-6" />
    </div>
  );
}

function TaskCard({ task }: { task: Task }) {
  // No mobile task-detail route exists yet, so this links to the Find
  // Tasks list (where the task is actually viewable/actionable) rather
  // than a per-task URL that doesn't resolve to a real page.
  return (
    <Link
      href="/mobile/find-tasks"
      className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm transition-colors active:bg-gray-50"
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
    </Link>
  );
}

function MyTaskCard({ task }: { task: Task }) {
  const statusColors: Record<string, string> = {
    'draft': 'bg-gray-100 text-gray-700',
    'payment_pending': 'bg-orange-100 text-orange-700',
    'waiting_for_wysa': 'bg-blue-100 text-blue-700',
    'wysa_accepted': 'bg-green-100 text-green-700',
    'confirmed': 'bg-green-100 text-green-700',
    'in_progress': 'bg-blue-100 text-blue-700',
    'completed': 'bg-green-100 text-green-700',
    'payment_released': 'bg-gray-100 text-gray-700',
    'cancelled': 'bg-red-100 text-red-700',
    'under_review': 'bg-purple-100 text-purple-700',
  };
  const statusLabels: Record<string, string> = {
    'wysa_accepted': 'Confirmed',
    'confirmed': 'Confirmed',
    'in_progress': 'In Progress',
    'waiting_for_wysa': 'Pending',
    'payment_pending': 'Payment Pending',
  };

  // No mobile task-detail route exists yet, so this links to the My Tasks
  // list (where the task is actually viewable/actionable) rather than a
  // per-task URL that doesn't resolve to a real page.
  return (
    <Link
      href="/mobile/my-tasks"
      className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm transition-colors active:bg-gray-50"
    >
      <TaskThumbnail task={task} />

      <div className="min-w-0 flex-1">
        <h4 className="truncate text-sm font-semibold text-gray-900">{task.title}</h4>
        <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {task.date ? new Date(task.date).toLocaleDateString() : 'Flexible'}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {task.area}
          </span>
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1">
        <Badge className={statusColors[task.status] || 'bg-gray-100 text-gray-700'}>
          {statusLabels[task.status] || task.status.replace(/_/g, ' ')}
        </Badge>
        <span className="text-sm font-semibold text-gray-900">₹{task.budget}</span>
      </div>
    </Link>
  );
}