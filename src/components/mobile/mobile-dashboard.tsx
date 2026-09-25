"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  DollarSign, 
  Plus,
  ArrowRight,
  Briefcase,
  Star,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { listAvailableTasks, listAllTasksForCustomer } from '@/lib/task-store';
import type { Task } from '@/lib/task-store';
import type { User } from '@supabase/supabase-js';

export function MobileDashboard() {
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

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'there';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Welcome Section */}
      <div className="text-center py-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Good morning, {firstName}! 👋
        </h2>
        <p className="text-gray-600 mb-4">
          What would you like help with today?
        </p>
        
        <Link href="/mobile/create-task">
          <Button className="bg-teal-600 hover:bg-teal-700 w-full py-3 rounded-xl">
            <Plus className="h-5 w-5 mr-2" />
            Post a Task
          </Button>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="bg-blue-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
              <Briefcase className="h-6 w-6 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{myTasks.length}</p>
            <p className="text-sm text-gray-600">My Tasks</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="bg-teal-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
              <Star className="h-6 w-6 text-teal-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">4.8</p>
            <p className="text-sm text-gray-600">Rating</p>
          </CardContent>
        </Card>
      </div>

      {/* Available Tasks */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Available Tasks</h3>
          <Link href="/mobile/find-tasks" className="text-teal-600 text-sm font-medium">
            View All
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

      {/* My Recent Tasks */}
      {myTasks.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">My Recent Tasks</h3>
            <Link href="/mobile/my-tasks" className="text-teal-600 text-sm font-medium">
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {myTasks.map((task) => (
              <MyTaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Link href="/mobile/find-tasks">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <div className="bg-purple-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                <Briefcase className="h-6 w-6 text-purple-600" />
              </div>
              <p className="font-medium text-gray-900">Find Tasks</p>
              <p className="text-sm text-gray-600">Browse available help</p>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/mobile/become-wysa">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <div className="bg-green-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <p className="font-medium text-gray-900">Become Wysa</p>
              <p className="text-sm text-gray-600">Start earning</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}

function TaskCard({ task }: { task: Task }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-medium text-gray-900 line-clamp-2">{task.title}</h4>
          <Badge className="bg-green-100 text-green-700 ml-2">
            ₹{task.budget}
          </Badge>
        </div>
        
        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
          {task.description}
        </p>
        
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center">
            <MapPin className="h-3 w-3 mr-1" />
            {task.area}
          </div>
          <div className="flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            {task.date ? new Date(task.date).toLocaleDateString() : 'Flexible'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MyTaskCard({ task }: { task: Task }) {
  const statusColors = {
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

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-medium text-gray-900 line-clamp-1">{task.title}</h4>
          <Badge className={statusColors[task.status] || 'bg-gray-100 text-gray-700'}>
            {task.status.replace('_', ' ')}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center">
            <DollarSign className="h-3 w-3 mr-1" />
            ₹{task.budget}
          </div>
          <div className="flex items-center">
            <Calendar className="h-3 w-3 mr-1" />
            {new Date(task.createdAt).toLocaleDateString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}