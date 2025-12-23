"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { useToast } from "@/hooks/use-toast";
import { createProject, getTeams, getCustomers } from "@/app/projects/actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SingleSelectAutocomplete } from "@/components/ui/single-select-autocomplete";
import { Loader2, Plus } from "lucide-react";
import { AddCustomerDialog } from "@/components/add-customer-dialog";


const initialState = {
  success: false,
  message: "",
};


function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <LoadingButton type="submit" loading={pending}>
      Create Project
    </LoadingButton>
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
  const [teams, setTeams] = useState<{ value: string; label: string; }[]>([]);
  const [customers, setCustomers] = useState<{ value: string; label: string; }[]>([]);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [isConfirmCloseOpen, setIsConfirmCloseOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      getTeams().then(setTeams);
      getCustomers().then(setCustomers);
      const today = new Date().toISOString().split('T')[0];
      setStartDate(today);
      setEndDate(today);
      setIsFormDirty(false);
    }
  }, [isOpen]);

  const refreshCustomers = async () => {
    const updatedCustomers = await getCustomers();
    setCustomers(updatedCustomers);
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = e.target.value;
    setStartDate(newStartDate);
    if (newStartDate && endDate && newStartDate > endDate) {
      setEndDate(newStartDate);
    }
    setIsFormDirty(true);
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

  const handleCloseDialog = () => {
    if (isFormDirty) {
      setIsConfirmCloseOpen(true);
    } else {
      onOpenChange(false);
    }
  };

  console.log("Teams data being passed to SingleSelectAutocomplete:", teams);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) {
          handleCloseDialog();
        } else {
          onOpenChange(true);
        }
      }}>
        <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
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
                <Input id="name" name="name" placeholder="e.g. Website Redesign" required onChange={() => setIsFormDirty(true)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" placeholder="A brief description of the project..." onChange={() => setIsFormDirty(true)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="team">Team</Label>
                <SingleSelectAutocomplete
                  options={teams}
                  placeholder="Select or create a team..."
                  name="team"
                  onValueChange={() => setIsFormDirty(true)}
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
                      onValueChange={() => setIsFormDirty(true)}
                    />
                  </div>
                  <Button type="button" size="icon" variant="outline" onClick={() => setIsAddCustomerOpen(true)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="taskName">First Task Name</Label>
                <Input id="taskName" name="taskName" placeholder="e.g. Project setup" required onChange={() => setIsFormDirty(true)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input id="startDate" name="startDate" type="date" value={startDate} onChange={handleStartDateChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input id="endDate" name="endDate" type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setIsFormDirty(true); }} min={startDate} required />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={handleCloseDialog}>Cancel</Button>
              <SubmitButton />
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog >
      <AlertDialog open={isConfirmCloseOpen} onOpenChange={setIsConfirmCloseOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to discard them?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => onOpenChange(false)}>
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AddCustomerDialog
        isOpen={isAddCustomerOpen}
        onOpenChange={setIsAddCustomerOpen}
        onSuccess={refreshCustomers}
      />
    </>
  );
}
