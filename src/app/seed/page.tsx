
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { seedData } from './actions';
import { seedSpyfallData } from '@/app/seed/spyfall-actions';

export default function SeedPage() {
  const [isProjectLoading, setIsProjectLoading] = useState(false);
  const [isSpyfallLoading, setIsSpyfallLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleSeedProjects = async () => {
    setIsProjectLoading(true);
    try {
      await seedData();
      toast({
        title: 'Success!',
        description: 'Your database has been seeded with sample project data.',
      });
      router.push('/projects');
      router.refresh();
    } catch (error) {
      console.error('Failed to seed project data:', error);
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: 'There was a problem seeding your project data.',
      });
    } finally {
      setIsProjectLoading(false);
    }
  };
  
  const handleSeedSpyfall = async () => {
    setIsSpyfallLoading(true);
    try {
        const result = await seedSpyfallData();
        if (result.success) {
            toast({
                title: "Success",
                description: result.message,
            });
        } else {
             toast({
                title: "Info",
                description: result.message,
                variant: "default",
            });
        }
    } catch (error) {
        toast({
            title: "Error",
            description: "An unexpected error occurred while seeding Spyfall data.",
            variant: "destructive",
        });
    } finally {
        setIsSpyfallLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-full">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Seed Database</CardTitle>
          <CardDescription>
            Populate your Firestore database with sample data to explore the app's features.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div>
                <h3 className="font-semibold mb-2">Project Data</h3>
                <p className="text-sm text-muted-foreground mb-3">
                    Seed the database with sample projects and tasks. This is great for exploring the main project management features.
                </p>
                <Button onClick={handleSeedProjects} disabled={isProjectLoading} className="w-full">
                    {isProjectLoading ? 'Seeding...' : 'Seed Project Data'}
                </Button>
            </div>
            <div>
                <h3 className="font-semibold mb-2">Spyfall Game Data</h3>
                <p className="text-sm text-muted-foreground mb-3">
                    Seed the database with locations and roles for the Spyfall board game. This is required to play the game in the "Party" section.
                </p>
                <Button onClick={handleSeedSpyfall} disabled={isSpyfallLoading} className="w-full" variant="secondary">
                    {isSpyfallLoading ? 'Seeding...' : 'Seed Spyfall Data'}
                </Button>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
