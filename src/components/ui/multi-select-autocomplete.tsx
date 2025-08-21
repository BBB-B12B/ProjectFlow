"use client";

import * as React from "react";
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { X as RemoveIcon } from "lucide-react";

interface MultiSelectAutocompleteProps {
  options: string[];
  initialValue?: string;
  name: string;
}

export function MultiSelectAutocomplete({ options, initialValue, name }: MultiSelectAutocompleteProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [open, setOpen] = React.useState(false);

  const [selected, setSelected] = React.useState<string[]>(() => 
    initialValue ? initialValue.split(',').map(s => s.trim()).filter(Boolean) : []
  );
  
  const [inputValue, setInputValue] = React.useState("");

  React.useEffect(() => {
    setSelected(initialValue ? initialValue.split(',').map(s => s.trim()).filter(Boolean) : []);
  }, [initialValue]);

  const handleSelect = React.useCallback((option: string) => {
    setInputValue("");
    setSelected(prev => {
        if (!prev.includes(option)) {
            return [...prev, option];
        }
        return prev;
    });
    // Give time for the state to update before closing the dropdown
    setTimeout(() => {
        setOpen(false);
    }, 100);
  }, []);

  const handleRemove = React.useCallback((option: string) => {
    setSelected(prev => prev.filter(item => item !== option));
  }, []);

  const handleKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    const input = inputRef.current
    if (input) {
      if (e.key === "Backspace" && input.value === "") {
        handleRemove(selected[selected.length - 1]);
      }
      if (e.key === "Escape") {
        input.blur();
      }
    }
  }, [handleRemove, selected]);

  const filteredOptions = options.filter(
    (option) =>
      !selected.includes(option) &&
      option.toLowerCase().includes(inputValue.toLowerCase())
  );

  const showCreateOption = inputValue && !options.some(opt => opt.toLowerCase() === inputValue.toLowerCase()) && !selected.some(sel => sel.toLowerCase() === inputValue.toLowerCase());

  const hiddenInputValue = selected.join(', ');

  return (
    <div>
      <Command onKeyDown={handleKeyDown} className="overflow-visible bg-transparent">
        <div
          className="group rounded-md border border-input px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
        >
          <div className="flex flex-wrap gap-1">
            {selected.map((option) => (
              <Badge key={option} variant="secondary" className="gap-1.5 pr-1.5">
                {option}
                <button
                  aria-label={`Remove ${option}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleRemove(option)}
                  className="rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <RemoveIcon className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                </button>
              </Badge>
            ))}
            <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onFocus={() => setOpen(true)}
                onBlur={() => setOpen(false)}
                placeholder="Select or create..."
                className="flex-1 bg-transparent p-0 text-sm placeholder:text-muted-foreground focus:outline-none"
            />
          </div>
        </div>
        <div className="relative mt-2">
            {open && (inputValue.length > 0 || filteredOptions.length > 0) && (
            <div className="absolute top-0 z-10 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in">
                <CommandList>
                <CommandGroup>
                  {showCreateOption && (
                    <CommandItem
                      onMouseDown={(e) => e.preventDefault()}
                      onSelect={() => handleSelect(inputValue)}
                      className="cursor-pointer"
                    >
                      Create "{inputValue}"
                    </CommandItem>
                  )}
                  {filteredOptions.map((option) => (
                    <CommandItem
                      key={option}
                      onMouseDown={(e) => e.preventDefault()}
                      onSelect={() => handleSelect(option)}
                      className="cursor-pointer"
                    >
                      {option}
                    </CommandItem>
                  ))}
                </CommandGroup>
                </CommandList>
            </div>
            )}
        </div>
      </Command>
      <input type="hidden" name={name} value={hiddenInputValue} />
    </div>
  );
}
