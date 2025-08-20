'use server';

import { collection, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { projects, tasks } from '@/lib/seed-data';

export async function seedData() {
  try {
    // Seed projects
    const projectsBatch = writeBatch(db);
    const projectsCollection = collection(db, 'projects');
    projects.forEach((project) => {
      const docRef = collection(db, 'projects', project.id);
      projectsBatch.set(docRef, project);
    });
    await projectsBatch.commit();
    console.log('Successfully seeded projects.');

    // Seed tasks
    const tasksBatch = writeBatch(db);
    const tasksCollection = collection(db, 'tasks');
    tasks.forEach((task) => {
      const docRef = collection(db, 'tasks', task.id);
      tasksBatch.set(tasksCollection, task);
    });
    await tasksBatch.commit();
    console.log('Successfully seeded tasks.');

  } catch (error) {
    console.error("Error seeding data: ", error);
    throw new Error('Failed to seed database.');
  }
}
