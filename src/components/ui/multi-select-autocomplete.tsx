// /home/user/studio/src/components/ui/multi-select-autocomplete.tsx
"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { X as RemoveIcon, Check } from "lucide-react";
// เปลี่ยน import จาก name-utils เป็น utils
import {
    normalizeAssigneeName,
    formatAssigneeDisplayName,
    deduplicateAssignees
} from "@/lib/utils";

interface MultiSelectAutocompleteProps {
    options: string[];
    initialValue?: string | string[];
    placeholder?: string;
    name?: string;
    onValueChange?: (value: string) => void;
}

export function MultiSelectAutocomplete({
    options: initialOptions,
    initialValue,
    placeholder,
    name,
    onValueChange,
}: MultiSelectAutocompleteProps) {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [open, setOpen] = React.useState(false);
    const [selected, setSelected] = React.useState<string[]>([]);
    const [inputValue, setInputValue] = React.useState("");
    const [highlightedIndex, setHighlightedIndex] = React.useState(-1);

    // Normalize และ deduplicate options
    const normalizedOptions = React.useMemo(() => {
        const optionMap = new Map<string, string>();

        initialOptions.forEach(option => {
            const normalized = normalizeAssigneeName(option);
            const formatted = formatAssigneeDisplayName(option);

            // เก็บเฉพาะตัวแรกที่พบ หรือเลือกตัวที่มี format ดีกว่า
            if (!optionMap.has(normalized) ||
                (formatted.charAt(0) === formatted.charAt(0).toUpperCase() &&
                    optionMap.get(normalized)?.charAt(0) !== optionMap.get(normalized)?.charAt(0).toUpperCase())) {
                optionMap.set(normalized, formatted);
            }
        });

        return Array.from(optionMap.values()).sort();
    }, [initialOptions]);

    // Effect to synchronize the internal state with the initialValue prop
    React.useEffect(() => {
        let valueToSet: string[] = [];
        if (initialValue) {
            if (Array.isArray(initialValue)) {
                valueToSet = initialValue;
            } else if (typeof initialValue === 'string' && initialValue) {
                // Normalize และ deduplicate
                const deduped = deduplicateAssignees(initialValue);
                valueToSet = deduped.split(',').map(item => item.trim()).filter(item => item !== '');
            }
        }

        if (JSON.stringify(valueToSet) !== JSON.stringify(selected)) {
            setSelected(valueToSet);
        }
    }, [initialValue]);

    const updateSelected = (newSelected: string[]) => {
        // Normalize ก่อนเก็บ
        const normalizedSelected = newSelected.map(formatAssigneeDisplayName);
        const uniqueSelected = [...new Set(normalizedSelected)];

        setSelected(uniqueSelected);
        if (onValueChange) {
            onValueChange(uniqueSelected.join(', '));
        }
    };

    const handleSelect = (optionValue: string) => {
        setInputValue("");
        const formattedValue = formatAssigneeDisplayName(optionValue);

        // ตรวจสอบว่ามีอยู่แล้วหรือไม่ (case-insensitive)
        const normalizedSelected = selected.map(normalizeAssigneeName);
        const normalizedValue = normalizeAssigneeName(formattedValue);

        if (normalizedSelected.includes(normalizedValue)) {
            // ถ้ามีอยู่แล้ว ให้ลบออก
            const newSelected = selected.filter(item =>
                normalizeAssigneeName(item) !== normalizedValue
            );
            updateSelected(newSelected);
        } else {
            // ถ้ายังไม่มี ให้เพิ่มเข้าไป
            updateSelected([...selected, formattedValue]);
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

        // ตรวจสอบว่ามีอยู่แล้วหรือไม่
        const normalizedSelected = selected.map(normalizeAssigneeName);
        const normalizedOptionValues = normalizedOptions.map(normalizeAssigneeName);

        if (!normalizedSelected.includes(normalizedValue) &&
            !normalizedOptions.includes(normalizedValue)) {
            updateSelected([...selected, formattedValue]);
        }

        setInputValue("");
        setHighlightedIndex(-1);
        setTimeout(() => inputRef.current?.focus(), 0);
    };

    const filteredOptions = normalizedOptions.filter(option => {
        const normalizedOption = normalizeAssigneeName(option);
        const normalizedSelected = selected.map(normalizeAssigneeName);
        const normalizedInput = normalizeAssigneeName(inputValue);

        return !normalizedSelected.includes(normalizedOption) &&
            normalizedOption.includes(normalizedInput);
    });

    const showCreateOption = inputValue &&
        !normalizedOptions.some(opt => normalizeAssigneeName(opt) === normalizeAssigneeName(inputValue)) &&
        !selected.some(sel => normalizeAssigneeName(sel) === normalizeAssigneeName(inputValue));

    // สร้าง array ของตัวเลือกทั้งหมดที่แสดงใน dropdown
    const allDisplayOptions = React.useMemo(() => {
        const opts = [...filteredOptions];
        if (showCreateOption) {
            opts.push(formatAssigneeDisplayName(inputValue));
        }
        return opts;
    }, [filteredOptions, showCreateOption, inputValue]);

    // Reset highlighted index when options change
    React.useEffect(() => {
        if (allDisplayOptions.length > 0 && highlightedIndex >= allDisplayOptions.length) {
            setHighlightedIndex(0);
        } else if (allDisplayOptions.length === 0) {
            setHighlightedIndex(-1);
        }
    }, [allDisplayOptions.length, highlightedIndex]);

    // Handle keyboard navigation
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

    return (
        <div className="w-full">
            <input type="hidden" name={name} value={selected.join(', ')} />
            <div className="group w-full rounded-md border border-input text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                <div
                    className="flex flex-wrap gap-1.5 p-1.5"
                    onClick={() => inputRef.current?.focus()}
                >
                    {selected.map((value) => (
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

                                return (
                                    <div
                                        key={`${normalizeAssigneeName(option)}-${index}`}
                                        className={`
                                            relative flex cursor-pointer select-none items-center justify-between rounded-sm px-2 py-1.5 text-sm outline-none
                                            ${isHighlighted
                                                ? 'bg-accent text-accent-foreground'
                                                : 'hover:bg-accent hover:text-accent-foreground'
                                            }
                                        `}
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
                                        <span>
                                            {isCreateOption ? `Create "${formatAssigneeDisplayName(inputValue)}"` : option}
                                        </span>
                                        {!isCreateOption && isSelected && (
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