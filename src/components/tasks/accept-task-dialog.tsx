"use client";

import { Handshake } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function AcceptTaskDialog({
  open,
  onOpenChange,
  onConfirmAccept,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmAccept: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-1.5">
            <Handshake className="size-4 text-coral" />
            Accept this task?
          </DialogTitle>
          <DialogDescription>
            You&apos;ll be committing to this task if the customer confirms.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            className="flex-1 rounded-full"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button className="flex-1 rounded-full" onClick={onConfirmAccept}>
            Accept task
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
