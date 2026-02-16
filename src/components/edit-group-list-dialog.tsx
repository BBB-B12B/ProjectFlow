"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, Pencil, Trash2 } from "lucide-react";
import type { AssigneeGroup } from "@/lib/types";
import { deleteGroup } from "@/app/actions/group-actions";
import { useToast } from "@/hooks/use-toast";
import { useTransition } from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface EditGroupListDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    groups: AssigneeGroup[];
    onEditGroup: (group: AssigneeGroup) => void;
}

export function EditGroupListDialog({ isOpen, onOpenChange, groups, onEditGroup }: EditGroupListDialogProps) {
    const { toast } = useToast();
    const [isDeleting, startDeleteTransition] = useTransition();

    const handleDelete = (groupId: string) => {
        startDeleteTransition(async () => {
            const result = await deleteGroup(groupId);
            if (result.success) {
                toast({ title: "Success", description: result.message });
            } else {
                toast({ title: "Error", description: result.message, variant: "destructive" });
            }
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Manage Groups</DialogTitle>
                    <DialogDescription>
                        Edit or delete existing assignee groups.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-[250px] w-full rounded-md border p-4">
                    <div className="space-y-4">
                        {groups.length === 0 ? (
                            <p className="text-sm text-center text-muted-foreground py-4">No groups found.</p>
                        ) : (
                            groups.map((group) => (
                                <div key={group.id} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <Users className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm font-medium">{group.name}</span>
                                        <span className="text-xs text-muted-foreground">({group.members.length})</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => onEditGroup(group)}
                                        >
                                            <Pencil className="h-3 w-3" />
                                        </Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Delete Group?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Are you sure you want to delete "{group.name}"? This action cannot be undone.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDelete(group.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                                        {isDeleting ? "Deleting..." : "Delete"}
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
