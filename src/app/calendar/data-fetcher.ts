import { db } from "@/lib/firebase-lite";
import { collection, getDocs } from "firebase/firestore/lite";
import type { Task, Customer } from "@/lib/types";

// Define a structured Member type for UI consumption
export interface CalendarMember {
    name: string;
    type: 'Employee' | 'Customer';
    isDarkModeOnly?: boolean;
}

export async function fetchMembersAndLocations() {
    try {
        console.log("Fetching members/locations.");

        const [taskSnapshot, eventSnapshot, customerSnapshot] = await Promise.all([
            getDocs(collection(db, "tasks")).catch(e => {
                console.error("Error fetching tasks:", e);
                return { docs: [] };
            }),
            getDocs(collection(db, "events")).catch(e => {
                console.error("Error fetching events:", e);
                return { docs: [] };
            }),
            getDocs(collection(db, "customers")).catch(e => {
                console.error("Error fetching customers:", e);
                return { docs: [] };
            })
        ]);

        const employees = new Map<string, CalendarMember>();
        const customers = new Map<string, CalendarMember>();

        // 1. Process Tasks for Employees (Assignees)
        taskSnapshot.docs.forEach((doc: any) => {
            const data = doc.data() as Task;
            if (data.Assignee && typeof data.Assignee === 'string') {
                data.Assignee.split(',').forEach(name => {
                    const trimmed = name.trim();
                    if (trimmed && !employees.has(trimmed)) {
                        employees.set(trimmed, {
                            name: trimmed,
                            type: 'Employee'
                        });
                    }
                });
            }
        });

        // 2. Process Customers
        customerSnapshot.docs.forEach((doc: any) => {
            const data = doc.data() as Customer;
            const name = data.name?.trim();
            if (name && !customers.has(name)) {
                customers.set(name, {
                    name: name,
                    type: 'Customer',
                    isDarkModeOnly: data.isDarkModeOnly
                });
            }
        });

        // 3. Combine unique members
        // Convert Maps to Arrays and sort by name
        const allMembers = [
            ...Array.from(employees.values()),
            ...Array.from(customers.values())
        ].sort((a, b) => a.name.localeCompare(b.name));

        // Process Locations
        const events = eventSnapshot.docs.map((doc: any) => doc.data() as { location?: string });
        const locations = Array.from(new Set(events.map(e => e.location).filter(Boolean) as string[]));

        return { members: allMembers, locations };
    } catch (error) {
        console.error("Fatal error in fetchMembersAndLocations:", error);
        return { members: [], locations: [] };
    }
}
