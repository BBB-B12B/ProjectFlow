"use client";

import * as React from "react";
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { X as RemoveIcon } from "lucide-react";

interface SingleSelectAutocompleteProps {
    options: { value: string; label: string; }[];
    initialValue?: string;
    placeholder?: string;
    name?: string;
    value?: string; // Controlled prop for the selected value (ID)
    onValueChange?: (value: string) => void; // Callback for when the value (ID) changes
    // New prop: A formatter function for how the selected option's label is displayed in the input
    displayFormatter?: (option: { value: string; label: string }) => string;
}

export function SingleSelectAutocomplete({
    options,
    initialValue,
    placeholder,
    name,
    value,
    onValueChange,
    displayFormatter, // Destructure the new prop
}: SingleSelectAutocompleteProps) {
    const [open, setOpen] = React.useState(false);
    const [internalValue, setInternalValue] = React.useState(value || initialValue || "");
    const [inputValue, setInputValue] = React.useState(() => {
        const initialOption = options.find(opt => opt.value === (value || initialValue));
        // Use displayFormatter if available, otherwise default to label
        return initialOption ? (displayFormatter ? displayFormatter(initialOption) : initialOption.label) : (value || initialValue || "");
    });
    const [highlightedValue, setHighlightedValue] = React.useState("");

    React.useEffect(() => {
        const currentSelectedId = value !== undefined ? value : internalValue;
        const option = options.find(opt => opt.value === currentSelectedId);
        
        if (option) {
            // Use displayFormatter for inputValue if provided
            setInputValue(displayFormatter ? displayFormatter(option) : option.label);
        } else if (value === "" || value === null || value === undefined) {
            setInputValue("");
        } else if (value !== undefined) {
            setInputValue(value);
        }
        setInternalValue(currentSelectedId);
    }, [value, options, displayFormatter]); // Add displayFormatter to dependencies

    const filteredOptions = React.useMemo(() => {
        if (!inputValue) {
            return options;
        }
        const lowercasedInput = inputValue.toLowerCase();
        return options.filter(option =>
            option.label.toLowerCase().includes(lowercasedInput)
        );
    }, [options, inputValue]);

    const handleSelect = (selectedLabel: string) => {
        const selectedOption = options.find(opt => opt.label === selectedLabel);
        if (selectedOption) {
            setInternalValue(selectedOption.value);
            // Use displayFormatter for inputValue here too
            setInputValue(displayFormatter ? displayFormatter(selectedOption) : selectedOption.label);
            onValueChange?.(selectedOption.value);
        } else {
            setInternalValue(selectedLabel);
            setInputValue(selectedLabel);
            onValueChange?.(selectedLabel);
        }
        setOpen(false);
        setHighlightedValue("");
    };

    const handleCreate = (newValue: string) => {
        setInternalValue(newValue);
        setInputValue(newValue);
        onValueChange?.(newValue);
        setOpen(false);
        setHighlightedValue("");
    };

    const handleInputChange = (newInputValue: string) => {
        setInputValue(newInputValue);
        const matchedOption = options.find(opt => opt.label === newInputValue);
        if (!matchedOption && internalValue) {
            setInternalValue("");
            onValueChange?.("");
        }
        setOpen(true);
        setHighlightedValue(""); 
    };

    const handleRemove = () => {
        setInternalValue("");
        setInputValue("");
        onValueChange?.("");
        setOpen(false);
    }

    return (
        <Command
            value={highlightedValue}
            onValueChange={setHighlightedValue}
            loop
            className="overflow-visible"
        >
            <input type="hidden" name={name} value={internalValue} />
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
                    {internalValue && (
                        <button
                            type="button"
                            aria-label={`Remove ${inputValue}`}
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
                               {filteredOptions.map((option, index) => (
                                   <CommandItem
                                       key={`${option.value}-${index}`}
                                       value={option.label}
                                       onSelect={handleSelect}
                                   >
                                       {option.label}
                                   </CommandItem>
                               ))}
                               {inputValue && !options.some(o => o.label.toLowerCase() === inputValue.toLowerCase()) && (
                                   <CommandItem
                                       key="create-new-option"
                                       value={inputValue}
                                       onSelect={handleCreate}
                                   >
                                       Create "{inputValue}"
                                   </CommandItem>
                               )}
                               {filteredOptions.length === 0 && !inputValue && (
                                    <CommandItem key="no-options-available" disabled>No options available.</CommandItem>
                               )}
                               {filteredOptions.length === 0 && inputValue && !options.some(o => o.label.toLowerCase() === inputValue.toLowerCase()) && (
                                   <CommandItem key="no-results-found" disabled>No results for "{inputValue}"</CommandItem>
                               )}
                            </CommandGroup>
                        </CommandList>
                    </div>
                )}
            </div>
        </Command>
    );
}
