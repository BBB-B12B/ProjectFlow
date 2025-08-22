"use client";

import { useState, useEffect, useTransition } from 'react';
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Project } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { unarchiveProject } from '@/app/projects/actions';

async function getArchivedProjects(): Promise<Project[]> {
    try {
        const projectsCol = collection(db, 'projects');
        const q = query(projectsCol, where("status", "==", "Archived"));
        const projectSnapshot = await getDocs(q);
        return projectSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
    } catch (error) {
        console.error("Error fetching archived projects:", error);
        return [];
    }
}

export function ArchivedProjectsDialog({
  isOpen,
  onOpenChange,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}) {
  const [archivedProjects, setArchivedProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      getArchivedProjects().then(projects => {
        setArchivedProjects(projects);
        setIsLoading(false);
      });
    }
  }, [isOpen]);

  const handleRestore = (projectId: string) => {
    startTransition(async () => {
      const result = await unarchiveProject(projectId);
      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        });
        // Refresh the list
        setArchivedProjects(prev => prev.filter(p => p.id !== projectId));
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Archived Projects</DialogTitle>
          <DialogDescription>
            Restore projects to make them active again.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-72 w-full rounded-md border p-4">
          {isLoading ? (
            <p>Loading...</p>
          ) : archivedProjects.length > 0 ? (
            <div className="space-y-4">
              {archivedProjects.map(project => (
                <div key={project.id} className="flex items-center justify-between">
                  <span>{project.name}</span>
                  <Button
                    size="sm"
                    onClick={() => handleRestore(project.id)}
                    disabled={isPending}
                  >
                    {isPending ? "Restoring..." : "Restore"}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p>No archived projects found.</p>
          )}
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
