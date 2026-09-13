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
import { cn, formatNumber } from '@/lib/utils';
import {
    create,
    index as purchaseOrdersIndex,
    show,
} from '@/routes/purchase-orders';
import type { Paginated } from '@/types';

type PurchaseOrder = {
    id: number;
    uuid: string;
    purchase_order_code: string;
    date: string;
    status: string;
    payment_status: string | null;
    grand_total: string;
    project: {
        id: number;
        name: string;
    };
    customer: {
        id: number;
        name: string;
    };
    vendor: {
        id: number;
        name: string;
    };
    currency: {
        id: number;
        iso_code: string;
        symbol: string | null;
    };
};

type Sort = 'latest' | 'oldest' | 'date_desc' | 'date_asc';

type Filters = {
    search: string;
    status: string;
    sort: Sort;
};

type Props = {
    purchaseOrders: Paginated<PurchaseOrder>;
    filters: Filters;
};

const DEFAULT_FILTERS: Filters = {
    search: '',
    status: 'all',
    sort: 'latest',
};

const STATUS_OPTIONS = [
    { value: 'draft', label: 'Draft' },
    { value: 'issued', label: 'Issued' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'voided', label: 'Voided' },
];

const SORT_OPTIONS: { value: Sort; label: string }[] = [
    { value: 'latest', label: 'Latest created' },
    { value: 'oldest', label: 'Oldest created' },
    { value: 'date_desc', label: 'Newest PO date' },
    { value: 'date_asc', label: 'Oldest PO date' },
];

function normalizeFilters(filters: Filters): Filters {
    return {
        search: filters.search ?? DEFAULT_FILTERS.search,
        status: filters.status || DEFAULT_FILTERS.status,
        sort: filters.sort || DEFAULT_FILTERS.sort,
    };
}

function formatPurchaseOrderDate(value: string): string {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(new Date(value));
}

function formatPurchaseOrderTotal(purchaseOrder: PurchaseOrder): string {
    return `${purchaseOrder.currency.symbol ?? purchaseOrder.currency.iso_code} ${formatNumber(purchaseOrder.grand_total)}`;
}

function EmptyPurchaseOrdersState({
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
                        ? 'No purchase orders match your filters'
                        : 'No purchase orders yet'}
                </p>
                <p className="text-sm text-muted-foreground">
                    {hasActiveFilters
                        ? 'Try clearing a filter or searching for a different purchase order.'
                        : 'Create a purchase order to start tracking procurement.'}
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
                        New purchase order
                    </Link>
                </Button>
            )}
        </div>
    );
}

export default function PurchaseOrdersIndex({
    purchaseOrders,
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
        purchaseOrders.from !== null && purchaseOrders.to !== null
            ? `Showing ${purchaseOrders.from}-${purchaseOrders.to} of ${purchaseOrders.total} purchase orders`
            : 'No purchase orders found';

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
            purchaseOrdersIndex.url({
                query: {
                    search: next.search || undefined,
                    status: next.status !== 'all' ? next.status : undefined,
                    sort: next.sort !== 'latest' ? next.sort : undefined,
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
            purchaseOrdersIndex.url(),
            {},
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }

    return (
        <>
            <Head title="Purchase Orders" />

            <div className="space-y-6 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <Heading
                        title="Purchase Orders"
                        description="Manage purchase orders raised against vendors"
                    />

                    <Button asChild className="w-full sm:w-auto">
                        <Link href={create()}>
                            <Plus />
                            New Purchase Order
                        </Link>
                    </Button>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                    <div className="relative w-full sm:max-w-xs">
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={filterState.search}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            placeholder="Search by code or vendor"
                            className="pl-9"
                        />
                    </div>

                    <Select
                        value={filterState.status}
                        onValueChange={handleStatusChange}
                    >
                        <SelectTrigger className="w-full sm:w-44">
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

                    <Select
                        value={filterState.sort}
                        onValueChange={handleSortChange}
                    >
                        <SelectTrigger className="w-full sm:w-44">
                            <SelectValue placeholder="Sort by" />
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
                                {purchaseOrders.data.length === 0 ? (
                                    <div className="p-8">
                                        <EmptyPurchaseOrdersState
                                            hasActiveFilters={hasActiveFilters}
                                            onReset={handleReset}
                                        />
                                    </div>
                                ) : (
                                    purchaseOrders.data.map((purchaseOrder) => (
                                        <article
                                            key={purchaseOrder.id}
                                            className="space-y-4 p-4"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="min-w-0">
                                                    <Link
                                                        href={show(
                                                            purchaseOrder,
                                                        )}
                                                        className="font-mono text-xs font-medium text-muted-foreground hover:text-primary hover:underline"
                                                    >
                                                        {
                                                            purchaseOrder.purchase_order_code
                                                        }
                                                    </Link>
                                                    <p className="mt-1 truncate font-medium">
                                                        {
                                                            purchaseOrder
                                                                .project.name
                                                        }
                                                    </p>
                                                </div>
                                                <StatusBadge
                                                    category="document"
                                                    value={purchaseOrder.status}
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div className="min-w-0 space-y-1">
                                                    <p className="text-muted-foreground">
                                                        Customer
                                                    </p>
                                                    <p className="truncate font-medium">
                                                        {
                                                            purchaseOrder
                                                                .customer.name
                                                        }
                                                    </p>
                                                </div>
                                                <div className="min-w-0 space-y-1">
                                                    <p className="text-muted-foreground">
                                                        Vendor
                                                    </p>
                                                    <p className="truncate font-medium">
                                                        {
                                                            purchaseOrder.vendor
                                                                .name
                                                        }
                                                    </p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-muted-foreground">
                                                        PO date
                                                    </p>
                                                    <p className="font-medium">
                                                        {formatPurchaseOrderDate(
                                                            purchaseOrder.date,
                                                        )}
                                                    </p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-muted-foreground">
                                                        Payment
                                                    </p>
                                                    {purchaseOrder.payment_status ? (
                                                        <StatusBadge
                                                            category="payment"
                                                            value={
                                                                purchaseOrder.payment_status
                                                            }
                                                        />
                                                    ) : (
                                                        <p className="font-medium text-muted-foreground">
                                                            Not started
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="col-span-2 space-y-1">
                                                    <p className="text-muted-foreground">
                                                        Grand total
                                                    </p>
                                                    <p className="font-medium">
                                                        {formatPurchaseOrderTotal(
                                                            purchaseOrder,
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
                                            <TableHead>PO code</TableHead>
                                            <TableHead>Project</TableHead>
                                            <TableHead>Customer</TableHead>
                                            <TableHead>Vendor</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Payment</TableHead>
                                            <TableHead>Grand total</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {purchaseOrders.data.length === 0 && (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={8}
                                                    className="h-52"
                                                >
                                                    <EmptyPurchaseOrdersState
                                                        hasActiveFilters={
                                                            hasActiveFilters
                                                        }
                                                        onReset={handleReset}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        )}

                                        {purchaseOrders.data.map(
                                            (purchaseOrder) => (
                                                <TableRow
                                                    key={purchaseOrder.id}
                                                    className="hover:bg-muted/30"
                                                >
                                                    <TableCell className="font-medium">
                                                        <Link
                                                            href={show(
                                                                purchaseOrder,
                                                            )}
                                                            className="font-mono text-xs hover:text-primary hover:underline"
                                                        >
                                                            {
                                                                purchaseOrder.purchase_order_code
                                                            }
                                                        </Link>
                                                    </TableCell>
                                                    <TableCell className="max-w-56">
                                                        <span className="block truncate">
                                                            {
                                                                purchaseOrder
                                                                    .project
                                                                    .name
                                                            }
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="max-w-48 text-muted-foreground">
                                                        <span className="block truncate">
                                                            {
                                                                purchaseOrder
                                                                    .customer
                                                                    .name
                                                            }
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="max-w-48 text-muted-foreground">
                                                        <span className="block truncate">
                                                            {
                                                                purchaseOrder
                                                                    .vendor.name
                                                            }
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground">
                                                        {formatPurchaseOrderDate(
                                                            purchaseOrder.date,
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <StatusBadge
                                                            category="document"
                                                            value={
                                                                purchaseOrder.status
                                                            }
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        {purchaseOrder.payment_status ? (
                                                            <StatusBadge
                                                                category="payment"
                                                                value={
                                                                    purchaseOrder.payment_status
                                                                }
                                                            />
                                                        ) : (
                                                            <span className="text-muted-foreground">
                                                                Not started
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right text-muted-foreground">
                                                        {formatPurchaseOrderTotal(
                                                            purchaseOrder,
                                                        )}
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

                        {purchaseOrders.last_page > 1 && (
                            <nav className="flex flex-wrap items-center gap-1">
                                {purchaseOrders.links.map((link, index) => (
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

PurchaseOrdersIndex.layout = {
    breadcrumbs: [
        {
            title: 'Purchase Orders',
            href: purchaseOrdersIndex(),
        },
    ],
};
