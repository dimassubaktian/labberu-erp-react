import { Head, Link, router } from '@inertiajs/react';
import { ArrowDown, ArrowUp, Plus, Search, X } from 'lucide-react';
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
import { create, index as quotationsIndex, show } from '@/routes/quotations';
import type { Paginated } from '@/types';

type Quotation = {
    id: number;
    uuid: string;
    quotation_code: string;
    version_major: number;
    version_minor: number;
    status: string;
    valid_until: string | null;
    total: string;
    created_at: string;
    project: {
        id: number;
        name: string;
        customer: {
            id: number;
            name: string;
        };
    };
    currency: {
        id: number;
        iso_code: string;
        symbol: string | null;
    };
};

type Sort = 'asc' | 'desc';
type SortBy = 'created_at' | 'valid_until' | 'total';

type Filters = {
    search: string;
    status: string;
    sort_by: SortBy;
    sort: Sort;
};

type Props = {
    quotations: Paginated<Quotation>;
    filters: Filters;
};

const STATUS_OPTIONS = [
    { value: 'draft', label: 'Draft' },
    { value: 'request_for_approval', label: 'Request for approval' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'voided', label: 'Voided' },
    { value: 'cancelled', label: 'Cancelled' },
];

const DEFAULT_FILTERS: Filters = {
    search: '',
    status: 'all',
    sort_by: 'created_at',
    sort: 'desc',
};

export default function QuotationsIndex({ quotations, filters }: Props) {
    const [search, setSearch] = React.useState(filters.search);
    const [status, setStatus] = React.useState(filters.status || 'all');
    const [sortBy, setSortBy] = React.useState<SortBy>(filters.sort_by || 'created_at');
    const [sort, setSort] = React.useState<Sort>(filters.sort || 'desc');
    const debounceRef = React.useRef<ReturnType<typeof setTimeout>>(undefined);

    const hasActiveFilters =
        search !== DEFAULT_FILTERS.search ||
        status !== DEFAULT_FILTERS.status ||
        sortBy !== DEFAULT_FILTERS.sort_by ||
        sort !== DEFAULT_FILTERS.sort;

    function applyFilters(overrides: Partial<{ search: string; status: string; sort_by: SortBy; sort: Sort }>): void {
        const next = { search, status, sort_by: sortBy, sort, ...overrides };

        router.get(
            quotationsIndex.url({
                query: {
                    search: next.search || undefined,
                    status: next.status !== 'all' ? next.status : undefined,
                    sort_by: next.sort_by !== 'created_at' ? next.sort_by : undefined,
                    sort: next.sort !== 'desc' ? next.sort : undefined,
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

    function handleSortChange(column: SortBy): void {
        const nextSort: Sort = sortBy === column && sort === 'desc' ? 'asc' : 'desc';
        setSortBy(column);
        setSort(nextSort);
        applyFilters({ sort_by: column, sort: nextSort });
    }

    function handleReset(): void {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        setSearch(DEFAULT_FILTERS.search);
        setStatus(DEFAULT_FILTERS.status);
        setSortBy(DEFAULT_FILTERS.sort_by);
        setSort(DEFAULT_FILTERS.sort);

        router.get(
            quotationsIndex.url(),
            {},
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }

    function SortIcon({ column }: { column: SortBy }) {
        if (sortBy !== column) return null;
        return sort === 'desc' ? (
            <ArrowDown className="size-3.5" />
        ) : (
            <ArrowUp className="size-3.5" />
        );
    }

    return (
        <>
            <Head title="Quotations" />

            <div className="space-y-6 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <Heading
                        title="Quotations"
                        description="Manage quotations for your projects"
                    />

                    <Button asChild className="w-full sm:w-auto">
                        <Link href={create()}>
                            <Plus />
                            New Quotation
                        </Link>
                    </Button>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                    <div className="relative w-full sm:max-w-xs">
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(event) => handleSearchChange(event.target.value)}
                            placeholder="Search by code, project, or customer"
                            className="pl-9"
                        />
                    </div>

                    <Select value={status} onValueChange={handleStatusChange}>
                        <SelectTrigger className="w-full sm:w-52">
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

                    {hasActiveFilters && (
                        <Button
                            variant="ghost"
                            onClick={handleReset}
                            className="w-full text-destructive hover:text-destructive dark:text-destructive-foreground dark:hover:text-destructive-foreground sm:w-auto"
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
                                <TableHead>Quotation code</TableHead>
                                <TableHead>Project</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Version</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>
                                    <button
                                        type="button"
                                        onClick={() => handleSortChange('valid_until')}
                                        className="inline-flex items-center gap-1 hover:text-foreground"
                                    >
                                        Valid until
                                        <SortIcon column="valid_until" />
                                    </button>
                                </TableHead>
                                <TableHead>
                                    <button
                                        type="button"
                                        onClick={() => handleSortChange('total')}
                                        className="inline-flex items-center gap-1 hover:text-foreground"
                                    >
                                        Total
                                        <SortIcon column="total" />
                                    </button>
                                </TableHead>
                                <TableHead>
                                    <button
                                        type="button"
                                        onClick={() => handleSortChange('created_at')}
                                        className="inline-flex items-center gap-1 hover:text-foreground"
                                    >
                                        Created date
                                        <SortIcon column="created_at" />
                                    </button>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {quotations.data.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={8}
                                        className="h-24 text-center text-muted-foreground"
                                    >
                                        No quotations found.
                                    </TableCell>
                                </TableRow>
                            )}

                            {quotations.data.map((quotation) => (
                                <TableRow key={quotation.id}>
                                    <TableCell className="font-medium">
                                        <Link href={show(quotation)}>
                                            {quotation.quotation_code}
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        {quotation.project.name}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {quotation.project.customer.name}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {quotation.version_major}.
                                        {quotation.version_minor}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="secondary"
                                            className="capitalize"
                                        >
                                            {quotation.status.replaceAll(
                                                '_',
                                                ' ',
                                            )}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {quotation.valid_until ? (
                                            formatDate(quotation.valid_until)
                                        ) : (
                                            <span className="text-muted-foreground">
                                                &mdash;
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {quotation.currency.symbol ??
                                            quotation.currency.iso_code}{' '}
                                        {formatNumber(quotation.total)}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {formatDate(quotation.created_at)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {quotations.last_page > 1 && (
                    <nav className="flex flex-wrap items-center gap-1">
                        {quotations.links.map((link, index) => (
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

QuotationsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Quotations',
            href: quotationsIndex(),
        },
    ],
};
