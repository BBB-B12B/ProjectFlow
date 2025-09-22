// src/app/api/customers/[id]/route.ts
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        const docRef = doc(db, 'customers', id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
        }

        // Fetch related projects count
        const projectsQuery = query(collection(db, 'projects'), where('customerId', '==', id));
        const projectsSnapshot = await getDocs(projectsQuery);
        const relatedProjectCount = projectsSnapshot.size;

        const customer = {
            id: docSnap.id,
            ...docSnap.data(),
            createdAt: docSnap.data().createdAt?.toDate().toISOString(),
            updatedAt: docSnap.data().updatedAt?.toDate().toISOString(),
            relatedProjectCount: relatedProjectCount, // Add related project count
        };
        return NextResponse.json(customer);
    } catch (error) {
        console.error("Error fetching customer:", error);
        return NextResponse.json({ error: "Failed to fetch customer" }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        const data = await req.json();
        const docRef = doc(db, 'customers', id);

        const updatedData = {
            ...data,
            updatedAt: serverTimestamp(),
        };

        await updateDoc(docRef, updatedData);

        // Fetch the updated document to return the current state and recalculate relatedProjectCount
        const updatedDocSnap = await getDoc(docRef);

        // Recalculate related projects count after update
        const projectsQuery = query(collection(db, 'projects'), where('customerId', '==', id));
        const projectsSnapshot = await getDocs(projectsQuery);
        const relatedProjectCount = projectsSnapshot.size;

        const updatedCustomer = {
            id: updatedDocSnap.id,
            ...updatedDocSnap.data(),
            createdAt: updatedDocSnap.data().createdAt?.toDate().toISOString(),
            updatedAt: updatedDocSnap.data().updatedAt?.toDate().toISOString(),
            relatedProjectCount: relatedProjectCount,
        };

        return NextResponse.json(updatedCustomer);
    } catch (error) {
        console.error("Error updating customer:", error);
        return NextResponse.json({ error: "Failed to update customer" }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        const docRef = doc(db, 'customers', id);
        await deleteDoc(docRef);
        return NextResponse.json({ message: 'Customer deleted successfully' });
    } catch (error) {
        console.error("Error deleting customer:", error);
        return NextResponse.json({ error: "Failed to delete customer" }, { status: 500 });
    }
}
