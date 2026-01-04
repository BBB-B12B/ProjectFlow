"use client";

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useToast } from "@/hooks/use-toast";
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
import { MultiSelectAutocomplete } from '@/components/ui/multi-select-autocomplete';
import { SingleSelectAutocomplete } from '@/components/ui/single-select-autocomplete';
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, Timestamp } from "firebase/firestore";
import type { Task, Project } from "@/lib/types";

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  description?: string;
  members?: string[];
  location?: string;
  relatedTask?: {
    id: string;
    name: string;
    projectId: string;
  };
  isDarkModeOnly?: boolean;
}

interface TaskWithProjectDetails extends Task {
  projectName: string;
  projectIsDarkModeOnly: boolean;
}

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
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const [isDirty, setIsDirty] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [tasks, setTasks] = useState<TaskWithProjectDetails[]>([]);
  const [selectedTask, setSelectedTask] = useState<TaskWithProjectDetails | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const { theme } = useTheme();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!isOpen) {
      formRef.current?.reset();
      setIsDirty(false);
      setSelectedTask(null);
      setSelectedLocation("");
    }
  }, [isOpen]);

  // Fetch tasks client-side to avoid Edge/SES issues
  useEffect(() => {
    if (isOpen) {
      const fetchTasksAndProjects = async () => {
        try {
          const [tasksSnapshot, projectsSnapshot] = await Promise.all([
            getDocs(collection(db, "tasks")),
            getDocs(collection(db, "projects"))
          ]);

          const projectsMap = new Map<string, Project>();
          projectsSnapshot.docs.forEach(doc => {
            projectsMap.set(doc.id, doc.data() as Project);
          });

          const tasksWithDetails: TaskWithProjectDetails[] = [];
          tasksSnapshot.docs.forEach(taskDoc => {
            const task = { id: taskDoc.id, ...taskDoc.data() } as Task;
            const project = projectsMap.get(task.projectId);

            tasksWithDetails.push({
              ...task,
              projectName: project ? project.name : "Unknown Project",
              projectIsDarkModeOnly: project ? (project.isDarkModeOnly || false) : false,
            });
          });
          setTasks(tasksWithDetails);
        } catch (error) {
          console.error("Error fetching tasks for dropdown:", error);
          toast({ title: "Error", description: "Failed to load tasks.", variant: "destructive" });
        }
      };
      fetchTasksAndProjects();
    }
  }, [isOpen, toast]);

  const formatDateToYYYYMMDD = (date: Date | null) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

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

    // Manual Validation & Extraction
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const selectedMembers = formData.get("members") ? (formData.get("members") as string).split(",") : [];
    const location = formData.get("location") as string;
    const allDay = formData.get("allDay") === "true";

    const startDate = formData.get('startDate') as string;
    const startTime = formData.get('startTime') as string;
    const endDate = formData.get('endDate') as string;
    const endTime = formData.get('endTime') as string;

    if (!title || !startDate || !endDate) {
      toast({ title: "Error", description: "Title and dates are required.", variant: "destructive" });
      return;
    }

    // Date construction
    let start: Date, end: Date;
    if (startDate && startTime) {
      start = new Date(`${startDate}T${startTime}`);
    } else {
      start = new Date(startDate); // Fallback
    }

    if (endDate && endTime) {
      end = new Date(`${endDate}T${endTime}`);
    } else {
      end = new Date(endDate); // Fallback
    }

    startTransition(async () => {
      try {
        const eventData: any = {
          title,
          description,
          members: selectedMembers,
          location,
          allDay,
          start: Timestamp.fromDate(start),
          end: Timestamp.fromDate(end),
        };

        if (selectedTask) {
          eventData.relatedTask = {
            id: selectedTask.id,
            name: selectedTask.TaskName,
            projectId: selectedTask.projectId,
          };
          eventData.isDarkModeOnly = selectedTask.projectIsDarkModeOnly;
        }

        await addDoc(collection(db, "events"), eventData);

        toast({ title: "Success", description: "Event created successfully." });
        onOpenChange(false);
        router.refresh(); // Refresh mainly for other things, but onSnapshot in parent handles the view
      } catch (error) {
        console.error("Error creating event:", error);
        toast({ title: "Error", description: "Failed to create event." + error, variant: "destructive" });
      }
    });
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Event</DialogTitle>
            <DialogDescription>
              Fill in the details below to schedule a new event.
            </DialogDescription>
          </DialogHeader>
          <form ref={formRef} onSubmit={handleSubmit} onChange={handleFormChange} className="space-y-4">
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
                <Label htmlFor="relatedTask">Related Task (Optional)</Label>
                <SingleSelectAutocomplete
                  options={tasks
                    .filter(task => theme === 'dark' ? task.projectIsDarkModeOnly : !task.projectIsDarkModeOnly)
                    .map(task => ({
                      value: task.id,
                      label: `${task.TaskName} (Project: ${task.projectName})`
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