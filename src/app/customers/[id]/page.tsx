import { Metadata } from 'next';
import CustomerDetailClient from './customer-detail-client';
import { db } from '@/lib/firebase-lite';
import { doc, getDoc } from 'firebase/firestore/lite';

export const runtime = 'edge';


export const metadata: Metadata = {
    title: 'Customer Details | ProjectFlow',
    description: 'View customer details, ratings, and related projects.',
};

export default function CustomerDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    return <CustomerDetailClient params={params} />;
}
