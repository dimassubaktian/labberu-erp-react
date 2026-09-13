import { Head, Link, router } from '@inertiajs/react';
import { ArrowDown, ArrowUp, Plus, Search, X } from 'lucide-react';
import * as React from 'react';
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
import { cn } from '@/lib/utils';
import { create, index as projectsIndex, show } from '@/routes/projects';
import type { Paginated } from '@/types';

type Project = {
    id: number;
    uuid: string;
    project_code: string;
    name: string;
    status: string;
    sales_status: string | null;
    po_status: string | null;
    billing_status: string | null;
    priority: string;
    request_date: string;
    customer: {
        id: number;
        name: string;
    };
    business_line: {
        id: number;
        name: string;
    } | null;
};

type BusinessLine = {
    id: number;
    name: string;
};

type Sort = 'asc' | 'desc';

type Filters = {
    search: string;
    status: string;
    priority: string;
    business_line: string;
    sort: Sort;
};

type Props = {
    projects: Paginated<Project>;
    businessLines: BusinessLine[];
    filters: Filters;
};

const STATUS_OPTIONS = [
    { value: 'new', label: 'New' },
    { value: 'planning', label: 'Planning' },
    { value: 'in_progress', label: 'In progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'voided', label: 'Voided' },
];

const PRIORITY_OPTIONS = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' },
];

const DEFAULT_FILTERS: Filters = {
    search: '',
    status: 'all',
    priority: 'all',
    business_line: 'all',
    sort: 'desc',
};

function normalizeFilters(filters: Filters): Filters {
    return {
        search: filters.search ?? DEFAULT_FILTERS.search,
        status: filters.status || DEFAULT_FILTERS.status,
        priority: filters.priority || DEFAULT_FILTERS.priority,
        business_line: filters.business_line || DEFAULT_FILTERS.business_line,
        sort: filters.sort || DEFAULT_FILTERS.sort,
    };
}

function formatProjectDate(value: string): string {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(new Date(value));
}

function EmptyProjectsState({
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
                        ? 'No projects match your filters'
                        : 'No projects yet'}
                </p>
                <p className="text-sm text-muted-foreground">
                    {hasActiveFilters
                        ? 'Try clearing a filter or searching for a different project.'
                        : 'Create a project to start tracking its workflow.'}
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
                        New project
                    </Link>
                </Button>
            )}
        </div>
    );
}

function WorkflowStatus({
    label,
    category,
    value,
}: {
    label: string;
    category: 'sales' | 'po' | 'billing';
    value: string | null;
}) {
    if (!value) {
        return null;
    }

    return (
        <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">{label}</span>
            <ProjectBadge category={category} value={value} />
        </div>
    );
}

function ProjectWorkflow({ project }: { project: Project }) {
    if (
        !project.sales_status &&
        !project.po_status &&
        !project.billing_status
    ) {
        return null;
    }

    return (
        <div className="space-y-2 border-t border-border/50 pt-3">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Workflow
            </p>
            <div className="grid gap-2 sm:grid-cols-3 sm:gap-4">
                <WorkflowStatus
                    label="Sales"
                    category="sales"
                    value={project.sales_status}
                />
                <WorkflowStatus
                    label="PO"
                    category="po"
                    value={project.po_status}
                />
                <WorkflowStatus
                    label="Billing"
                    category="billing"
                    value={project.billing_status}
                />
            </div>
        </div>
    );
}

export default function ProjectsIndex({
    projects,
    businessLines,
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
        filterState.priority !== DEFAULT_FILTERS.priority ||
        filterState.business_line !== DEFAULT_FILTERS.business_line ||
        filterState.sort !== DEFAULT_FILTERS.sort;

    const resultSummary =
        projects.from !== null && projects.to !== null
            ? `Showing ${projects.from}-${projects.to} of ${projects.total} projects`
            : 'No projects found';

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
            projectsIndex.url({
                query: {
                    search: next.search || undefined,
                    status: next.status !== 'all' ? next.status : undefined,
                    priority:
                        next.priority !== 'all' ? next.priority : undefined,
                    business_line:
                        next.business_line !== 'all'
                            ? next.business_line
                            : undefined,
                    sort: next.sort !== 'desc' ? next.sort : undefined,
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

    function handlePriorityChange(value: string): void {
        applyFilters({ priority: value });
    }

    function handleBusinessLineChange(value: string): void {
        applyFilters({ business_line: value });
    }

    function handleSortToggle(): void {
        const next: Sort = filterState.sort === 'desc' ? 'asc' : 'desc';
        applyFilters({ sort: next });
    }

    function handleReset(): void {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        const next = { ...DEFAULT_FILTERS };
        filterStateRef.current = next;
        setFilterStateValue(next);

        router.get(
            projectsIndex.url(),
            {},
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }

    return (
        <>
            <Head title="Projects" />

            <div className="space-y-6 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <Heading
                        title="Projects"
                        description="Manage your organization's projects"
                    />

                    <Button asChild className="w-full sm:w-auto">
                        <Link href={create()}>
                            <Plus />
                            New Project
                        </Link>
                    </Button>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                    <div className="relative w-full sm:max-w-md">
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={filterState.search}
                            onChange={(event) =>
                                handleSearchChange(event.target.value)
                            }
                            placeholder="Search code, name, customer, or business line"
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
                        value={filterState.priority}
                        onValueChange={handlePriorityChange}
                    >
                        <SelectTrigger className="w-full sm:w-44">
                            <SelectValue placeholder="Priority" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All priorities</SelectItem>
                            {PRIORITY_OPTIONS.map((option) => (
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
                        value={filterState.business_line}
                        onValueChange={handleBusinessLineChange}
                    >
                        <SelectTrigger className="w-full sm:w-52">
                            <SelectValue placeholder="Business line" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">
                                All business lines
                            </SelectItem>
                            {businessLines.map((businessLine) => (
                                <SelectItem
                                    key={businessLine.id}
                                    value={String(businessLine.id)}
                                >
                                    {businessLine.name}
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
                                {projects.data.length === 0 ? (
                                    <div className="p-8">
                                        <EmptyProjectsState
                                            hasActiveFilters={hasActiveFilters}
                                            onReset={handleReset}
                                        />
                                    </div>
                                ) : (
                                    projects.data.map((project) => (
                                        <article
                                            key={project.id}
                                            className="space-y-4 p-4"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="min-w-0">
                                                    <Link
                                                        href={show(project)}
                                                        className="font-mono text-xs font-medium text-muted-foreground hover:text-primary hover:underline"
                                                    >
                                                        {project.project_code}
                                                    </Link>
                                                    <Link
                                                        href={show(project)}
                                                        className="mt-1 block truncate font-medium hover:text-primary hover:underline"
                                                    >
                                                        {project.name}
                                                    </Link>
                                                </div>
                                                <ProjectBadge
                                                    category="status"
                                                    value={project.status}
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div className="min-w-0 space-y-1">
                                                    <p className="text-muted-foreground">
                                                        Customer
                                                    </p>
                                                    <p className="truncate font-medium">
                                                        {project.customer.name}
                                                    </p>
                                                </div>
                                                <div className="min-w-0 space-y-1">
                                                    <p className="text-muted-foreground">
                                                        Business line
                                                    </p>
                                                    <p className="truncate font-medium">
                                                        {project.business_line
                                                            ?.name ??
                                                            'Not assigned'}
                                                    </p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-muted-foreground">
                                                        Priority
                                                    </p>
                                                    <ProjectBadge
                                                        category="priority"
                                                        value={project.priority}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-muted-foreground">
                                                        Requested
                                                    </p>
                                                    <p className="font-medium">
                                                        {formatProjectDate(
                                                            project.request_date,
                                                        )}
                                                    </p>
                                                </div>
                                            </div>

                                            <ProjectWorkflow
                                                project={project}
                                            />
                                        </article>
                                    ))
                                )}
                            </div>
                        ) : (
                            <div>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Project code</TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Customer</TableHead>
                                            <TableHead>Business line</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Sales</TableHead>
                                            <TableHead>PO</TableHead>
                                            <TableHead>Billing</TableHead>
                                            <TableHead>Priority</TableHead>
                                            <TableHead>
                                                <button
                                                    type="button"
                                                    onClick={handleSortToggle}
                                                    className="inline-flex items-center gap-1 hover:text-foreground"
                                                >
                                                    Request date
                                                    {filterState.sort ===
                                                    'desc' ? (
                                                        <ArrowDown className="size-3.5" />
                                                    ) : (
                                                        <ArrowUp className="size-3.5" />
                                                    )}
                                                </button>
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {projects.data.length === 0 && (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={10}
                                                    className="h-52"
                                                >
                                                    <EmptyProjectsState
                                                        hasActiveFilters={
                                                            hasActiveFilters
                                                        }
                                                        onReset={handleReset}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        )}

                                        {projects.data.map((project) => (
                                            <TableRow
                                                key={project.id}
                                                className="hover:bg-muted/30"
                                            >
                                                <TableCell className="font-medium">
                                                    <Link
                                                        href={show(project)}
                                                        className="font-mono text-xs hover:text-primary hover:underline"
                                                    >
                                                        {project.project_code}
                                                    </Link>
                                                </TableCell>
                                                <TableCell className="max-w-72">
                                                    <Link
                                                        href={show(project)}
                                                        className="block truncate font-medium hover:text-primary hover:underline"
                                                    >
                                                        {project.name}
                                                    </Link>
                                                </TableCell>
                                                <TableCell className="max-w-56 text-muted-foreground">
                                                    <span className="block truncate">
                                                        {project.customer.name}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="max-w-48 text-muted-foreground">
                                                    <span className="block truncate">
                                                        {project.business_line
                                                            ?.name ??
                                                            'Not assigned'}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <ProjectBadge
                                                        category="status"
                                                        value={project.status}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    {project.sales_status ? (
                                                        <ProjectBadge
                                                            category="sales"
                                                            value={
                                                                project.sales_status
                                                            }
                                                        />
                                                    ) : (
                                                        <span className="text-muted-foreground">
                                                            Not started
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {project.po_status ? (
                                                        <ProjectBadge
                                                            category="po"
                                                            value={
                                                                project.po_status
                                                            }
                                                        />
                                                    ) : (
                                                        <span className="text-muted-foreground">
                                                            Not started
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {project.billing_status ? (
                                                        <ProjectBadge
                                                            category="billing"
                                                            value={
                                                                project.billing_status
                                                            }
                                                        />
                                                    ) : (
                                                        <span className="text-muted-foreground">
                                                            Not started
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <ProjectBadge
                                                        category="priority"
                                                        value={project.priority}
                                                    />
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {formatProjectDate(
                                                        project.request_date,
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

                        {projects.last_page > 1 && (
                            <nav className="flex flex-wrap items-center gap-1">
                                {projects.links.map((link, index) => (
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

ProjectsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Projects',
            href: projectsIndex(),
        },
    ],
};
