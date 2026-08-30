"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function DebugAuthPage() {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getDebugInfo() {
      const supabase = createClient();
      
      // Get current session
      const { data: session, error: sessionError } = await supabase.auth.getSession();
      
      // Get current user
      const { data: user, error: userError } = await supabase.auth.getUser();
      
      // Get environment info
      const envInfo = {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        currentOrigin: typeof window !== 'undefined' ? window.location.origin : 'N/A',
        userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'N/A',
      };

      setDebugInfo({
        session,
        sessionError,
        user,
        userError,
        envInfo,
        timestamp: new Date().toISOString(),
      });
      setLoading(false);
    }

    getDebugInfo();
  }, []);

  if (loading) {
    return <div className="p-8">Loading debug information...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Auth Debug Information</h1>
      
      <div className="space-y-6">
        <section className="border p-4 rounded">
          <h2 className="font-semibold text-lg mb-2">Environment</h2>
          <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
            {JSON.stringify(debugInfo.envInfo, null, 2)}
          </pre>
        </section>

        <section className="border p-4 rounded">
          <h2 className="font-semibold text-lg mb-2">Current Session</h2>
          {debugInfo.sessionError ? (
            <div className="text-red-600">
              <p>Session Error: {debugInfo.sessionError.message}</p>
            </div>
          ) : (
            <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
              {JSON.stringify(debugInfo.session, null, 2)}
            </pre>
          )}
        </section>

        <section className="border p-4 rounded">
          <h2 className="font-semibold text-lg mb-2">Current User</h2>
          {debugInfo.userError ? (
            <div className="text-red-600">
              <p>User Error: {debugInfo.userError.message}</p>
            </div>
          ) : (
            <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
              {JSON.stringify(debugInfo.user, null, 2)}
            </pre>
          )}
        </section>

        <section className="border p-4 rounded">
          <h2 className="font-semibold text-lg mb-2">Expected Redirect URLs</h2>
          <div className="space-y-2 text-sm">
            <p><strong>Local Development:</strong> http://localhost:3000/auth/callback</p>
            <p><strong>Production:</strong> https://your-app.vercel.app/auth/callback</p>
            <p><strong>Current Origin:</strong> {debugInfo.envInfo.currentOrigin}</p>
            <p><strong>Generated Callback URL:</strong> {debugInfo.envInfo.currentOrigin}/auth/callback</p>
          </div>
        </section>
      </div>
    </div>
  );
}