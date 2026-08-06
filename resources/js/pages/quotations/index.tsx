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
import { show as showCustomer } from '@/routes/customers';
import { show as showProject } from '@/routes/projects';
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
        uuid: string;
        name: string;
        customer: {
            id: number;
            uuid: string;
            name: string;
        };
    };
    currency: {
        id: number;
        iso_code: string;
        symbol: string | null;
    };
};

type Sort = 'latest' | 'oldest' | 'higher_amount' | 'lower_amount';

type Filters = {
    search: string;
    status: string;
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

const SORT_OPTIONS: { value: Sort; label: string }[] = [
    { value: 'latest', label: 'Latest' },
    { value: 'oldest', label: 'Oldest' },
    { value: 'higher_amount', label: 'Higher amount' },
    { value: 'lower_amount', label: 'Lower amount' },
];

const DEFAULT_FILTERS: Filters = {
    search: '',
    status: 'all',
    sort: 'latest',
};

export default function QuotationsIndex({ quotations, filters }: Props) {
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
            quotationsIndex.url({
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
            quotationsIndex.url(),
            {},
            { preserveState: true, preserveScroll: true, replace: true },
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

                    <Select value={sort} onValueChange={handleSortChange}>
                        <SelectTrigger className="w-full sm:w-44">
                            <SelectValue placeholder="Sort by" />
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
                                <TableHead>Valid until</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>Created date</TableHead>
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
                                        <Link href={showProject(quotation.project).url}>
                                            {quotation.project.name}
                                        </Link>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        <Link href={showCustomer(quotation.project.customer).url}>
                                            {quotation.project.customer.name}
                                        </Link>
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
