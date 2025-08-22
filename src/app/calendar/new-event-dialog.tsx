"use client";

import { useActionState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
import { Textarea } from '@/components/ui/textarea';
import { MultiSelectAutocomplete } from '@/components/ui/multi-select-autocomplete';

const initialState = { success: false, message: "" };

interface NewEventDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  defaultDate: Date | null;
  members: string[]; // Changed from assignees
  locations: string[];
}

export function NewEventDialog({
  isOpen,
  onOpenChange,
  defaultDate,
  members, // Changed from assignees
  locations,
}: NewEventDialogProps) {
  const [state, formAction] = useActionState(createEvent, initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast({ title: "Success", description: state.message });
      router.refresh();
      onOpenChange(false);
      formRef.current?.reset();
    } else if (state.message) {
      toast({ title: "Error", description: state.message, variant: "destructive" });
    }
  }, [state, toast, onOpenChange, router]);

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
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
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" />
            </div>
             <div className="space-y-2">
                <Label htmlFor="members">Members</Label>
                <MultiSelectAutocomplete
                    options={members} // Use members prop
                    placeholder="Select members..."
                    name="members"
                />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" name="location" list="location-options" />
              <datalist id="location-options">
                {locations.map((loc, i) => <option key={i} value={loc} />)}
              </datalist>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start">Start Date</Label>
                  <Input id="start" name="start" type="datetime-local" defaultValue={formatDate(defaultDate)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end">End Date</Label>
                  <Input id="end" name="end" type="datetime-local" defaultValue={formatDate(defaultDate)} required />
                </div>
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
