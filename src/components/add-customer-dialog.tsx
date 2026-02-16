"use client";

import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Customer } from '@/lib/types';
import { CustomerFormDialog } from '@/components/customer-form-dialog';

interface AddCustomerDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: (newCustomer: Customer) => void;
}

export function AddCustomerDialog({ isOpen, onOpenChange, onSuccess }: AddCustomerDialogProps) {
    const handleAddCustomer = async (formData: Partial<Customer>) => {
        const customerData = {
            ...formData,
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        const docRef = await addDoc(collection(db, 'customers'), customerData);

        if (onSuccess) {
            onSuccess({ id: docRef.id, ...customerData } as Customer);
        }
    };

    return (
        <CustomerFormDialog
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            mode="create"
            onSubmit={handleAddCustomer}
        />
    );
}
