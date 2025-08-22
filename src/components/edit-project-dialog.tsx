"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { updateProject } from "@/app/projects/actions";
import type { Project } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState = {
  success: false,
  message: "",
};

export function EditProjectDialog({
  isOpen,
  onOpenChange,
  project,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  project: Project | null;
}) {
  const [state, formAction] = useActionState(updateProject, initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description);
    }
  }, [project]);

  useEffect(() => {
    if (state.success) {
      toast({
        title: "Success",
        description: state.message,
      });
      onOpenChange(false);
    } else if (state.message) {
      toast({
        title: "Error",
        description: state.message,
        variant: "destructive",
      });
    }
  }, [state, toast, onOpenChange]);

  if (!project) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
          <DialogDescription>
            Make changes to your project here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={formAction}>
          <input type="hidden" name="projectId" value={project.id} />
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name</Label>
              <Input id="name" name="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input id="startDate" name="startDate" type="date" value={project.startDate} disabled />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input id="endDate" name="endDate" type="date" value={project.endDate} disabled />
                </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="ghost">Cancel</Button>
            </DialogClose>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
