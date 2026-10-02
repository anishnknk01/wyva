"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Calendar, 
  MapPin, 
  DollarSign, 
  Clock,
  Plus,
  Filter,
  MessageCircle,
  Phone,
  MoreHorizontal
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSkeleton } from '@/components/ui/loading-spinner';
import { TaskListLoading, useAsyncOperation } from '@/components/mobile/loading-state-manager';
import { useOptimisticList } from '@/hooks/use-optimistic';
import { createClient } from '@/lib/supabase/client';
import { listAllTasksForCustomer } from '@/lib/task-store';
import { taskStatusLabels, getEffectiveStatus } from '@/lib/tasks';
import type { Task } from '@/lib/task-store';
import type { User } from '@supabase/supabase-js';

export function MobileMyTasks() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    async function loadTasks() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const userTasks = await listAllTasksForCustomer(user.id);
        setTasks(userTasks);
      }
      
      setLoading(false);
    }
    
    loadTasks();
  }, []);

  const getFilteredTasks = () => {
    switch (activeTab) {
      case 'active':
        return tasks.filter(task => 
          !['completed', 'payment_released', 'cancelled'].includes(task.status)
        );
      case 'completed':
        return tasks.filter(task => 
          ['completed', 'payment_released'].includes(task.status)
        );
      case 'draft':
        return tasks.filter(task => task.status === 'draft' || task.status === 'payment_pending');
      default:
        return tasks;
    }
  };

  const filteredTasks = getFilteredTasks();

  const activeTasks = tasks.filter(task => 
    !['completed', 'payment_released', 'cancelled'].includes(task.status)
  );
  const completedTasks = tasks.filter(task => 
    ['completed', 'payment_released'].includes(task.status)
  );
  const draftTasks = tasks.filter(task => 
    task.status === 'draft' || task.status === 'payment_pending'
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header Actions */}
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">My Tasks</h2>
            <p className="text-sm text-gray-600">{tasks.length} total tasks</p>
          </div>
          <Link href="/mobile/create-task">
            <Button size="sm" className="bg-teal-600 hover:bg-teal-700">
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-12 bg-gray-50">
            <TabsTrigger value="all" className="text-xs">
              All ({tasks.length})
            </TabsTrigger>
            <TabsTrigger value="active" className="text-xs">
              Active ({activeTasks.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="text-xs">
              Done ({completedTasks.length})
            </TabsTrigger>
            <TabsTrigger value="draft" className="text-xs">
              Draft ({draftTasks.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Tasks List */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {activeTab === 'all' ? 'No tasks yet' : `No ${activeTab} tasks`}
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              {activeTab === 'all' 
                ? 'Post your first task to get started!' 
                : `You don't have any ${activeTab} tasks right now.`
              }
            </p>
            {activeTab === 'all' && (
              <Link href="/mobile/create-task">
                <Button className="bg-teal-600 hover:bg-teal-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Post a Task
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {filteredTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TaskCard({ task }: { task: Task }) {
  const router = useRouter();
  const [showActions, setShowActions] = useState(false);

  const getStatusColor = (status: string) => {
    const colors = {
      'draft': 'bg-gray-100 text-gray-700',
      'payment_pending': 'bg-orange-100 text-orange-700',
      'waiting_for_wysa': 'bg-blue-100 text-blue-700',
      'wysa_accepted': 'bg-green-100 text-green-700',
      'confirmed': 'bg-green-100 text-green-700',
      'in_progress': 'bg-yellow-100 text-yellow-700',
      'completed': 'bg-green-100 text-green-700',
      'payment_released': 'bg-gray-100 text-gray-700',
      'cancelled': 'bg-red-100 text-red-700',
      'under_review': 'bg-purple-100 text-purple-700',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  // Display status — same effective-status computation the Task Details
  // pages already use (promotes a confirmed task to "in progress" once
  // its scheduled time has passed, or once the worker has explicitly
  // started it), so the badge shown here always matches what's shown on
  // the task's own detail page instead of lagging behind on "Confirmed".
  const displayStatus = getEffectiveStatus(task.status, task.date, task.time);

  const canChat = task.status === 'wysa_accepted' || task.status === 'confirmed' || task.status === 'in_progress';
  const needsPayment = task.status === 'payment_pending';
  const canViewDetails = task.status !== 'draft';

  const handleCardClick = () => {
    if (needsPayment) {
      router.push(`/mobile/pay-task/${task.id}`);
    } else if (canViewDetails) {
      router.push(`/mobile/tasks/${task.id}`);
    }
  };

  return (
    <Card className="hover:shadow-md transition-all duration-200">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
              {task.title}
            </h3>
            <p className="text-gray-600 text-sm line-clamp-2 mb-2">
              {task.description}
            </p>
          </div>
          <div className="ml-3 flex items-center space-x-2">
            <Badge className={getStatusColor(displayStatus)}>
              {taskStatusLabels[displayStatus] || displayStatus}
            </Badge>
            <Sheet open={showActions} onOpenChange={setShowActions}>
              <SheetTrigger>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-auto">
                <SheetHeader>
                  <SheetTitle>{task.title}</SheetTitle>
                </SheetHeader>
                <div className="grid grid-cols-1 gap-2 mt-4">
                  {needsPayment && (
                    <Button 
                      onClick={() => router.push(`/mobile/pay-task/${task.id}`)}
                      className="bg-teal-600 hover:bg-teal-700"
                    >
                      Complete Payment
                    </Button>
                  )}
                  {canViewDetails && (
                    <Button 
                      variant="outline"
                      onClick={() => router.push(`/mobile/tasks/${task.id}`)}
                    >
                      View Details
                    </Button>
                  )}
                  {canChat && (
                    <Button variant="outline">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Chat with Wysa
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => setShowActions(false)}>
                    Cancel
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              {task.date ? new Date(task.date).toLocaleDateString() : 'Flexible'}
            </div>
            {task.area && (
              <div className="flex items-center">
                <MapPin className="h-3 w-3 mr-1" />
                {task.area}
              </div>
            )}
          </div>
          <div className="flex items-center">
            <DollarSign className="h-3 w-3 mr-1" />
            ₹{task.budget}
          </div>
        </div>

        <div className="flex space-x-2">
          {needsPayment ? (
            <Button 
              onClick={handleCardClick}
              className="flex-1 bg-teal-600 hover:bg-teal-700"
            >
              Complete Payment
            </Button>
          ) : (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={handleCardClick}
              >
                View Details
              </Button>
              {canChat && (
                <Button variant="outline" size="sm">
                  <MessageCircle className="h-4 w-4" />
                </Button>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}