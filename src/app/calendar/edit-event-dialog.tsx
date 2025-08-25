"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { updateEvent, deleteEvent, CalendarEvent } from './actions';
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
import { Trash2 } from 'lucide-react';
import { db } from "@/lib/firebase";
import { doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { getAnonymousUser } from '@/lib/anonymous-animals';

const initialState = { success: false, message: "" };

interface EditEventDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  event: CalendarEvent | null;
  members: string[];
  locations: string[];
}

export function EditEventDialog({
  isOpen,
  onOpenChange,
  event,
  members,
  locations,
}: EditEventDialogProps) {
  const [state, formAction] = useActionState(updateEvent, initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [currentUser] = useState(getAnonymousUser());
  
  useEffect(() => {
    if (event?.id) {
        const presenceRef = doc(db, 'presence', event.id);

        if (isOpen) {
            // --- (1) ADD avatarUrl TO THE PRESENCE DATA ---
            setDoc(presenceRef, {
                userId: currentUser.id,
                userName: currentUser.name,
                avatarUrl: currentUser.avatarUrl, // <-- ADDED THIS LINE
                lastSeen: serverTimestamp(),
            }).catch(console.error);

            return () => {
                deleteDoc(presenceRef).catch(console.error);
            };
        }
    }
  }, [isOpen, event, currentUser]);


  useEffect(() => {
    if (state.success) {
      toast({ title: "Success", description: state.message });
      router.refresh();
      onOpenChange(false);
    } else if (state.message) {
      toast({ title: "Error", description: state.message, variant: "destructive" });
    }
  }, [state, toast, onOpenChange, router]);
  
  const handleDeleteConfirm = () => {
      if(event) {
          startTransition(async () => {
              const result = await deleteEvent(event.id);
              if (result.success) {
                  toast({ title: "Success", description: result.message });
                  router.refresh();
                  onOpenChange(false);
              } else {
                  toast({ title: "Error", description: result.message, variant: "destructive" });
              }
              setIsDeleteAlertOpen(false);
          });
      }
  }

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  if (!event) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
          </DialogHeader>
          <form ref={formRef} action={formAction}>
            <input type="hidden" name="id" value={event.id} />
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Event Title</Label>
                <Input id="title" name="title" defaultValue={event.title} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" defaultValue={event.description} />
              </div>
               <div className="space-y-2">
                  <Label htmlFor="members">Members</Label>
                  <MultiSelectAutocomplete
                      options={members}
                      placeholder="Select members..."
                      name="members"
                      initialValue={event.members}
                  />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" name="location" list="location-options" defaultValue={event.location} />
                <datalist id="location-options">
                  {locations.map((loc, i) => <option key={i} value={loc} />)}
                </datalist>
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start">Start Date</Label>
                    <Input id="start" name="start" type="datetime-local" defaultValue={formatDate(event.start)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end">End Date</Label>
                    <Input id="end" name="end" type="datetime-local" defaultValue={formatDate(event.end)} required />
                  </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="allDay" name="allDay" value="true" defaultChecked={event.allDay} />
                <Label htmlFor="allDay">All day event</Label>
              </div>
            </div>
            <DialogFooter className="justify-between">
              <Button type="button" variant="destructive" size="icon" onClick={() => setIsDeleteAlertOpen(true)}>
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete Event</span>
              </Button>
              <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                  <Button type="submit">Save Changes</Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete this event.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteConfirm} disabled={isPending}>
                      {isPending ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
