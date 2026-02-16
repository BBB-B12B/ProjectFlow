import { collection, getDocs } from 'firebase/firestore/lite';
import { redirect } from 'next/navigation';
import { db } from '@/lib/firebase-lite';
import { seedData } from './seed/actions';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export default async function HomePage() {
  const projectsCol = collection(db, 'projects');
  const projectSnapshot = await getDocs(projectsCol);

  // If no projects, seed the database and then reload the page to fetch the new data.
  if (projectSnapshot.empty) {
    await seedData();
    // Redirecting to the same page to force a refetch after seeding
    redirect('/');
  }

  // Otherwise, if projects exist, redirect to the main projects dashboard.
  redirect('/projects');
}
