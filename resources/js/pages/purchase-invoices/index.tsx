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
import { cn, formatDate } from '@/lib/utils';
import {
    create,
    index as purchaseInvoicesIndex,
    show,
} from '@/routes/purchase-invoices';
import type { Paginated } from '@/types';

type PurchaseInvoice = {
    id: number;
    uuid: string;
    purchase_invoice_code: string;
    invoice_date: string;
    due_date: string;
    status: string;
    payment_status: string | null;
    purchase_order: {
        id: number;
        purchase_order_code: string;
        vendor: { id: number; name: string };
    };
};

type Filters = {
    search: string;
    status: string;
    payment_status: string;
    sort: string;
};

type Props = {
    purchaseInvoices: Paginated<PurchaseInvoice>;
    filters: Filters;
};

const DEFAULT_FILTERS: Filters = {
    search: '',
    status: 'all',
    payment_status: 'all',
    sort: 'latest',
};

function normalizeFilters(filters: Filters): Filters {
    return {
        search: filters.search ?? DEFAULT_FILTERS.search,
        status: filters.status || DEFAULT_FILTERS.status,
        payment_status:
            filters.payment_status || DEFAULT_FILTERS.payment_status,
        sort: filters.sort || DEFAULT_FILTERS.sort,
    };
}

function EmptyPurchaseInvoicesState({
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
                        ? 'No purchase invoices match your filters'
                        : 'No purchase invoices yet'}
                </p>
                <p className="text-sm text-muted-foreground">
                    {hasActiveFilters
                        ? 'Try clearing a filter or searching for a different purchase invoice.'
                        : 'Create a purchase invoice to start tracking vendor billing.'}
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
                        New purchase invoice
                    </Link>
                </Button>
            )}
        </div>
    );
}

const STATUS_OPTIONS = [
    { value: 'draft', label: 'Draft' },
    { value: 'issued', label: 'Issued' },
];

const PAYMENT_OPTIONS = [
    { value: 'paid', label: 'Paid' },
    { value: 'partially_paid', label: 'Partially paid' },
];

const SORT_OPTIONS = [
    { value: 'latest', label: 'Latest first' },
    { value: 'oldest', label: 'Oldest first' },
    { value: 'due_date_desc', label: 'Latest due date' },
    { value: 'due_date_asc', label: 'Oldest due date' },
];

export default function PurchaseInvoicesIndex({
    purchaseInvoices,
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
        filterState.payment_status !== DEFAULT_FILTERS.payment_status ||
        filterState.sort !== DEFAULT_FILTERS.sort;

    const resultSummary =
        purchaseInvoices.from !== null && purchaseInvoices.to !== null
            ? `Showing ${purchaseInvoices.from}-${purchaseInvoices.to} of ${purchaseInvoices.total} purchase invoices`
            : 'No purchase invoices found';

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
            purchaseInvoicesIndex.url({
                query: {
                    search: next.search || undefined,
                    status: next.status !== 'all' ? next.status : undefined,
                    payment_status:
                        next.payment_status !== 'all'
                            ? next.payment_status
                            : undefined,
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

    function handlePaymentStatusChange(value: string): void {
        applyFilters({ payment_status: value });
    }

    function handleSortChange(value: string): void {
        applyFilters({ sort: value });
    }

    function handleReset(): void {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        const next = { ...DEFAULT_FILTERS };
        filterStateRef.current = next;
        setFilterStateValue(next);

        router.get(
            purchaseInvoicesIndex.url(),
            {},
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }

    return (
        <>
            <Head title="Purchase Invoices" />

            <div className="space-y-6 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <Heading
                        title="Purchase Invoices"
                        description="Bill vendors against approved purchase orders"
                    />

                    <Button asChild className="w-full sm:w-auto">
                        <Link href={create()}>
                            <Plus />
                            New Purchase Invoice
                        </Link>
                    </Button>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                    <div className="relative w-full sm:max-w-xs">
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={filterState.search}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            placeholder="Search by invoice code, PO, or vendor"
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

                    <Select
                        value={filterState.payment_status}
                        onValueChange={handlePaymentStatusChange}
                    >
                        <SelectTrigger className="w-full sm:w-44">
                            <SelectValue placeholder="Payment" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All payments</SelectItem>
                            {PAYMENT_OPTIONS.map((option) => (
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
                            <SelectValue placeholder="Sort" />
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
                                {purchaseInvoices.data.length === 0 ? (
                                    <div className="p-8">
                                        <EmptyPurchaseInvoicesState
                                            hasActiveFilters={hasActiveFilters}
                                            onReset={handleReset}
                                        />
                                    </div>
                                ) : (
                                    purchaseInvoices.data.map(
                                        (purchaseInvoice) => (
                                            <article
                                                key={purchaseInvoice.id}
                                                className="space-y-4 p-4"
                                            >
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="min-w-0">
                                                        <Link
                                                            href={show(
                                                                purchaseInvoice,
                                                            )}
                                                            className="font-mono text-xs font-medium text-muted-foreground hover:text-primary hover:underline"
                                                        >
                                                            {
                                                                purchaseInvoice.purchase_invoice_code
                                                            }
                                                        </Link>
                                                        <p className="mt-1 truncate font-medium">
                                                            {
                                                                purchaseInvoice
                                                                    .purchase_order
                                                                    .purchase_order_code
                                                            }
                                                        </p>
                                                    </div>
                                                    <StatusBadge
                                                        category="document"
                                                        value={
                                                            purchaseInvoice.status
                                                        }
                                                    />
                                                </div>

                                                <div className="grid grid-cols-2 gap-4 text-sm">
                                                    <div className="min-w-0 space-y-1">
                                                        <p className="text-muted-foreground">
                                                            Vendor
                                                        </p>
                                                        <p className="truncate font-medium">
                                                            {
                                                                purchaseInvoice
                                                                    .purchase_order
                                                                    .vendor.name
                                                            }
                                                        </p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-muted-foreground">
                                                            Invoice date
                                                        </p>
                                                        <p className="font-medium">
                                                            {formatDate(
                                                                purchaseInvoice.invoice_date,
                                                            )}
                                                        </p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-muted-foreground">
                                                            Due date
                                                        </p>
                                                        <p className="font-medium">
                                                            {formatDate(
                                                                purchaseInvoice.due_date,
                                                            )}
                                                        </p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-muted-foreground">
                                                            Payment
                                                        </p>
                                                        {purchaseInvoice.payment_status ? (
                                                            <StatusBadge
                                                                category="payment"
                                                                value={
                                                                    purchaseInvoice.payment_status
                                                                }
                                                            />
                                                        ) : (
                                                            <p className="font-medium text-muted-foreground">
                                                                Not set
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </article>
                                        ),
                                    )
                                )}
                            </div>
                        ) : (
                            <div>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Invoice code</TableHead>
                                            <TableHead>
                                                Purchase order
                                            </TableHead>
                                            <TableHead>Vendor</TableHead>
                                            <TableHead>Invoice date</TableHead>
                                            <TableHead>Due date</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Payment</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {purchaseInvoices.data.length === 0 && (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={7}
                                                    className="h-52"
                                                >
                                                    <EmptyPurchaseInvoicesState
                                                        hasActiveFilters={
                                                            hasActiveFilters
                                                        }
                                                        onReset={handleReset}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        )}

                                        {purchaseInvoices.data.map(
                                            (purchaseInvoice) => (
                                                <TableRow
                                                    key={purchaseInvoice.id}
                                                    className="hover:bg-muted/30"
                                                >
                                                    <TableCell className="font-medium">
                                                        <Link
                                                            href={show(
                                                                purchaseInvoice,
                                                            )}
                                                            className="font-mono text-xs hover:text-primary hover:underline"
                                                        >
                                                            {
                                                                purchaseInvoice.purchase_invoice_code
                                                            }
                                                        </Link>
                                                    </TableCell>
                                                    <TableCell className="max-w-40 text-muted-foreground">
                                                        <span className="block truncate">
                                                            {
                                                                purchaseInvoice
                                                                    .purchase_order
                                                                    .purchase_order_code
                                                            }
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="max-w-56 text-muted-foreground">
                                                        <span className="block truncate">
                                                            {
                                                                purchaseInvoice
                                                                    .purchase_order
                                                                    .vendor.name
                                                            }
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap text-muted-foreground">
                                                        {formatDate(
                                                            purchaseInvoice.invoice_date,
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap text-muted-foreground">
                                                        {formatDate(
                                                            purchaseInvoice.due_date,
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <StatusBadge
                                                            category="document"
                                                            value={
                                                                purchaseInvoice.status
                                                            }
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        {purchaseInvoice.payment_status ? (
                                                            <StatusBadge
                                                                category="payment"
                                                                value={
                                                                    purchaseInvoice.payment_status
                                                                }
                                                            />
                                                        ) : (
                                                            <span className="text-muted-foreground">
                                                                Not set
                                                            </span>
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

                        {purchaseInvoices.last_page > 1 && (
                            <nav className="flex flex-wrap items-center gap-1">
                                {purchaseInvoices.links.map((link, index) => (
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

PurchaseInvoicesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Purchase Invoices',
            href: purchaseInvoicesIndex(),
        },
    ],
};
