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
  const [state, formAction] = useActionState(updateEvent, initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [tasks, setTasks] = useState<TaskWithProjectDetails[]>([]);
  const [selectedTask, setSelectedTask] = useState<TaskWithProjectDetails | null>(null);

  const [currentUser] = useState(getAnonymousUser());
  
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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
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

    formAction(formData);
  };

  return (
    <> 
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
          </DialogHeader>
          <form ref={formRef} onSubmit={handleSubmit}>
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
                    label: `${task.TaskName} (Project: ${task.projectName})` // Show both in dropdown
                  }))}
                  placeholder="Select a related task..."
                  name="relatedTaskId_display" 
                  onValueChange={(taskId) => {
                    const task = tasks.find(t => t.id === taskId) || null;
                    setSelectedTask(task);
                  }}
                  value={selectedTask?.id || ""}
                  displayFormatter={(option) => {
                    const task = tasks.find(t => t.id === option.value);
                    return task?.TaskName || option.label; // Only show task name in input
                  }}
                />
                {/* Show project name in a new line after a task is selected */}
                {selectedTask && selectedTask.projectName && (
                  <div className="text-sm text-muted-foreground mt-1">
                    Project: {selectedTask.projectName}
                  </div>
                )}
                {/* Hidden inputs to pass the full task details to the server action */}
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
                  />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <SingleSelectAutocomplete
                    options={locations.map(loc => ({ value: loc, label: loc }))}
                    placeholder="Select or create a location..."
                    name="location"
                    initialValue={event.location}
                    onValueChange={() => {}} 
                    value={event.location}
                />
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
