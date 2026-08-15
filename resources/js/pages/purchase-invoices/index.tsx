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
import { cn, formatDate } from '@/lib/utils';
import { create, index as purchaseInvoicesIndex, show } from '@/routes/purchase-invoices';
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

export default function PurchaseInvoicesIndex({ purchaseInvoices, filters }: Props) {
    const [search, setSearch] = React.useState(filters.search);
    const [status, setStatus] = React.useState(filters.status || 'all');
    const [paymentStatus, setPaymentStatus] = React.useState(filters.payment_status || 'all');
    const [sort, setSort] = React.useState(filters.sort || 'latest');
    const debounceRef = React.useRef<ReturnType<typeof setTimeout>>(undefined);

    const hasActiveFilters =
        search !== DEFAULT_FILTERS.search ||
        status !== DEFAULT_FILTERS.status ||
        paymentStatus !== DEFAULT_FILTERS.payment_status ||
        sort !== DEFAULT_FILTERS.sort;

    function applyFilters(overrides: Partial<Filters>): void {
        const next = { search, status, payment_status: paymentStatus, sort, ...overrides };

        router.get(
            purchaseInvoicesIndex.url({
                query: {
                    search: next.search || undefined,
                    status: next.status !== 'all' ? next.status : undefined,
                    payment_status: next.payment_status !== 'all' ? next.payment_status : undefined,
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

    function handlePaymentStatusChange(value: string): void {
        setPaymentStatus(value);
        applyFilters({ payment_status: value });
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
        setStatus(DEFAULT_FILTERS.status);
        setPaymentStatus(DEFAULT_FILTERS.payment_status);
        setSort(DEFAULT_FILTERS.sort);

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
                            value={search}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            placeholder="Search by invoice code, PO, or vendor"
                            className="pl-9"
                        />
                    </div>

                    <Select value={status} onValueChange={handleStatusChange}>
                        <SelectTrigger className="w-full sm:w-36">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All statuses</SelectItem>
                            {STATUS_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={paymentStatus} onValueChange={handlePaymentStatusChange}>
                        <SelectTrigger className="w-full sm:w-44">
                            <SelectValue placeholder="Payment" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All payments</SelectItem>
                            {PAYMENT_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={sort} onValueChange={handleSortChange}>
                        <SelectTrigger className="w-full sm:w-44">
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
                                <TableHead>Invoice code</TableHead>
                                <TableHead>Purchase order</TableHead>
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
                                        className="h-24 text-center text-muted-foreground"
                                    >
                                        No purchase invoices found.
                                    </TableCell>
                                </TableRow>
                            )}

                            {purchaseInvoices.data.map((purchaseInvoice) => (
                                <TableRow key={purchaseInvoice.id}>
                                    <TableCell className="font-medium">
                                        <Link href={show(purchaseInvoice)}>
                                            {purchaseInvoice.purchase_invoice_code}
                                        </Link>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {purchaseInvoice.purchase_order.purchase_order_code}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {purchaseInvoice.purchase_order.vendor.name}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {formatDate(purchaseInvoice.invoice_date)}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {formatDate(purchaseInvoice.due_date)}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="secondary"
                                            className="capitalize"
                                        >
                                            {purchaseInvoice.status.replaceAll(
                                                '_',
                                                ' ',
                                            )}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {purchaseInvoice.payment_status ? (
                                            <Badge
                                                variant="secondary"
                                                className="capitalize"
                                            >
                                                {purchaseInvoice.payment_status.replaceAll(
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
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
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
