import { redirect } from 'next/navigation';

export default function HomePage() {
  // Redirect to the seed page first to ensure data is available.
  // The seed page will then redirect to the projects page.
  redirect('/seed');
}
