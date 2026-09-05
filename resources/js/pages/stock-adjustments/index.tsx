import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowDownLeft,
    ArrowUpRight,
    Boxes,
    CalendarDays,
    ClipboardPenLine,
    Plus,
    Search,
    SlidersHorizontal,
    UserRound,
    X,
} from 'lucide-react';
import React from 'react';
import { StatusBadge } from '@/components/project-badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
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

export default function StockAdjustmentsIndex({
    stockAdjustments,
    filters,
}: Props) {
    const [search, setSearch] = React.useState(filters.search);
    const [type, setType] = React.useState(filters.type || 'all');
    const [sort, setSort] = React.useState(filters.sort || 'latest');
    const debounceRef = React.useRef<ReturnType<typeof setTimeout>>(undefined);

    const hasActiveFilters =
        search !== DEFAULT_FILTERS.search ||
        type !== DEFAULT_FILTERS.type ||
        sort !== DEFAULT_FILTERS.sort;
    const resultSummary =
        stockAdjustments.from && stockAdjustments.to
            ? `Showing ${stockAdjustments.from}–${stockAdjustments.to} of ${stockAdjustments.total}`
            : 'No adjustments recorded';

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

            <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6">
                <section className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
                    <div className="flex flex-col gap-5 bg-linear-to-br from-primary/[0.08] via-card to-card p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-start gap-4">
                            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:size-14">
                                <ClipboardPenLine className="size-6 sm:size-7" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">
                                    Inventory corrections
                                </p>
                                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                                    Stock adjustments
                                </h1>
                                <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                                    Record count corrections, damaged stock,
                                    losses, and opening balances with a clear
                                    audit trail.
                                </p>
                            </div>
                        </div>
                        <Button asChild className="w-full sm:w-auto">
                            <Link href={create()}>
                                <Plus />
                                New adjustment
                            </Link>
                        </Button>
                    </div>

                    <div className="grid divide-y divide-border/60 border-t border-border/60 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                        <div className="space-y-1 p-4 sm:p-5">
                            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                Recorded adjustments
                            </p>
                            <p className="text-lg font-semibold">
                                {formatNumber(stockAdjustments.total)}
                            </p>
                        </div>
                        <div className="space-y-1 p-4 sm:p-5">
                            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                Current page
                            </p>
                            <p className="text-lg font-semibold">
                                {stockAdjustments.current_page} of{' '}
                                {stockAdjustments.last_page}
                            </p>
                        </div>
                        <div className="space-y-1 p-4 sm:p-5">
                            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                Applied filters
                            </p>
                            <p className="text-lg font-semibold">
                                {hasActiveFilters ? 'Active' : 'None'}
                            </p>
                        </div>
                    </div>
                </section>

                <Card>
                    <CardHeader className="gap-5 border-b border-border/60 pb-5 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <CardTitle>Find adjustments</CardTitle>
                            <CardDescription>
                                Search inventory corrections and refine the
                                audit trail by direction or date.
                            </CardDescription>
                        </div>
                        {hasActiveFilters && (
                            <Button
                                variant="ghost"
                                onClick={handleReset}
                                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                            >
                                <X />
                                Reset filters
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                            <div className="relative w-full sm:max-w-md">
                                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    value={search}
                                    onChange={(e) =>
                                        handleSearchChange(e.target.value)
                                    }
                                    placeholder="Search product code or name"
                                    className="pl-9"
                                />
                            </div>

                            <Select
                                value={type}
                                onValueChange={handleTypeChange}
                            >
                                <SelectTrigger className="w-full sm:w-44">
                                    <SlidersHorizontal className="size-4 text-muted-foreground" />
                                    <SelectValue placeholder="Adjustment type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        All adjustment types
                                    </SelectItem>
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

                            <Select
                                value={sort}
                                onValueChange={handleSortChange}
                            >
                                <SelectTrigger className="w-full sm:w-44">
                                    <CalendarDays className="size-4 text-muted-foreground" />
                                    <SelectValue placeholder="Sort order" />
                                </SelectTrigger>
                                <SelectContent>
                                    {SORT_OPTIONS.map((option) => (
                                        <SelectItem
                                            key={option.value}
                                            value={option.value}
                                        >
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                <Card className="overflow-hidden">
                    <CardHeader className="border-b border-border/60 pb-5">
                        <CardTitle>Adjustment ledger</CardTitle>
                        <CardDescription>
                            Every manual inventory correction, including its
                            reason, supporting note, and responsible user.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-muted/40">
                                <TableRow>
                                    <TableHead className="pl-5">Date</TableHead>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Adjustment</TableHead>
                                    <TableHead className="text-right">
                                        Quantity
                                    </TableHead>
                                    <TableHead>Reason & note</TableHead>
                                    <TableHead className="pr-5">
                                        Adjusted by
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {stockAdjustments.data.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-64">
                                            <div className="flex flex-col items-center justify-center gap-3 text-center">
                                                <div className="rounded-xl bg-muted p-3 text-muted-foreground">
                                                    <Boxes className="size-6" />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="font-medium">
                                                        No stock adjustments
                                                        found
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        Try clearing a filter or
                                                        create an adjustment to
                                                        record an inventory
                                                        correction.
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}

                                {stockAdjustments.data.map((adjustment) => {
                                    const isIncrease =
                                        adjustment.type === 'increase';

                                    return (
                                        <TableRow
                                            key={adjustment.id}
                                            className="hover:bg-muted/30"
                                        >
                                            <TableCell className="pl-5 align-top text-muted-foreground">
                                                <div className="flex items-center gap-2 whitespace-nowrap">
                                                    <CalendarDays className="size-4" />
                                                    {formatDate(
                                                        adjustment.created_at,
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="min-w-56 align-top">
                                                <div className="space-y-1">
                                                    <p className="font-medium">
                                                        {
                                                            adjustment.product
                                                                .name
                                                        }
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {
                                                            adjustment.product
                                                                .product_code
                                                        }
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="align-top">
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className={cn(
                                                            'flex size-7 items-center justify-center rounded-full',
                                                            isIncrease
                                                                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                                                                : 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
                                                        )}
                                                    >
                                                        {isIncrease ? (
                                                            <ArrowUpRight className="size-4" />
                                                        ) : (
                                                            <ArrowDownLeft className="size-4" />
                                                        )}
                                                    </span>
                                                    <StatusBadge
                                                        category="inventory_adjustment"
                                                        value={adjustment.type}
                                                    />
                                                </div>
                                            </TableCell>
                                            <TableCell
                                                className={cn(
                                                    'text-right align-top font-semibold whitespace-nowrap',
                                                    isIncrease
                                                        ? 'text-emerald-700 dark:text-emerald-300'
                                                        : 'text-amber-700 dark:text-amber-300',
                                                )}
                                            >
                                                {isIncrease ? '+' : '−'}
                                                {formatNumber(
                                                    adjustment.quantity,
                                                )}{' '}
                                                <span className="font-medium text-muted-foreground">
                                                    {adjustment.product.unit}
                                                </span>
                                            </TableCell>
                                            <TableCell className="min-w-64 align-top">
                                                <div className="space-y-1">
                                                    <p className="font-medium">
                                                        {adjustment.reason}
                                                    </p>
                                                    <p className="line-clamp-2 text-sm text-muted-foreground">
                                                        {adjustment.note ||
                                                            'No supporting note added.'}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="min-w-40 pr-5 align-top">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                                                        <UserRound className="size-4" />
                                                    </div>
                                                    <span className="text-sm font-medium">
                                                        {
                                                            adjustment
                                                                .adjusted_by
                                                                .name
                                                        }
                                                    </span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>

                    {stockAdjustments.last_page > 1 && (
                        <div className="flex flex-col gap-3 border-t border-border/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-muted-foreground">
                                {resultSummary}
                            </p>
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
                        </div>
                    )}
                </Card>
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
