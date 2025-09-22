// /home/user/studio/src/components/new-customer-quick-add-dialog.tsx
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

const initialState = {
  success: false,
  message: "",
  customer: null as any | null, // To return the newly created customer
};

async function createCustomerAction(prevState: any, formData: FormData) {
    try {
        const name = formData.get('name') as string;
        const email = formData.get('email') as string;
        const companyName = formData.get('companyName') as string || null;
        const businessType = formData.get('businessType') as string || null;
        const businessDetails = formData.get('businessDetails') as string || null;

        if (!name || !email) {
            return { success: false, message: "Customer name and email are required." };
        }

        const response = await fetch('/api/customers', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name,
                email,
                companyName,
                businessType,
                businessDetails,
                relatedProjectCount: 0,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to add customer');
        }

        const newCustomer = await response.json();
        return { success: true, message: "Customer created successfully.", customer: newCustomer };
    } catch (error: any) {
        console.error("Error creating customer in quick add:", error);
        return { success: false, message: error.message || "Failed to create customer." };
    }
}

function SubmitButton() {
    const { pending } = useFormStatus();
  
    return (
      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {pending ? "Creating..." : "Create Customer"}
      </Button>
    );
}

export function NewCustomerQuickAddDialog({
  isOpen,
  onOpenChange,
  onCustomerAdded // New prop to handle adding customer
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onCustomerAdded: (customer: any) => void;
}) {
  const [state, formAction] = useActionState(createCustomerAction, initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success && state.customer) {
      toast({
        title: "Success",
        description: state.message,
      });
      onCustomerAdded(state.customer);
      onOpenChange(false);
      formRef.current?.reset();
    } else if (state.message) {
      toast({
        title: "Error",
        description: state.message,
        variant: "destructive",
      });
    }
  }, [state, toast, onOpenChange, onCustomerAdded]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Customer</DialogTitle>
          <DialogDescription>
            Quickly add a new customer here. You can fill in more details later.
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={formAction}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Customer Name</Label>
              <Input id="name" name="name" placeholder="e.g. Acme Corp." required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="e.g. contact@acmecorp.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name (Optional)</Label>
              <Input id="companyName" name="companyName" placeholder="e.g. Acme Corp." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessType">Business Type (Optional)</Label>
              <Input id="businessType" name="businessType" placeholder="e.g. Technology" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessDetails">Business Details (Optional)</Label>
              <Input id="businessDetails" name="businessDetails" placeholder="e.g. Software development, IT consulting" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
