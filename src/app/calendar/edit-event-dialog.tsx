"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { updateEvent, deleteEvent, CalendarEvent, getAllTasksWithProjectDetails, TaskWithProjectDetails } from './actions';
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
import { LoadingButton } from "@/components/ui/loading-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from '@/components/ui/textarea';
import { MultiSelectAutocomplete } from '@/components/ui/multi-select-autocomplete';
import { SingleSelectAutocomplete } from '@/components/ui/single-select-autocomplete';
import { Trash2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, setDoc, updateDoc, deleteField, serverTimestamp } from "firebase/firestore";
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
  const [state, formAction, isSaving] = useActionState(updateEvent, initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [tasks, setTasks] = useState<TaskWithProjectDetails[]>([]);
  const [selectedTask, setSelectedTask] = useState<TaskWithProjectDetails | null>(null);

  const [currentUser] = useState(getAnonymousUser());

  // State for unsaved changes warning
  const [isDirty, setIsDirty] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  useEffect(() => {
    if (event?.id) {
      const presenceRef = doc(db, 'presence', event.id);

      if (isOpen) {
        const editorData = {
          userName: currentUser.name,
          avatarUrl: currentUser.avatarUrl,
          lastSeen: serverTimestamp(),
        };
        setDoc(presenceRef, { editors: { [currentUser.id]: editorData } }, { merge: true })
          .catch(console.error);

        return () => {
          updateDoc(presenceRef, {
            [`editors.${currentUser.id}`]: deleteField()
          }).catch(console.error);
        };
      }
    }
  }, [isOpen, event, currentUser]);


  useEffect(() => {
    if (state.success) {
      toast({ title: "Success", description: state.message });
      router.refresh();
      onOpenChange(false);
      setIsDirty(false); // Reset dirty state on successful save
    } else if (state.message) {
      toast({ title: "Error", description: state.message, variant: "destructive" });
    }
  }, [state, toast, onOpenChange, router]);

  useEffect(() => {
    if (isOpen) {
      const fetchTasks = async () => {
        const fetchedTasks = await getAllTasksWithProjectDetails();
        setTasks(fetchedTasks);

        // Set initial selected task if event has one
        if (event?.relatedTask) {
          const initialTask = fetchedTasks.find(t => t.id === event.relatedTask?.id);
          setSelectedTask(initialTask || null);
        }
      };
      fetchTasks();
    }
  }, [isOpen, event]);

  // Reset dirty state when dialog opens or event changes
  useEffect(() => {
    if (isOpen && event) {
      setIsDirty(false);
    }
  }, [isOpen, event]);

  const handleDeleteConfirm = () => {
    if (event) {
      startTransition(async () => {
        const result = await deleteEvent(event.id);
        if (result.success) {
          toast({ title: "Success", description: result.message });
          router.refresh();
          onOpenChange(false);
          setIsDirty(false); // Reset dirty state on successful delete
        } else {
          toast({ title: "Error", description: result.message, variant: "destructive" });
        }
        setIsDeleteAlertOpen(false);
      });
    }
  }

  // Formats date to 'YYYY-MM-DD' for date input type in local time
  const formatDateToYYYYMMDD = (date: Date | null) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Formats time to 'HH:mm' for time input type in local time
  const formatTimeToHHMM = (date: Date | null) => {
    if (!date) return '';
    const d = new Date(date);
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  if (!event) return null;

  const handleOpenChangeInternal = (open: boolean) => {
    if (!open && isDirty) {
      setIsConfirmOpen(true);
    } else {
      onOpenChange(open);
    }
  };

  const handleFormChange = () => {
    setIsDirty(true);
  };

  const handleCancel = () => {
    if (isDirty) {
      setIsConfirmOpen(true);
    } else {
      onOpenChange(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const startDate = formData.get('startDate') as string;
    const startTime = formData.get('startTime') as string;
    const endDate = formData.get('endDate') as string;
    const endTime = formData.get('endTime') as string;

    // Combine date and time, treating them as local inputs
    // Then convert to UTC for consistent storage.
    if (startDate && startTime) {
      const startDateTimeLocalString = `${startDate}T${startTime}`;
      const startDateTimeLocal = new Date(startDateTimeLocalString);
      formData.set('start', startDateTimeLocal.toISOString());
    }
    if (endDate && endTime) {
      const endDateTimeLocalString = `${endDate}T${endTime}`;
      const endDateTimeLocal = new Date(endDateTimeLocalString);
      formData.set('end', endDateTimeLocal.toISOString());
    }

    if (selectedTask) {
      formData.set("relatedTaskId", selectedTask.id);
      formData.set("relatedTaskName", selectedTask.TaskName || "");
      formData.set("relatedTaskProjectId", selectedTask.projectId);
      formData.set("isDarkModeOnly", String(selectedTask.projectIsDarkModeOnly));
    } else {
      // Explicitly clear these fields if no task is selected
      formData.delete("relatedTaskId");
      formData.delete("relatedTaskName");
      formData.delete("relatedTaskProjectId");
      formData.delete("isDarkModeOnly");
    }

    startTransition(() => {
      formAction(formData);
    });
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleOpenChangeInternal}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
          </DialogHeader>
          <form ref={formRef} onSubmit={handleSubmit} onChange={handleFormChange}>
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
                <Label htmlFor="relatedTask">Related Task (Optional)</Label>
                <SingleSelectAutocomplete
                  options={tasks.map(task => ({
                    value: task.id,
                    label: `${task.TaskName} (Project: ${task.projectName})`
                  }))}
                  placeholder="Select a related task..."
                  name="relatedTaskId_display"
                  onValueChange={(taskId) => {
                    const task = tasks.find(t => t.id === taskId) || null;
                    setSelectedTask(task);
                    setIsDirty(true); // Mark as dirty on task change
                  }}
                  value={selectedTask?.id || ""}
                  displayFormatter={(option) => {
                    const task = tasks.find(t => t.id === option.value);
                    return task?.TaskName || option.label;
                  }}
                />
                {selectedTask && selectedTask.projectName && (
                  <div className="text-sm text-muted-foreground mt-1">
                    Project: {selectedTask.projectName}
                  </div>
                )}
                {selectedTask && (
                  <>
                    <input type="hidden" name="relatedTaskId" value={selectedTask.id} />
                    <input type="hidden" name="relatedTaskName" value={selectedTask.TaskName || ""} />
                    <input type="hidden" name="relatedTaskProjectId" value={selectedTask.projectId} />
                    <input type="hidden" name="isDarkModeOnly" value={String(selectedTask.projectIsDarkModeOnly)} />
                  </>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="members">Members</Label>
                <MultiSelectAutocomplete
                  options={members}
                  placeholder="Select members..."
                  name="members"
                  initialValue={event.members}
                  onValueChange={() => setIsDirty(true)} // Mark as dirty on members change
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <SingleSelectAutocomplete
                  options={locations.map(loc => ({ value: loc, label: loc }))}
                  placeholder="Select or create a location..."
                  name="location"
                  initialValue={event.location}
                  onValueChange={() => setIsDirty(true)} // Mark as dirty on location change
                  value={event.location}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input id="startDate" name="startDate" type="date" defaultValue={formatDateToYYYYMMDD(event.start)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input id="startTime" name="startTime" type="time" defaultValue={formatTimeToHHMM(event.start)} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input id="endDate" name="endDate" type="date" defaultValue={formatDateToYYYYMMDD(event.end)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input id="endTime" name="endTime" type="time" defaultValue={formatTimeToHHMM(event.end)} required />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="allDay" name="allDay" value="true" defaultChecked={event.allDay} onChange={() => setIsDirty(true)} />
                <Label htmlFor="allDay">All day event</Label>
              </div>
            </div>
            <DialogFooter className="justify-between">
              <Button type="button" variant="destructive" size="icon" onClick={() => setIsDeleteAlertOpen(true)}>
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Delete Event</span>
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={handleCancel}>Cancel</Button>
                <LoadingButton type="submit" loading={isSaving}>Save Changes</LoadingButton>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* Delete Confirmation Dialog */}
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

      {/* Unsaved Changes Warning Dialog */}
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
              onOpenChange(false); // Close the main dialog
              setIsConfirmOpen(false); // Close this confirmation dialog
              setIsDirty(false); // Reset dirty state
            }}>
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}