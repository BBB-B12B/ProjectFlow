"use server";

import { db } from "@/lib/firebase";
import { collection, getDocs, writeBatch, doc } from "firebase/firestore";

interface ProjectData {
  id: string;
  team?: string;
  isDarkModeOnly?: boolean;
}

export async function migrateProjects() {
  try {
    const projectsRef = collection(db, "projects");
    const snapshot = await getDocs(projectsRef);

    if (snapshot.empty) {
      return { success: true, message: "No projects found to migrate." };
    }

    const batch = writeBatch(db);
    let migratedCount = 0;

    snapshot.forEach(document => {
      const data = document.data() as ProjectData;
      
      // Only update documents that DO NOT have the isDarkModeOnly field yet
      if (typeof data.isDarkModeOnly === 'undefined') {
        const projectRef = doc(db, "projects", document.id);
        const isDarkModeOnly = data.team?.trim().toUpperCase() === 'OS';
        
        batch.update(projectRef, { isDarkModeOnly });
        migratedCount++;
      }
    });

    if (migratedCount > 0) {
      await batch.commit();
      return { success: true, message: `Successfully migrated ${migratedCount} projects.` };
    } else {
      return { success: true, message: "All projects are already up-to-date." };
    }

  } catch (error) {
    console.error("Error migrating projects:", error);
    if (error instanceof Error) {
        return { success: false, message: `Migration failed: ${error.message}` };
    }
    return { success: false, message: "An unknown error occurred during migration." };
  }
}
