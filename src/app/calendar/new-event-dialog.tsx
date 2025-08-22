"use client";

import { useActionState, useEffect, useRef } from 'react';
import { useToast } from "@/hooks/use-toast";
import { createEvent } from './actions';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

const initialState = { success: false, message: "" };

export function NewEventDialog({
  isOpen,
  onOpenChange,
  defaultDate,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  defaultDate: Date | null;
}) {
  const [state, formAction] = useActionState(createEvent, initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      toast({ title: "Success", description: state.message });
      onOpenChange(false);
      formRef.current?.reset();
    } else if (state.message) {
      toast({ title: "Error", description: state.message, variant: "destructive" });
    }
  }, [state, toast, onOpenChange]);

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toISOString().slice(0, 16); // Format for datetime-local input
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Event</DialogTitle>
        </DialogHeader>
        <form ref={formRef} action={formAction}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Event Title</Label>
              <Input id="title" name="title" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="start">Start Date</Label>
              <Input id="start" name="start" type="datetime-local" defaultValue={formatDate(defaultDate)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end">End Date</Label>
              <Input id="end" name="end" type="datetime-local" defaultValue={formatDate(defaultDate)} required />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="allDay" name="allDay" value="true" />
              <Label htmlFor="allDay">All day event</Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">Create Event</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
