"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { useToast } from "@/hooks/use-toast";
import { updateProject, getTeams, getCustomers } from "@/app/projects/actions";
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
import { LoadingButton } from "@/components/ui/loading-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SingleSelectAutocomplete } from "@/components/ui/single-select-autocomplete";
import { Plus } from "lucide-react";
import { AddCustomerDialog } from "@/components/add-customer-dialog";
const initialState = {
  success: false,
  message: "",
};


function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <LoadingButton type="submit" loading={pending}>
      Save Changes
    </LoadingButton>
  );
}

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
  const [teams, setTeams] = useState<{ value: string; label: string; }[]>([]);
  const [customers, setCustomers] = useState<{ value: string; label: string; }[]>([]);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      getTeams().then(setTeams);
      getCustomers().then(setCustomers);
    }
  }, [isOpen]);

  const refreshCustomers = async () => {
    const updatedCustomers = await getCustomers();
    setCustomers(updatedCustomers);
  };

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
    <>
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
                <Input id="name" name="name" defaultValue={project.name} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" defaultValue={project.description} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="team">Team</Label>
                <SingleSelectAutocomplete
                  key={project.id}
                  options={teams}
                  placeholder="Select or create a team..."
                  name="team"
                  initialValue={project.team}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="owner">Owner (Customer)</Label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <SingleSelectAutocomplete
                      options={customers}
                      placeholder="Select or create a customer..."
                      name="owner"
                      initialValue={(project as any).customerId || project.owner}
                    />
                  </div>
                  <Button type="button" size="icon" variant="outline" onClick={() => setIsAddCustomerOpen(true)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
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
              <SubmitButton />
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <AddCustomerDialog
        isOpen={isAddCustomerOpen}
        onOpenChange={setIsAddCustomerOpen}
        onSuccess={refreshCustomers}
      />
    </>
  );
}
