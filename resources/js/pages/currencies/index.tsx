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
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { create, index as currenciesIndex, show } from '@/routes/currencies';
import type { Paginated } from '@/types';

type Currency = {
    id: number;
    uuid: string;
    iso_code: string;
    name: string;
    symbol: string | null;
    status: string;
    base_currency: boolean;
};

type Filters = {
    search: string;
    status: string;
};

type Props = {
    currencies: Paginated<Currency>;
    filters: Filters;
};

const DEFAULT_FILTERS: Filters = { search: '', status: 'all' };

function normalizeFilters(filters: Filters): Filters {
    return {
        search: filters.search ?? DEFAULT_FILTERS.search,
        status: filters.status || DEFAULT_FILTERS.status,
    };
}

function EmptyCurrenciesState({
    hasActiveFilters,
    onReset,
}: {
    hasActiveFilters: boolean;
    onReset: () => void;
}) {
    return (
        <div className="flex flex-col items-center justify-center gap-3 text-center">
            <div className="rounded-xl bg-muted p-3 text-muted-foreground">
                <Search className="size-6" />
            </div>
            <div className="space-y-1">
                <p className="font-medium">
                    {hasActiveFilters
                        ? 'No currencies match your filters'
                        : 'No currencies yet'}
                </p>
                <p className="text-sm text-muted-foreground">
                    {hasActiveFilters
                        ? 'Try clearing a filter or searching for a different currency.'
                        : 'Create a currency to manage the monetary units used by your organization.'}
                </p>
            </div>
            {hasActiveFilters ? (
                <Button variant="outline" size="sm" onClick={onReset}>
                    <X />
                    Clear filters
                </Button>
            ) : (
                <Button asChild size="sm">
                    <Link href={create()}>
                        <Plus />
                        New currency
                    </Link>
                </Button>
            )}
        </div>
    );
}

const STATUS_OPTIONS = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
];

export default function CurrenciesIndex({ currencies, filters }: Props) {
    const initialFilters = normalizeFilters(filters);
    const isMobile = useIsMobile();
    const [filterState, setFilterStateValue] =
        React.useState<Filters>(initialFilters);
    const filterStateRef = React.useRef(initialFilters);
    const [isUpdating, setIsUpdating] = React.useState(false);
    const debounceRef = React.useRef<ReturnType<typeof setTimeout>>(undefined);

    const hasActiveFilters =
        filterState.search !== DEFAULT_FILTERS.search ||
        filterState.status !== DEFAULT_FILTERS.status;

    const resultSummary =
        currencies.from !== null && currencies.to !== null
            ? `Showing ${currencies.from}-${currencies.to} of ${currencies.total} currencies`
            : 'No currencies found';

    React.useEffect(() => {
        const removeStartListener = router.on('start', () =>
            setIsUpdating(true),
        );
        const removeFinishListener = router.on('finish', () =>
            setIsUpdating(false),
        );

        return () => {
            removeStartListener();
            removeFinishListener();
        };
    }, []);

    React.useEffect(() => {
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, []);

    function updateFilters(overrides: Partial<Filters>): Filters {
        const next = { ...filterStateRef.current, ...overrides };

        filterStateRef.current = next;
        setFilterStateValue(next);

        return next;
    }

    function applyFilters(overrides: Partial<Filters>): void {
        const next = updateFilters(overrides);

        router.get(
            currenciesIndex.url({
                query: {
                    search: next.search || undefined,
                    status: next.status !== 'all' ? next.status : undefined,
                },
            }),
            {},
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }

    function handleSearchChange(value: string): void {
        updateFilters({ search: value });

        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => {
            applyFilters({ search: value });
        }, 400);
    }

    function handleStatusChange(value: string): void {
        applyFilters({ status: value });
    }

    function handleReset(): void {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        const next = { ...DEFAULT_FILTERS };
        filterStateRef.current = next;
        setFilterStateValue(next);

        router.get(
            currenciesIndex.url(),
            {},
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }

    return (
        <>
            <Head title="Currencies" />

            <div className="space-y-6 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <Heading
                        title="Currencies"
                        description="Manage the currencies used across your organization"
                    />

                    <Button asChild className="w-full sm:w-auto">
                        <Link href={create()}>
                            <Plus />
                            New Currency
                        </Link>
                    </Button>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                    <div className="relative w-full sm:max-w-xs">
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={filterState.search}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            placeholder="Search by code or name"
                            className="pl-9"
                        />
                    </div>

                    <Select
                        value={filterState.status}
                        onValueChange={handleStatusChange}
                    >
                        <SelectTrigger className="w-full sm:w-36">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All statuses</SelectItem>
                            {STATUS_OPTIONS.map((option) => (
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
                    <div
                        className={cn(
                            'transition-opacity',
                            isUpdating && 'opacity-60',
                        )}
                    >
                        {isMobile ? (
                            <div className="divide-y divide-border/50">
                                {currencies.data.length === 0 ? (
                                    <div className="p-8">
                                        <EmptyCurrenciesState
                                            hasActiveFilters={hasActiveFilters}
                                            onReset={handleReset}
                                        />
                                    </div>
                                ) : (
                                    currencies.data.map((currency) => (
                                        <article
                                            key={currency.id}
                                            className="space-y-4 p-4"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="min-w-0">
                                                    <Link
                                                        href={show(currency)}
                                                        className="font-mono text-xs font-medium text-muted-foreground hover:text-primary hover:underline"
                                                    >
                                                        {currency.iso_code}
                                                    </Link>
                                                    <Link
                                                        href={show(currency)}
                                                        className="mt-1 block truncate font-medium hover:text-primary hover:underline"
                                                    >
                                                        {currency.name}
                                                    </Link>
                                                </div>
                                                <div className="flex shrink-0 flex-wrap justify-end gap-2">
                                                    <StatusBadge
                                                        category="active"
                                                        value={currency.status}
                                                    />
                                                    {currency.base_currency && (
                                                        <StatusBadge
                                                            category="base"
                                                            value="base"
                                                            label="Base"
                                                        />
                                                    )}
                                                </div>
                                            </div>

                                            <div className="space-y-1 text-sm">
                                                <p className="text-muted-foreground">
                                                    Symbol
                                                </p>
                                                <p className="font-medium">
                                                    {currency.symbol ||
                                                        'Not provided'}
                                                </p>
                                            </div>
                                        </article>
                                    ))
                                )}
                            </div>
                        ) : (
                            <div>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>ISO code</TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Symbol</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {currencies.data.length === 0 && (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={4}
                                                    className="h-52"
                                                >
                                                    <EmptyCurrenciesState
                                                        hasActiveFilters={
                                                            hasActiveFilters
                                                        }
                                                        onReset={handleReset}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        )}

                                        {currencies.data.map((currency) => (
                                            <TableRow
                                                key={currency.id}
                                                className="hover:bg-muted/30"
                                            >
                                                <TableCell className="font-medium">
                                                    <Link
                                                        href={show(currency)}
                                                        className="font-mono text-xs hover:text-primary hover:underline"
                                                    >
                                                        {currency.iso_code}
                                                    </Link>
                                                </TableCell>
                                                <TableCell className="max-w-72">
                                                    <Link
                                                        href={show(currency)}
                                                        className="block truncate font-medium hover:text-primary hover:underline"
                                                    >
                                                        {currency.name}
                                                    </Link>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {currency.symbol || (
                                                        <span className="text-muted-foreground">
                                                            Not provided
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <StatusBadge
                                                            category="active"
                                                            value={
                                                                currency.status
                                                            }
                                                        />
                                                        {currency.base_currency && (
                                                            <StatusBadge
                                                                category="base"
                                                                value="base"
                                                                label="Base"
                                                            />
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-3 border-t border-border/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <p className="text-sm text-muted-foreground">
                                {resultSummary}
                            </p>
                            {isUpdating && (
                                <span className="text-xs text-muted-foreground">
                                    Updating...
                                </span>
                            )}
                        </div>

                        {currencies.last_page > 1 && (
                            <nav className="flex flex-wrap items-center gap-1">
                                {currencies.links.map((link, index) => (
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
                </div>
            </div>
        </>
    );
}

CurrenciesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Currencies',
            href: currenciesIndex(),
        },
    ],
};
