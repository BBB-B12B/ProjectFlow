"use client";

import { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Customer } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';

interface AddCustomerDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: (newCustomer: Customer) => void;
}

export function AddCustomerDialog({ isOpen, onOpenChange, onSuccess }: AddCustomerDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({
        name: '',
        email: '',
        phone: '',
        company: '',
        status: 'Lead',
        isDarkModeOnly: false,
    });

    const handleAddCustomer = async () => {
        if (!newCustomer.name) return;
        setIsSubmitting(true);
        try {
            const customerData = {
                ...newCustomer,
                tags: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            const docRef = await addDoc(collection(db, 'customers'), customerData);

            onOpenChange(false);
            setNewCustomer({ name: '', email: '', phone: '', company: '', status: 'Lead', isDarkModeOnly: false });

            if (onSuccess) {
                onSuccess({ id: docRef.id, ...customerData } as Customer);
            }
        } catch (error) {
            console.error("Error adding customer:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add Customer</DialogTitle>
                    <DialogDescription>
                        Add a new customer to your CRM. Click save when you're done.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Name</Label>
                        <Input id="name" value={newCustomer.name} onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })} className="col-span-3" placeholder="John Doe" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="company" className="text-right">Company</Label>
                        <Input id="company" value={newCustomer.company} onChange={(e) => setNewCustomer({ ...newCustomer, company: e.target.value })} className="col-span-3" placeholder="Acme Inc." />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">Email</Label>
                        <Input id="email" type="email" value={newCustomer.email} onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })} className="col-span-3" placeholder="john@example.com" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="phone" className="text-right">Phone</Label>
                        <input id="phone" value={newCustomer.phone} onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })} className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" placeholder="+1 234 567 890" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="os-customer" className="text-right">OS Customer</Label>
                        <div className="col-span-3 flex items-center space-x-2">
                            <Switch
                                id="os-customer"
                                checked={newCustomer.isDarkModeOnly || false}
                                onCheckedChange={(checked) => setNewCustomer({ ...newCustomer, isDarkModeOnly: checked })}
                            />
                            <Label htmlFor="os-customer" className="font-normal text-muted-foreground">
                                (Visible in Dark Mode only)
                            </Label>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <LoadingButton onClick={handleAddCustomer} loading={isSubmitting}>Save changes</LoadingButton>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
