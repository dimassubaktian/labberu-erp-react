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
import {
    create,
    index as deliveryOrdersIndex,
    show,
} from '@/routes/delivery-orders';
import type { Paginated } from '@/types';

type Sort = 'delivery_date_asc' | 'delivery_date_desc';

type Filters = {
    search: string;
    status: string;
    sort: Sort;
};

type DeliveryOrder = {
    id: number;
    uuid: string;
    do_code: string;
    delivery_date: string;
    status: string;
    quotation: {
        id: number;
        quotation_code: string;
        project: {
            id: number;
            customer: { id: number; name: string };
        };
    };
};

type Props = {
    deliveryOrders: Paginated<DeliveryOrder>;
    filters: Filters;
};

const DEFAULT_FILTERS: Filters = {
    search: '',
    status: 'all',
    sort: 'delivery_date_desc',
};

const STATUS_OPTIONS = [
    { value: 'draft', label: 'Draft' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'cancelled', label: 'Cancelled' },
];

const SORT_OPTIONS: { value: Sort; label: string }[] = [
    { value: 'delivery_date_desc', label: 'Newest delivery date' },
    { value: 'delivery_date_asc', label: 'Oldest delivery date' },
];

function normalizeFilters(filters: Filters): Filters {
    return {
        search: filters.search ?? DEFAULT_FILTERS.search,
        status: filters.status || DEFAULT_FILTERS.status,
        sort: filters.sort || DEFAULT_FILTERS.sort,
    };
}

function formatDeliveryDate(value: string): string {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(new Date(value));
}

function EmptyDeliveryOrdersState({
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
                        ? 'No delivery orders match your filters'
                        : 'No delivery orders yet'}
                </p>
                <p className="text-sm text-muted-foreground">
                    {hasActiveFilters
                        ? 'Try clearing a filter or searching for a different delivery order.'
                        : 'Create a delivery order to record a shipment.'}
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
                        New delivery order
                    </Link>
                </Button>
            )}
        </div>
    );
}

export default function DeliveryOrdersIndex({
    deliveryOrders,
    filters,
}: Props) {
    const initialFilters = normalizeFilters(filters);
    const isMobile = useIsMobile();
    const [filterState, setFilterStateValue] =
        React.useState<Filters>(initialFilters);
    const filterStateRef = React.useRef(initialFilters);
    const [isUpdating, setIsUpdating] = React.useState(false);
    const debounceRef = React.useRef<ReturnType<typeof setTimeout>>(undefined);

    const hasActiveFilters =
        filterState.search !== DEFAULT_FILTERS.search ||
        filterState.status !== DEFAULT_FILTERS.status ||
        filterState.sort !== DEFAULT_FILTERS.sort;

    const resultSummary =
        deliveryOrders.from !== null && deliveryOrders.to !== null
            ? `Showing ${deliveryOrders.from}-${deliveryOrders.to} of ${deliveryOrders.total} delivery orders`
            : 'No delivery orders found';

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
            deliveryOrdersIndex.url({
                query: {
                    search: next.search || undefined,
                    status: next.status !== 'all' ? next.status : undefined,
                    sort:
                        next.sort !== 'delivery_date_desc'
                            ? next.sort
                            : undefined,
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

        debounceRef.current = setTimeout(
            () => applyFilters({ search: value }),
            400,
        );
    }

    function handleStatusChange(value: string): void {
        applyFilters({ status: value });
    }

    function handleSortChange(value: string): void {
        applyFilters({ sort: value as Sort });
    }

    function handleReset(): void {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        const next = { ...DEFAULT_FILTERS };
        filterStateRef.current = next;
        setFilterStateValue(next);

        router.get(
            deliveryOrdersIndex.url(),
            {},
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }

    return (
        <>
            <Head title="Delivery Orders" />

            <div className="space-y-6 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <Heading
                        title="Delivery Orders"
                        description="Record what was shipped against approved quotations"
                    />

                    <Button asChild className="w-full sm:w-auto">
                        <Link href={create()}>
                            <Plus />
                            New Delivery Order
                        </Link>
                    </Button>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                    <div className="relative w-full sm:max-w-xs">
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={filterState.search}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            placeholder="Search by code or customer"
                            className="pl-9"
                        />
                    </div>

                    <Select
                        value={filterState.status}
                        onValueChange={handleStatusChange}
                    >
                        <SelectTrigger className="w-full sm:w-48">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All statuses</SelectItem>
                            {STATUS_OPTIONS.map((o) => (
                                <SelectItem key={o.value} value={o.value}>
                                    {o.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={filterState.sort}
                        onValueChange={handleSortChange}
                    >
                        <SelectTrigger className="w-full sm:w-52">
                            <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                            {SORT_OPTIONS.map((o) => (
                                <SelectItem key={o.value} value={o.value}>
                                    {o.label}
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
                                {deliveryOrders.data.length === 0 ? (
                                    <div className="p-8">
                                        <EmptyDeliveryOrdersState
                                            hasActiveFilters={hasActiveFilters}
                                            onReset={handleReset}
                                        />
                                    </div>
                                ) : (
                                    deliveryOrders.data.map((deliveryOrder) => (
                                        <article
                                            key={deliveryOrder.id}
                                            className="space-y-4 p-4"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="min-w-0">
                                                    <Link
                                                        href={show(
                                                            deliveryOrder,
                                                        )}
                                                        className="font-mono text-xs font-medium text-muted-foreground hover:text-primary hover:underline"
                                                    >
                                                        {deliveryOrder.do_code}
                                                    </Link>
                                                    <p className="mt-1 truncate font-medium">
                                                        {
                                                            deliveryOrder
                                                                .quotation
                                                                .quotation_code
                                                        }
                                                    </p>
                                                </div>
                                                <StatusBadge
                                                    category="document"
                                                    value={deliveryOrder.status}
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div className="min-w-0 space-y-1">
                                                    <p className="text-muted-foreground">
                                                        Customer
                                                    </p>
                                                    <p className="truncate font-medium">
                                                        {
                                                            deliveryOrder
                                                                .quotation
                                                                .project
                                                                .customer.name
                                                        }
                                                    </p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-muted-foreground">
                                                        Delivery date
                                                    </p>
                                                    <p className="font-medium">
                                                        {formatDeliveryDate(
                                                            deliveryOrder.delivery_date,
                                                        )}
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
                                            <TableHead>DO code</TableHead>
                                            <TableHead>Quotation</TableHead>
                                            <TableHead>Customer</TableHead>
                                            <TableHead>Delivery date</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {deliveryOrders.data.length === 0 && (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={5}
                                                    className="h-52"
                                                >
                                                    <EmptyDeliveryOrdersState
                                                        hasActiveFilters={
                                                            hasActiveFilters
                                                        }
                                                        onReset={handleReset}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        )}

                                        {deliveryOrders.data.map(
                                            (deliveryOrder) => (
                                                <TableRow
                                                    key={deliveryOrder.id}
                                                    className="hover:bg-muted/30"
                                                >
                                                    <TableCell className="font-medium">
                                                        <Link
                                                            href={show(
                                                                deliveryOrder,
                                                            )}
                                                            className="font-mono text-xs hover:text-primary hover:underline"
                                                        >
                                                            {
                                                                deliveryOrder.do_code
                                                            }
                                                        </Link>
                                                    </TableCell>
                                                    <TableCell className="font-mono text-xs text-muted-foreground">
                                                        {
                                                            deliveryOrder
                                                                .quotation
                                                                .quotation_code
                                                        }
                                                    </TableCell>
                                                    <TableCell className="max-w-56 text-muted-foreground">
                                                        <span className="block truncate">
                                                            {
                                                                deliveryOrder
                                                                    .quotation
                                                                    .project
                                                                    .customer
                                                                    .name
                                                            }
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground">
                                                        {formatDeliveryDate(
                                                            deliveryOrder.delivery_date,
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <StatusBadge
                                                            category="document"
                                                            value={
                                                                deliveryOrder.status
                                                            }
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ),
                                        )}
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

                        {deliveryOrders.last_page > 1 && (
                            <nav className="flex flex-wrap items-center gap-1">
                                {deliveryOrders.links.map((link, index) => (
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

DeliveryOrdersIndex.layout = {
    breadcrumbs: [
        {
            title: 'Delivery Orders',
            href: deliveryOrdersIndex(),
        },
    ],
};
