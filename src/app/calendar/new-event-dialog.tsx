"use client";

import { useActionState, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { createEvent, getAllTasksWithProjectDetails, TaskWithProjectDetails } from './actions';
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
  const [tasks, setTasks] = useState<TaskWithProjectDetails[]>([]);
  const [selectedTask, setSelectedTask] = useState<TaskWithProjectDetails | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string>(""); // State for location

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
      setSelectedTask(null); // Reset selected task when dialog closes
      setSelectedLocation(""); // Reset selected location
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      const fetchTasks = async () => {
        const fetchedTasks = await getAllTasksWithProjectDetails();
        setTasks(fetchedTasks);
      };
      fetchTasks();
    }
  }, [isOpen]);

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

    const startDate = formData.get('startDate') as string;
    const startTime = formData.get('startTime') as string;
    const endDate = formData.get('endDate') as string;
    const endTime = formData.get('endTime') as string;

    // Combine date and time, treating them as local inputs
    // Then convert to UTC for consistent storage.
    if (startDate && startTime) {
      const startDateTimeLocalString = `${startDate}T${startTime}`;
      const startDateTimeLocal = new Date(startDateTimeLocalString); // Interpreted in local timezone
      formData.set('start', startDateTimeLocal.toISOString()); // Convert to UTC ISO string
    }
    if (endDate && endTime) {
      const endDateTimeLocalString = `${endDate}T${endTime}`;
      const endDateTimeLocal = new Date(endDateTimeLocalString); // Interpreted in local timezone
      formData.set('end', endDateTimeLocal.toISOString()); // Convert to UTC ISO string
    }

    if (selectedTask) {
      formData.set("relatedTaskId", selectedTask.id);
      formData.set("relatedTaskName", selectedTask.TaskName || "");
      formData.set("relatedTaskProjectId", selectedTask.projectId);
      formData.set("isDarkModeOnly", String(selectedTask.projectIsDarkModeOnly));
    } else {
      // Ensure these are explicitly cleared if no task is selected
      formData.delete("relatedTaskId");
      formData.delete("relatedTaskName");
      formData.delete("relatedTaskProjectId");
      formData.delete("isDarkModeOnly");
    }

    formAction(formData);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
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
                    setIsDirty(true);
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
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <SingleSelectAutocomplete
                  options={locations.map(loc => ({ value: loc, label: loc }))}
                  placeholder="Select or create a location..."
                  name="location"
                  onValueChange={(value) => {
                    setSelectedLocation(value);
                    setIsDirty(true);
                  }}
                  value={selectedLocation}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input id="startDate" name="startDate" type="date" defaultValue={formatDateToYYYYMMDD(defaultDate)} required />
                  {state.errors?.start && <p className="text-red-500 text-sm">{state.errors.start[0]}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input id="startTime" name="startTime" type="time" defaultValue={formatTimeToHHMM(defaultDate)} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input id="endDate" name="endDate" type="date" defaultValue={formatDateToYYYYMMDD(defaultDate)} required />
                  {state.errors?.end && <p className="text-red-500 text-sm">{state.errors.end[0]}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input id="endTime" name="endTime" type="time" defaultValue={formatTimeToHHMM(defaultDate)} required />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="allDay" name="allDay" value="true" />
                <Label htmlFor="allDay">All day event</Label>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCancel}>Cancel</Button>
              <LoadingButton type="submit" loading={isPending}>Create Event</LoadingButton>
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