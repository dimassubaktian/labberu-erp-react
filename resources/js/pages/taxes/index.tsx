import { Head, Link, router } from '@inertiajs/react';
import { Plus, Search, X } from 'lucide-react';
import React from 'react';
import Heading from '@/components/heading';
import { StatusBadge } from '@/components/project-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { create, index as taxesIndex, show } from '@/routes/taxes';
import type { Paginated } from '@/types';

type Tax = {
    id: number;
    uuid: string;
    name: string;
    code: string;
    rate: string;
    type: string;
};

type Filters = {
    search: string;
    type: string;
};

type Props = {
    taxes: Paginated<Tax>;
    filters: Filters;
};

const DEFAULT_FILTERS: Filters = { search: '', type: 'all' };

const TYPE_OPTIONS = [
    { value: 'percentage', label: 'Percentage' },
    { value: 'fixed', label: 'Fixed' },
];

export default function TaxesIndex({ taxes, filters }: Props) {
    const [search, setSearch] = React.useState(filters.search);
    const [type, setType] = React.useState(filters.type || 'all');
    const debounceRef = React.useRef<ReturnType<typeof setTimeout>>(undefined);

    const hasActiveFilters =
        search !== DEFAULT_FILTERS.search || type !== DEFAULT_FILTERS.type;

    function applyFilters(overrides: Partial<Filters>): void {
        const next = { search, type, ...overrides };

        router.get(
            taxesIndex.url({
                query: {
                    search: next.search || undefined,
                    type: next.type !== 'all' ? next.type : undefined,
                },
            }),
            {},
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }

    function handleSearchChange(value: string): void {
        setSearch(value);

        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => {
            applyFilters({ search: value });
        }, 400);
    }

    function handleTypeChange(value: string): void {
        setType(value);
        applyFilters({ type: value });
    }

    function handleReset(): void {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        setSearch(DEFAULT_FILTERS.search);
        setType(DEFAULT_FILTERS.type);

        router.get(
            taxesIndex.url(),
            {},
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }

    return (
        <>
            <Head title="Taxes" />

            <div className="space-y-6 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <Heading
                        title="Taxes"
                        description="Manage the taxes used across your organization"
                    />

                    <Button asChild className="w-full sm:w-auto">
                        <Link href={create()}>
                            <Plus />
                            New Tax
                        </Link>
                    </Button>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                    <div className="relative w-full sm:max-w-xs">
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            placeholder="Search by code or name"
                            className="pl-9"
                        />
                    </div>

                    <Select value={type} onValueChange={handleTypeChange}>
                        <SelectTrigger className="w-full sm:w-36">
                            <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All types</SelectItem>
                            {TYPE_OPTIONS.map((option) => (
                                <SelectItem
                                    key={option.value}
                                    value={option.value}
                                >
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {hasActiveFilters && (
                        <Button
                            variant="ghost"
                            onClick={handleReset}
                            className="w-full text-destructive hover:text-destructive sm:w-auto"
                        >
                            <X />
                            Reset
                        </Button>
                    )}
                </div>

                <div className="overflow-hidden rounded-xl border border-border/50">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Code</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Rate</TableHead>
                                <TableHead>Type</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {taxes.data.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={4}
                                        className="h-24 text-center text-muted-foreground"
                                    >
                                        No taxes found.
                                    </TableCell>
                                </TableRow>
                            )}

                            {taxes.data.map((tax) => (
                                <TableRow key={tax.id}>
                                    <TableCell className="font-medium">
                                        <Link href={show(tax)}>{tax.code}</Link>
                                    </TableCell>
                                    <TableCell>
                                        <Link href={show(tax)}>{tax.name}</Link>
                                    </TableCell>
                                    <TableCell>
                                        {tax.type === 'percentage'
                                            ? `${tax.rate}%`
                                            : tax.rate}
                                    </TableCell>
                                    <TableCell>
                                        <StatusBadge
                                            category="tax_type"
                                            value={tax.type}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {taxes.last_page > 1 && (
                    <nav className="flex flex-wrap items-center gap-1">
                        {taxes.links.map((link, index) => (
                            <Link
                                key={index}
                                href={link.url ?? '#'}
                                preserveScroll
                                className={cn(
                                    'rounded-md px-3 py-1.5 text-sm',
                                    link.active
                                        ? 'bg-primary text-primary-foreground'
                                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                                    !link.url &&
                                        'pointer-events-none opacity-50',
                                )}
                                dangerouslySetInnerHTML={{
                                    __html: link.label,
                                }}
                            />
                        ))}
                    </nav>
                )}
            </div>
        </>
    );
}

TaxesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Taxes',
            href: taxesIndex(),
        },
    ],
};
