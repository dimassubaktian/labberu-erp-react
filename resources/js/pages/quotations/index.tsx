import { Head, Link, router } from '@inertiajs/react';
import { Plus, Search, X } from 'lucide-react';
import React from 'react';
import Heading from '@/components/heading';
import { ProjectBadge } from '@/components/project-badge';
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

function normalizeFilters(filters: Filters): Filters {
    return {
        search: filters.search ?? DEFAULT_FILTERS.search,
        status: filters.status || DEFAULT_FILTERS.status,
        sort: filters.sort || DEFAULT_FILTERS.sort,
    };
}

function formatQuotationDate(value: string): string {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(new Date(value));
}

function formatQuotationTotal(quotation: Quotation): string {
    return `${quotation.currency.symbol ?? quotation.currency.iso_code} ${formatNumber(quotation.total)}`;
}

function EmptyQuotationsState({
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
                        ? 'No quotations match your filters'
                        : 'No quotations yet'}
                </p>
                <p className="text-sm text-muted-foreground">
                    {hasActiveFilters
                        ? 'Try clearing a filter or searching for a different quotation.'
                        : 'Create a quotation to start tracking project pricing.'}
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
                        New quotation
                    </Link>
                </Button>
            )}
        </div>
    );
}

export default function QuotationsIndex({ quotations, filters }: Props) {
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
        quotations.from !== null && quotations.to !== null
            ? `Showing ${quotations.from}-${quotations.to} of ${quotations.total} quotations`
            : 'No quotations found';

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
                            value={filterState.search}
                            onChange={(event) =>
                                handleSearchChange(event.target.value)
                            }
                            placeholder="Search by code, project, or customer"
                            className="pl-9"
                        />
                    </div>

                    <Select
                        value={filterState.status}
                        onValueChange={handleStatusChange}
                    >
                        <SelectTrigger className="w-full sm:w-52">
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
                            className="w-full text-destructive hover:text-destructive sm:w-auto dark:text-destructive-foreground dark:hover:text-destructive-foreground"
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
                                {quotations.data.length === 0 ? (
                                    <div className="p-8">
                                        <EmptyQuotationsState
                                            hasActiveFilters={hasActiveFilters}
                                            onReset={handleReset}
                                        />
                                    </div>
                                ) : (
                                    quotations.data.map((quotation) => (
                                        <article
                                            key={quotation.id}
                                            className="space-y-4 p-4"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="min-w-0">
                                                    <Link
                                                        href={show(quotation)}
                                                        className="font-mono text-xs font-medium text-muted-foreground hover:text-primary hover:underline"
                                                    >
                                                        {
                                                            quotation.quotation_code
                                                        }
                                                    </Link>
                                                    <Link
                                                        href={
                                                            showProject(
                                                                quotation.project,
                                                            ).url
                                                        }
                                                        className="mt-1 block truncate font-medium hover:text-primary hover:underline"
                                                    >
                                                        {quotation.project.name}
                                                    </Link>
                                                </div>
                                                <ProjectBadge
                                                    category="document"
                                                    value={quotation.status}
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div className="min-w-0 space-y-1">
                                                    <p className="text-muted-foreground">
                                                        Customer
                                                    </p>
                                                    <Link
                                                        href={
                                                            showCustomer(
                                                                quotation
                                                                    .project
                                                                    .customer,
                                                            ).url
                                                        }
                                                        className="block truncate font-medium hover:text-primary hover:underline"
                                                    >
                                                        {
                                                            quotation.project
                                                                .customer.name
                                                        }
                                                    </Link>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-muted-foreground">
                                                        Version
                                                    </p>
                                                    <p className="font-mono text-xs font-medium">
                                                        {
                                                            quotation.version_major
                                                        }
                                                        .
                                                        {
                                                            quotation.version_minor
                                                        }
                                                    </p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-muted-foreground">
                                                        Valid until
                                                    </p>
                                                    <p className="font-medium">
                                                        {quotation.valid_until
                                                            ? formatQuotationDate(
                                                                  quotation.valid_until,
                                                              )
                                                            : 'Not set'}
                                                    </p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-muted-foreground">
                                                        Created
                                                    </p>
                                                    <p className="font-medium">
                                                        {formatQuotationDate(
                                                            quotation.created_at,
                                                        )}
                                                    </p>
                                                </div>
                                                <div className="col-span-2 space-y-1">
                                                    <p className="text-muted-foreground">
                                                        Total
                                                    </p>
                                                    <p className="font-medium">
                                                        {formatQuotationTotal(
                                                            quotation,
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
                                            <TableHead>
                                                Quotation code
                                            </TableHead>
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
                                                    className="h-52"
                                                >
                                                    <EmptyQuotationsState
                                                        hasActiveFilters={
                                                            hasActiveFilters
                                                        }
                                                        onReset={handleReset}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        )}

                                        {quotations.data.map((quotation) => (
                                            <TableRow
                                                key={quotation.id}
                                                className="hover:bg-muted/30"
                                            >
                                                <TableCell className="font-medium">
                                                    <Link
                                                        href={show(quotation)}
                                                        className="font-mono text-xs hover:text-primary hover:underline"
                                                    >
                                                        {
                                                            quotation.quotation_code
                                                        }
                                                    </Link>
                                                </TableCell>
                                                <TableCell className="max-w-72">
                                                    <Link
                                                        href={
                                                            showProject(
                                                                quotation.project,
                                                            ).url
                                                        }
                                                        className="block truncate font-medium hover:text-primary hover:underline"
                                                    >
                                                        {quotation.project.name}
                                                    </Link>
                                                </TableCell>
                                                <TableCell className="max-w-56 text-muted-foreground">
                                                    <Link
                                                        href={
                                                            showCustomer(
                                                                quotation
                                                                    .project
                                                                    .customer,
                                                            ).url
                                                        }
                                                        className="block truncate hover:text-primary hover:underline"
                                                    >
                                                        {
                                                            quotation.project
                                                                .customer.name
                                                        }
                                                    </Link>
                                                </TableCell>
                                                <TableCell className="font-mono text-xs text-muted-foreground">
                                                    {quotation.version_major}.
                                                    {quotation.version_minor}
                                                </TableCell>
                                                <TableCell>
                                                    <ProjectBadge
                                                        category="document"
                                                        value={quotation.status}
                                                    />
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {quotation.valid_until
                                                        ? formatQuotationDate(
                                                              quotation.valid_until,
                                                          )
                                                        : 'Not set'}
                                                </TableCell>
                                                <TableCell className="text-right text-muted-foreground">
                                                    {formatQuotationTotal(
                                                        quotation,
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {formatQuotationDate(
                                                        quotation.created_at,
                                                    )}
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
                </div>
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
