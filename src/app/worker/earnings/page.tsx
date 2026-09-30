"use client";

import { useState, useEffect, useCallback } from "react";
import { WorkerSidebar } from "@/components/worker/worker-sidebar";
import { WorkerHeader }  from "@/components/worker/worker-header";
import { useAuthGuard }  from "@/lib/auth-guard";
import { createClient }  from "@/lib/supabase/client";
import { IndianRupee, ArrowDownLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function WorkerEarningsPage() {
  const { user, loading: authLoading } = useAuthGuard();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [payments, setPayments] = useState<any[]>([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    const supabase = createClient();
    const { data } = await supabase.from("tasks")
      .select("id, title, total, status, updated_at")
      .eq("accepted_wysa_id", user.id)
      .eq("status", "payment_released")
      .order("updated_at", { ascending: false });
    setPayments(data ?? []);
    setTotal((data ?? []).reduce((s: number, t: any) => s + t.total, 0));
    setLoading(false);
  }, [user]);

  useEffect(() => { if (user) load(); }, [user, load]);

  if (authLoading) return <div className="flex h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-b-2 border-purple-600" /></div>;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <WorkerSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col min-w-0">
        <WorkerHeader user={user} setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 overflow-y-auto p-6 max-w-3xl">
          <h1 className="mb-6 text-xl font-bold text-gray-900">Earnings</h1>
          <Card className="mb-6 bg-gradient-to-r from-purple-600 to-purple-700">
            <CardContent className="p-5 text-white">
              <p className="text-sm opacity-80">Total Earnings</p>
              <p className="mt-1 text-3xl font-bold">₹{total.toLocaleString()}</p>
            </CardContent>
          </Card>
          {loading ? <p className="text-sm text-gray-400">Loading…</p> : payments.length === 0 ? (
            <p className="text-sm text-gray-400">No payments received yet.</p>
          ) : (
            <div className="space-y-2">
              {payments.map((p: any) => (
                <Card key={p.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-green-50 p-2"><ArrowDownLeft className="h-4 w-4 text-green-500" /></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{p.title}</p>
                        <p className="text-xs text-gray-400">{new Date(p.updated_at).toLocaleDateString("en-IN")}</p>
                      </div>
                    </div>
                    <p className="font-semibold text-green-600">+₹{p.total}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
export default WorkerEarningsPage;
