"use client";

import { useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { toast } from "sonner";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { TaskPaymentSummary } from "@/components/pay-task/task-payment-summary";
import { TaskPaymentMethods } from "@/components/pay-task/task-payment-methods";
import { TaskPaymentSecurity } from "@/components/pay-task/task-payment-security";
import { formatCurrency, type PaymentMethod } from "@/lib/tasks";
import type { Task } from "@/lib/task-store";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void;
    };
  }
}

export function PayTaskPage({ task }: { task: Task }) {
  const [method, setMethod] = useState<PaymentMethod>("upi");
  const [isPaying, setIsPaying] = useState(false);
  const [secured, setSecured] = useState(task.status !== "payment_pending");

  async function handlePay() {
    setIsPaying(true);
    try {
      // Same-origin fetch, so the browser sends the Supabase auth session
      // cookie automatically — the API route reads it server-side.
      const orderRes = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: task.id }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        throw new Error(orderData.error ?? "Could not start payment");
      }

      const razorpay = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        order_id: orderData.orderId,
        name: "WYSA",
        description: task.title,
        prefill: {},
        theme: { color: "#e35d47" },
        method: {
          upi: method === "upi",
          card: method === "card",
          wallet: method === "wallet",
        },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          const verifyRes = await fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              taskId: task.id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              paymentMethod: method,
            }),
          });
          const verifyData = await verifyRes.json();
          setIsPaying(false);
          if (!verifyRes.ok) {
            toast.error("Payment could not be verified", {
              description: verifyData.error,
            });
            return;
          }
          toast.success("Payment secured");
          setSecured(true);
        },
        modal: {
          ondismiss: () => setIsPaying(false),
        },
      });
      razorpay.open();
    } catch (err) {
      setIsPaying(false);
      toast.error("Payment failed", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    }
  }

  if (secured) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center sm:px-6">
        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-teal/10 text-teal">
          <ShieldCheck className="size-8" />
        </span>
        <h1 className="mt-4 font-heading text-2xl font-bold sm:text-3xl">
          Payment secured
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your payment is being held until the task is completed. This is
          only a prototype simulation, not real escrow.
        </p>
        <Button
          size="lg"
          className="mt-6 w-full rounded-full"
          render={<Link href={`/task-posted/${task.id}`} />}
        >
          Continue
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <Link
        href="/create-task"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to task
      </Link>

      <h1 className="font-heading text-2xl font-bold sm:text-3xl">
        Secure your task
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Your payment is held by the platform until the task is marked done.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-6 pb-24 lg:grid-cols-[1fr_360px] lg:pb-0">
        <div className="order-2 flex flex-col gap-5 lg:order-1">
          <TaskPaymentMethods method={method} onChangeMethod={setMethod} />
          <TaskPaymentSecurity />
        </div>

        <div className="order-1 flex flex-col gap-4 lg:order-2 lg:sticky lg:top-20 lg:self-start">
          <TaskPaymentSummary task={task} />

          <Button
            size="lg"
            disabled={isPaying}
            onClick={handlePay}
            className="hidden h-12 w-full rounded-full text-base lg:flex"
          >
            {isPaying ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Processing payment...
              </>
            ) : (
              `Pay ${formatCurrency(task.total)}`
            )}
          </Button>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-4 backdrop-blur-md lg:hidden">
        <Button
          size="lg"
          disabled={isPaying}
          onClick={handlePay}
          className="h-12 w-full rounded-full text-base"
        >
          {isPaying ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Processing payment...
            </>
          ) : (
            `Pay ${formatCurrency(task.total)}`
          )}
        </Button>
      </div>
    </div>
  );
}
