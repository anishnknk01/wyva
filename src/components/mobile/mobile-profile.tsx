"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Settings, 
  CreditCard, 
  HelpCircle, 
  Shield, 
  Star,
  FileText,
  LogOut,
  ChevronRight,
  Edit,
  Briefcase,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { RatingDisplay, RatingBadge } from '@/components/mobile/rating-stars';
import { createClient } from '@/lib/supabase/client';
import { signOut } from '@/app/auth/actions';
import { listAllTasksForCustomer, calculateWysaEarnings } from '@/lib/task-store';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { Task } from '@/lib/task-store';

const profileMenuItems = [
  { 
    icon: FileText, 
    label: 'My Tasks', 
    href: '/mobile/my-tasks',
    description: 'View and manage your tasks'
  },
  { 
    icon: Star, 
    label: 'My Reviews', 
    href: '/mobile/reviews',
    description: 'View ratings and reviews received'
  },
  { 
    icon: CreditCard, 
    label: 'Payments', 
    href: '/mobile/payments',
    description: 'Payment history and methods'
  },
  { 
    icon: Settings, 
    label: 'Settings', 
    href: '/mobile/settings',
    description: 'Account and app preferences'
  },
  { 
    icon: HelpCircle, 
    label: 'Help & Support', 
    href: '/mobile/help',
    description: 'Get help and contact us'
  },
  { 
    icon: Shield, 
    label: 'Safety', 
    href: '/safety',
    description: 'Safety guidelines and reporting'
  },
];

export function MobileProfile() {
  const router = useRouter();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [earnings, setEarnings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{
    average_rating: number;
    total_ratings: number;
  } | null>(null);

  useEffect(() => {
    async function loadUserData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // Load user profile with ratings
        const { data: profileData } = await supabase
          .from('profiles')
          .select('average_rating, total_ratings')
          .eq('id', user.id)
          .single();
        
        if (profileData) {
          setProfile(profileData);
        }

        const userTasks = await listAllTasksForCustomer(user.id);
        setTasks(userTasks);
        
        // Calculate earnings if user is a Wysa
        const userEarnings = await calculateWysaEarnings(user.id);
        setEarnings(userEarnings);
      }
      
      setLoading(false);
    }
    
    loadUserData();
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const completedTasks = tasks.filter(task => 
    ['completed', 'payment_released'].includes(task.status)
  ).length;

  const activeTasks = tasks.filter(task => 
    !['completed', 'payment_released', 'cancelled'].includes(task.status)
  ).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="flex-1 overflow-y-auto">
        {/* Profile Header */}
        <div className="bg-white p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <Avatar className="w-16 h-16">
              <AvatarFallback className="bg-teal-600 text-white text-xl font-semibold">
                {userInitial}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900">{userName}</h2>
              <p className="text-gray-600 text-sm">{user?.email}</p>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center space-x-3">
                  {profile && profile.total_ratings > 0 ? (
                    <RatingDisplay 
                      rating={profile.average_rating} 
                      totalRatings={profile.total_ratings}
                      size="sm"
                    />
                  ) : (
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-gray-400 mr-1" />
                      <span className="text-sm text-gray-500">No ratings yet</span>
                    </div>
                  )}
                </div>
                <div>
                  {profile ? (
                    <RatingBadge 
                      averageRating={profile.average_rating || 0}
                      totalRatings={profile.total_ratings || 0}
                    />
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      Member since 2024
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon">
              <Edit className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="bg-blue-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{activeTasks}</p>
                <p className="text-sm text-gray-600">Active Tasks</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="bg-green-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{completedTasks}</p>
                <p className="text-sm text-gray-600">Completed</p>
              </CardContent>
            </Card>
          </div>

          {earnings > 0 && (
            <Card className="bg-gradient-to-r from-teal-500 to-teal-600">
              <CardContent className="p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90">Total Earnings</p>
                    <p className="text-2xl font-bold">₹{earnings.toLocaleString()}</p>
                  </div>
                  <Briefcase className="h-8 w-8 opacity-80" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Become Wysa CTA */}
          {earnings === 0 && (
            <Card className="bg-gradient-to-r from-purple-500 to-purple-600">
              <CardContent className="p-4 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-semibold mb-1">Become a Wysa</p>
                    <p className="text-sm opacity-90">Start earning by helping others</p>
                  </div>
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={() => router.push('/mobile/become-wysa')}
                  >
                    Apply Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Menu Items */}
        <div className="px-4 space-y-2">
          {profileMenuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Card 
                key={item.href} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => router.push(item.href)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-gray-100 p-2 rounded-lg">
                        <Icon className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{item.label}</p>
                        <p className="text-sm text-gray-600">{item.description}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Sign Out */}
        <div className="p-4 mt-6">
          <Button
            variant="outline"
            onClick={handleSignOut}
            className="w-full border-red-200 text-red-600 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>

        {/* App Info */}
        <div className="p-4 text-center">
          <p className="text-xs text-gray-500">Wysa Mobile v1.0.0</p>
          <p className="text-xs text-gray-500 mt-1">Made with ❤️ in Mangalore</p>
        </div>
      </div>
    </div>
  );
}