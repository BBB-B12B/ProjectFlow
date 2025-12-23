"use server";

import { db } from "@/lib/firebase";
import { collection, addDoc, writeBatch, doc, query, where, getDocs, updateDoc, getDoc } from "firebase/firestore";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Project, Task } from "@/lib/types";

const CreateProjectSchema = z.object({
    name: z.string().min(1, "Project name is required."),
    description: z.string().optional(),
    startDate: z.string().min(1, "Start date is required."),
    endDate: z.string().min(1, "End date is required."),
    taskName: z.string().min(1, "First task name is required."),
    team: z.string().optional(),
    owner: z.string().optional(),
});

const UpdateProjectSchema = z.object({
    projectId: z.string().min(1, "Project ID is required."),
    name: z.string().min(1, "Project name is required."),
    description: z.string().optional(),
    team: z.string().optional(),
    owner: z.string().optional(),
});

export async function createProject(prevState: any, formData: FormData) {
    const validatedFields = CreateProjectSchema.safeParse(
        Object.fromEntries(formData.entries())
    );

    if (!validatedFields.success) {
        console.error("Validation Error:", validatedFields.error.flatten().fieldErrors);
        return { success: false, message: "Invalid form data." };
    }

    const { name, description, startDate, endDate, taskName, team, owner } = validatedFields.data;

    if (new Date(endDate) < new Date(startDate)) {
        return { success: false, message: "End date cannot be before the start date." };
    }

    try {
        const batch = writeBatch(db);

        const isDarkModeOnly = team?.trim().toUpperCase() === 'OS';

        let customerId = "";
        let ownerName = owner || "";

        // Resolve Customer ID to Name if possible, and store ID
        if (owner) {
            // Check if 'owner' is a potential ID (simple length check or assume it's an ID if it came from dropdown)
            // Since we changed getCustomers to return ID, we try to fetch it.
            try {
                const customerDoc = await getDoc(doc(db, "customers", owner));
                if (customerDoc.exists()) {
                    customerId = customerDoc.id;
                    ownerName = (customerDoc.data() as any).name || ownerName;
                }
            } catch (ignore) {
                // If error (e.g. invalid ID format), assume it's just a name entered manually
            }
        }

        const projectRef = doc(collection(db, "projects"));
        batch.set(projectRef, {
            name,
            description: description || "",
            startDate,
            endDate,
            status: 'กำลังดำเนินการ',
            team: team || "",
            owner: ownerName,
            customerId: customerId, // Link to Customer
            isDarkModeOnly: isDarkModeOnly,
            totalTasks: 0,
            completedTasks: 0,
        });

        const taskRef = doc(collection(db, "tasks"));
        batch.set(taskRef, {
            TaskName: taskName,
            StartDate: startDate,
            EndDate: endDate,
            Status: 'ยังไม่ได้เริ่ม',
            Assignee: "",
            Owner: "", // This is task owner, which user says should be at Project level, but existing structure has it here too.
            Effect: 0,
            Effort: 0,
            projectId: projectRef.id,
            Want: "",
            Category: "",
            ProjectType: "Main",
        });

        await batch.commit();

        if (customerId) {
            await recalculateCustomerStats(customerId);
        }

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

    const { projectId, name, description, team, owner } = validatedFields.data;

    try {
        const isDarkModeOnly = team?.trim().toUpperCase() === 'OS';
        const projectRef = doc(db, "projects", projectId);

        // Logic to detect if owner changed and update linkage
        let newCustomerId = "";
        let newOwnerName = owner || "";

        if (owner) {
            try {
                const customerDoc = await getDoc(doc(db, "customers", owner));
                if (customerDoc.exists()) {
                    newCustomerId = customerDoc.id;
                    newOwnerName = (customerDoc.data() as any).name || newOwnerName;
                }
            } catch (ignore) { }
        }

        // Get old project to check previous customer
        const oldProjectDoc = await getDoc(projectRef);
        const oldProjectData = oldProjectDoc.data() as Project | undefined;
        const oldCustomerId = oldProjectData?.customerId;

        await updateDoc(projectRef, {
            name,
            description: description || "",
            team: team || "",
            owner: newOwnerName,
            customerId: newCustomerId || oldCustomerId, // Update if new valid customer found, else keep old? Or should we clear? Assume keep/update.
            isDarkModeOnly: isDarkModeOnly,
        });

        if (newCustomerId) await recalculateCustomerStats(newCustomerId);
        if (oldCustomerId && oldCustomerId !== newCustomerId) await recalculateCustomerStats(oldCustomerId);

        revalidatePath("/projects");
        revalidatePath(`/project/${projectId}`);
        return { success: true, message: "Project updated successfully." };
    } catch (error) {
        console.error("Error updating project:", error);
        return { success: false, message: "Failed to update project." };
    }
}

export async function getTeams(): Promise<{ value: string; label: string; }[]> {
    try {
        const snapshot = await getDocs(collection(db, "projects"));
        const projects = snapshot.docs.map(doc => doc.data() as Project);
        const teams = new Set(projects.map(project => project.team).filter(Boolean) as string[]);

        return Array.from(teams).map(teamName => ({
            value: teamName,
            label: teamName
        }));
    } catch (error) {
        console.error("Error fetching teams:", error);
        return [];
    }
}

export async function getCustomers(): Promise<{ value: string; label: string; }[]> {
    try {
        const snapshot = await getDocs(collection(db, "customers"));
        return snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as { id: string, name: string }))
            .filter(c => c.name)
            .map(c => ({
                value: c.id,
                label: c.name
            }))
            .sort((a, b) => a.label.localeCompare(b.label));
    } catch (error) {
        console.error("Error fetching customers:", error);
        return [];
    }
}

async function recalculateCustomerStats(customerId: string) {
    if (!customerId) return;
    try {
        const projectsRef = collection(db, 'projects');
        const q = query(projectsRef, where('customerId', '==', customerId));
        const snapshot = await getDocs(q);

        const totalProjects = snapshot.size;
        const completedProjects = snapshot.docs.filter(doc => (doc.data() as Project).status === 'เสร็จสิ้น').length;

        await updateDoc(doc(db, 'customers', customerId), {
            totalProjects,
            completedProjects,
            updatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error(`Error recalculating stats for customer ${customerId}:`, error);
    }
}

export async function deleteProject(projectId: string) {
    if (!projectId) {
        return { success: false, message: "Project ID is required." };
    }
    try {
        const projectDoc = await getDoc(doc(db, "projects", projectId));
        const customerId = (projectDoc.data() as Project)?.customerId;

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

        if (customerId) {
            await recalculateCustomerStats(customerId);
        }
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
