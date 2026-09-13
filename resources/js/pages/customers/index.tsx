import { Head, Link, router } from '@inertiajs/react';
import { Plus, Search, X } from 'lucide-react';
import React from 'react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { create, index as customersIndex, show } from '@/routes/customers';
import type { Paginated } from '@/types';

type Customer = {
    id: number;
    uuid: string;
    customer_code: string;
    name: string;
    attention: string | null;
    phone: string | null;
    city: string | null;
};

type Filters = {
    search: string;
};

type Props = {
    customers: Paginated<Customer>;
    filters: Filters;
};

const DEFAULT_FILTERS: Filters = { search: '' };

function normalizeFilters(filters: Filters): Filters {
    return {
        search: filters.search ?? DEFAULT_FILTERS.search,
    };
}

function EmptyCustomersState({
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
                        ? 'No customers match your search'
                        : 'No customers yet'}
                </p>
                <p className="text-sm text-muted-foreground">
                    {hasActiveFilters
                        ? 'Try clearing the search or using a different customer name or code.'
                        : 'Create a customer to start managing your relationships.'}
                </p>
            </div>
            {hasActiveFilters ? (
                <Button variant="outline" size="sm" onClick={onReset}>
                    <X />
                    Clear search
                </Button>
            ) : (
                <Button asChild size="sm">
                    <Link href={create()}>
                        <Plus />
                        New customer
                    </Link>
                </Button>
            )}
        </div>
    );
}

export default function CustomersIndex({ customers, filters }: Props) {
    const initialFilters = normalizeFilters(filters);
    const isMobile = useIsMobile();
    const [filterState, setFilterStateValue] =
        React.useState<Filters>(initialFilters);
    const filterStateRef = React.useRef(initialFilters);
    const [isUpdating, setIsUpdating] = React.useState(false);
    const debounceRef = React.useRef<ReturnType<typeof setTimeout>>(undefined);

    const hasActiveFilters = filterState.search !== DEFAULT_FILTERS.search;

    const resultSummary =
        customers.from !== null && customers.to !== null
            ? `Showing ${customers.from}-${customers.to} of ${customers.total} customers`
            : 'No customers found';

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
            customersIndex.url({
                query: { search: next.search || undefined },
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

    function handleReset(): void {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        const next = { ...DEFAULT_FILTERS };
        filterStateRef.current = next;
        setFilterStateValue(next);

        router.get(
            customersIndex.url(),
            {},
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }

    return (
        <>
            <Head title="Customers" />

            <div className="space-y-6 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <Heading
                        title="Customers"
                        description="Manage the customers your organization works with"
                    />

                    <Button asChild className="w-full sm:w-auto">
                        <Link href={create()}>
                            <Plus />
                            New Customer
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
                                {customers.data.length === 0 ? (
                                    <div className="p-8">
                                        <EmptyCustomersState
                                            hasActiveFilters={hasActiveFilters}
                                            onReset={handleReset}
                                        />
                                    </div>
                                ) : (
                                    customers.data.map((customer) => (
                                        <article
                                            key={customer.id}
                                            className="space-y-4 p-4"
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className="min-w-0">
                                                    <Link
                                                        href={show(customer)}
                                                        className="font-mono text-xs font-medium text-muted-foreground hover:text-primary hover:underline"
                                                    >
                                                        {customer.customer_code}
                                                    </Link>
                                                    <Link
                                                        href={show(customer)}
                                                        className="mt-1 block truncate font-medium hover:text-primary hover:underline"
                                                    >
                                                        {customer.name}
                                                    </Link>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div className="min-w-0 space-y-1">
                                                    <p className="text-muted-foreground">
                                                        Attention
                                                    </p>
                                                    <p className="truncate font-medium">
                                                        {customer.attention ??
                                                            'Not provided'}
                                                    </p>
                                                </div>
                                                <div className="min-w-0 space-y-1">
                                                    <p className="text-muted-foreground">
                                                        Phone
                                                    </p>
                                                    <p className="truncate font-medium">
                                                        {customer.phone ??
                                                            'Not provided'}
                                                    </p>
                                                </div>
                                                <div className="min-w-0 space-y-1">
                                                    <p className="text-muted-foreground">
                                                        City
                                                    </p>
                                                    <p className="truncate font-medium">
                                                        {customer.city ??
                                                            'Not provided'}
                                                    </p>
                                                </div>
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
                                            <TableHead>Customer code</TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Attention</TableHead>
                                            <TableHead>Phone</TableHead>
                                            <TableHead>City</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {customers.data.length === 0 && (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={5}
                                                    className="h-52"
                                                >
                                                    <EmptyCustomersState
                                                        hasActiveFilters={
                                                            hasActiveFilters
                                                        }
                                                        onReset={handleReset}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        )}

                                        {customers.data.map((customer) => (
                                            <TableRow
                                                key={customer.id}
                                                className="hover:bg-muted/30"
                                            >
                                                <TableCell className="font-medium">
                                                    <Link
                                                        href={show(customer)}
                                                        className="font-mono text-xs hover:text-primary hover:underline"
                                                    >
                                                        {customer.customer_code}
                                                    </Link>
                                                </TableCell>
                                                <TableCell className="max-w-72">
                                                    <Link
                                                        href={show(customer)}
                                                        className="block truncate font-medium hover:text-primary hover:underline"
                                                    >
                                                        {customer.name}
                                                    </Link>
                                                </TableCell>
                                                <TableCell className="max-w-56 text-muted-foreground">
                                                    <span className="block truncate">
                                                        {customer.attention ??
                                                            'Not provided'}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="max-w-48 text-muted-foreground">
                                                    <span className="block truncate">
                                                        {customer.phone ??
                                                            'Not provided'}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="max-w-48 text-muted-foreground">
                                                    <span className="block truncate">
                                                        {customer.city ??
                                                            'Not provided'}
                                                    </span>
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

                        {customers.last_page > 1 && (
                            <nav className="flex flex-wrap items-center gap-1">
                                {customers.links.map((link, index) => (
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

CustomersIndex.layout = {
    breadcrumbs: [
        {
            title: 'Customers',
            href: customersIndex(),
        },
    ],
};
