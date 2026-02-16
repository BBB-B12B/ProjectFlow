"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { updateEvent, deleteEvent, deleteRecurringInstance, updateRecurringInstance, CalendarEvent, getAllTasksWithProjectDetails, TaskWithProjectDetails } from './actions';
import type { AssigneeGroup } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { MemberSelectorWithGroup } from '@/components/ui/member-selector-with-group';
import { SingleSelectAutocomplete } from '@/components/ui/single-select-autocomplete';
import { Trash2, Copy } from 'lucide-react';
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
  groups: AssigneeGroup[];
  onDuplicate: (event: CalendarEvent) => void;
}

export function EditEventDialog({
  isOpen,
  onOpenChange,
  event,
  members,
  locations,
  groups,
  onDuplicate,
}: EditEventDialogProps) {
  const [state, formAction, isSaving] = useActionState(updateEvent, initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isSaveTypeOpen, setIsSaveTypeOpen] = useState(false); // [T-170] Save Type Dialog
  const [isPending, startTransition] = useTransition();

  const [tasks, setTasks] = useState<TaskWithProjectDetails[]>([]);
  const [selectedTask, setSelectedTask] = useState<TaskWithProjectDetails | null>(null);

  // T-153: Fix Hydration Mismatch by initializing inside useEffect
  const [currentUser, setCurrentUser] = useState({ id: 'loading', name: 'Loading...', avatarUrl: '' });

  useEffect(() => {
    setCurrentUser(getAnonymousUser());
  }, []);

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

  // Recurrence Parsing
  const isRecurringInstance = event?.id.includes('_recur_');
  const originalId = isRecurringInstance ? event?.id.split('_recur_')[0] : event?.id;
  const instanceDate = isRecurringInstance ? event?.id.split('_recur_')[1] : null;

  const handleDeleteConfirm = (scope: 'instance' | 'series' = 'series') => {
    if (event && originalId) {
      startTransition(async () => {
        let result;
        if (scope === 'instance' && instanceDate) {
          result = await deleteRecurringInstance(originalId, instanceDate);
        } else {
          result = await deleteEvent(originalId);
        }

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

    // Recurrence logic for Edit
    if (isRecurringInstance && instanceDate) {
      // If it's an instance, we assume the user wants to split unless they confirm otherwise.
      // But for now, let's just make it simpler: We will intercept the submit and ask via Dialog?
      // Or just assume "Series" by default if no change?
      // Actually, if I modify an instance, I should ask.
      // But formAction is direct.
      // Let's implement a "Split Mode" toggle or just ask?

      // Strategy:
      // 1. If it's an instance, add hidden inputs for the split logic.
      // 2. We need a way to distinguish Update Series vs Update Instance.
      // Let's add two submit buttons in the dialog footer if it's recurring?
      // Or just default to Series for now (Behavior 1) and Instance (Behavior 2)?

      // Proper UX:
      // Show a valid Dialog. But here we are inside handleSubmit.
      // I will implement a visual choice in the footer instead.
      // "Save to Series" vs "Save to This Event Only"

      // I'll leave this default for now and handle the choice via button clicks.
      // See the button changes below.
    }

    // Should we normalize the ID back to originalId if saving series?
    // updateEvent expects ID. If we pass "recur_id", it won't find the doc.
    // So we MUST pass originalId if updating series.

    // Check which button was clicked? 
    // We can use a hidden input 'recurrenceMode' set by the button.
    const mode = formData.get('recurrenceMode');

    if (isRecurringInstance && mode === 'instance' && instanceDate) {
      // New Action for Instance Update
      formData.append('originalEventId', originalId || "");
      formData.append('instanceDate', instanceDate);
      // Remove ID so it creates new? No, logic inside updateRecurringInstance handles it.
      startTransition(async () => {
        const res = await updateRecurringInstance(state, formData);
        if (res.success) {
          toast({ title: "Success", description: res.message });
          router.refresh();
          onOpenChange(false);
          setIsDirty(false);
        }
      });
      return;
    }

    // Default / Series Update
    if (originalId) {
      formData.set('id', originalId); // Ensure we target the master doc
    }

    startTransition(() => {
      formAction(formData);
    });
    setIsSaveTypeOpen(false);
  };

  const handleSaveTypeSelection = (mode: 'instance' | 'series') => {
    // Manually construct FormData and submit with mode
    if (formRef.current) {
      const formData = new FormData(formRef.current);
      formData.set('recurrenceMode', mode);

      // We must handle the specific logic here because we are bypassing handleSubmit
      const startDate = formData.get('startDate') as string;
      const startTime = formData.get('startTime') as string;
      const endDate = formData.get('endDate') as string;
      const endTime = formData.get('endTime') as string;

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
        formData.delete("relatedTaskId");
        formData.delete("relatedTaskName");
        formData.delete("relatedTaskProjectId");
        formData.delete("isDarkModeOnly");
      }

      // Instance Update Specifics
      if (mode === 'instance' && instanceDate && originalId) {
        formData.append('originalEventId', originalId);
        formData.append('instanceDate', instanceDate);

        startTransition(async () => {
          const res = await updateRecurringInstance(state, formData);
          if (res.success) {
            toast({ title: "Success", description: res.message });
            router.refresh();
            onOpenChange(false);
            setIsDirty(false);
          }
        });
        setIsSaveTypeOpen(false);
        return;
      }

      // Series Update Specifics
      if (originalId) {
        formData.set('id', originalId);
      }

      startTransition(() => {
        formAction(formData);
      });
      setIsSaveTypeOpen(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleOpenChangeInternal}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
            <DialogDescription>
              Make changes to your event details here.
            </DialogDescription>
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
                <MemberSelectorWithGroup
                  label="Members"
                  options={members}
                  groups={groups}
                  value={event.members || []}
                  onValueChange={() => setIsDirty(true)}
                  name="members"
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
              <div className="flex gap-2">
                <Button type="button" variant="destructive" size="icon" onClick={() => setIsDeleteAlertOpen(true)}>
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete Event</span>
                </Button>
                <Button type="button" variant="outline" onClick={() => {
                  if (event) onDuplicate(event);
                }}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </Button>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={handleCancel}>Cancel</Button>

                {/* [T-170] Unified Save Button */}
                <LoadingButton
                  type={isRecurringInstance ? "button" : "submit"}
                  loading={isSaving}
                  onClick={(e) => {
                    if (isRecurringInstance) {
                      e.preventDefault();
                      setIsSaveTypeOpen(true);
                    }
                  }}
                >
                  Save Changes
                </LoadingButton>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event?</AlertDialogTitle>
            <AlertDialogDescription>
              {isRecurringInstance
                ? "This is a recurring event. Do you want to delete only this occurrence or the entire series?"
                : "This action cannot be undone. This will permanently delete this event."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            {isRecurringInstance ? (
              <>
                <AlertDialogAction onClick={() => handleDeleteConfirm('instance')} disabled={isPending}>
                  Delete this occurrence
                </AlertDialogAction>
                <AlertDialogAction onClick={() => handleDeleteConfirm('series')} disabled={isPending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete entire series
                </AlertDialogAction>
              </>
            ) : (
              <AlertDialogAction onClick={() => handleDeleteConfirm('series')} disabled={isPending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* [T-170] Save Type Selection Dialog */}
      <AlertDialog open={isSaveTypeOpen} onOpenChange={setIsSaveTypeOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Edit Recurring Event</AlertDialogTitle>
            <AlertDialogDescription>
              This is a recurring event. How would you like to save your changes?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-2 py-2">
            <Button onClick={() => handleSaveTypeSelection('instance')}>
              Save This Event Only
            </Button>
            <Button variant="secondary" onClick={() => handleSaveTypeSelection('series')}>
              Save Entire Series
            </Button>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
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