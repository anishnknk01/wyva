"use client";

import { useEffect, useState } from "react";
import { IndianRupee, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { RoleLayout }        from "@/components/layout/role-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge }             from "@/components/ui/badge";
import { createClient }      from "@/lib/supabase/client";

type PaymentRow = {
  id: string; title: string; total: number;
  status: string; role: "paid" | "earned"; date: string;
};

function PaymentsContent() {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const [{ data: paidTasks }, { data: earnedTasks }] = await Promise.all([
        supabase.from("tasks").select("id,title,total,status,updated_at")
          .eq("customer_id", user.id).not("payment_method", "is", null)
          .order("updated_at", { ascending: false }),
        supabase.from("tasks").select("id,title,total,status,updated_at")
          .eq("accepted_wysa_id", user.id).eq("status", "payment_released")
          .order("updated_at", { ascending: false }),
      ]);

      const rows: PaymentRow[] = [
        ...(paidTasks ?? []).map((t: any) => ({ id: t.id, title: t.title, total: t.total, status: t.status, role: "paid" as const, date: t.updated_at })),
        ...(earnedTasks ?? []).map((t: any) => ({ id: t.id, title: t.title, total: t.total, status: t.status, role: "earned" as const, date: t.updated_at })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setPayments(rows);
      setLoading(false);
    }
    load();
  }, []);

  const totalPaid   = payments.filter(p => p.role === "paid").reduce((s, p) => s + p.total, 0);
  const totalEarned = payments.filter(p => p.role === "earned").reduce((s, p) => s + p.total, 0);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Payments</h1>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1"><ArrowUpRight className="h-4 w-4 text-red-500" /><span className="text-sm">Total spent</span></div>
          <p className="text-2xl font-bold text-gray-900">₹{totalPaid.toLocaleString()}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1"><ArrowDownLeft className="h-4 w-4 text-green-500" /><span className="text-sm">Total earned</span></div>
          <p className="text-2xl font-bold text-gray-900">₹{totalEarned.toLocaleString()}</p>
        </CardContent></Card>
      </div>
      {loading ? <p className="text-sm text-gray-400">Loading…</p>
       : payments.length === 0 ? <p className="text-sm text-gray-400">No payment history yet.</p>
       : (
        <div className="space-y-2">
          {payments.map(p => (
            <Card key={`${p.role}-${p.id}`}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${p.role === "paid" ? "bg-red-50" : "bg-green-50"}`}>
                    {p.role === "paid" ? <ArrowUpRight className="h-4 w-4 text-red-500" /> : <ArrowDownLeft className="h-4 w-4 text-green-500" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{p.title}</p>
                    <p className="text-xs text-gray-400">{new Date(p.date).toLocaleDateString("en-IN")} · {p.role === "paid" ? "Paid" : "Received"}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${p.role === "paid" ? "text-red-600" : "text-green-600"}`}>
                    {p.role === "paid" ? "-" : "+"}₹{p.total}
                  </p>
                  <Badge variant="secondary" className="text-xs">{p.status.replace(/_/g, " ")}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PaymentsPage() {
  return <RoleLayout><PaymentsContent /></RoleLayout>;
}
