"use server";

import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, Timestamp, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Task, Project } from "@/lib/types";

export interface CalendarEvent {
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

// New interface for tasks with project details
export interface TaskWithProjectDetails extends Task {
  projectName: string;
  projectIsDarkModeOnly: boolean;
}

type FormState = {
  success: boolean;
  message: string;
  errors?: {
    title?: string[];
    start?: string[];
    end?: string[];
    allDay?: string[];
    description?: string[];
    members?: string[];
    location?: string[];
    id?: string[];
    relatedTask?: string[];
    isDarkModeOnly?: string[];
  };
};

const EventSchema = z.object({
  title: z.string().min(1, "Title is required."),
  start: z.string().min(1, "Start date is required").transform((str) => new Date(str)),
  end: z.string().min(1, "End date is required").transform((str) => new Date(str)),
  allDay: z.preprocess((arg) => arg === 'true', z.boolean()),
  description: z.string().optional(),
  members: z.preprocess((arg) => {
    if (typeof arg === 'string' && arg.length > 0) return arg.split(',');
    if (Array.isArray(arg)) return arg;
    return [];
  }, z.array(z.string()).optional()),
  location: z.string().optional(),
  // New fields
  relatedTaskId: z.string().optional(), // Will be used to find relatedTask details
  relatedTaskName: z.string().optional(),
  relatedTaskProjectId: z.string().optional(),
  isDarkModeOnly: z.preprocess((arg) => arg === 'true', z.boolean()).optional(),
});

const CreateEventSchema = EventSchema;
const UpdateEventSchema = EventSchema.extend({
  id: z.string().min(1, "Event ID is required."),
});


export async function createEvent(prevState: any, formData: FormData): Promise<FormState> {
  const data = Object.fromEntries(formData.entries());
  if (!data.allDay) data.allDay = 'false';
  const validatedFields = CreateEventSchema.safeParse(data);

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Please correct the errors below.",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { relatedTaskId, relatedTaskName, relatedTaskProjectId, isDarkModeOnly, ...rest } = validatedFields.data;

  const eventToSave: any = {
    ...rest,
    start: Timestamp.fromDate(rest.start),
    end: Timestamp.fromDate(rest.end),
  };

  if (relatedTaskId && relatedTaskName && relatedTaskProjectId) {
    eventToSave.relatedTask = {
      id: relatedTaskId,
      name: relatedTaskName,
      projectId: relatedTaskProjectId,
    };
    eventToSave.isDarkModeOnly = isDarkModeOnly;
  }

  try {
    await addDoc(collection(db, "events"), eventToSave);
    revalidatePath("/calendar");
    return { success: true, message: "Event created successfully." };
  } catch (error) {
    console.error("Error creating event:", error);
    return { success: false, message: "Failed to create event." };
  }
}

export async function updateEvent(prevState: any, formData: FormData): Promise<FormState> {
  const data = Object.fromEntries(formData.entries());
  if (!data.allDay) data.allDay = 'false';
  const validatedFields = UpdateEventSchema.safeParse(data);

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Please correct the errors below.",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { id, relatedTaskId, relatedTaskName, relatedTaskProjectId, isDarkModeOnly, ...rest } = validatedFields.data;

  const eventToUpdate: any = {
    ...rest,
    start: Timestamp.fromDate(rest.start),
    end: Timestamp.fromDate(rest.end),
  };

  if (relatedTaskId && relatedTaskName && relatedTaskProjectId) {
    eventToUpdate.relatedTask = {
      id: relatedTaskId,
      name: relatedTaskName,
      projectId: relatedTaskProjectId,
    };
    eventToUpdate.isDarkModeOnly = isDarkModeOnly;
  } else {
    // If no task is selected, ensure these fields are removed or set to undefined
    eventToUpdate.relatedTask = null;
    eventToUpdate.isDarkModeOnly = false;
  }

  try {
    const eventRef = doc(db, "events", id);
    await updateDoc(eventRef, eventToUpdate);
    revalidatePath("/calendar");
    return { success: true, message: "Event updated successfully." };
  } catch (error) {
    console.error("Error updating event:", error);
    return { success: false, message: "Failed to update event." };
  }
}

export async function deleteEvent(eventId: string): Promise<FormState> {
  if (!eventId) {
    return { success: false, message: "Event ID is required." };
  }
  try {
    await deleteDoc(doc(db, "events", eventId));
    revalidatePath("/calendar");
    return { success: true, message: "Event deleted successfully." };
  } catch (error) {
    return { success: false, message: "Failed to delete event." };
  }
}


export async function getEvents(): Promise<CalendarEvent[]> {
  try {
    const snapshot = await getDocs(collection(db, "events"));
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        start: data.start.toDate(),
        end: data.end.toDate(),
        allDay: data.allDay,
        description: data.description,
        members: data.members,
        location: data.location,
        relatedTask: data.relatedTask || undefined, // Include new field
        isDarkModeOnly: data.isDarkModeOnly || false, // Include new field
      };
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    return [];
  }
}

export async function getMembersList(): Promise<string[]> {
  try {
    const [taskSnapshot, eventSnapshot, customerSnapshot] = await Promise.all([
      getDocs(collection(db, "tasks")),
      getDocs(collection(db, "events")),
      getDocs(collection(db, "customers"))
    ]);

    const employeeSet = new Set<string>();
    taskSnapshot.docs.forEach(doc => {
      const data = doc.data() as Task;
      if (data.Assignee && typeof data.Assignee === 'string') {
        data.Assignee.split(',').forEach(name => {
          const trimmed = name.trim();
          if (trimmed) employeeSet.add(trimmed);
        });
      }
    });

    const customerSet = new Set<string>();
    customerSnapshot.docs.forEach(doc => {
      const data = doc.data() as { name: string };
      if (data.name) {
        customerSet.add(data.name);
      }
    });

    // Event members might be just names, we keep them if they match known entities or just add them?
    // For now, let's just use Employees and Customers as the source of truth for the dropdown.
    // Existing event members that are not in the list should probably be preserved?
    // Let's just return formatted values.

    const formattedEmployees = Array.from(employeeSet).map(name => `${name} (Employee)`);
    const formattedCustomers = Array.from(customerSet).map(name => `${name} (Customer)`);

    // Also include raw names from events to ensure existing members are shown (though they might not have suffix)
    // actually, let's strictly provide the new format.

    const allMembers = [...formattedEmployees, ...formattedCustomers].sort();

    return allMembers;
  } catch (error) {
    console.error("Error fetching members list:", error);
    return [];
  }
}

export async function getLocations(): Promise<string[]> {
  try {
    const snapshot = await getDocs(collection(db, "events"));
    const events = snapshot.docs.map(doc => doc.data() as CalendarEvent);
    const locations = new Set(events.map(event => event.location).filter(Boolean) as string[]);
    return Array.from(locations);
  } catch (error) {
    console.error("Error fetching locations:", error);
    return [];
  }
}

export async function getAllTasksWithProjectDetails(): Promise<TaskWithProjectDetails[]> {
  try {
    const tasksSnapshot = await getDocs(collection(db, "tasks"));
    const projectsSnapshot = await getDocs(collection(db, "projects"));

    const projectsMap = new Map<string, Project>();
    projectsSnapshot.docs.forEach(doc => {
      projectsMap.set(doc.id, doc.data() as Project);
    });

    const tasksWithDetails: TaskWithProjectDetails[] = [];
    tasksSnapshot.docs.forEach(taskDoc => {
      const task = { id: taskDoc.id, ...taskDoc.data() } as Task;
      const project = projectsMap.get(task.projectId);

      if (project) {
        tasksWithDetails.push({
          ...task,
          projectName: project.name,
          projectIsDarkModeOnly: project.isDarkModeOnly || false,
        });
      }
    });
    return tasksWithDetails;
  } catch (error) {
    console.error("Error fetching tasks with project details:", error);
    return [];
  }
}
