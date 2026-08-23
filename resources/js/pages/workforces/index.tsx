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

const STATUS_OPTIONS = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
];

export default function WorkforcesIndex({
    workforces,
    jobTitles,
    filters,
}: Props) {
    const [search, setSearch] = React.useState(filters.search);
    const [jobTitle, setJobTitle] = React.useState(filters.job_title || 'all');
    const [status, setStatus] = React.useState(filters.status || 'all');
    const debounceRef = React.useRef<ReturnType<typeof setTimeout>>(undefined);

    const hasActiveFilters =
        search !== DEFAULT_FILTERS.search ||
        jobTitle !== DEFAULT_FILTERS.job_title ||
        status !== DEFAULT_FILTERS.status;

    function applyFilters(overrides: Partial<Filters>): void {
        const next = { search, job_title: jobTitle, status, ...overrides };

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
        setSearch(value);

        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => {
            applyFilters({ search: value });
        }, 400);
    }

    function handleJobTitleChange(value: string): void {
        setJobTitle(value);
        applyFilters({ job_title: value });
    }

    function handleStatusChange(value: string): void {
        setStatus(value);
        applyFilters({ status: value });
    }

    function handleReset(): void {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        setSearch(DEFAULT_FILTERS.search);
        setJobTitle(DEFAULT_FILTERS.job_title);
        setStatus(DEFAULT_FILTERS.status);

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
                            value={search}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            placeholder="Search by code, name, or email"
                            className="pl-9"
                        />
                    </div>

                    <Select
                        value={jobTitle}
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

                    <Select value={status} onValueChange={handleStatusChange}>
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
                                        className="h-24 text-center text-muted-foreground"
                                    >
                                        No workforces found.
                                    </TableCell>
                                </TableRow>
                            )}

                            {workforces.data.map((workforce) => (
                                <TableRow key={workforce.id}>
                                    <TableCell>
                                        <Link href={show(workforce)}>
                                            {workforce.employee_code}
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        <Link href={show(workforce)}>
                                            {workforce.full_name}
                                        </Link>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {workforce.job_title.name}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {workforce.email}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={
                                                workforce.status === 'active'
                                                    ? 'secondary'
                                                    : 'outline'
                                            }
                                            className="capitalize"
                                        >
                                            {workforce.status}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
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
