"use server";

import { db } from "@/lib/firebase";
import {
  Timestamp,
  collection,
  writeBatch,
  getDocs,
  doc,
} from "firebase/firestore";
import { Project, Task } from "@/lib/types";

const PROJECTS: Omit<Project, "id">[] = [];

const TASKS: Omit<Task, "id" | "projectId">[] = [
];

export async function seedData() {
  try {
    const projectsCol = collection(db, "projects");
    const tasksCol = collection(db, "tasks");

    // Check if data already exists
    const projectSnapshot = await getDocs(projectsCol);
    if (!projectSnapshot.empty) {
      console.log("Project data already exists. Aborting seed.");
      return; // Stop if data is already there
    }

    const batch = writeBatch(db);

    const projectIds: string[] = [];

    // Add projects and get their IDs
    PROJECTS.forEach((project) => {
      // Use doc(collectionRef) to get a new DocumentReference with a random ID
      const projectRef = doc(projectsCol);
      batch.set(projectRef, project);
      projectIds.push(projectRef.id);
    });

    // Assign tasks to projects in a round-robin fashion
    let currentTaskIndex = 0;
    while (currentTaskIndex < TASKS.length) {
      for (const projectId of projectIds) {
        if (currentTaskIndex >= TASKS.length) break;

        const taskData = TASKS[currentTaskIndex];
        const taskRef = doc(tasksCol); // Create a new task doc with a random ID
        batch.set(taskRef, { ...taskData, projectId });

        currentTaskIndex++;
      }
    }

    await batch.commit();
    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database: ", error);
    // Re-throw the error to be caught by the calling function
    throw new Error("Failed to seed database.");
  }
}
