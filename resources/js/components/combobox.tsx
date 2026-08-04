import { Check, ChevronsUpDown } from 'lucide-react';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

type ComboboxProps<T> = {
    id?: string;
    value: string;
    onValueChange: (value: string, option?: T) => void;
    options: T[];
    getOptionId: (option: T) => string;
    getOptionLabel: (option: T) => string;
    renderOption?: (option: T) => React.ReactNode;
    placeholder?: string;
    disabled?: boolean;
};

export function Combobox<T>({
    id,
    value,
    onValueChange,
    options,
    getOptionId,
    getOptionLabel,
    renderOption,
    placeholder = 'Select an option',
    disabled,
}: ComboboxProps<T>) {
    const [open, setOpen] = React.useState(false);
    const selectedOption = options.find(
        (option) => getOptionId(option) === value,
    );

    function handleSelect(option: T): void {
        onValueChange(getOptionId(option), option);
        setOpen(false);
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    id={id}
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className="w-full min-w-0 justify-between font-normal"
                >
                    <span className="truncate">
                        {selectedOption
                            ? getOptionLabel(selectedOption)
                            : placeholder}
                    </span>
                    <ChevronsUpDown className="shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-(--radix-popover-trigger-width) p-0"
                align="start"
            >
                <Command>
                    <CommandInput placeholder="Type to search…" />
                    <CommandList>
                        <CommandEmpty>No results found.</CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => {
                                const optionId = getOptionId(option);

                                return (
                                    <CommandItem
                                        key={optionId}
                                        value={getOptionLabel(option)}
                                        onSelect={() => handleSelect(option)}
                                    >
                                        <Check
                                            className={cn(
                                                optionId === value
                                                    ? 'opacity-100'
                                                    : 'opacity-0',
                                            )}
                                        />
                                        <span className="truncate">
                                            {renderOption
                                                ? renderOption(option)
                                                : getOptionLabel(option)}
                                        </span>
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
