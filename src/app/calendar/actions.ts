"use server";

import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, Timestamp, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Task } from "@/lib/types";

export interface CalendarEvent {
    id: string;
    title: string;
    start: Date;
    end: Date;
    allDay: boolean;
    description?: string;
    members?: string[];
    location?: string;
}

type FormState = {
    success: boolean;
    message: string;
};

const EventSchema = z.object({
  title: z.string().min(1, "Title is required."),
  start: z.string().transform((str) => new Date(str)),
  end: z.string().transform((str) => new Date(str)),
  allDay: z.boolean(),
  description: z.string().optional(),
  members: z.preprocess((arg) => {
    if (typeof arg === 'string' && arg.length > 0) return arg.split(',');
    if (Array.isArray(arg)) return arg;
    return [];
   }, z.array(z.string()).optional()),
  location: z.string().optional(),
});

const CreateEventSchema = EventSchema;
const UpdateEventSchema = EventSchema.extend({
    id: z.string().min(1, "Event ID is required."),
});


export async function createEvent(prevState: any, formData: FormData): Promise<FormState> {
    const validatedFields = CreateEventSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
        return { success: false, message: "Invalid form data." };
    }

    try {
        await addDoc(collection(db, "events"), {
            ...validatedFields.data,
            start: Timestamp.fromDate(validatedFields.data.start),
            end: Timestamp.fromDate(validatedFields.data.end),
        });
        revalidatePath("/calendar");
        return { success: true, message: "Event created successfully." };
    } catch (error) {
        return { success: false, message: "Failed to create event." };
    }
}

export async function updateEvent(prevState: any, formData: FormData): Promise<FormState> {
    const validatedFields = UpdateEventSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
        return { success: false, message: "Invalid form data." };
    }
    
    const { id, ...eventData } = validatedFields.data;

    try {
        const eventRef = doc(db, "events", id);
        await updateDoc(eventRef, {
            ...eventData,
            start: Timestamp.fromDate(eventData.start),
            end: Timestamp.fromDate(eventData.end),
        });
        revalidatePath("/calendar");
        return { success: true, message: "Event updated successfully." };
    } catch (error) {
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
            };
        });
    } catch (error) {
        console.error("Error fetching events:", error);
        return [];
    }
}

export async function getMembersList(): Promise<string[]> {
    try {
        const [taskSnapshot, eventSnapshot] = await Promise.all([
            getDocs(collection(db, "tasks")),
            getDocs(collection(db, "events"))
        ]);

        const taskAssignees = taskSnapshot.docs
            .map(doc => (doc.data() as Task).Assignee)
            .filter(Boolean);
            
        const eventMembers = eventSnapshot.docs
            .map(doc => (doc.data() as { members?: string[] }).members || [])
            .flat()
            .filter(Boolean);

        const allMembers = new Set([...taskAssignees, ...eventMembers]);
        
        return Array.from(allMembers);
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
