"use client";

import { Smartphone, CreditCard, Wallet } from "lucide-react";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PaymentMethod } from "@/lib/tasks";

export function TaskPaymentMethods({
  method,
  onChangeMethod,
}: {
  method: PaymentMethod;
  onChangeMethod: (method: PaymentMethod) => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <h2 className="font-heading text-lg font-semibold">Payment method</h2>

      <Tabs
        value={method}
        onValueChange={(value) => onChangeMethod(value as PaymentMethod)}
        className="mt-4"
      >
        <TabsList className="h-11 w-full">
          <TabsTrigger value="upi" className="gap-1.5">
            <Smartphone className="size-4" />
            UPI
          </TabsTrigger>
          <TabsTrigger value="card" className="gap-1.5">
            <CreditCard className="size-4" />
            Card
          </TabsTrigger>
          <TabsTrigger value="wallet" className="gap-1.5">
            <Wallet className="size-4" />
            Wallet
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upi" className="mt-5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="upi-id">UPI ID</Label>
            <Input id="upi-id" placeholder="Enter UPI ID" className="h-10" />
          </div>
        </TabsContent>

        <TabsContent value="card" className="mt-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="card-number">Card number</Label>
              <Input
                id="card-number"
                inputMode="numeric"
                placeholder="1234 5678 9012 3456"
                className="h-10"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="card-expiry">MM/YY</Label>
              <Input id="card-expiry" placeholder="MM/YY" className="h-10" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="card-cvv">CVV</Label>
              <Input
                id="card-cvv"
                inputMode="numeric"
                placeholder="123"
                className="h-10"
              />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="card-name">Name on card</Label>
              <Input id="card-name" placeholder="Full name" className="h-10" />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="wallet" className="mt-5">
          <div className="flex items-center justify-between rounded-xl bg-muted/60 p-4">
            <div>
              <p className="text-sm font-medium">WYSA Wallet</p>
              <p className="text-xs text-muted-foreground">Prototype balance</p>
            </div>
            <p className="font-heading text-lg font-bold text-teal">₹2,500</p>
          </div>
        </TabsContent>
      </Tabs>

      <p className="mt-4 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
        Demo payment — no real money will be charged.
      </p>
    </div>
  );
}
