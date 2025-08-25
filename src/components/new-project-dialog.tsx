"use client";

// --- (1) IMPORT useFormStatus and a loading icon ---
import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { useToast } from "@/hooks/use-toast";
import { createProject, getTeams } from "@/app/projects/actions";
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
import { SingleSelectAutocomplete } from "@/components/ui/single-select-autocomplete";
import { Loader2 } from "lucide-react";

const initialState = {
  success: false,
  message: "",
};

// --- (2) CREATE A DEDICATED SUBMIT BUTTON COMPONENT ---
// This component uses the useFormStatus hook to get the form's pending state.
function SubmitButton() {
    const { pending } = useFormStatus();
  
    return (
      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {pending ? "Creating..." : "Create Project"}
      </Button>
    );
}


export function NewProjectDialog({
  isOpen,
  onOpenChange,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}) {
  const [state, formAction] = useActionState(createProject, initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [teams, setTeams] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  useEffect(() => {
    if (isOpen) {
        getTeams().then(setTeams);
        const today = new Date().toISOString().split('T')[0];
        setStartDate(today);
        setEndDate(today);
    }
  }, [isOpen]);

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = e.target.value;
    setStartDate(newStartDate);
    if (newStartDate && endDate && newStartDate > endDate) {
      setEndDate(newStartDate);
    }
  };

  useEffect(() => {
    if (state.success) {
      toast({
        title: "Success",
        description: state.message,
      });
      onOpenChange(false);
      formRef.current?.reset();
    } else if (state.message) {
      toast({
        title: "Error",
        description: state.message,
        variant: "destructive",
      });
    }
  }, [state, toast, onOpenChange]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Fill in the details for your new project. Click create when you're done.
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={formAction}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name</Label>
              <Input id="name" name="name" placeholder="e.g. Website Redesign" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" placeholder="A brief description of the project..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="team">Team</Label>
              <SingleSelectAutocomplete
                options={teams}
                placeholder="Select or create a team..."
                name="team"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taskName">First Task Name</Label>
              <Input id="taskName" name="taskName" placeholder="e.g. Project setup" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input id="startDate" name="startDate" type="date" value={startDate} onChange={handleStartDateChange} required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input id="endDate" name="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} min={startDate} required />
                </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="ghost">Cancel</Button>
            </DialogClose>
            {/* --- (3) REPLACE THE OLD BUTTON WITH THE NEW COMPONENT --- */}
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
