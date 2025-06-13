import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Command as CommandPrimitive } from "cmdk";
import { X, Check } from "lucide-react";

export type Option = {
  value: string;
  label: string;
  disabled?: boolean;
};

interface MultiSelectProps {
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  maxDisplay?: number;
  emptyMessage?: string;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select options",
  className,
  disabled = false,
  maxDisplay = 3,
  emptyMessage = "No options available"
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = React.useState("");
  const containerRef = React.useRef<HTMLDivElement>(null);
  const commandRef = React.useRef<React.ElementRef<typeof CommandPrimitive>>(null);

  // Create a filtered list of available options (excluding already selected ones)
  const displayOptions = options.filter((option) => 
    !option.disabled && !selected.includes(option.value) && 
    option.label.toLowerCase().includes(inputValue.toLowerCase())
  );

  // Handle selecting and deselecting options
  const handleSelect = (value: string) => {
    if (!selected.includes(value)) {
      onChange([...selected, value]);
    }
    setInputValue("");
    inputRef.current?.focus();
  };

  const handleRemove = (value: string) => {
    onChange(selected.filter((item) => item !== value));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const input = inputRef.current;
    if (input) {
      if (e.key === "Delete" || e.key === "Backspace") {
        if (input.value === "" && selected.length > 0) {
          handleRemove(selected[selected.length - 1]);
        }
      }
      
      // Navigation and accessibility
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    }
  };

  // Handle clicks outside to close the dropdown
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Get displayed options
  const displaySelected = selected.map(value => {
    const option = options.find(opt => opt.value === value);
    return option ? option.label : value;
  });
  
  const visibleSelected = displaySelected.slice(0, maxDisplay);
  const hiddenCount = Math.max(0, displaySelected.length - maxDisplay);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative",
        className
      )}
    >
      <div
        className={cn(
          "flex min-h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors",
          disabled ? "cursor-not-allowed opacity-50" : "cursor-text",
          isOpen && "ring-1 ring-ring"
        )}
        onClick={() => {
          if (!disabled) {
            setIsOpen(true);
            inputRef.current?.focus();
          }
        }}
      >
        <div className="flex flex-wrap gap-1 py-1">
          {visibleSelected.map((label) => (
            <Badge key={label} variant="secondary" className="rounded-sm px-1 font-normal">
              {label}
              <button
                className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const value = options.find(opt => opt.label === label)?.value;
                  if (value) handleRemove(value);
                }}
                disabled={disabled}
              >
                <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                <span className="sr-only">Remove {label}</span>
              </button>
            </Badge>
          ))}
          
          {hiddenCount > 0 && (
            <Badge variant="secondary" className="rounded-sm px-1 font-normal">
              +{hiddenCount} more
            </Badge>
          )}
          
          <input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="flex-1 bg-transparent px-1 py-0.5 outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
            placeholder={selected.length === 0 ? placeholder : ""}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
          />
        </div>
      </div>
      
      {isOpen && !disabled && (
        <div className="absolute z-10 mt-1 w-full rounded-md border border-input bg-popover text-popover-foreground shadow-md outline-none animate-in fade-in-0 zoom-in-95">
          <Command ref={commandRef} className="w-full" shouldFilter={false}>
            <CommandInput
              placeholder="Search..."
              value={inputValue}
              onValueChange={setInputValue}
              className="border-none focus:ring-0"
            />
            <CommandList>
              <CommandEmpty>{emptyMessage}</CommandEmpty>
              <CommandGroup>
                {displayOptions.length > 0 ? (
                  displayOptions.map((option) => (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      onSelect={(currentValue) => handleSelect(currentValue)}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selected.includes(option.value) ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {option.label}
                    </CommandItem>
                  ))
                ) : inputValue.length > 0 ? (
                  <CommandItem
                    className="cursor-pointer"
                    onSelect={() => {
                      // Do nothing, just a placeholder when no matches
                    }}
                  >
                    No matches found
                  </CommandItem>
                ) : null}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
}
