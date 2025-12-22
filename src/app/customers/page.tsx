import { Metadata } from 'next';
import CustomerListClient from './customer-list-client';

export const metadata: Metadata = {
    title: 'Customers | ProjectFlow',
    description: 'Manage your customer relationships.',
};

export default function CustomersPage() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
            </div>
            <CustomerListClient />
        </div>
    );
}
