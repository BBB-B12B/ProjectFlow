"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { X as RemoveIcon, Check } from "lucide-react";

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
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [open, setOpen] = React.useState(false);
    const [selected, setSelected] = React.useState<string[]>([]);
    const [inputValue, setInputValue] = React.useState("");
    const [highlightedValue, setHighlightedValue] = React.useState("");

    React.useEffect(() => {
        if (initialValue) {
            if (Array.isArray(initialValue)) {
                setSelected(initialValue);
            } else if (typeof initialValue === 'string' && initialValue) {
                setSelected(initialValue.split(','));
            } else {
                setSelected([]);
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
        setTimeout(() => inputRef.current?.focus(), 0);
    };

    const handleRemove = (optionValue: string) => {
        setSelected(prev => prev.filter(item => item !== optionValue));
    };

    const handleCreate = (newValue: string) => {
        const trimmedValue = newValue.trim();
        if (trimmedValue && !selected.includes(trimmedValue) && !options.some(opt => opt.value === trimmedValue)) {
            setSelected(prev => [...prev, trimmedValue]);
        }
        setInputValue("");
        setTimeout(() => inputRef.current?.focus(), 0);
    };
    
    const filteredOptions = options.filter(option =>
        !selected.includes(option.value) &&
        option.label.toLowerCase().includes(inputValue.toLowerCase())
    );

    const showCreateOption = inputValue && !options.some(opt => opt.value.toLowerCase() === inputValue.toLowerCase());
    
    React.useEffect(() => {
        if (filteredOptions.length > 0) {
            setHighlightedValue(filteredOptions[0].value);
        } else if (showCreateOption) {
            setHighlightedValue(inputValue);
        } else {
            setHighlightedValue("");
        }
    }, [inputValue]);

    return (
        <Command 
            className="overflow-visible"
            value={highlightedValue}
            onValueChange={setHighlightedValue}
            loop
            onKeyDown={(e) => {
                if (e.key === 'Backspace' && inputValue === '') {
                    if (selected.length > 0) {
                        handleRemove(selected[selected.length - 1]);
                    }
                }
            }}
        >
            <input type="hidden" name={name} value={selected.join(',')} />
            <div className="group w-full rounded-md border border-input text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                <div 
                    className="flex flex-wrap gap-1.5 p-1.5"
                    onClick={() => inputRef.current?.focus()}
                >
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
                                onClick={(e) => { e.stopPropagation(); handleRemove(value); }}
                                onMouseDown={(e) => e.preventDefault()}
                                className="ml-1 rounded-full p-0.5 outline-none ring-offset-background hover:bg-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                            >
                                <RemoveIcon className="h-3 w-3" />
                            </button>
                        </Badge>
                    ))}
                    <div className="flex-1" style={{minWidth: '100px'}}>
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onFocus={() => setOpen(true)}
                            onBlur={() => setTimeout(() => setOpen(false), 150)}
                            placeholder={selected.length > 0 ? "" : (placeholder || "Select or create...")}
                            className="w-full bg-transparent p-0.5 text-sm placeholder:text-muted-foreground focus:outline-none"
                        />
                    </div>
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
                                        onSelect={handleSelect}
                                        onMouseDown={(e) => e.preventDefault()}
                                        className="flex items-center justify-between"
                                    >
                                        {option.label}
                                        {selected.includes(option.value) && <Check className="h-4 w-4" />}
                                    </CommandItem>
                                ))}
                                {showCreateOption && (
                                    <CommandItem
                                        value={inputValue}
                                        onSelect={handleCreate}
                                        onMouseDown={(e) => e.preventDefault()}
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
