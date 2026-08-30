"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function TestAuthPage() {
  const [status, setStatus] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [tables, setTables] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient();
      
      // Check session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      // Check user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      // Try to query tasks table
      const { data: tasksData, error: tasksError } = await supabase
        .from("tasks")
        .select("id")
        .limit(1);
      
      // Try to query profiles table
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id")
        .limit(1);
      
      setStatus({
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        session: session ? "Active" : "None",
        sessionError,
        userError,
      });
      
      setTables({
        tasks: {
          exists: !tasksError,
          error: tasksError?.message,
          errorCode: tasksError?.code,
        },
        profiles: {
          exists: !profilesError,
          error: profilesError?.message,
          errorCode: profilesError?.code,
        },
      });
      
      setUser(user);
      setLoading(false);
    }
    
    checkAuth();
  }, []);

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-3xl font-bold">Authentication & Database Test</h1>
        
        <div className="mb-6 rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-xl font-semibold">Supabase Config</h2>
          <pre className="overflow-auto rounded bg-muted p-4 text-sm">
            {JSON.stringify(status, null, 2)}
          </pre>
        </div>
        
        <div className="mb-6 rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-xl font-semibold">Database Tables</h2>
          {tables.tasks.exists ? (
            <div className="mb-4 rounded bg-green-500/10 p-3 text-green-700 dark:text-green-300">
              ✅ Tasks table exists!
            </div>
          ) : (
            <div className="mb-4 rounded bg-red-500/10 p-3 text-red-700 dark:text-red-300">
              ❌ Tasks table NOT found
              <div className="mt-2 text-sm">
                Error: {tables.tasks.error}
                <br />
                Code: {tables.tasks.errorCode}
              </div>
            </div>
          )}
          
          {tables.profiles.exists ? (
            <div className="rounded bg-green-500/10 p-3 text-green-700 dark:text-green-300">
              ✅ Profiles table exists!
            </div>
          ) : (
            <div className="rounded bg-red-500/10 p-3 text-red-700 dark:text-red-300">
              ❌ Profiles table NOT found
              <div className="mt-2 text-sm">
                Error: {tables.profiles.error}
                <br />
                Code: {tables.profiles.errorCode}
              </div>
            </div>
          )}
          
          <div className="mt-4 rounded bg-yellow-500/10 p-3 text-sm text-yellow-700 dark:text-yellow-300">
            <strong>If tables don't exist:</strong>
            <ol className="ml-4 mt-2 list-decimal space-y-1">
              <li>Open: <a href="https://supabase.com/dashboard/project/bcsylldvbwgmzevrjnfa/sql/new" target="_blank" rel="noopener" className="underline">Supabase SQL Editor</a></li>
              <li>Copy SQL from: <code>CREATE_DATABASE_TABLES.md</code></li>
              <li>Paste and click RUN</li>
              <li>Refresh this page</li>
            </ol>
          </div>
        </div>
        
        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-xl font-semibold">Current User</h2>
          {user ? (
            <pre className="overflow-auto rounded bg-muted p-4 text-sm">
              {JSON.stringify(user, null, 2)}
            </pre>
          ) : (
            <p className="text-muted-foreground">Not logged in</p>
          )}
        </div>

        <div className="mt-6 flex gap-4">
          <a 
            href="/login"
            className="rounded-lg bg-primary px-6 py-3 text-primary-foreground hover:bg-primary/90"
          >
            Go to Login
          </a>
          <a 
            href="/create-task"
            className="rounded-lg border bg-background px-6 py-3 hover:bg-accent"
          >
            Go to Create Task
          </a>
        </div>
      </div>
    </div>
  );
}
