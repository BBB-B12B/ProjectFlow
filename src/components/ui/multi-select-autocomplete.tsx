"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { X as RemoveIcon, Check } from "lucide-react";

type Option = {
    value: string;
    label: string;
};

interface MultiSelectAutocompleteProps {
    options: string[];
    initialValue?: string | string[];
    placeholder?: string;
    name?: string;
}

export function MultiSelectAutocomplete({
    options: initialOptions,
    initialValue,
    placeholder,
    name,
}: MultiSelectAutocompleteProps) {
    const commandRef = React.useRef<HTMLDivElement>(null);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [open, setOpen] = React.useState(false);
    const [selected, setSelected] = React.useState<string[]>([]);
    const [inputValue, setInputValue] = React.useState("");

    React.useEffect(() => {
        if (initialValue) {
            if (Array.isArray(initialValue)) {
                setSelected(initialValue);
            } else {
                setSelected([initialValue]);
            }
        }
    }, [initialValue]);
    
    const options = React.useMemo(() => 
        initialOptions.map(option => ({ value: option, label: option })),
    [initialOptions]);

    const handleSelect = (optionValue: string) => {
        setInputValue("");
        setSelected(prev => {
            if (prev.includes(optionValue)) {
                return prev.filter(item => item !== optionValue);
            } else {
                return [...prev, optionValue];
            }
        });
    };

    const handleRemove = (optionValue: string) => {
        setSelected(prev => prev.filter(item => item !== optionValue));
    };

    const handleCreate = (newValue: string) => {
        if (newValue && !selected.includes(newValue) && !options.some(opt => opt.value === newValue)) {
            setSelected(prev => [...prev, newValue]);
        }
        setInputValue("");
    };
    
    const filteredOptions = options.filter(option =>
        !selected.includes(option.value) &&
        option.label.toLowerCase().includes(inputValue.toLowerCase())
    );

    const showCreateOption = inputValue && !options.some(opt => opt.value.toLowerCase() === inputValue.toLowerCase());

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Enter' && open) {
            e.preventDefault();
            const highlightedItem = commandRef.current?.querySelector('[aria-selected="true"]');
            
            if (highlightedItem) {
                (highlightedItem as HTMLElement).click();
            } else if (showCreateOption) {
                handleCreate(inputValue);
            }
        } else if (e.key === 'Escape') {
            inputRef.current?.blur();
        }
    };
    
    const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
        if (commandRef.current && !commandRef.current.contains(e.relatedTarget as Node)) {
            setOpen(false);
        }
    };

    return (
        <Command
            ref={commandRef}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            className="overflow-visible"
        >
            <input type="hidden" name={name} value={selected.join(',')} />
            <div
                className="group w-full rounded-md border border-input p-1.5 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
                onClick={() => {
                    inputRef.current?.focus();
                    if (!open) setOpen(true);
                }}
            >
                <div className="flex flex-wrap gap-1.5">
                    {selected.map((value) => (
                        <Badge
                            key={value}
                            variant="secondary"
                            className="rounded-sm pr-1.5"
                        >
                            {options.find(opt => opt.value === value)?.label || value}
                            <button
                                type="button"
                                aria-label={`Remove ${value}`}
                                onClick={() => handleRemove(value)}
                                className="ml-1 rounded-full p-0.5 outline-none ring-offset-background hover:bg-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                            >
                                <RemoveIcon className="h-3 w-3" />
                            </button>
                        </Badge>
                    ))}
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onFocus={() => setOpen(true)}
                        placeholder={placeholder || "Select or create..."}
                        className="flex-1 bg-transparent p-0.5 text-sm placeholder:text-muted-foreground focus:outline-none"
                    />
                </div>
            </div>
            <div className="relative mt-2">
                {open && (
                    <div className="absolute top-0 z-50 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in">
                        <CommandList>
                            <CommandGroup className="max-h-64 overflow-auto">
                                {filteredOptions.map((option) => (
                                    <CommandItem
                                        key={option.value}
                                        value={option.value}
                                        onSelect={() => handleSelect(option.value)}
                                        className="flex items-center justify-between"
                                    >
                                        {option.label}
                                        {selected.includes(option.value) && <Check className="h-4 w-4" />}
                                    </CommandItem>
                                ))}
                                {showCreateOption && (
                                    <CommandItem
                                        value={inputValue}
                                        onSelect={() => handleCreate(inputValue)}
                                    >
                                        Create "{inputValue}"
                                    </CommandItem>
                                )}
                                {!showCreateOption && filteredOptions.length === 0 && (
                                    <CommandItem disabled>No results found.</CommandItem>
                                )}
                            </CommandGroup>
                        </CommandList>
                    </div>
                )}
            </div>
        </Command>
    );
}
