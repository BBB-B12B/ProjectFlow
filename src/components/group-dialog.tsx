"use client";

import { useState, useTransition, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MultiSelectAutocomplete } from "./ui/multi-select-autocomplete";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { updateGroup } from "@/app/actions/group-actions";
import type { AssigneeGroup } from "@/lib/types";

interface GroupDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    assigneeOptions: string[];
    group?: AssigneeGroup | null; // Optional group for editing
}

export function GroupDialog({ isOpen, onOpenChange, assigneeOptions, group }: GroupDialogProps) {
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [name, setName] = useState("");
    const [members, setMembers] = useState("");

    // Initialize form data when group prop changes
    useEffect(() => {
        if (isOpen && group) {
            setName(group.name);
            setMembers(group.members.join(', ')); // Assuming MultiSelectAutocomplete takes comma-separated string
        } else if (isOpen && !group) {
            // Reset for create mode
            setName("");
            setMembers("");
        }
    }, [isOpen, group]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !members.trim()) return;

        startTransition(async () => {
            try {
                const memberList = members.split(',').map(m => m.trim()).filter(Boolean);

                if (group) {
                    // Edit Mode
                    const result = await updateGroup(group.id, {
                        name: name.trim(),
                        members: memberList
                    });

                    if (result.success) {
                        toast({ title: "Success", description: result.message });
                        onOpenChange(false);
                    } else {
                        toast({ title: "Error", description: result.message, variant: "destructive" });
                    }
                } else {
                    // Create Mode
                    await addDoc(collection(db, "assignee_groups"), {
                        name: name.trim(),
                        members: memberList,
                        createdAt: serverTimestamp(),
                    });

                    toast({
                        title: "Success",
                        description: "Group created successfully.",
                    });

                    setName("");
                    setMembers("");
                    onOpenChange(false);
                }
            } catch (error) {
                console.error("Error saving group:", error);
                toast({
                    title: "Error",
                    description: "Failed to save group. Please try again.",
                    variant: "destructive",
                });
            }
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{group ? "Edit Group" : "Create New Group"}</DialogTitle>
                    <DialogDescription>
                        {group ? "Update group details and members." : "Create a group of assignees for quick selection."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            Name
                        </Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="col-span-3"
                            placeholder="e.g. Dev Team"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="members" className="text-right">
                            Members
                        </Label>
                        <div className="col-span-3">
                            <MultiSelectAutocomplete
                                options={assigneeOptions}
                                initialValue={members}
                                onValueChange={setMembers}
                                placeholder="Select members..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? "Saving..." : (group ? "Save Changes" : "Create Group")}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
