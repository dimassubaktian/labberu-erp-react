import { Head, Link, router } from '@inertiajs/react';
import { ArrowDown, ArrowUp, Plus, Search, X } from 'lucide-react';
import * as React from 'react';
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
};

type Sort = 'asc' | 'desc';

type Filters = {
    search: string;
    status: string;
    priority: string;
    sort: Sort;
};

type Props = {
    projects: Paginated<Project>;
    filters: Filters;
};

const STATUS_OPTIONS = [
    { value: 'new', label: 'New' },
    { value: 'planning', label: 'Planning' },
    { value: 'in_progress', label: 'In progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
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
    sort: 'desc',
};

export default function ProjectsIndex({ projects, filters }: Props) {
    const [search, setSearch] = React.useState(filters.search);
    const [status, setStatus] = React.useState(filters.status || 'all');
    const [priority, setPriority] = React.useState(filters.priority || 'all');
    const [sort, setSort] = React.useState<Sort>(filters.sort);
    const debounceRef = React.useRef<ReturnType<typeof setTimeout>>(undefined);

    const hasActiveFilters =
        search !== DEFAULT_FILTERS.search ||
        status !== DEFAULT_FILTERS.status ||
        priority !== DEFAULT_FILTERS.priority ||
        sort !== DEFAULT_FILTERS.sort;

    function applyFilters(overrides: Partial<Filters>): void {
        const next = { search, status, priority, sort, ...overrides };

        router.get(
            projectsIndex.url({
                query: {
                    search: next.search || undefined,
                    status: next.status !== 'all' ? next.status : undefined,
                    priority:
                        next.priority !== 'all' ? next.priority : undefined,
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

    function handlePriorityChange(value: string): void {
        setPriority(value);
        applyFilters({ priority: value });
    }

    function handleSortToggle(): void {
        const next: Sort = sort === 'desc' ? 'asc' : 'desc';
        setSort(next);
        applyFilters({ sort: next });
    }

    function handleReset(): void {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        setSearch(DEFAULT_FILTERS.search);
        setStatus(DEFAULT_FILTERS.status);
        setPriority(DEFAULT_FILTERS.priority);
        setSort(DEFAULT_FILTERS.sort);

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
                    <div className="relative w-full sm:max-w-xs">
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(event) =>
                                handleSearchChange(event.target.value)
                            }
                            placeholder="Search by code or name"
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

                    <Select
                        value={priority}
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
                                <TableHead>Project code</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Customer</TableHead>
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
                                        {sort === 'desc' ? (
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
                                        colSpan={9}
                                        className="h-24 text-center text-muted-foreground"
                                    >
                                        No projects found.
                                    </TableCell>
                                </TableRow>
                            )}

                            {projects.data.map((project) => (
                                <TableRow key={project.id}>
                                    <TableCell className="font-medium">
                                        <Link href={show(project)}>
                                            {project.project_code}
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        <Link href={show(project)}>
                                            {project.name}
                                        </Link>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {project.customer.name}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="secondary"
                                            className="capitalize"
                                        >
                                            {project.status.replace('_', ' ')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {project.sales_status ? (
                                            <Badge
                                                variant="secondary"
                                                className="capitalize"
                                            >
                                                {project.sales_status.replaceAll(
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
                                    <TableCell>
                                        {project.po_status ? (
                                            <Badge
                                                variant="secondary"
                                                className="capitalize"
                                            >
                                                {project.po_status.replaceAll(
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
                                    <TableCell>
                                        {project.billing_status ? (
                                            <Badge
                                                variant="secondary"
                                                className="capitalize"
                                            >
                                                {project.billing_status.replaceAll(
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
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className="capitalize"
                                        >
                                            {project.priority}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {formatDate(project.request_date)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
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
