"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  Briefcase, 
  LayoutDashboard, 
  Search, 
  Filter,
  MapPin,
  Users,
  Plus
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TaskCard } from "@/components/tasks/task-card";
import { TaskCardSkeleton } from "@/components/tasks/task-card-skeleton";
import { TasksEmptyState } from "@/components/tasks/tasks-empty-state";
import { taskCategories, taskAreas } from "@/lib/tasks";
import { listAvailableTasks, type Task } from "@/lib/task-store";

export function TasksPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("Any category");
  const [area, setArea] = useState("Any area");
  // Pre-fill from the ?q= param so search bars elsewhere (dashboard header,
  // homepage hero) can deep-link straight into a filtered task search.
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") ?? "");

  useEffect(() => {
    let active = true;
    listAvailableTasks().then((loaded) => {
      if (active) {
        setTasks(loaded);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    return tasks.filter((task) => {
      if (category !== "Any category" && task.category !== category) return false;
      if (area !== "Any area" && task.area !== area) return false;
      if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !task.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [tasks, category, area, searchQuery]);

  function handleView(task: Task) {
    router.push(`/tasks/${task.id}`);
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Find Tasks</h1>
              <p className="text-gray-600 mt-1">Discover tasks posted by people in Mangalore</p>
            </div>
            <Button 
              className="bg-teal-600 hover:bg-teal-700"
              render={<Link href="/create-task" />}
            >
              <Plus className="h-4 w-4 mr-2" />
              Post a Task
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Available Tasks</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {loading ? "..." : filtered.length}
                    </p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-xl">
                    <Briefcase className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Areas</p>
                    <p className="text-2xl font-bold text-gray-900">{taskAreas.length - 1}</p>
                  </div>
                  <div className="bg-teal-50 p-3 rounded-xl">
                    <MapPin className="h-6 w-6 text-teal-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Categories</p>
                    <p className="text-2xl font-bold text-gray-900">{taskCategories.length}</p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-xl">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center">
                  <Filter className="h-5 w-5 mr-2 text-teal-600" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Search Tasks
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by title or description..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Category Filter */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Category
                  </label>
                  <Select value={category} onValueChange={(v) => setCategory(v ?? "Any category")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Any category">Any category</SelectItem>
                      {taskCategories.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Area Filter */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Area
                  </label>
                  <Select value={area} onValueChange={(v) => setArea(v ?? "Any area")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Any area">Any area</SelectItem>
                      {taskAreas.map((a) => (
                        <SelectItem key={a} value={a}>
                          {a}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Quick Actions */}
                <div className="pt-4 border-t">
                  <Button 
                    variant="outline" 
                    className="w-full mb-2"
                    render={<Link href="/wysa-tasks" />}
                  >
                    My Wysa Tasks
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tasks Grid */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">
                    Available Tasks
                  </CardTitle>
                  <p className="text-sm text-gray-500">
                    {loading
                      ? "Loading..."
                      : `${filtered.length} task${filtered.length === 1 ? "" : "s"} found`}
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {loading ? (
                    Array.from({ length: 4 }).map((_, i) => <TaskCardSkeleton key={i} />)
                  ) : filtered.length === 0 ? (
                    <div className="md:col-span-2">
                      <TasksEmptyState />
                    </div>
                  ) : (
                    filtered.map((task) => (
                      <TaskCard key={task.id} task={task} onView={handleView} />
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
