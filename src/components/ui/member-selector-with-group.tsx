"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MultiSelectAutocomplete } from "@/components/ui/multi-select-autocomplete";
import { GroupDialog } from "@/components/group-dialog";
import { EditGroupListDialog } from "@/components/edit-group-list-dialog";
import { Users, Settings } from "lucide-react";
import type { AssigneeGroup } from "@/lib/types";

interface MemberSelectorWithGroupProps {
    /** Label to display above the input, e.g., "Assignee" or "Members" */
    label: string;
    /** All available members options */
    options: string[];
    /** Existing groups for selection */
    groups: AssigneeGroup[];
    /** Current selected value (string or array of strings) */
    value: string | string[];
    /** Callback when value changes */
    onValueChange?: (value: string) => void;
    /** Name attribute for the hidden input (for FormData) */
    name?: string;
    /** Placeholder text */
    placeholder?: string;
}

export function MemberSelectorWithGroup({
    label,
    options,
    groups,
    value,
    onValueChange,
    name,
    placeholder = "Select members..."
}: MemberSelectorWithGroupProps) {
    const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
    const [isManageListOpen, setIsManageListOpen] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<AssigneeGroup | null>(null);

    const handleCreateGroup = () => {
        setSelectedGroup(null);
        setIsGroupDialogOpen(true);
    };

    const handleEditGroup = (group: AssigneeGroup) => {
        setIsManageListOpen(false); // Close list
        setSelectedGroup(group);
        setIsGroupDialogOpen(true); // Open edit dialog
    };

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center mb-2">
                <Label htmlFor={name}>{label}</Label>
                <div className="flex gap-1">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs text-muted-foreground"
                        onClick={() => setIsManageListOpen(true)}
                    >
                        <Settings className="w-3 h-3 mr-1" /> Manage
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs text-muted-foreground"
                        onClick={handleCreateGroup}
                    >
                        <Users className="w-3 h-3 mr-1" /> New Group
                    </Button>
                </div>
            </div>
            <MultiSelectAutocomplete
                options={options}
                initialValue={value}
                name={name}
                onValueChange={onValueChange}
                groups={groups}
                placeholder={placeholder}
            />
            <GroupDialog
                isOpen={isGroupDialogOpen}
                onOpenChange={setIsGroupDialogOpen}
                assigneeOptions={options}
                group={selectedGroup}
            />
            <EditGroupListDialog
                isOpen={isManageListOpen}
                onOpenChange={setIsManageListOpen}
                groups={groups}
                onEditGroup={handleEditGroup}
            />
        </div>
    );
}
