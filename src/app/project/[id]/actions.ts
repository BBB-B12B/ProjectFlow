"use server";

import { db } from "@/lib/firebase-lite";
import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc, query, where, getDoc } from "firebase/firestore/lite";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Task } from "@/lib/types";

// Helper function to recalculate project stats and date range
export async function recalculateProjectStats(projectId: string) {
  try {
    const tasksRef = collection(db, 'tasks');
    const q = query(tasksRef, where('projectId', '==', projectId));
    const snapshot = await getDocs(q);

    const totalTasks = snapshot.size;
    const completedTasks = snapshot.docs.filter(doc => doc.data().Status === 'จบงานแล้ว').length;
    const inProgressTasks = snapshot.docs.filter(doc => {
      const status = doc.data().Status;
      return status === 'กำลังดำเนินการ' || status === 'In Progress';
    }).length;

    let minStart = "";
    let maxEnd = "";

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const start = data.StartDate;
      const end = data.EndDate;

      if (start && (!minStart || start < minStart)) {
        minStart = start;
      }
      if (end && (!maxEnd || end > maxEnd)) {
        maxEnd = end;
      }
    });

    const updateData: any = {
      totalTasks,
      completedTasks,
      inProgressTasks
    };

    if (minStart) updateData.startDate = minStart;
    if (maxEnd) updateData.endDate = maxEnd;

    await updateDoc(doc(db, 'projects', projectId), updateData);
    revalidatePath('/projects'); // Trigger update for projects list
  } catch (error) {
    console.error(`Error recalculating stats for project ${projectId}:`, error);
  }
}

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

    // Fetch Task to get ProjectId for stats update
    const taskSnap = await getDoc(taskDocRef);
    const projectId = taskSnap.exists() ? taskSnap.data().projectId : null;

    await updateDoc(taskDocRef, { Status: status });

    if (projectId) await recalculateProjectStats(projectId);

    revalidatePath(`/project/.*`, 'layout');
  } catch (error) {
    console.error("Error updating task status:", error);
    throw new Error("Failed to update task status.");
  }
}

export async function updateTaskOrder(taskId: string, newOrder: number, newStatus?: string) {
  try {
    const taskDocRef = doc(db, "tasks", taskId);
    const updates: any = { Order: newOrder };
    if (newStatus) {
      updates.Status = newStatus;
    }

    await updateDoc(taskDocRef, updates);

    // If status changed, we might need to recalculate project stats (completed count etc)
    if (newStatus) {
      const taskSnap = await getDoc(taskDocRef);
      const projectId = taskSnap.exists() ? taskSnap.data().projectId : null;
      if (projectId) await recalculateProjectStats(projectId);
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating task order:", error);
    return { success: false };
  }
}

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
  Effect: z.coerce.number(),
  Effort: z.coerce.number(),
  Progress: z.coerce.number().min(0).max(100),
  checklist: z.array(z.object({
    id: z.string(),
    text: z.string(),
    isCompleted: z.boolean(),
  })).optional(),
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

    // Fetch Task to get ProjectId
    const taskSnap = await getDoc(taskDocRef);
    const projectId = taskSnap.exists() ? taskSnap.data().projectId : null;

    await updateDoc(taskDocRef, {
      ...taskData,
      LastUpdateDate: new Date().toISOString().split('T')[0],
    });

    if (projectId) await recalculateProjectStats(projectId);

    revalidatePath(`/project/.*`, 'layout');
    return { success: true };
  } catch (error) {
    console.error("Error updating task:", error);
    return { success: false, message: "Failed to update task." };
  }
}

const CreateTaskSchema = z.object({
  projectId: z.string().min(1, "Project ID is missing."),
  TaskName: z.string().min(1, "Task name is required."),
  StartDate: z.string().min(1, "Start date is required."),
  EndDate: z.string().min(1, "End date is required."),
  Category: z.string().optional(),
  Status: z.string(),
  ProjectType: z.string(),
  Assignee: z.string().optional(),
  Owner: z.string().optional(),
  Want: z.string().optional(),
  Effect: z.coerce.number(),
  Effort: z.coerce.number(),
  Progress: z.coerce.number().min(0).max(100),
});

export async function createTask(prevState: any, formData: FormData) {
  const validatedFields = CreateTaskSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    console.error("Validation Error:", validatedFields.error.flatten().fieldErrors);
    return { success: false, message: "Invalid form data." };
  }

  const { projectId, ...taskData } = validatedFields.data;

  try {
    const tasksCol = collection(db, "tasks");
    await addDoc(tasksCol, {
      ...taskData,
      projectId: projectId,
      CreateDate: new Date().toISOString().split('T')[0],
      LastUpdateDate: new Date().toISOString().split('T')[0],
    });

    await recalculateProjectStats(projectId);

    revalidatePath(`/project/${projectId}`);
    return { success: true, message: "Task created successfully." };
  } catch (error) {
    console.error("Error creating task:", error);
    return { success: false, message: "Failed to create task." };
  }
}

export async function deleteTask(taskId: string, projectId: string) {
  try {
    const taskDocRef = doc(db, "tasks", taskId);
    await deleteDoc(taskDocRef);

    await recalculateProjectStats(projectId);

    revalidatePath(`/project/${projectId}`);
    return { success: true, message: "Task deleted successfully." };
  } catch (error) {
    console.error("Error deleting task:", error);
    return { success: false, message: "Failed to delete task." };
  }
}

export async function saveChecklist(taskId: string, checklist: { id: string; text: string; isCompleted: boolean }[]) {
  try {
    const taskDocRef = doc(db, "tasks", taskId);
    console.log(`Saving checklist for Task ${taskId}:`, checklist); // DEBUG LOG
    await updateDoc(taskDocRef, {
      checklist: checklist, // Ensure field name matches types
      LastUpdateDate: new Date().toISOString().split('T')[0]
    });
    console.log(`Saved checklist for Task ${taskId} successfully.`); // DEBUG LOG

    const taskSnap = await getDoc(taskDocRef);
    const projectId = taskSnap.exists() ? taskSnap.data().projectId : null;

    if (projectId) {
      revalidatePath(`/project/${projectId}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Error saving checklist:", error);
    return { success: false, message: "Failed to save checklist." };
  }
}

export async function saveComment(taskId: string, comment: { text: string; createdBy: { name: string; avatarUrl?: string } }) {
  try {
    const taskDocRef = doc(db, "tasks", taskId);
    const newComment = {
      id: crypto.randomUUID(),
      text: comment.text,
      createdAt: new Date().toISOString(),
      createdBy: comment.createdBy,
    };

    const taskSnap = await getDoc(taskDocRef);
    if (!taskSnap.exists()) return { success: false, message: "Task not found" };

    const currentComments = taskSnap.data().comments || [];

    await updateDoc(taskDocRef, {
      comments: [...currentComments, newComment],
      LastUpdateDate: new Date().toISOString().split('T')[0]
    });

    const projectId = taskSnap.data().projectId;
    if (projectId) {
      revalidatePath(`/project/${projectId}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Error saving comment:", error);
    return { success: false, message: "Failed to save comment." };
  }
}