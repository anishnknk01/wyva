"use client";

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function TestCallbackPage() {
  const searchParams = useSearchParams();
  const [info, setInfo] = useState<any>({});

  useEffect(() => {
    // Collect all URL parameters and environment info
    const urlParams: any = {};
    searchParams.forEach((value, key) => {
      urlParams[key] = value;
    });

    const debugInfo = {
      urlParams,
      currentUrl: window.location.href,
      origin: window.location.origin,
      pathname: window.location.pathname,
      search: window.location.search,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    };

    setInfo(debugInfo);
  }, [searchParams]);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Test Callback Page</h1>
      <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
        ✅ Success! This page loaded correctly, which means Safari can reach your server.
      </div>
      
      <div className="space-y-4">
        <section className="border p-4 rounded">
          <h2 className="font-semibold mb-2">Current URL Information</h2>
          <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
{JSON.stringify(info, null, 2)}
          </pre>
        </section>

        <section className="border p-4 rounded">
          <h2 className="font-semibold mb-2">Test Links</h2>
          <div className="space-y-2">
            <div>
              <a 
                href="/auth/callback" 
                className="text-blue-600 hover:underline"
                target="_blank"
              >
                Test /auth/callback (opens in new tab)
              </a>
            </div>
            <div>
              <a 
                href="/auth/callback?code=test123" 
                className="text-blue-600 hover:underline"
                target="_blank"
              >
                Test /auth/callback with test code (opens in new tab)
              </a>
            </div>
            <div>
              <a 
                href="/debug-auth" 
                className="text-blue-600 hover:underline"
                target="_blank"
              >
                Test /debug-auth (opens in new tab)
              </a>
            </div>
          </div>
        </section>

        <section className="border p-4 rounded">
          <h2 className="font-semibold mb-2">Expected Google Redirect URL</h2>
          <p className="font-mono text-sm bg-gray-100 p-2 rounded">
            {typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback
          </p>
        </section>
      </div>
    </div>
  );
}