'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, increment, arrayRemove, deleteDoc } from 'firebase/firestore';
import { deleteFileFromR2 } from '@/lib/r2';

export async function deleteProjectFile(
    projectId: string,
    url: string,
    trackingId: string,
    fileName?: string // Added for logging or R2 key extraction if needed
) {
    console.log(`[deleteProjectFile] Starting deletion. ProjectId: ${projectId}, TrackingId: ${trackingId}, URL: ${url}`);

    if (!projectId || !trackingId || !url) {
        console.error("[deleteProjectFile] Missing required parameters.");
        return { success: false, error: "Missing required parameters (projectId, trackingId, or url)" };
    }

    try {
        // 1. Extract R2 Key from URL
        // URL format: https://[domain]/[folder]/[timestamp]-[filename]
        // or https://pub-[hash].r2.dev/[folder]/[timestamp]-[filename]
        // We need the part after the domain.

        let key = '';
        try {
            const urlObj = new URL(url);
            // Pathname usually starts with /, remove it to get the key
            key = urlObj.pathname.substring(1);
            // Verify key format roughly matches "folder/filename"
            if (!key.includes('/')) {
                console.warn(`[deleteProjectFile] Warning: Key '${key}' might be incorrect for R2 deletion.`);
            }
        } catch (e) {
            console.error("Invalid URL for deletion:", url);
            return { success: false, error: "Invalid URL" };
        }

        if (!key) {
            return { success: false, error: "Could not extract R2 key" };
        }

        console.log(`[deleteProjectFile] Deleting file: ${key} from Project: ${projectId}`);

        // 2. Delete from R2
        try {
            await deleteFileFromR2(key);
        } catch (r2Error) {
            console.error(`[deleteProjectFile] R2 Deletion failed for key ${key}:`, r2Error);
            // Continue to remove from Firestore even if R2 fails (to keep DB clean), 
            // or abort? Usually better to try to clean up DB or mark as 'orphan'.
            // For now, we continue but log the error.
        }

        // 3. Update Firestore (ProjectTrackingProgress)
        const trackingRef = doc(db, 'projectTrackingProgress', trackingId);
        const trackingDoc = await getDoc(trackingRef);

        if (trackingDoc.exists()) {
            const data = trackingDoc.data();
            const attachments = data.attachments || [];

            if (attachments.length <= 1 && attachments.includes(url)) {
                // If it's the only attachment, delete the whole tracking document
                await deleteDoc(trackingRef);
            } else {
                // Otherwise, just remove the specific URL from the array
                await updateDoc(trackingRef, {
                    attachments: arrayRemove(url)
                });
            }
        } else {
            console.warn(`[deleteProjectFile] Tracking document ${trackingId} not found.`);
        }

        // 4. Decrement Total Files count in Project
        const projectRef = doc(db, 'projects', projectId);
        await updateDoc(projectRef, {
            totalFiles: increment(-1)
        });

        return { success: true };

    } catch (error: any) {
        console.error("[deleteProjectFile] Critical Error:", error);
        return { success: false, error: error.message || "Failed to delete file (Unknown error)" };
    }
}
