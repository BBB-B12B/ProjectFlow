"use server";

import { db } from "@/lib/firebase";
import { collection, addDoc, writeBatch, doc, query, where, getDocs, updateDoc } from "firebase/firestore";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Project, Task } from "@/lib/types";

// ... (keep createProject, deleteProject, updateProject, etc. as they are)

const CreateProjectSchema = z.object({
  name: z.string().min(1, "Project name is required."),
  description: z.string().optional(),
  startDate: z.string().min(1, "Start date is required."),
  endDate: z.string().min(1, "End date is required."),
  taskName: z.string().min(1, "First task name is required."),
  team: z.string().optional(),
});

const UpdateProjectSchema = z.object({
    projectId: z.string().min(1, "Project ID is required."),
    name: z.string().min(1, "Project name is required."),
    description: z.string().optional(),
    team: z.string().optional(),
});

export async function createProject(prevState: any, formData: FormData) {
  const validatedFields = CreateProjectSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    console.error("Validation Error:", validatedFields.error.flatten().fieldErrors);
    return { success: false, message: "Invalid form data." };
  }

  const { name, description, startDate, endDate, taskName, team } = validatedFields.data;

  if (new Date(endDate) < new Date(startDate)) {
    return { success: false, message: "End date cannot be before the start date." };
  }

  try {
    const batch = writeBatch(db);
    
    // Determine if the project should be dark mode only
    const isDarkModeOnly = team?.trim().toUpperCase() === 'OS';

    const projectRef = doc(collection(db, "projects"));
    batch.set(projectRef, {
      name,
      description: description || "",
      startDate,
      endDate,
      status: 'กำลังดำเนินการ',
      team: team || "",
      isDarkModeOnly: isDarkModeOnly, // Add the new field here
    });

    const taskRef = doc(collection(db, "tasks"));
    batch.set(taskRef, {
      TaskName: taskName,
      StartDate: startDate,
      EndDate: endDate,
      Status: 'ยังไม่ได้เริ่ม',
      Assignee: "",
      Owner: "",
      Effect: 0,
      Effort: 0,
      projectId: projectRef.id,
      Want: "",
      Category: "",
      ProjectType: "Main",
    });

    await batch.commit();
    
    revalidatePath("/projects");
    return { success: true, message: "Project and first task created successfully." };
  } catch (error) {
    console.error("Error creating project:", error);
    return { success: false, message: "Failed to create project." };
  }
}

export async function updateProject(prevState: any, formData: FormData) {
    const validatedFields = UpdateProjectSchema.safeParse(
        Object.fromEntries(formData.entries())
    );

    if (!validatedFields.success) {
        console.error("Validation Error:", validatedFields.error.flatten().fieldErrors);
        return { success: false, message: "Invalid form data." };
    }

    const { projectId, name, description, team } = validatedFields.data;

    try {
        const isDarkModeOnly = team?.trim().toUpperCase() === 'OS';
        const projectRef = doc(db, "projects", projectId);
        await updateDoc(projectRef, {
            name,
            description: description || "",
            team: team || "",
            isDarkModeOnly: isDarkModeOnly, // Also update on edit
        });

        revalidatePath("/projects");
        revalidatePath(`/project/${projectId}`);
        return { success: true, message: "Project updated successfully." };
    } catch (error) {
        console.error("Error updating project:", error);
        return { success: false, message: "Failed to update project." };
    }
}

export async function getTeams(): Promise<string[]> {
    try {
        const snapshot = await getDocs(collection(db, "projects"));
        const projects = snapshot.docs.map(doc => doc.data() as Project);
        const teams = new Set(projects.map(project => project.team).filter(Boolean) as string[]);
        return Array.from(teams);
    } catch (error) {
        console.error("Error fetching teams:", error);
        return [];
    }
}

// Keep deleteProject, archiveProject, unarchiveProject functions as they are
export async function deleteProject(projectId: string) {
    if (!projectId) {
        return { success: false, message: "Project ID is required." };
    }
    try {
        const batch = writeBatch(db);
        const tasksCol = collection(db, "tasks");
        const q = query(tasksCol, where("projectId", "==", projectId));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
            batch.delete(doc.ref);
        });
        const projectRef = doc(db, "projects", projectId);
        batch.delete(projectRef);
        await batch.commit();
        revalidatePath("/projects");
        return { success: true, message: "Project and its tasks have been deleted." };
    } catch (error) {
        console.error("Error deleting project:", error);
        return { success: false, message: "Failed to delete project." };
    }
}

export async function archiveProject(projectId: string) {
    if (!projectId) {
        return { success: false, message: "Project ID is required." };
    }
    try {
        const projectRef = doc(db, "projects", projectId);
        await updateDoc(projectRef, { status: 'Archived' });
        revalidatePath("/projects");
        return { success: true, message: "Project archived successfully." };
    } catch (error) {
        console.error("Error archiving project:", error);
        return { success: false, message: "Failed to archive project." };
    }
}

export async function unarchiveProject(projectId: string) {
    if (!projectId) {
        return { success: false, message: "Project ID is required." };
    }
    try {
        const projectRef = doc(db, "projects", projectId);
        await updateDoc(projectRef, { status: 'กำลังดำเนินการ' });
        revalidatePath("/projects");
        return { success: true, message: "Project restored successfully." };
    } catch (error) {
        console.error("Error unarchiving project:", error);
        return { success: false, message: "Failed to unarchive project." };
    }
}
