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
    index as goodsReceiptNotesIndex,
    show,
} from '@/routes/goods-receipt-notes';
import type { Paginated } from '@/types';

type GoodsReceiptNote = {
    id: number;
    uuid: string;
    grn_code: string;
    received_date: string;
    status: string;
    purchase_order: {
        id: number;
        purchase_order_code: string;
        vendor: { id: number; name: string };
    };
};

type Sort = 'latest' | 'oldest' | 'date_desc' | 'date_asc';

type Filters = {
    search: string;
    status: string;
    sort: Sort;
};

type Props = {
    goodsReceiptNotes: Paginated<GoodsReceiptNote>;
    filters: Filters;
};

const DEFAULT_FILTERS: Filters = {
    search: '',
    status: 'all',
    sort: 'latest',
};

const STATUS_OPTIONS = [
    { value: 'draft', label: 'Draft' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'cancelled', label: 'Cancelled' },
];

const SORT_OPTIONS: { value: Sort; label: string }[] = [
    { value: 'latest', label: 'Latest created' },
    { value: 'oldest', label: 'Oldest created' },
    { value: 'date_desc', label: 'Newest received date' },
    { value: 'date_asc', label: 'Oldest received date' },
];

export default function GoodsReceiptNotesIndex({
    goodsReceiptNotes,
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
            goodsReceiptNotesIndex.url({
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
            goodsReceiptNotesIndex.url(),
            {},
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }

    return (
        <>
            <Head title="Goods Receipt Notes" />

            <div className="space-y-6 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <Heading
                        title="Goods Receipt Notes"
                        description="Record what arrived against approved purchase orders"
                    />

                    <Button asChild className="w-full sm:w-auto">
                        <Link href={create()}>
                            <Plus />
                            New Goods Receipt Note
                        </Link>
                    </Button>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                    <div className="relative w-full sm:max-w-xs">
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            placeholder="Search by GRN, PO code, or vendor"
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
                        <SelectTrigger className="w-full sm:w-52">
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
                                <TableHead>GRN code</TableHead>
                                <TableHead>Purchase order</TableHead>
                                <TableHead>Vendor</TableHead>
                                <TableHead>Received date</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {goodsReceiptNotes.data.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={5}
                                        className="h-24 text-center text-muted-foreground"
                                    >
                                        No goods receipt notes found.
                                    </TableCell>
                                </TableRow>
                            )}

                            {goodsReceiptNotes.data.map((goodsReceiptNote) => (
                                <TableRow key={goodsReceiptNote.id}>
                                    <TableCell className="font-medium">
                                        <Link href={show(goodsReceiptNote)}>
                                            {goodsReceiptNote.grn_code}
                                        </Link>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {
                                            goodsReceiptNote.purchase_order
                                                .purchase_order_code
                                        }
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {
                                            goodsReceiptNote.purchase_order
                                                .vendor.name
                                        }
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {formatDate(
                                            goodsReceiptNote.received_date,
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="secondary"
                                            className="capitalize"
                                        >
                                            {goodsReceiptNote.status.replaceAll(
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

                {goodsReceiptNotes.last_page > 1 && (
                    <nav className="flex flex-wrap items-center gap-1">
                        {goodsReceiptNotes.links.map((link, index) => (
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

GoodsReceiptNotesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Goods Receipt Notes',
            href: goodsReceiptNotesIndex(),
        },
    ],
};
