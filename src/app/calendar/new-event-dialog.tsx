"use client";

import { useActionState, useEffect, useRef, useState } from 'react';
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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from '@/components/ui/textarea';
import { MultiSelectAutocomplete } from '@/components/ui/multi-select-autocomplete';
import { SingleSelectAutocomplete } from '@/components/ui/single-select-autocomplete';

const initialState = { success: false, message: "", errors: undefined };

interface NewEventDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  defaultDate: Date | null;
  members: string[];
  locations: string[];
}

export function NewEventDialog({
  isOpen,
  onOpenChange,
  defaultDate,
  members,
  locations,
}: NewEventDialogProps) {
  const [state, formAction, isPending] = useActionState(createEvent, initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const [isDirty, setIsDirty] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  useEffect(() => {
    if (state.success) {
      toast({ title: "Success", description: state.message });
      router.refresh();
      onOpenChange(false);
    } else if (state.message && !state.errors) {
      toast({ title: "Error", description: state.message, variant: "destructive" });
    }
  }, [state, toast, onOpenChange, router]);
  
  useEffect(() => {
    if (!isOpen) {
        formRef.current?.reset();
        setIsDirty(false);
    }
  }, [isOpen]);

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && isDirty) {
      setIsConfirmOpen(true);
    } else {
      onOpenChange(open);
    }
  };
  
  const handleFormChange = () => {
      setIsDirty(true);
  }
  
  const handleCancel = () => {
      if (isDirty) {
          setIsConfirmOpen(true);
      } else {
          onOpenChange(false);
      }
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formAction(formData);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Event</DialogTitle>
          </DialogHeader>
          <form ref={formRef} onSubmit={handleSubmit} onChange={handleFormChange} className="space-y-4">
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Event Title</Label>
                <Input id="title" name="title" required />
                {state.errors?.title && <p className="text-red-500 text-sm">{state.errors.title[0]}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" />
              </div>
               <div className="space-y-2">
                  <Label htmlFor="members">Members</Label>
                  <MultiSelectAutocomplete
                      options={members}
                      placeholder="Select members..."
                      name="members"
                  />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <SingleSelectAutocomplete
                    options={locations}
                    placeholder="Select or create a location..."
                    name="location"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start">Start Date</Label>
                    <Input id="start" name="start" type="datetime-local" defaultValue={formatDate(defaultDate)} required />
                    {state.errors?.start && <p className="text-red-500 text-sm">{state.errors.start[0]}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end">End Date</Label>
                    <Input id="end" name="end" type="datetime-local" defaultValue={formatDate(defaultDate)} required />
                    {state.errors?.end && <p className="text-red-500 text-sm">{state.errors.end[0]}</p>}
                  </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="allDay" name="allDay" value="true" />
                <Label htmlFor="allDay">All day event</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCancel}>Cancel</Button>
              <Button type="submit" disabled={isPending}>{isPending ? "Creating..." : "Create Event"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Discard changes?</AlertDialogTitle>
                  <AlertDialogDescription>
                      You have unsaved changes. Are you sure you want to discard them?
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => {
                      onOpenChange(false);
                      setIsConfirmOpen(false);
                  }}>
                      Discard
                  </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
