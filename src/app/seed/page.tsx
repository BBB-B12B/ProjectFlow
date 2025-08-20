
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { seedData } from './actions';

export default function SeedPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleSeed = async () => {
    setIsLoading(true);
    try {
      await seedData();
      toast({
        title: 'Success!',
        description: 'Your database has been seeded with sample data.',
      });
      router.push('/projects');
      router.refresh(); // Refresh the page to ensure server components refetch data
    } catch (error) {
      console.error('Failed to seed data:', error);
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: 'There was a problem seeding your database. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-full">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Seed Database</CardTitle>
          <CardDescription>
            Your Firestore database is currently empty. Click the button below to populate it with
            sample projects and tasks. This will allow you to explore the app's features with
            some initial data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleSeed} disabled={isLoading} className="w-full">
            {isLoading ? 'Seeding...' : 'Seed Data'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
