'use server'

import { db } from "@/lib/firebase-lite";
import { doc, updateDoc, deleteDoc } from "firebase/firestore/lite";
import { revalidatePath } from "next/cache";

export async function updateGroup(groupId: string, data: { name: string, members: string[] }) {
    try {
        const ref = doc(db, "assignee_groups", groupId);
        await updateDoc(ref, {
            name: data.name,
            members: data.members
        });
        revalidatePath('/', 'layout'); // Revalidate everything as groups are global
        return { success: true, message: "Group updated successfully." };
    } catch (error) {
        console.error("Error updating group:", error);
        return { success: false, message: "Failed to update group." };
    }
}

export async function deleteGroup(groupId: string) {
    try {
        const ref = doc(db, "assignee_groups", groupId);
        await deleteDoc(ref);
        revalidatePath('/', 'layout');
        return { success: true, message: "Group deleted successfully." };
    } catch (error) {
        console.error("Error deleting group:", error);
        return { success: false, message: "Failed to delete group." };
    }
}
