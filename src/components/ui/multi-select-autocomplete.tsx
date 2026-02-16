import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { X as RemoveIcon, Check, Users } from "lucide-react";
import {
    normalizeAssigneeName,
    formatAssigneeDisplayName,
    deduplicateAssignees
} from "@/lib/utils";
import type { AssigneeGroup } from "@/lib/types";
import { cn } from "@/lib/utils";

interface MultiSelectAutocompleteProps {
    options: string[];
    initialValue?: string | string[];
    placeholder?: string;
    name?: string;
    onValueChange?: (value: string) => void;
    groups?: AssigneeGroup[];
}

export function MultiSelectAutocomplete({
    options: initialOptions,
    initialValue,
    placeholder,
    name,
    onValueChange,
    groups = [],
}: MultiSelectAutocompleteProps) {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [open, setOpen] = React.useState(false);
    const [selected, setSelected] = React.useState<string[]>([]);
    const [inputValue, setInputValue] = React.useState("");
    const [highlightedIndex, setHighlightedIndex] = React.useState(-1);

    // Normalize and deduplicate options
    const normalizedOptions = React.useMemo(() => {
        const optionMap = new Map<string, string>();

        initialOptions.forEach(option => {
            const normalized = normalizeAssigneeName(option);
            const formatted = formatAssigneeDisplayName(option);

            if (!optionMap.has(normalized) ||
                (formatted.charAt(0) === formatted.charAt(0).toUpperCase() &&
                    optionMap.get(normalized)?.charAt(0) !== optionMap.get(normalized)?.charAt(0).toUpperCase())) {
                optionMap.set(normalized, formatted);
            }
        });

        return Array.from(optionMap.values()).sort();
    }, [initialOptions]);

    // Defensive check: Ensure groups is always an array
    const safeGroups = React.useMemo(() => {
        return Array.isArray(groups) ? groups.map(g => ({
            ...g,
            members: Array.isArray(g.members) ? g.members : []
        })) : [];
    }, [groups]);

    const groupOptions = React.useMemo(() => {
        return safeGroups.map(g => g.name).sort();
    }, [safeGroups]);

    const allOptions = React.useMemo(() => {
        return [...groupOptions, ...normalizedOptions];
    }, [groupOptions, normalizedOptions]);


    // Effect to synchronize the internal state with the initialValue prop
    React.useEffect(() => {
        let valueToSet: string[] = [];
        if (initialValue) {
            if (Array.isArray(initialValue)) {
                valueToSet = initialValue;
            } else if (typeof initialValue === 'string' && initialValue) {
                const deduped = deduplicateAssignees(initialValue);
                valueToSet = deduped.split(',').map(item => item.trim()).filter(item => item !== '');
            }
        }

        // Check if selected members match a group
        if (safeGroups.length > 0) {
            const sortedSelected = [...valueToSet].sort().join(',');
            const matchedGroup = safeGroups.find(g => {
                const sortedMembers = [...g.members].sort().join(',');
                return sortedMembers === sortedSelected;
            });

            // If matches exactly, we might want to show the group name visually? 
            // Requirement: "Select group -> save members". "Display in Card -> Group Name".
            // Requirement: "In dropdown list -> Group is blue".
            // Requirement: "If group selected, save members".
            // But here in the input box... "When assignee selected... Highlight blue between Personal and Group".

            // Let's keep it simple: Expand to members in the background (value), but maybe show pill?
            // Actually requirement says "When select Group, must save Assignee as members".
            // So `selected` state should probably contain MEMBERS.
            // But UI rendering logic in input might need to know.
            // If we just save members, then `selected` is [A, B].
        }

        if (JSON.stringify(valueToSet) !== JSON.stringify(selected)) {
            setSelected(valueToSet);
        }
    }, [initialValue, safeGroups]);

    const updateSelected = (newSelected: string[]) => {
        // Normalize
        const normalizedSelected = newSelected.map(formatAssigneeDisplayName);
        const uniqueSelected = [...new Set(normalizedSelected)];

        setSelected(uniqueSelected);
        if (onValueChange) {
            onValueChange(uniqueSelected.join(', '));
        }
    };

    const handleSelect = (optionValue: string) => {
        setInputValue("");

        // Check if it is a group
        const group = safeGroups.find(g => g.name === optionValue);

        if (group) {
            // Add all group members
            // We need to verify if we are adding or removing.
            // If group is clicked, we probably just ADD them.

            // Logic: Combine existing selected with group members
            const allMembers = [...selected, ...group.members];
            updateSelected(allMembers);
        } else {
            // Normal user selection
            const formattedValue = formatAssigneeDisplayName(optionValue);
            const normalizedSelected = selected.map(normalizeAssigneeName);
            const normalizedValue = normalizeAssigneeName(formattedValue);

            if (normalizedSelected.includes(normalizedValue)) {
                const newSelected = selected.filter(item =>
                    normalizeAssigneeName(item) !== normalizedValue
                );
                updateSelected(newSelected);
            } else {
                updateSelected([...selected, formattedValue]);
            }
        }

        setHighlightedIndex(-1);
        setTimeout(() => inputRef.current?.focus(), 0);
    };

    const handleRemove = (optionValue: string) => {
        const normalizedValue = normalizeAssigneeName(optionValue);
        const newSelected = selected.filter(item =>
            normalizeAssigneeName(item) !== normalizedValue
        );
        updateSelected(newSelected);
    };

    const handleCreate = (newValue: string) => {
        const trimmedValue = newValue.trim();
        if (!trimmedValue) return;

        const formattedValue = formatAssigneeDisplayName(trimmedValue);
        const normalizedValue = normalizeAssigneeName(formattedValue);

        const normalizedSelected = selected.map(normalizeAssigneeName);
        const normalizedOptionValues = normalizedOptions.map(normalizeAssigneeName);

        if (!normalizedSelected.includes(normalizedValue) &&
            !normalizedOptionValues.includes(normalizedValue)) {
            updateSelected([...selected, formattedValue]);
        }

        setInputValue("");
        setHighlightedIndex(-1);
        setTimeout(() => inputRef.current?.focus(), 0);
    };

    const filteredOptions = allOptions.filter(option => {
        // Filter logic need to be careful with Groups vs Users
        // Option is a string name
        const normalizedOption = normalizeAssigneeName(option);
        const normalizedInput = normalizeAssigneeName(inputValue);

        // Check if matching input
        if (!normalizedOption.includes(normalizedInput)) return false;

        // Group Logic
        const group = safeGroups.find(g => g.name === option);
        if (group) {
            // Only hide group if ALL its members are already selected
            const allMembersSelected = group.members.every(m =>
                selected.map(normalizeAssigneeName).includes(normalizeAssigneeName(m))
            );
            return !allMembersSelected;
        }

        // User Logic
        // Hide user if already selected
        // BUT also hide user if they are covered by a VISIBLE group pill?
        // No, standard autocomplete usually hides selected items.
        // If John is covered by Group A pill, 'John' is in 'selected'.
        // So 'John' should be hidden from dropdown. This is correct.
        const isSelected = selected.map(normalizeAssigneeName).includes(normalizedOption);
        return !isSelected;
    });

    const showCreateOption = inputValue &&
        !allOptions.some(opt => normalizeAssigneeName(opt) === normalizeAssigneeName(inputValue));

    // Display options
    const allDisplayOptions = React.useMemo(() => {
        const opts = [...filteredOptions];
        if (showCreateOption) {
            opts.push(formatAssigneeDisplayName(inputValue));
        }
        return opts;
    }, [filteredOptions, showCreateOption, inputValue]);

    // Reset highlighted index
    React.useEffect(() => {
        if (allDisplayOptions.length > 0 && highlightedIndex >= allDisplayOptions.length) {
            setHighlightedIndex(0);
        } else if (allDisplayOptions.length === 0) {
            setHighlightedIndex(-1);
        }
    }, [allDisplayOptions.length, highlightedIndex]);

    // Keyboard handlers (same as before)
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!open) {
            if (e.key === 'ArrowDown' || e.key === 'Enter') {
                e.preventDefault();
                setOpen(true);
                setHighlightedIndex(0);
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex(prev => {
                    const nextIndex = prev + 1;
                    return nextIndex < allDisplayOptions.length ? nextIndex : 0;
                });
                break;

            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex(prev => {
                    const nextIndex = prev - 1;
                    return nextIndex >= 0 ? nextIndex : allDisplayOptions.length - 1;
                });
                break;

            case 'Enter':
                e.preventDefault();
                if (highlightedIndex >= 0 && highlightedIndex < allDisplayOptions.length) {
                    const selectedOption = allDisplayOptions[highlightedIndex];
                    if (showCreateOption && highlightedIndex === allDisplayOptions.length - 1) {
                        handleCreate(inputValue);
                    } else {
                        handleSelect(selectedOption);
                    }
                } else if (inputValue.trim()) {
                    handleCreate(inputValue);
                }
                break;

            case 'Escape':
                e.preventDefault();
                setOpen(false);
                setHighlightedIndex(-1);
                break;

            case 'Tab':
                if (highlightedIndex >= 0 && highlightedIndex < allDisplayOptions.length) {
                    e.preventDefault();
                    const selectedOption = allDisplayOptions[highlightedIndex];
                    if (showCreateOption && highlightedIndex === allDisplayOptions.length - 1) {
                        handleCreate(inputValue);
                    } else {
                        handleSelect(selectedOption);
                    }
                }
                break;

            case 'Backspace':
                if (inputValue === '' && selected.length > 0) {
                    e.preventDefault();
                    handleRemove(selected[selected.length - 1]);
                }
                break;
        }
    };

    // Check if current selection covers any groups (Subset Logic)
    const { coveredGroups, visibleIndividualMembers } = React.useMemo(() => {
        if (safeGroups.length === 0 || selected.length === 0) {
            return { coveredGroups: [], visibleIndividualMembers: selected };
        }

        const normalizedSelectedSet = new Set(selected.map(normalizeAssigneeName));
        const covered: AssigneeGroup[] = [];
        const coveredMembersSet = new Set<string>();

        // 1. Identify all covered groups
        safeGroups.forEach(g => {
            if (g.members.length === 0) return;

            // Check if ALL members of this group are in the selection
            const isCovered = g.members.every(member =>
                normalizedSelectedSet.has(normalizeAssigneeName(member))
            );

            if (isCovered) {
                covered.push(g);
                g.members.forEach(m => coveredMembersSet.add(normalizeAssigneeName(m)));
            }
        });

        // 2. Identify remaining individual members (those NOT covered by any group)
        // NOTE: If a member is in 2 groups, and both groups are selected, they are 'covered' by both.
        // If a member is in Group A (selected) and Group B (not selected), they are covered by Group A.
        // We only show individual pills for people who are NOT in any of the *displayed* group pills.
        const visible = selected.filter(member =>
            !coveredMembersSet.has(normalizeAssigneeName(member))
        );

        return { coveredGroups: covered, visibleIndividualMembers: visible };
    }, [selected, safeGroups]);

    const handleRemoveGroup = (group: AssigneeGroup) => {
        // Remove ALL members of this group from selection
        const groupMembersSet = new Set(group.members.map(normalizeAssigneeName));
        const newSelected = selected.filter(member =>
            !groupMembersSet.has(normalizeAssigneeName(member))
        );
        updateSelected(newSelected);
    };

    return (
        <div className="w-full">
            <input type="hidden" name={name} value={selected.join(', ')} />
            <div className="group w-full rounded-md border border-input text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                <div
                    className="flex flex-wrap gap-1.5 p-1.5"
                    onClick={() => inputRef.current?.focus()}
                >
                    {/* Render Covered Groups */}
                    {coveredGroups.map(group => (
                        <Badge
                            key={`group-${group.name}`}
                            variant="secondary"
                            className="rounded-sm pr-1.5 bg-blue-100 text-blue-800 hover:bg-blue-200"
                        >
                            <Users className="w-3 h-3 mr-1" />
                            {group.name}
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveGroup(group);
                                }}
                                className="ml-1 rounded-full p-0.5 outline-none hover:bg-blue-300"
                            >
                                <RemoveIcon className="h-3 w-3" />
                            </button>
                        </Badge>
                    ))}

                    {/* Render Remaining Individuals */}
                    {visibleIndividualMembers.map((value) => (
                        <Badge
                            key={normalizeAssigneeName(value)}
                            variant="secondary"
                            className="rounded-sm pr-1.5"
                        >
                            {value}
                            <button
                                type="button"
                                aria-label={`Remove ${value}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemove(value);
                                }}
                                onMouseDown={(e) => e.preventDefault()}
                                className="ml-1 rounded-full p-0.5 outline-none ring-offset-background hover:bg-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                            >
                                <RemoveIcon className="h-3 w-3" />
                            </button>
                        </Badge>
                    ))}

                    <div className="flex-1" style={{ minWidth: '100px' }}>
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputValue}
                            onChange={(e) => {
                                setInputValue(e.target.value);
                                setOpen(true);
                                setHighlightedIndex(0);
                            }}
                            onFocus={() => {
                                setOpen(true);
                                if (allDisplayOptions.length > 0) {
                                    setHighlightedIndex(0);
                                }
                            }}
                            onBlur={(e) => {
                                const currentTarget = e.currentTarget;
                                setTimeout(() => {
                                    if (!currentTarget.closest('.group')?.contains(document.activeElement)) {
                                        setOpen(false);
                                        setHighlightedIndex(-1);
                                    }
                                }, 200);
                            }}
                            onKeyDown={handleKeyDown}
                            placeholder={selected.length > 0 ? "" : (placeholder || "Select or create...")}
                            className="w-full bg-transparent p-0.5 text-sm placeholder:text-muted-foreground focus:outline-none"
                            autoComplete="off"
                        />
                    </div>
                </div>
            </div>
            <div className="relative mt-2">
                {open && allDisplayOptions.length > 0 && (
                    <div className="absolute top-0 z-50 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in">
                        <div className="max-h-64 overflow-auto p-1">
                            {allDisplayOptions.map((option, index) => {
                                const isCreateOption = showCreateOption && index === allDisplayOptions.length - 1;
                                const isHighlighted = index === highlightedIndex;
                                const isSelected = selected.some(sel =>
                                    normalizeAssigneeName(sel) === normalizeAssigneeName(option)
                                );

                                const isGroup = safeGroups.some(g => g.name === option);

                                return (
                                    <div
                                        key={`${normalizeAssigneeName(option)}-${index}`}
                                        className={cn(
                                            "relative flex cursor-pointer select-none items-center justify-between rounded-sm px-2 py-1.5 text-sm outline-none",
                                            isHighlighted ? "bg-accent text-accent-foreground" : "hover:bg-accent hover:text-accent-foreground",
                                            isGroup ? "bg-blue-50/50 hover:bg-blue-100 text-blue-900 border-l-2 border-blue-500" : ""
                                        )}
                                        onClick={() => {
                                            if (isCreateOption) {
                                                handleCreate(inputValue);
                                            } else {
                                                handleSelect(option);
                                            }
                                        }}
                                        onMouseEnter={() => setHighlightedIndex(index)}
                                        onMouseDown={(e) => e.preventDefault()}
                                    >
                                        <div className="flex items-center">
                                            {isGroup && <Users className="w-3 h-3 mr-2 text-blue-500" />}
                                            <span>
                                                {isCreateOption ? `Create "${formatAssigneeDisplayName(inputValue)}"` : option}
                                                {isGroup && <span className="text-xs text-muted-foreground ml-2">({safeGroups.find(g => g.name === option)?.members.length} members)</span>}
                                            </span>
                                        </div>
                                        {((!isCreateOption && isSelected) || (isGroup && false /* don't checkmark group? maybe */)) && (
                                            <Check className="h-4 w-4" />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
                {open && allDisplayOptions.length === 0 && inputValue && (
                    <div className="absolute top-0 z-50 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in">
                        <div className="p-2 text-sm text-muted-foreground">
                            No results found.
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}