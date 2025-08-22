"use server";

import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, Timestamp } from "firebase/firestore";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export interface CalendarEvent {
    id: string;
    title: string;
    start: Date;
    end: Date;
    allDay: boolean;
}

const CreateEventSchema = z.object({
  title: z.string().min(1, "Title is required."),
  start: z.string().transform((str) => new Date(str)),
  end: z.string().transform((str) => new Date(str)),
  allDay: z.boolean(),
});

export async function createEvent(prevState: any, formData: FormData) {
    const validatedFields = CreateEventSchema.safeParse({
        title: formData.get('title'),
        start: formData.get('start'),
        end: formData.get('end'),
        allDay: formData.get('allDay') === 'true',
    });

    if (!validatedFields.success) {
        return { success: false, message: "Invalid form data." };
    }

    try {
        await addDoc(collection(db, "events"), {
            title: validatedFields.data.title,
            start: Timestamp.fromDate(validatedFields.data.start),
            end: Timestamp.fromDate(validatedFields.data.end),
            allDay: validatedFields.data.allDay,
        });
        revalidatePath("/calendar");
        return { success: true, message: "Event created successfully." };
    } catch (error) {
        console.error("Error creating event:", error);
        return { success: false, message: "Failed to create event." };
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
            };
        });
    } catch (error) {
        console.error("Error fetching events:", error);
        return [];
    }
}
