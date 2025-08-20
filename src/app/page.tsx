
import { redirect } from 'next/navigation';

export default function HomePage() {
  // Redirect to the projects page. If no data, it can handle redirection to seed.
  redirect('/projects');
}
