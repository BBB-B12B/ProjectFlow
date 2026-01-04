"use client";

import * as React from "react";
import { X as RemoveIcon, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SingleSelectAutocompleteProps {
    options: { value: string; label: string; }[];
    initialValue?: string;
    placeholder?: string;
    name?: string;
    value?: string;
    onValueChange?: (value: string) => void;
    displayFormatter?: (option: { value: string; label: string }) => string;
}

export function SingleSelectAutocomplete({
    options,
    initialValue,
    placeholder,
    name,
    value,
    onValueChange,
    displayFormatter,
}: SingleSelectAutocompleteProps) {
    const [open, setOpen] = React.useState(false);
    const [inputValue, setInputValue] = React.useState("");
    // Internal value stores the selected ID
    const [internalValue, setInternalValue] = React.useState(value || initialValue || "");
    const [highlightedIndex, setHighlightedIndex] = React.useState(0);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const listRef = React.useRef<HTMLDivElement>(null);

    // Sync state with props
    React.useEffect(() => {
        const currentId = value !== undefined ? value : (internalValue || initialValue);
        const selectedOption = options.find(opt => opt.value === currentId);

        if (selectedOption) {
            setInputValue(displayFormatter ? displayFormatter(selectedOption) : selectedOption.label);
            setInternalValue(selectedOption.value);
        } else if ((value === "" || value === null) && value !== undefined) {
            setInputValue("");
            setInternalValue("");
        } else if (currentId && !selectedOption && options.length > 0) {
            // Option not found but we have an ID/Value (e.g. legacy name). Show as is.
            setInputValue(currentId);
            setInternalValue(currentId);
        }
    }, [value, options, displayFormatter, initialValue, internalValue]);

    const filteredOptions = React.useMemo(() => {
        if (!inputValue) return options;
        // If the input matches the currently selected label exactly, show all options (user likely just clicked to open)
        // BUT only if not actively typing... actually standard behavior is to filter.
        // Let's filter case-insensitively.
        const lowerInput = inputValue.toLowerCase();
        // Check if input matches the *current selected* label. If so, maybe show all?
        // Simpler: Just filter.
        return options.filter(opt => opt.label.toLowerCase().includes(lowerInput));
    }, [options, inputValue]);

    const showCreateOption = inputValue &&
        !options.some(opt => opt.label.toLowerCase() === inputValue.toLowerCase()) &&
        !options.some(opt => opt.value === inputValue); // Check values too just in case

    const allDisplayOptions = React.useMemo(() => {
        const opts = [...filteredOptions];
        if (showCreateOption) {
            opts.push({ value: inputValue, label: inputValue, isCreate: true } as any);
        }
        return opts;
    }, [filteredOptions, showCreateOption, inputValue]);

    // Reset highlighted index when options change
    React.useEffect(() => {
        setHighlightedIndex(0);
    }, [allDisplayOptions.length]);

    const handleSelect = (option: { value: string; label: string; isCreate?: boolean }) => {
        const finalValue = option.isCreate ? option.value : option.value;
        const finalLabel = option.isCreate ? option.value : (displayFormatter ? displayFormatter(option) : option.label);

        setInternalValue(finalValue);
        setInputValue(finalLabel);
        onValueChange?.(finalValue);
        setOpen(false);
        setHighlightedIndex(0);
    };

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
                setHighlightedIndex(prev => (prev + 1) % allDisplayOptions.length);
                // Scroll into view logic could be added here
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex(prev => (prev - 1 + allDisplayOptions.length) % allDisplayOptions.length);
                break;
            case 'Enter':
                e.preventDefault();
                if (allDisplayOptions[highlightedIndex]) {
                    handleSelect(allDisplayOptions[highlightedIndex]);
                }
                break;
            case 'Escape':
                e.preventDefault();
                setOpen(false);
                break;
            case 'Tab':
                if (allDisplayOptions[highlightedIndex]) {
                    e.preventDefault();
                    handleSelect(allDisplayOptions[highlightedIndex]);
                }
                break;
        }
    };

    const handleBlur = (e: React.FocusEvent) => {
        // Delay hide to allow click
        setTimeout(() => {
            if (!inputRef.current?.contains(document.activeElement)) {
                setOpen(false);
                // If input value doesn't match selected, revert?
                // Or leave as create? SingleSelect typically enforces selection or valid create.
                // We'll leave purely controlled by user action for now.
            }
        }, 200);
    };

    return (
        <div className="relative w-full">
            <input type="hidden" name={name} value={internalValue} />
            <div className="relative group w-full rounded-md border border-input bg-transparent text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                <div className="flex items-center px-3 py-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e) => {
                            setInputValue(e.target.value);
                            setOpen(true);
                        }}
                        onFocus={() => setOpen(true)}
                        onBlur={handleBlur}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder || "Select or create..."}
                        className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
                        autoComplete="off"
                    />
                    {internalValue ? (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleSelect({ value: "", label: "" }); // Clear
                            }}
                            className="ml-2 text-muted-foreground hover:text-foreground outline-none"
                        >
                            <RemoveIcon className="h-4 w-4" />
                        </button>
                    ) : (
                        <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                    )}
                </div>
            </div>

            {open && allDisplayOptions.length > 0 && (
                <div className="absolute top-full mt-1 z-50 w-full rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95">
                    <div ref={listRef} className="max-h-60 overflow-y-auto p-1">
                        {allDisplayOptions.map((option, index) => {
                            const isSelected = option.value === internalValue;
                            const isHighlighted = index === highlightedIndex;
                            const isCreate = (option as any).isCreate;

                            return (
                                <div
                                    key={`${option.value}-${index}`}
                                    className={cn(
                                        "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
                                        isHighlighted ? "bg-accent text-accent-foreground" : "text-popover-foreground",
                                        isSelected && "bg-accent/50"
                                    )}
                                    onClick={() => handleSelect(option as any)}
                                    onMouseEnter={() => setHighlightedIndex(index)}
                                >
                                    {isCreate ? (
                                        <span className="font-medium text-blue-500">Create "{option.label}"</span>
                                    ) : (
                                        <span>{option.label}</span>
                                    )}
                                    {isSelected && !isCreate && (
                                        <Check className="ml-auto h-4 w-4" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
            {open && allDisplayOptions.length === 0 && (
                <div className="absolute top-full mt-1 z-50 w-full rounded-md border bg-popover text-popover-foreground shadow-md p-2 text-sm text-muted-foreground">
                    No results found.
                </div>
            )}
        </div>
    );
}
