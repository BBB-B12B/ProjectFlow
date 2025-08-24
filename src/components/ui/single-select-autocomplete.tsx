"use client";

import * as React from "react";
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { X as RemoveIcon } from "lucide-react";

interface SingleSelectAutocompleteProps {
    options: string[];
    initialValue?: string;
    placeholder?: string;
    name?: string;
}

export function SingleSelectAutocomplete({
    options,
    initialValue,
    placeholder,
    name,
}: SingleSelectAutocompleteProps) {
    const [open, setOpen] = React.useState(false);
    const [inputValue, setInputValue] = React.useState(initialValue || "");
    const [selectedValue, setSelectedValue] = React.useState(initialValue || "");
    const [highlightedValue, setHighlightedValue] = React.useState("");

    React.useEffect(() => {
        setInputValue(initialValue || "");
        setSelectedValue(initialValue || "");
    }, [initialValue]);

    const handleSelect = (optionValue: string) => {
        setInputValue(optionValue);
        setSelectedValue(optionValue);
        setOpen(false);
        setHighlightedValue("");
    };

    const handleCreate = (newValue: string) => {
        setInputValue(newValue);
        setSelectedValue(newValue);
        setOpen(false);
        setHighlightedValue("");
    };

    const handleInputChange = (newInputValue: string) => {
        setInputValue(newInputValue);
        if (selectedValue && newInputValue !== selectedValue) {
            setSelectedValue("");
        }
        setHighlightedValue(""); 
    };

    const handleRemove = () => {
        setInputValue("");
        setSelectedValue("");
    }

    return (
        <Command
            value={highlightedValue}
            onValueChange={setHighlightedValue}
            loop
            className="overflow-visible"
        >
            <input type="hidden" name={name} value={selectedValue} />
            <div className="group w-full rounded-md border border-input text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                <div className="flex items-center gap-1.5 px-3 py-2">
                    <CommandInput
                        value={inputValue}
                        onValueChange={handleInputChange}
                        onFocus={() => setOpen(true)}
                        onBlur={() => setTimeout(() => setOpen(false), 150)}
                        placeholder={placeholder || "Select or create..."}
                        className="flex-1 bg-transparent p-0 text-sm placeholder:text-muted-foreground focus:outline-none border-none focus:ring-0"
                    />
                    {selectedValue && (
                        <button
                            type="button"
                            aria-label={`Remove ${selectedValue}`}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={handleRemove}
                            className="ml-1 rounded-full p-0.5 outline-none ring-offset-background hover:bg-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        >
                            <RemoveIcon className="h-3 w-3" />
                        </button>
                    )}
                </div>
            </div>
            <div className="relative mt-2">
                {open && (
                    <div className="absolute top-0 z-50 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in">
                        <CommandList>
                            <CommandGroup className="max-h-64 overflow-auto">
                               {options.map(option => (
                                   <CommandItem
                                       key={option}
                                       value={option}
                                       onSelect={handleSelect}
                                   >
                                       {option}
                                   </CommandItem>
                               ))}
                               {inputValue && !options.some(o => o.toLowerCase() === inputValue.toLowerCase()) && (
                                   <CommandItem
                                       value={inputValue}
                                       onSelect={handleCreate}
                                   >
                                       Create "{inputValue}"
                                   </CommandItem>
                               )}
                               {options.length === 0 && !inputValue && (
                                    <CommandItem disabled>No options available.</CommandItem>
                               )}
                            </CommandGroup>
                        </CommandList>
                    </div>
                )}
            </div>
        </Command>
    );
}
