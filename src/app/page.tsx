import { collection, getDocs } from 'firebase/firestore';
import { redirect } from 'next/navigation';
import { db } from '@/lib/firebase';

export default async function HomePage() {
  const projectsCol = collection(db, 'projects');
  const projectSnapshot = await getDocs(projectsCol);

  // If no projects, redirect to the seed page.
  if (projectSnapshot.empty) {
    redirect('/seed');
  }

  // Otherwise, redirect to the main projects dashboard.
  redirect('/projects');
}
