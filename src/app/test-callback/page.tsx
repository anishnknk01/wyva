import { Suspense } from "react";
import { TestCallbackContent } from "./test-callback-content";

function TestCallbackFallback() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Test Callback Page</h1>
      <div className="bg-gray-100 border px-4 py-3 rounded mb-4">
        Loading...
      </div>
    </div>
  );
}

export default function TestCallbackPage() {
  return (
    <Suspense fallback={<TestCallbackFallback />}>
      <TestCallbackContent />
    </Suspense>
  );
}