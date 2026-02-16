"use client";

import { useState, useEffect } from 'react';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";


interface CustomerFormDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    initialData?: Partial<Customer>; // Check if ID exists to determine mode if needed, or just use data
    mode: 'create' | 'edit';
    onSubmit: (data: Partial<Customer>) => Promise<void>;
}

export function CustomerFormDialog({ isOpen, onOpenChange, initialData, mode, onSubmit }: CustomerFormDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState<Partial<Customer>>({
        name: '',
        email: '',
        phone: '',
        company: '',
        status: 'Lead',
        isDarkModeOnly: false,
        lineId: '',
        lineLink: '',
        facebookName: '',
        facebookLink: '',
        whatsappNumber: '',
        whatsappLink: '',
    });

    // Reset or populate form when dialog opens/data changes
    useEffect(() => {
        if (isOpen) {
            setFormData({
                name: initialData?.name || '',
                email: initialData?.email || '',
                phone: initialData?.phone || '',
                company: initialData?.company || '',
                status: initialData?.status || 'Lead',
                isDarkModeOnly: initialData?.isDarkModeOnly || false,
                lineId: initialData?.lineId || '',
                lineLink: initialData?.lineLink || '',
                facebookName: initialData?.facebookName || '',
                facebookLink: initialData?.facebookLink || '',
                whatsappNumber: initialData?.whatsappNumber || '',
                whatsappLink: initialData?.whatsappLink || '',
                ...initialData // Override with any other fields
            });
        }
    }, [isOpen, initialData]);

    const handleSubmit = async () => {
        if (!formData.name) return;
        setIsSubmitting(true);
        try {
            await onSubmit(formData);
            onOpenChange(false);
        } catch (error) {
            console.error("Error submitting customer form:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[650px]">
                <DialogHeader>
                    <DialogTitle>{mode === 'create' ? 'Add Customer' : 'Edit Customer Profile'}</DialogTitle>
                    <DialogDescription>
                        {mode === 'create'
                            ? "Add a new customer to your CRM. Click save when you're done."
                            : "Update customer details below."}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    {/* Basic Info */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Name</Label>
                        <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="col-span-3" placeholder="John Doe" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="company" className="text-right">Company</Label>
                        <Input id="company" value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} className="col-span-3" placeholder="Acme Inc." />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">Email</Label>
                        <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="col-span-3" placeholder="john@example.com" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="phone" className="text-right">Phone</Label>
                        <Input id="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="col-span-3" placeholder="+1 234 567 890" />
                    </div>

                    {/* Status Field - Show for both or just edit? Add usually defaults to Lead but could be useful. Let's include it. */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="status" className="text-right">Status</Label>
                        <div className="col-span-3">
                            <Select
                                value={formData.status}
                                onValueChange={(val: any) => setFormData({ ...formData, status: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Lead">Lead</SelectItem>
                                    <SelectItem value="Active">Active</SelectItem>
                                    <SelectItem value="Churn">Churn</SelectItem>
                                    <SelectItem value="Inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="os-customer" className="text-right">OS Customer</Label>
                        <div className="col-span-3 flex items-center space-x-2">
                            <Switch
                                id="os-customer"
                                checked={formData.isDarkModeOnly || false}
                                onCheckedChange={(checked) => setFormData({ ...formData, isDarkModeOnly: checked })}
                            />
                            <Label htmlFor="os-customer" className="font-normal text-muted-foreground">
                                (Visible in Dark Mode only)
                            </Label>
                        </div>
                    </div>

                    {/* Social Media Section */}
                    <div className="border-t pt-4 mt-2">
                        <h4 className="mb-4 text-sm font-medium leading-none">Social Media</h4>
                        <div className="grid gap-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="lineId" className="text-right">Line</Label>
                                <div className="col-span-3 grid grid-cols-2 gap-2">
                                    <Input id="lineId" placeholder="Line ID" value={formData.lineId || ''} onChange={(e) => setFormData({ ...formData, lineId: e.target.value })} />
                                    <Input id="lineLink" placeholder="Line Link" value={formData.lineLink || ''} onChange={(e) => setFormData({ ...formData, lineLink: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="facebook" className="text-right">Facebook</Label>
                                <div className="col-span-3 grid grid-cols-2 gap-2">
                                    <Input id="facebookName" placeholder="FB Name" value={formData.facebookName || ''} onChange={(e) => setFormData({ ...formData, facebookName: e.target.value })} />
                                    <Input id="facebookLink" placeholder="FB Link" value={formData.facebookLink || ''} onChange={(e) => setFormData({ ...formData, facebookLink: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="whatsapp" className="text-right">WhatsApp</Label>
                                <div className="col-span-3 grid grid-cols-2 gap-2">
                                    <Input id="whatsappNumber" placeholder="Number" value={formData.whatsappNumber || ''} onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })} />
                                    <Input id="whatsappLink" placeholder="Link" value={formData.whatsappLink || ''} onChange={(e) => setFormData({ ...formData, whatsappLink: e.target.value })} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <LoadingButton onClick={handleSubmit} loading={isSubmitting}>Save changes</LoadingButton>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
