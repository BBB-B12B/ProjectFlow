"use server";

import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export async function getUniqueAssignees(): Promise<string[]> {
    try {
      const tasksCol = collection(db, "tasks");
      const taskSnapshot = await getDocs(tasksCol);
      const assignees = new Set<string>();
      taskSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.Assignee) {
          data.Assignee.split(',').forEach((assignee: string) => {
            const trimmedAssignee = assignee.trim();
            if (trimmedAssignee) {
              assignees.add(trimmedAssignee);
            }
          });
        }
      });
      return Array.from(assignees);
    } catch (error) {
      console.error("Error fetching unique assignees:", error);
      return [];
    }
  }

export async function updateTaskStatus(taskId: string, status: string) {
  try {
    const taskDocRef = doc(db, "tasks", taskId);
    await updateDoc(taskDocRef, { Status: status });
    revalidatePath(`/project/.*`, 'layout');
  } catch (error) {
    console.error("Error updating task status:", error);
    throw new Error("Failed to update task status.");
  }
}

// Updated schema to include Effect and Effort, coercing them to numbers
const UpdateTaskSchema = z.object({
  taskId: z.string().min(1, "Task ID is missing."),
  TaskName: z.string().min(1, "Task name is required."),
  StartDate: z.string(),
  EndDate: z.string(),
  Category: z.string().optional(),
  Status: z.string(),
  ProjectType: z.string(),
  Assignee: z.string().optional(),
  Owner: z.string().optional(),
  Want: z.string().optional(),
  Effect: z.coerce.number(), // Coerce form value from string to number
  Effort: z.coerce.number(), // Coerce form value from string to number
});

export async function updateTask(prevState: any, formData: FormData) {
  const validatedFields = UpdateTaskSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    console.error("Validation Error:", validatedFields.error.flatten().fieldErrors);
    return { success: false, message: "Invalid form data." };
  }
  
  const { taskId, ...taskData } = validatedFields.data;

  try {
    const taskDocRef = doc(db, "tasks", taskId);
    await updateDoc(taskDocRef, {
      ...taskData,
      LastUpdateDate: new Date().toISOString().split('T')[0],
    });
    revalidatePath(`/project/.*`, 'layout');
    return { success: true };
  } catch (error) {
    console.error("Error updating task:", error);
    return { success: false, message: "Failed to update task." };
  }
}
