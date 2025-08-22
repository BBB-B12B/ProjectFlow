"use server";

import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const CreateProjectSchema = z.object({
  name: z.string().min(1, "Project name is required."),
  description: z.string().optional(),
  startDate: z.string().min(1, "Start date is required."),
  endDate: z.string().min(1, "End date is required."),
});

export async function createProject(prevState: any, formData: FormData) {
  const validatedFields = CreateProjectSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    console.error("Validation Error:", validatedFields.error.flatten().fieldErrors);
    return { success: false, message: "Invalid form data." };
  }

  const { name, description, startDate, endDate } = validatedFields.data;

  // Validate that endDate is not before startDate
  if (new Date(endDate) < new Date(startDate)) {
    return { success: false, message: "End date cannot be before the start date." };
  }

  try {
    const projectsCol = collection(db, "projects");
    await addDoc(projectsCol, {
      name,
      description: description || "",
      startDate,
      endDate,
      status: 'กำลังดำเนินการ',
    });
    
    revalidatePath("/projects");
    return { success: true, message: "Project created successfully." };
  } catch (error) {
    console.error("Error creating project:", error);
    return { success: false, message: "Failed to create project." };
  }
}
