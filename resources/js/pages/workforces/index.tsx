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
import { create, index as workforcesIndex, show } from '@/routes/workforces';
import type { Paginated } from '@/types';

type Workforce = {
    id: number;
    uuid: string;
    employee_code: string;
    full_name: string;
    email: string;
    status: string;
    job_title: {
        id: number;
        name: string;
    };
};

type JobTitle = {
    id: number;
    name: string;
};

type Filters = {
    search: string;
    job_title: string;
    status: string;
};

type Props = {
    workforces: Paginated<Workforce>;
    jobTitles: JobTitle[];
    filters: Filters;
};

const DEFAULT_FILTERS: Filters = {
    search: '',
    job_title: 'all',
    status: 'all',
};

function normalizeFilters(filters: Filters): Filters {
    return {
        search: filters.search ?? DEFAULT_FILTERS.search,
        job_title: filters.job_title || DEFAULT_FILTERS.job_title,
        status: filters.status || DEFAULT_FILTERS.status,
    };
}

function EmptyWorkforcesState({
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
                        ? 'No workforces match your filters'
                        : 'No workforces yet'}
                </p>
                <p className="text-sm text-muted-foreground">
                    {hasActiveFilters
                        ? 'Try clearing a filter or searching for a different employee.'
                        : 'Create a workforce record to start managing your employees.'}
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
                        New workforce
                    </Link>
                </Button>
            )}
        </div>
    );
}

const STATUS_OPTIONS = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
];

export default function WorkforcesIndex({
    workforces,
    jobTitles,
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
        filterState.job_title !== DEFAULT_FILTERS.job_title ||
        filterState.status !== DEFAULT_FILTERS.status;

    const resultSummary =
        workforces.from !== null && workforces.to !== null
            ? `Showing ${workforces.from}-${workforces.to} of ${workforces.total} workforces`
            : 'No workforces found';

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
            workforcesIndex.url({
                query: {
                    search: next.search || undefined,
                    job_title:
                        next.job_title !== 'all' ? next.job_title : undefined,
                    status: next.status !== 'all' ? next.status : undefined,
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

    function handleJobTitleChange(value: string): void {
        applyFilters({ job_title: value });
    }

    function handleStatusChange(value: string): void {
        applyFilters({ status: value });
    }

    function handleReset(): void {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        const next = { ...DEFAULT_FILTERS };
        filterStateRef.current = next;
        setFilterStateValue(next);

        router.get(
            workforcesIndex.url(),
            {},
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }

    return (
        <>
            <Head title="Workforces" />

            <div className="space-y-6 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <Heading
                        title="Workforces"
                        description="Manage the employees in your organization"
                    />

                    <Button asChild className="w-full sm:w-auto">
                        <Link href={create()}>
                            <Plus />
                            New Workforce
                        </Link>
                    </Button>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                    <div className="relative w-full sm:max-w-xs">
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={filterState.search}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            placeholder="Search by code, name, or email"
                            className="pl-9"
                        />
                    </div>

                    <Select
                        value={filterState.job_title}
                        onValueChange={handleJobTitleChange}
                    >
                        <SelectTrigger className="w-full sm:w-48">
                            <SelectValue placeholder="Job title" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All job titles</SelectItem>
                            {jobTitles.map((jt) => (
                                <SelectItem key={jt.id} value={String(jt.id)}>
                                    {jt.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

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
                                {workforces.data.length === 0 ? (
                                    <div className="p-8">
                                        <EmptyWorkforcesState
                                            hasActiveFilters={hasActiveFilters}
                                            onReset={handleReset}
                                        />
                                    </div>
                                ) : (
                                    workforces.data.map((workforce) => (
                                        <article
                                            key={workforce.id}
                                            className="space-y-4 p-4"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="min-w-0">
                                                    <Link
                                                        href={show(workforce)}
                                                        className="font-mono text-xs font-medium text-muted-foreground hover:text-primary hover:underline"
                                                    >
                                                        {
                                                            workforce.employee_code
                                                        }
                                                    </Link>
                                                    <Link
                                                        href={show(workforce)}
                                                        className="mt-1 block truncate font-medium hover:text-primary hover:underline"
                                                    >
                                                        {workforce.full_name}
                                                    </Link>
                                                </div>
                                                <StatusBadge
                                                    category="active"
                                                    value={workforce.status}
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div className="min-w-0 space-y-1">
                                                    <p className="text-muted-foreground">
                                                        Job title
                                                    </p>
                                                    <p className="truncate font-medium">
                                                        {
                                                            workforce.job_title
                                                                .name
                                                        }
                                                    </p>
                                                </div>
                                                <div className="min-w-0 space-y-1">
                                                    <p className="text-muted-foreground">
                                                        Email
                                                    </p>
                                                    <p className="truncate font-medium">
                                                        {workforce.email}
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
                                            <TableHead>Employee code</TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Job title</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {workforces.data.length === 0 && (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={5}
                                                    className="h-52"
                                                >
                                                    <EmptyWorkforcesState
                                                        hasActiveFilters={
                                                            hasActiveFilters
                                                        }
                                                        onReset={handleReset}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        )}

                                        {workforces.data.map((workforce) => (
                                            <TableRow
                                                key={workforce.id}
                                                className="hover:bg-muted/30"
                                            >
                                                <TableCell>
                                                    <Link
                                                        href={show(workforce)}
                                                        className="font-mono text-xs hover:text-primary hover:underline"
                                                    >
                                                        {
                                                            workforce.employee_code
                                                        }
                                                    </Link>
                                                </TableCell>
                                                <TableCell className="max-w-64">
                                                    <Link
                                                        href={show(workforce)}
                                                        className="block truncate font-medium hover:text-primary hover:underline"
                                                    >
                                                        {workforce.full_name}
                                                    </Link>
                                                </TableCell>
                                                <TableCell className="max-w-52 text-muted-foreground">
                                                    <span className="block truncate">
                                                        {
                                                            workforce.job_title
                                                                .name
                                                        }
                                                    </span>
                                                </TableCell>
                                                <TableCell className="max-w-64 text-muted-foreground">
                                                    <span className="block truncate">
                                                        {workforce.email}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <StatusBadge
                                                        category="active"
                                                        value={workforce.status}
                                                    />
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

                        {workforces.last_page > 1 && (
                            <nav className="flex flex-wrap items-center gap-1">
                                {workforces.links.map((link, index) => (
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

WorkforcesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Workforces',
            href: workforcesIndex(),
        },
    ],
};
