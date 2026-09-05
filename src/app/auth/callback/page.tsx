"use client";

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function CallbackPage() {
  const searchParams = useSearchParams();
  const [info, setInfo] = useState<any>({});

  useEffect(() => {
    const urlParams: any = {};
    searchParams.forEach((value, key) => {
      urlParams[key] = value;
    });

    setInfo({
      urlParams,
      currentUrl: window.location.href,
      timestamp: new Date().toISOString(),
    });

    // If there's a code, we could handle the OAuth flow here
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    
    if (code) {
      console.log('OAuth code received:', code);
    }
    
    if (error) {
      console.error('OAuth error received:', error);
    }
  }, [searchParams]);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Auth Callback Debug Page</h1>
      <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
        ✅ Success! The /auth/callback route is working.
      </div>
      
      <div className="space-y-4">
        <section className="border p-4 rounded">
          <h2 className="font-semibold mb-2">URL Parameters Received</h2>
          <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
{JSON.stringify(info, null, 2)}
          </pre>
        </section>

        <section className="border p-4 rounded">
          <h2 className="font-semibold mb-2">What this means:</h2>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>If you see this page, the /auth/callback route exists and works</li>
            <li>If there's a 'code' parameter, Google OAuth redirected here successfully</li>
            <li>If there's an 'error' parameter, something went wrong in the OAuth flow</li>
            <li>If there are no parameters, you accessed this URL directly</li>
          </ul>
        </section>

        <section className="border p-4 rounded">
          <h2 className="font-semibold mb-2">Next Steps:</h2>
          <div className="space-y-2 text-sm">
            <p>1. If this page loads, your server is working correctly</p>
            <p>2. Add this exact URL to Google Console: <code className="bg-gray-100 px-1 rounded">{typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback</code></p>
            <p>3. Try Google login again</p>
          </div>
        </section>
      </div>
    </div>
  );
}