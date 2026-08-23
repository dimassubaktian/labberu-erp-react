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

export default function PurchaseOrdersIndex({
    purchaseOrders,
    filters,
}: Props) {
    const [search, setSearch] = React.useState(filters.search);
    const [status, setStatus] = React.useState(filters.status || 'all');
    const [sort, setSort] = React.useState<Sort>(filters.sort || 'latest');
    const debounceRef = React.useRef<ReturnType<typeof setTimeout>>(undefined);

    const hasActiveFilters =
        search !== DEFAULT_FILTERS.search ||
        status !== DEFAULT_FILTERS.status ||
        sort !== DEFAULT_FILTERS.sort;

    function applyFilters(overrides: Partial<Filters>): void {
        const next = { search, status, sort, ...overrides };

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
        setSearch(value);

        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => {
            applyFilters({ search: value });
        }, 400);
    }

    function handleStatusChange(value: string): void {
        setStatus(value);
        applyFilters({ status: value });
    }

    function handleSortChange(value: string): void {
        setSort(value as Sort);
        applyFilters({ sort: value as Sort });
    }

    function handleReset(): void {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        setSearch(DEFAULT_FILTERS.search);
        setStatus(DEFAULT_FILTERS.status);
        setSort(DEFAULT_FILTERS.sort);

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
                            value={search}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            placeholder="Search by code or vendor"
                            className="pl-9"
                        />
                    </div>

                    <Select value={status} onValueChange={handleStatusChange}>
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

                    <Select value={sort} onValueChange={handleSortChange}>
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
                                        className="h-24 text-center text-muted-foreground"
                                    >
                                        No purchase orders found.
                                    </TableCell>
                                </TableRow>
                            )}

                            {purchaseOrders.data.map((purchaseOrder) => (
                                <TableRow key={purchaseOrder.id}>
                                    <TableCell className="font-medium">
                                        <Link href={show(purchaseOrder)}>
                                            {purchaseOrder.purchase_order_code}
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        {purchaseOrder.project.name}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {purchaseOrder.customer.name}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {purchaseOrder.vendor.name}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {formatDate(purchaseOrder.date)}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="secondary"
                                            className="capitalize"
                                        >
                                            {purchaseOrder.status.replaceAll(
                                                '_',
                                                ' ',
                                            )}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {purchaseOrder.payment_status ? (
                                            <Badge
                                                variant="secondary"
                                                className="capitalize"
                                            >
                                                {purchaseOrder.payment_status.replaceAll(
                                                    '_',
                                                    ' ',
                                                )}
                                            </Badge>
                                        ) : (
                                            <span className="text-muted-foreground">
                                                &mdash;
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {purchaseOrder.currency.symbol ??
                                            purchaseOrder.currency
                                                .iso_code}{' '}
                                        {formatNumber(
                                            purchaseOrder.grand_total,
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
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
