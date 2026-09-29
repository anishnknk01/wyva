// Shared global ambient type declarations.
//
// TypeScript merges every `declare global { interface Window { ... } }`
// block across the project, and requires every merged member to have an
// identical type. Previously two files (pay-task-page.tsx and
// mobile-pay-task.tsx) each declared their own slightly different
// `Window.Razorpay` shape, which TS rejected as conflicting declarations.
// Keeping the single canonical shape here avoids that.

interface RazorpayPaymentResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open: () => void;
  on?: (event: string, handler: (response: RazorpayPaymentResponse) => void) => void;
}

// Minimal Web Speech API surface used by src/hooks/use-search.ts. Not part
// of standard lib.dom.d.ts (still non-standard / vendor-prefixed in most
// browsers), so declared here rather than reaching for `any` at call sites.
interface SpeechRecognitionResultLike {
  transcript: string;
}

interface SpeechRecognitionEventLike extends Event {
  results: { [index: number]: { [index: number]: SpeechRecognitionResultLike } };
}

interface SpeechRecognitionErrorEventLike extends Event {
  error: string;
}

interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => RazorpayInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    SpeechRecognition?: new () => SpeechRecognitionLike;
  }
}

export {};
