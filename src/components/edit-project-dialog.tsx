"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { updateProject, getTeams } from "@/app/projects/actions";
import type { Project, Customer } from "@/lib/types";
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
import { Plus } from 'lucide-react'; // Import Plus icon
import { NewCustomerQuickAddDialog } from './new-customer-quick-add-dialog'; // Import the new dialog

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
  const [teams, setTeams] = useState<{ value: string; label: string; }[]>([]);
  const [customers, setCustomers] = useState<{ value: string; label: string; }[]>([]);
  const [isNewCustomerQuickAddDialogOpen, setIsNewCustomerQuickAddDialogOpen] = useState(false);
  const [selectedCustomerValue, setSelectedCustomerValue] = useState<string>(''); // Initialize with empty string

  // Function to fetch customers
  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers');
      if (!response.ok) {
        throw new Error('Failed to fetch customers');
      }
      const data: Customer[] = await response.json();
      setCustomers(data.map(customer => ({ value: customer.id, label: customer.name })));
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast({
        title: "Error",
        description: "Failed to load customer list.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      getTeams().then(data => setTeams(data.map(team => ({ value: team.value, label: team.label }))));
      fetchCustomers(); // Fetch customers when dialog opens
      // Set the selected customer value when the dialog opens or project changes
      setSelectedCustomerValue(project?.customerId || ''); 
    }
  }, [isOpen, project?.customerId]); // project?.customerId is in dependency array

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

  const handleCustomerAdded = (newCustomer: Customer) => {
    setCustomers(prev => [...prev, { value: newCustomer.id, label: newCustomer.name }]);
    setSelectedCustomerValue(newCustomer.id);
    setIsNewCustomerQuickAddDialogOpen(false);
  };

  if (!project) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
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
                <div className="flex items-center justify-between">
                    <Label htmlFor="customerId">Customer</Label>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setIsNewCustomerQuickAddDialogOpen(true)}
                        type="button"
                    >
                        <Plus className="mr-1 h-3 w-3" /> New Customer
                    </Button>
                </div>
                <SingleSelectAutocomplete
                  key={project.id + '-customer'}
                  options={customers}
                  placeholder="Select a customer (optional)"
                  name="customerId"
                  // Removed initialValue, now fully controlled by 'value' prop
                  value={selectedCustomerValue} 
                  onValueChange={setSelectedCustomerValue}
                />
            </div>
            <div className="space-y-2">
              <Label htmlFor="team">Team</Label>
              <SingleSelectAutocomplete
                key={project.id + '-team'}
                options={teams}
                placeholder="Select or create a team..."
                name="team"
                initialValue={project.team}
              />
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
      <NewCustomerQuickAddDialog 
        isOpen={isNewCustomerQuickAddDialogOpen} 
        onOpenChange={setIsNewCustomerQuickAddDialogOpen}
        onCustomerAdded={handleCustomerAdded}
      />
    </Dialog>
  );
}
