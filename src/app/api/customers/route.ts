// src/app/api/customers/route.ts
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, serverTimestamp, query, orderBy, where } from 'firebase/firestore';
import { NextResponse } from 'next/server';
import type { Project } from '@/lib/types';

export async function GET() {
    try {
        const customersQuery = query(collection(db, 'customers'), orderBy('createdAt', 'desc'));
        const customersSnapshot = await getDocs(customersQuery);

        const customersWithProjects = await Promise.all(customersSnapshot.docs.map(async doc => {
            const customerId = doc.id;
            const projectsQuery = query(collection(db, 'projects'), where('customerId', '==', customerId));
            const projectsSnapshot = await getDocs(projectsQuery);
            const relatedProjectCount = projectsSnapshot.size;

            return {
                id: customerId,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate().toISOString(),
                updatedAt: doc.data().updatedAt?.toDate().toISOString(),
                relatedProjectCount: relatedProjectCount,
            };
        }));

        return NextResponse.json(customersWithProjects);
    } catch (error) {
        console.error("Error fetching customers:", error);
        return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const data = await req.json();
        const newCustomer = {
            ...data,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            // relatedProjectCount will be 0 initially and updated when projects are linked
        };
        const docRef = await addDoc(collection(db, 'customers'), newCustomer);
        const addedCustomer = { 
            id: docRef.id, 
            ...newCustomer, 
            createdAt: new Date().toISOString(), // Optimistic update for client
            updatedAt: new Date().toISOString(), // Optimistic update for client
            relatedProjectCount: 0 // New customers have 0 related projects
        };
        return NextResponse.json(addedCustomer, { status: 201 });
    } catch (error) {
        console.error("Error adding customer:", error);
        return NextResponse.json({ error: "Failed to add customer" }, { status: 500 });
    }
}
