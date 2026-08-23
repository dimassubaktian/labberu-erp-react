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

export default function DeliveryOrdersIndex({
    deliveryOrders,
    filters,
}: Props) {
    const [search, setSearch] = React.useState(filters.search);
    const [status, setStatus] = React.useState(filters.status || 'all');
    const [sort, setSort] = React.useState<Sort>(
        filters.sort || 'delivery_date_desc',
    );
    const debounceRef = React.useRef<ReturnType<typeof setTimeout>>(undefined);

    const hasActiveFilters =
        search !== DEFAULT_FILTERS.search ||
        status !== DEFAULT_FILTERS.status ||
        sort !== DEFAULT_FILTERS.sort;

    function applyFilters(overrides: Partial<Filters>): void {
        const next = { search, status, sort, ...overrides };

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
        setSearch(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(
            () => applyFilters({ search: value }),
            400,
        );
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
        if (debounceRef.current) clearTimeout(debounceRef.current);
        setSearch(DEFAULT_FILTERS.search);
        setStatus(DEFAULT_FILTERS.status);
        setSort(DEFAULT_FILTERS.sort);
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
                            value={search}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            placeholder="Search by code or customer"
                            className="pl-9"
                        />
                    </div>

                    <Select value={status} onValueChange={handleStatusChange}>
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

                    <Select value={sort} onValueChange={handleSortChange}>
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
                                        className="h-24 text-center text-muted-foreground"
                                    >
                                        No delivery orders found.
                                    </TableCell>
                                </TableRow>
                            )}

                            {deliveryOrders.data.map((deliveryOrder) => (
                                <TableRow key={deliveryOrder.id}>
                                    <TableCell className="font-medium">
                                        <Link href={show(deliveryOrder)}>
                                            {deliveryOrder.do_code}
                                        </Link>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {deliveryOrder.quotation.quotation_code}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {
                                            deliveryOrder.quotation.project
                                                .customer.name
                                        }
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {formatDate(
                                            deliveryOrder.delivery_date,
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="secondary"
                                            className="capitalize"
                                        >
                                            {deliveryOrder.status.replaceAll(
                                                '_',
                                                ' ',
                                            )}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
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
