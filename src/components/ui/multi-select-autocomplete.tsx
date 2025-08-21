"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Command as CommandPrimitive } from "cmdk";

interface MultiSelectAutocompleteProps {
  options: string[];
  initialValue?: string;
  name: string;
}

export function MultiSelectAutocomplete({ options, initialValue, name }: MultiSelectAutocompleteProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<string[]>([]);
  const [inputValue, setInputValue] = React.useState("");

  React.useEffect(() => {
    setSelected(initialValue ? initialValue.split(',').map(s => s.trim()).filter(Boolean) : []);
  }, [initialValue]);

  const handleUnselect = React.useCallback((option: string) => {
    setSelected(prev => prev.filter(s => s !== option));
  }, []);

  const handleSelect = React.useCallback((option: string) => {
    setInputValue("");
    setSelected(prev => {
        if (!prev.includes(option)) {
            return [...prev, option];
        }
        return prev;
    });
  }, []);

  const handleKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    const input = inputRef.current;
    if (input) {
      if (e.key === "Delete" || e.key === "Backspace") {
        if (input.value === "") {
          setSelected(prev => prev.slice(0, -1));
        }
      }
      if (e.key === "Escape") {
        input.blur();
      }
      if (e.key === "Enter" && inputValue) {
        e.preventDefault();
        handleSelect(inputValue);
      }
    }
  }, [inputValue, handleSelect]);
  
  const filteredOptions = options.filter(
    (option) =>
      !selected.includes(option) &&
      option.toLowerCase().includes(inputValue.toLowerCase())
  );

  const hiddenInputValue = selected.join(', ');

  return (
    <div>
      <Command onKeyDown={handleKeyDown} className="overflow-visible bg-transparent">
        <div className="group rounded-md border border-input px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
          <div className="flex flex-wrap gap-1">
            {selected.map((option) => (
              <Badge key={option} variant="secondary">
                {option}
                <button
                  className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onClick={() => handleUnselect(option)}
                >
                  <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                </button>
              </Badge>
            ))}
            <CommandPrimitive.Input
              ref={inputRef}
              value={inputValue}
              onValueChange={setInputValue}
              onBlur={() => setTimeout(() => setOpen(false), 150)}
              onFocus={() => setOpen(true)}
              placeholder="Select or create..."
              className="ml-2 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>
        <div className="relative mt-2">
            {open && (
            <div className="absolute top-0 z-10 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in">
                <CommandList>
                <CommandGroup className="h-full max-h-[200px] overflow-auto">
                  {inputValue && !options.includes(inputValue) && !selected.includes(inputValue) && (
                    <CommandItem
                      onSelect={() => handleSelect(inputValue)}
                      className="cursor-pointer"
                    >
                      Create "{inputValue}"
                    </CommandItem>
                  )}
                  {filteredOptions.map((option) => (
                    <CommandItem
                      key={option}
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
