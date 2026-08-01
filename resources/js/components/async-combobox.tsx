import { useHttp } from '@inertiajs/react';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
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

type SearchResponse<T> = {
    data: T[];
};

type AsyncComboboxProps<T> = {
    id?: string;
    value: string;
    onValueChange: (value: string, option?: T) => void;
    searchUrl: string;
    getOptionId: (option: T) => string;
    getOptionLabel: (option: T) => string;
    renderOption?: (option: T) => React.ReactNode;
    initialOption?: T | null;
    placeholder?: string;
    disabled?: boolean;
};

export function AsyncCombobox<T>({
    id,
    value,
    onValueChange,
    searchUrl,
    getOptionId,
    getOptionLabel,
    renderOption,
    initialOption = null,
    placeholder = 'Select an option',
    disabled,
}: AsyncComboboxProps<T>) {
    const [open, setOpen] = React.useState(false);
    const [options, setOptions] = React.useState<T[]>(
        initialOption ? [initialOption] : [],
    );
    const [selectedOption, setSelectedOption] = React.useState<T | null>(
        initialOption,
    );
    const { setData, get, processing } = useHttp<
        { q: string },
        SearchResponse<T>
    >({ q: '' });
    const debounceRef = React.useRef<ReturnType<typeof setTimeout>>(undefined);
    const hasSearchedRef = React.useRef(false);

    function search(query: string): void {
        setData('q', query);

        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => {
            hasSearchedRef.current = true;

            get(searchUrl, {
                onSuccess: (response) => {
                    setOptions(response.data);
                },
            });
        }, 300);
    }

    function handleOpenChange(nextOpen: boolean): void {
        setOpen(nextOpen);

        if (nextOpen && !hasSearchedRef.current) {
            search('');
        }
    }

    function handleSelect(option: T): void {
        setSelectedOption(option);
        onValueChange(getOptionId(option), option);
        setOpen(false);
    }

    return (
        <Popover open={open} onOpenChange={handleOpenChange}>
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
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder="Type to search…"
                        onValueChange={search}
                    />
                    <CommandList>
                        {processing && (
                            <div className="flex items-center justify-center py-6">
                                <Loader2 className="size-4 animate-spin text-muted-foreground" />
                            </div>
                        )}
                        {!processing && (
                            <CommandEmpty>No results found.</CommandEmpty>
                        )}
                        {!processing && (
                            <CommandGroup>
                                {options.map((option) => {
                                    const optionId = getOptionId(option);

                                    return (
                                        <CommandItem
                                            key={optionId}
                                            value={optionId}
                                            onSelect={() =>
                                                handleSelect(option)
                                            }
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
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
