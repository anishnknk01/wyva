"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LogOut, Edit, Save, X, Star, FileText, CheckCircle, IndianRupee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { signOut } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/client";
import { listAllTasksForCustomer } from "@/lib/task-store";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import type { Task } from "@/lib/task-store";

type ProfileRow = {
  full_name: string;
  phone: string | null;
  average_rating: number | null;
  total_ratings: number | null;
  role: string | null;
};

export function DashboardProfile() {
  const router = useRouter();
  const [user,    setUser]    = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [tasks,   setTasks]   = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [nameInput,  setNameInput]  = useState("");
  const [phoneInput, setPhoneInput] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data: p } = await supabase
          .from("profiles")
          .select("full_name, phone, average_rating, total_ratings, role")
          .eq("id", user.id).single();
        if (p) { setProfile(p); setNameInput(p.full_name ?? ""); setPhoneInput(p.phone ?? ""); }
        setTasks(await listAllTasksForCustomer(user.id));
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleSave() {
    if (!user || !nameInput.trim()) { toast.error("Name can't be empty"); return; }
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("profiles")
      .update({ full_name: nameInput.trim(), phone: phoneInput.trim() || null })
      .eq("id", user.id);
    setSaving(false);
    if (error) { toast.error("Couldn't save changes"); return; }
    setProfile(prev => prev ? { ...prev, full_name: nameInput.trim(), phone: phoneInput.trim() || null } : prev);
    setEditing(false);
    toast.success("Profile updated");
  }

  const completedTasks = tasks.filter(t => ["completed","payment_released"].includes(t.status));
  const activeTasks    = tasks.filter(t => !["completed","payment_released","cancelled"].includes(t.status));
  const totalSpent     = completedTasks.reduce((s, t) => s + (t.total ?? 0), 0);

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-b-2 border-teal-600" /></div>;
  }

  const name    = profile?.full_name || user?.email?.split("@")[0] || "User";
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      {/* Header card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Avatar className="w-20 h-20">
              <AvatarFallback className="bg-teal-600 text-white text-2xl font-bold">{initial}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              {editing ? (
                <div className="space-y-3 max-w-sm">
                  <div className="flex flex-col gap-1.5">
                    <Label>Full name</Label>
                    <Input value={nameInput} onChange={e => setNameInput(e.target.value)} className="h-10" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Phone</Label>
                    <Input type="tel" value={phoneInput} onChange={e => setPhoneInput(e.target.value)} placeholder="+91" className="h-10" />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSave} disabled={saving} className="bg-teal-600 hover:bg-teal-700">
                      <Save className="h-4 w-4 mr-1" />{saving ? "Saving…" : "Save"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditing(false)} disabled={saving}>
                      <X className="h-4 w-4 mr-1" />Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-gray-900">{name}</h1>
                    <Badge className="border-teal-200 bg-teal-50 text-teal-700 text-xs">Customer</Badge>
                    <Button variant="ghost" size="icon" onClick={() => setEditing(true)}><Edit className="h-4 w-4" /></Button>
                  </div>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                  {profile?.phone && <p className="text-sm text-gray-500">{profile.phone}</p>}
                  {profile && (profile.average_rating ?? 0) > 0 && (
                    <div className="flex items-center gap-1 mt-2">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{profile.average_rating?.toFixed(1)}</span>
                      <span className="text-xs text-gray-400">({profile.total_ratings} ratings)</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats — customer focused */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="bg-blue-50 w-11 h-11 rounded-full flex items-center justify-center mx-auto mb-2">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{activeTasks.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">Active Tasks</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="bg-green-50 w-11 h-11 rounded-full flex items-center justify-center mx-auto mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{completedTasks.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="bg-purple-50 w-11 h-11 rounded-full flex items-center justify-center mx-auto mb-2">
              <IndianRupee className="h-5 w-5 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">₹{totalSpent.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-0.5">Total Spent</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <Card>
        <CardContent className="p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h2>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white" onClick={() => router.push("/create-task")}>
              Post a Task
            </Button>
            <Button size="sm" variant="outline" onClick={() => router.push("/my-tasks")}>My Tasks</Button>
            <Button size="sm" variant="outline" onClick={() => router.push("/messages")}>Messages</Button>
            <Button size="sm" variant="outline" onClick={() => router.push("/payments")}>Payments</Button>
          </div>
        </CardContent>
      </Card>

      {/* Sign out */}
      <Button variant="outline" onClick={async () => { await signOut(); router.push("/login"); }}
        className="border-red-200 text-red-600 hover:bg-red-50">
        <LogOut className="h-4 w-4 mr-2" /> Sign Out
      </Button>
    </div>
  );
}
