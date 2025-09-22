// src/app/crm/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Customer } from '@/lib/types';
import { Plus, Edit, Mail, Phone, MapPin, Building, Briefcase, Info } from 'lucide-react'; // Import more icons
import { NewCustomerQuickAddDialog } from '@/components/new-customer-quick-add-dialog';
import { EditCustomerDialog } from '@/components/edit-customer-dialog';

export default function CRMPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isNewCustomerQuickAddDialogOpen, setIsNewCustomerQuickAddDialogOpen] = useState(false);
    const [isEditCustomerDialogOpen, setIsEditCustomerDialogOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

    const fetchCustomers = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/customers');
            if (!response.ok) {
                throw new Error('Failed to fetch customers');
            }
            const data: Customer[] = await response.json();
            setCustomers(data);
        } catch (err: any) {
            setError(err.message);
            console.error("Error fetching customers:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    const handleCustomerAdded = (newCustomer: Customer) => {
        setCustomers((prevCustomers) => [{
            ...newCustomer,
            createdAt: new Date(newCustomer.createdAt).toISOString(), 
            updatedAt: new Date(newCustomer.updatedAt).toISOString(),
        }, ...prevCustomers]);
        setIsNewCustomerQuickAddDialogOpen(false);
    };

    const handleCustomerUpdated = (updatedCustomer: Customer) => {
        setCustomers(prevCustomers => prevCustomers.map(cust => 
            cust.id === updatedCustomer.id ? { 
                ...updatedCustomer,
                createdAt: new Date(updatedCustomer.createdAt).toISOString(),
                updatedAt: new Date(updatedCustomer.updatedAt).toISOString(),
            } : cust
        ));
        setIsEditCustomerDialogOpen(false);
        setSelectedCustomer(null);
    };

    const handleEditClick = (customer: Customer) => {
        setSelectedCustomer(customer);
        setIsEditCustomerDialogOpen(true);
    };

    return (
        <div className="container mx-auto p-4">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold tracking-tight">Customer Relationship Management (CRM)</h1>
                <Button onClick={() => setIsNewCustomerQuickAddDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Customer
                </Button>
            </div>

            {loading && <p>กำลังโหลดลูกค้า...</p>}
            {error && <p className="text-red-500">Error: {error}</p>}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {customers.map((customer) => (
                    <Card key={customer.id} className="h-full flex flex-col justify-between hover:shadow-lg transition-shadow duration-200 ease-in-out cursor-pointer">
                        <CardHeader className="flex flex-col space-y-0 pb-2">
                            <div className="flex items-center justify-between w-full">
                                <CardTitle className="flex-grow text-2xl font-bold truncate pr-2 leading-tight">
                                    {customer.name}
                                </CardTitle>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={(e) => { e.stopPropagation(); handleEditClick(customer); }}
                                    className="flex-shrink-0"
                                >
                                    <Edit className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center text-sm text-muted-foreground">
                                <Mail className="mr-2 h-4 w-4" />
                                <span>{customer.email}</span>
                            </div>
                            {customer.phone && (
                                <div className="flex items-center text-sm text-muted-foreground">
                                    <Phone className="mr-2 h-4 w-4" />
                                    <span>{customer.phone}</span>
                                </div>
                            )}
                            {customer.address && (
                                <div className="flex items-center text-sm text-muted-foreground">
                                    <MapPin className="mr-2 h-4 w-4" />
                                    <span>{customer.address}</span>
                                </div>
                            )}
                            {(customer.companyName || customer.businessType || customer.businessDetails) && (
                                <div className="pt-2 border-t mt-3">
                                    <h4 className="font-semibold text-sm mb-1">Business Details</h4>
                                    {customer.companyName && (
                                        <div className="flex items-center text-sm text-muted-foreground">
                                            <Building className="mr-2 h-4 w-4" />
                                            <span>{customer.companyName}</span>
                                        </div>
                                    )}
                                    {customer.businessType && (
                                        <div className="flex items-center text-sm text-muted-foreground">
                                            <Briefcase className="mr-2 h-4 w-4" />
                                            <span>{customer.businessType}</span>
                                        </div>
                                    )}
                                    {customer.businessDetails && (
                                        <div className="flex items-center text-sm text-muted-foreground">
                                            <Info className="mr-2 h-4 w-4" />
                                            <span className="line-clamp-2">{customer.businessDetails}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                            <div className="pt-2 border-t mt-3">
                                <p className="text-sm text-muted-foreground font-semibold">Projects: {customer.relatedProjectCount}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <NewCustomerQuickAddDialog 
                isOpen={isNewCustomerQuickAddDialogOpen} 
                onOpenChange={setIsNewCustomerQuickAddDialogOpen}
                onCustomerAdded={handleCustomerAdded}
            />

            {selectedCustomer && (
                <EditCustomerDialog
                    isOpen={isEditCustomerDialogOpen}
                    onOpenChange={setIsEditCustomerDialogOpen}
                    customer={selectedCustomer}
                    onCustomerUpdated={handleCustomerUpdated}
                />
            )}
        </div>
    );
}
