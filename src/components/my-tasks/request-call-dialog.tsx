"use client";

import { useState } from "react";
import { Phone, ShieldCheck } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function RequestCallDialog({
  otherName,
  open,
  onOpenChange,
}: {
  otherName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [requested, setRequested] = useState(false);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) setRequested(false);
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-1.5">
            <Phone className="size-4 text-coral" />
            Request a call
          </DialogTitle>
          <DialogDescription>
            {otherName} will be notified to call you back through the app.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground">
          <ShieldCheck className="size-4 shrink-0 text-teal" />
          Your personal number stays private.
        </div>

        {requested ? (
          <div className="rounded-xl bg-teal/10 p-3 text-sm text-teal">
            Call request sent. This is a simulated action for the prototype.
          </div>
        ) : (
          <Button className="w-full rounded-full" onClick={() => setRequested(true)}>
            Send call request
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
