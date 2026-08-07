import { Head, Link, router } from '@inertiajs/react';
import { Plus, Search, X } from 'lucide-react';
import React from 'react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
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
import { cn, formatDate, formatNumber } from '@/lib/utils';
import {
    create,
    index as stockAdjustmentsIndex,
} from '@/routes/stock-adjustments';
import type { Paginated } from '@/types';

type StockAdjustment = {
    id: number;
    type: string;
    quantity: string;
    reason: string;
    note: string | null;
    created_at: string;
    product: {
        id: number;
        product_code: string;
        name: string;
        unit: string;
    };
    adjusted_by: {
        id: number;
        name: string;
    };
};

type Filters = {
    search: string;
    type: string;
    sort: string;
};

type Props = {
    stockAdjustments: Paginated<StockAdjustment>;
    filters: Filters;
};

const DEFAULT_FILTERS: Filters = { search: '', type: 'all', sort: 'latest' };

const TYPE_OPTIONS = [
    { value: 'increase', label: 'Increase' },
    { value: 'decrease', label: 'Decrease' },
];

const SORT_OPTIONS = [
    { value: 'latest', label: 'Latest first' },
    { value: 'oldest', label: 'Oldest first' },
];

export default function StockAdjustmentsIndex({ stockAdjustments, filters }: Props) {
    const [search, setSearch] = React.useState(filters.search);
    const [type, setType] = React.useState(filters.type || 'all');
    const [sort, setSort] = React.useState(filters.sort || 'latest');
    const debounceRef = React.useRef<ReturnType<typeof setTimeout>>(undefined);

    const hasActiveFilters =
        search !== DEFAULT_FILTERS.search ||
        type !== DEFAULT_FILTERS.type ||
        sort !== DEFAULT_FILTERS.sort;

    function applyFilters(overrides: Partial<Filters>): void {
        const next = { search, type, sort, ...overrides };

        router.get(
            stockAdjustmentsIndex.url({
                query: {
                    search: next.search || undefined,
                    type: next.type !== 'all' ? next.type : undefined,
                    sort: next.sort !== 'latest' ? next.sort : undefined,
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

    function handleSortChange(value: string): void {
        setSort(value);
        applyFilters({ sort: value });
    }

    function handleReset(): void {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        setSearch(DEFAULT_FILTERS.search);
        setType(DEFAULT_FILTERS.type);
        setSort(DEFAULT_FILTERS.sort);

        router.get(
            stockAdjustmentsIndex.url(),
            {},
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }

    return (
        <>
            <Head title="Stock Adjustments" />

            <div className="space-y-6 p-4">
                <div className="flex items-center justify-between gap-4">
                    <Heading
                        title="Stock Adjustments"
                        description="Manual corrections to a product's stock on hand, such as stock counts, damage, loss, or initial loads"
                    />
                    <Button asChild>
                        <Link href={create()}>New Adjustment</Link>
                    </Button>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                    <div className="relative w-full sm:max-w-xs">
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            placeholder="Search by code, name, or reference"
                            className="pl-9"
                        />
                    </div>

                    <Select value={type} onValueChange={handleTypeChange}>
                        <SelectTrigger className="w-full sm:w-40">
                            <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All types</SelectItem>
                            {TYPE_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={sort} onValueChange={handleSortChange}>
                        <SelectTrigger className="w-full sm:w-40">
                            <SelectValue placeholder="Sort" />
                        </SelectTrigger>
                        <SelectContent>
                            {SORT_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
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
                                <TableHead>Date</TableHead>
                                <TableHead>Product</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Quantity</TableHead>
                                <TableHead>Reason</TableHead>
                                <TableHead>Note</TableHead>
                                <TableHead>Adjusted by</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {stockAdjustments.data.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={7}
                                        className="h-24 text-center text-muted-foreground"
                                    >
                                        No stock adjustments found.
                                    </TableCell>
                                </TableRow>
                            )}

                            {stockAdjustments.data.map((adjustment) => (
                                <TableRow key={adjustment.id}>
                                    <TableCell className="text-muted-foreground">
                                        {formatDate(adjustment.created_at)}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {adjustment.product.product_code}{' '}
                                        &mdash; {adjustment.product.name}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="secondary"
                                            className="capitalize"
                                        >
                                            {adjustment.type}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {formatNumber(adjustment.quantity)}{' '}
                                        {adjustment.product.unit}
                                    </TableCell>
                                    <TableCell>{adjustment.reason}</TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {adjustment.note}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {adjustment.adjusted_by.name}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {stockAdjustments.last_page > 1 && (
                    <nav className="flex flex-wrap items-center gap-1">
                        {stockAdjustments.links.map((link, index) => (
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

StockAdjustmentsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Stock Adjustments',
            href: stockAdjustmentsIndex(),
        },
    ],
};
