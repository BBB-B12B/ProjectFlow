"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { useToast } from "@/hooks/use-toast";
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
} from "@/components/ui/alert-dialog"; // Import AlertDialog components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import type { Customer } from "@/lib/types";

const initialState = {
  success: false,
  message: "",
  customer: null as Customer | null,
};

async function updateCustomerAction(prevState: any, formData: FormData) {
    try {
        const id = formData.get('id') as string;
        const name = formData.get('name') as string;
        const email = formData.get('email') as string;
        const phone = formData.get('phone') as string || null;
        const address = formData.get('address') as string || null;
        const companyName = formData.get('companyName') as string || null;
        const businessType = formData.get('businessType') as string || null;
        const businessDetails = formData.get('businessDetails') as string || null;

        if (!id || !name || !email) {
            return { success: false, message: "Customer ID, name, and email are required." };
        }

        const response = await fetch(`/api/customers/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name,
                email,
                phone,
                address,
                companyName,
                businessType,
                businessDetails,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update customer');
        }

        const updatedCustomer = await response.json();
        return { success: true, message: "Customer updated successfully.", customer: updatedCustomer };
    } catch (error: any) {
        console.error("Error updating customer in dialog:", error);
        return { success: false, message: error.message || "Failed to update customer." };
    }
}

function SubmitButton() {
    const { pending } = useFormStatus();
  
    return (
      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {pending ? "Saving..." : "Save Changes"}
      </Button>
    );
}

export function EditCustomerDialog({
  isOpen,
  onOpenChange,
  customer,
  onCustomerUpdated,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  customer: Customer | null;
  onCustomerUpdated: (customer: Customer) => void;
}) {
  const [state, formAction] = useActionState(updateCustomerAction, initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  const [isFormDirty, setIsFormDirty] = useState(false); // New state for tracking changes
  const [isConfirmCloseOpen, setIsConfirmCloseOpen] = useState(false); // New state for confirmation dialog

  // Local states for form fields, initialized from the prop 'customer'
  const [editName, setEditName] = useState(customer?.name || '');
  const [editEmail, setEditEmail] = useState(customer?.email || '');
  const [editPhone, setEditPhone] = useState(customer?.phone || '');
  const [editAddress, setEditAddress] = useState(customer?.address || '');
  const [editCompanyName, setEditCompanyName] = useState(customer?.companyName || '');
  const [editBusinessType, setEditBusinessType] = useState(customer?.businessType || '');
  const [editBusinessDetails, setEditBusinessDetails] = useState(customer?.businessDetails || '');

  // Effect to update local states when the 'customer' prop changes and reset dirty state
  useEffect(() => {
    if (customer) {
      setEditName(customer.name);
      setEditEmail(customer.email);
      setEditPhone(customer.phone || '');
      setEditAddress(customer.address || '');
      setEditCompanyName(customer.companyName || '');
      setEditBusinessType(customer.businessType || '');
      setEditBusinessDetails(customer.businessDetails || '');
      setIsFormDirty(false); // Reset dirty state when a new customer is loaded
    } else {
      // Reset form and dirty state if no customer is provided
      setEditName('');
      setEditEmail('');
      setEditPhone('');
      setEditAddress('');
      setEditCompanyName('');
      setEditBusinessType('');
      setEditBusinessDetails('');
      setIsFormDirty(false);
    }
  }, [customer]);

  // Effect to handle form submission success/failure
  useEffect(() => {
    if (state.success && state.customer) {
      toast({
        title: "Success",
        description: state.message,
      });
      onCustomerUpdated(state.customer);
      onOpenChange(false);
      setIsFormDirty(false); // Reset dirty state on successful save
    } else if (state.message) {
      toast({
        title: "Error",
        description: state.message,
        variant: "destructive",
      });
    }
  }, [state, toast, onOpenChange, onCustomerUpdated]);

  // Generic change handler to mark form as dirty
  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setter(e.target.value);
    setIsFormDirty(true);
  };

  // Handle dialog close request (either from prop or internal cancel button)
  const handleCloseDialog = () => {
    if (isFormDirty) {
      setIsConfirmCloseOpen(true); // Open confirmation dialog
    } else {
      onOpenChange(false); // Close dialog directly if no changes
    }
  };

  if (!customer) return null; // Don't render if no customer is passed

  return (
    <>
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) { // If dialog is being closed
                handleCloseDialog();
            } else { // If dialog is being opened (unlikely for onOpenChange from outside to set true)
                onOpenChange(true);
            }
        }}>
        <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
            <DialogTitle>Edit Customer: {customer.name}</DialogTitle>
            <DialogDescription>
                Make changes to the customer details here. Click save when you're done.
            </DialogDescription>
            </DialogHeader>
            <form ref={formRef} action={formAction}>
            <input type="hidden" name="id" value={customer.id} />
            <div className="grid gap-4 py-4">
                <div className="space-y-2">
                <Label htmlFor="name">Customer Name</Label>
                <Input id="name" name="name" placeholder="e.g. Acme Corp." required value={editName} onChange={handleInputChange(setEditName)} />
                </div>
                <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="e.g. contact@acmecorp.com" required value={editEmail} onChange={handleInputChange(setEditEmail)} />
                </div>
                <div className="space-y-2">
                <Label htmlFor="phone">Phone (Optional)</Label>
                <Input id="phone" name="phone" placeholder="e.g. 081-123-4567" value={editPhone} onChange={handleInputChange(setEditPhone)} />
                </div>
                <div className="space-y-2">
                <Label htmlFor="address">Address (Optional)</Label>
                <Input id="address" name="address" placeholder="e.g. 123 Main St." value={editAddress} onChange={handleInputChange(setEditAddress)} />
                </div>
                <div className="space-y-2">
                <Label htmlFor="companyName">Company Name (Optional)</Label>
                <Input id="companyName" name="companyName" placeholder="e.g. Acme Corp." value={editCompanyName} onChange={handleInputChange(setEditCompanyName)} />
                </div>
                <div className="space-y-2">
                <Label htmlFor="businessType">Business Type (Optional)</Label>
                <Input id="businessType" name="businessType" placeholder="e.g. Technology" value={editBusinessType} onChange={handleInputChange(setEditBusinessType)} />
                </div>
                <div className="space-y-2">
                <Label htmlFor="businessDetails">Business Details (Optional)</Label>
                <Input id="businessDetails" name="businessDetails" placeholder="e.g. Software development, IT consulting" value={editBusinessDetails} onChange={handleInputChange(setEditBusinessDetails)} />
                </div>
            </div>
            <DialogFooter>
                <Button type="button" variant="ghost" onClick={handleCloseDialog}>Cancel</Button>
                <SubmitButton />
            </DialogFooter>
            </form>
        </DialogContent>
        </Dialog>

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
                    <AlertDialogAction onClick={() => onOpenChange(false)}>Discard</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
  );
}
