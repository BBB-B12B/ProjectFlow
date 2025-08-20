'use server';

import { collection, writeBatch, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { projects as seedProjects, tasks as seedTasks } from '@/lib/seed-data';

// Helper to generate a somewhat unique ID. In a real app, you might use a library like nanoid.
function generateId(length: number): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}


export async function seedData() {
  try {
    // Seed projects
    const projectsBatch = writeBatch(db);
    const projectsCollection = collection(db, 'projects');
    seedProjects.forEach((project) => {
      // Use the project's own 'id' if it exists, otherwise generate one.
      const id = (project as any).id || `proj-${project.No}`;
      const docRef = doc(projectsCollection, id);
      projectsBatch.set(docRef, project);
    });
    await projectsBatch.commit();
    console.log('Successfully seeded projects.');

    // Seed tasks
    const tasksBatch = writeBatch(db);
    const tasksCollection = collection(db, 'tasks');
    seedTasks.forEach((task) => {
       // Use the task's own 'id' if it exists, otherwise generate one.
      const id = (task as any).id || `task-${task.No}-${generateId(4)}`;
      const docRef = doc(tasksCollection, id);
      tasksBatch.set(docRef, task);
    });
    await tasksBatch.commit();
    console.log('Successfully seeded tasks.');

  } catch (error) {
    console.error("Error seeding data: ", error);
    throw new Error('Failed to seed database.');
  }
}
