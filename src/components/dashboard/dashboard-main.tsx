"use client";

import { useState, useEffect } from 'react';
import Link from "next/link";
import { Plus, ArrowRight, Calendar, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardStats } from './dashboard-stats';
import { DashboardCalendar } from './dashboard-calendar';
import { RecentActivity } from './recent-activity';
import { UpcomingTasks } from './upcoming-tasks';
import type { User } from "@supabase/supabase-js";

interface DashboardMainProps {
  user: User | null;
}

export function DashboardMain({ user }: DashboardMainProps) {
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

  return (
    <main className="flex-1 overflow-y-auto bg-gray-50">
      <div className="p-6">
        {/* Welcome Section */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              Welcome back, {userName}! 
              <span className="ml-2 text-2xl">👋</span>
            </h1>
            <p className="text-gray-600 mt-1">Here's what's happening with your tasks today.</p>
          </div>
          
          <Button className="bg-teal-600 hover:bg-teal-700" render={<Link href="/create-task" />}>
            <Plus className="mr-2 h-4 w-4" />
            Post a New Task
          </Button>
        </div>

        {/* Stats Cards */}
        <DashboardStats />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          {/* Left Column - Tasks */}
          <div className="lg:col-span-2 space-y-6">
            {/* My Tasks Section */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-semibold">My Tasks</CardTitle>
                <Link 
                  href="/my-tasks"
                  className="text-sm text-teal-600 hover:text-teal-700 flex items-center"
                >
                  View All
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </CardHeader>
              <CardContent>
                <div className="border-b border-gray-200 mb-4">
                  <nav className="-mb-px flex space-x-8">
                    <button className="border-transparent text-teal-600 border-b-2 border-teal-600 py-2 px-1 text-sm font-medium">
                      All (3)
                    </button>
                    <button className="border-transparent text-gray-500 hover:text-gray-700 py-2 px-1 text-sm font-medium">
                      Pending (1)
                    </button>
                    <button className="border-transparent text-gray-500 hover:text-gray-700 py-2 px-1 text-sm font-medium">
                      Accepted (1)
                    </button>
                    <button className="border-transparent text-gray-500 hover:text-gray-700 py-2 px-1 text-sm font-medium">
                      Completed (1)
                    </button>
                  </nav>
                </div>

                {/* Sample Tasks */}
                <div className="space-y-4">
                  <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <div className="h-8 w-8 bg-red-100 rounded flex items-center justify-center mr-3">
                            <span className="text-red-600 text-xs">🏥</span>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">Need help taking my grandmother to the hospital</h4>
                            <span className="inline-block bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full mt-1">
                              Waiting for Wysa
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center text-sm text-gray-500 space-x-4">
                          <span className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            Bajal, Mangalore
                          </span>
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            5 September 2026
                          </span>
                          <span className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            5:00 PM
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">Yes I have made it happen</p>
                        <p className="text-lg font-semibold text-gray-900 mt-2">₹500</p>
                      </div>
                      <Button variant="outline" size="sm">
                        View Details
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <div className="h-8 w-8 bg-blue-100 rounded flex items-center justify-center mr-3">
                            <span className="text-blue-600 text-xs">🛒</span>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">Grocery shopping assistance</h4>
                            <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full mt-1">
                              Accepted
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center text-sm text-gray-500 space-x-4">
                          <span className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            Falnir, Mangalore
                          </span>
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            7 September 2026
                          </span>
                          <span className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            11:00 AM
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">Need someone to help buy groceries for my home.</p>
                        <p className="text-lg font-semibold text-gray-900 mt-2">₹300</p>
                      </div>
                      <Button variant="outline" size="sm">
                        View Details
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Calendar and Activity */}
          <div className="space-y-6">
            <DashboardCalendar />
            <UpcomingTasks />
            <RecentActivity />
          </div>
        </div>
      </div>
    </main>
  );
}