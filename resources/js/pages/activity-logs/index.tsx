import { Head, Link, router } from '@inertiajs/react';
import { Search, X } from 'lucide-react';
import React from 'react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn, formatDateTime } from '@/lib/utils';
import { index as activityLogsIndex } from '@/routes/activity-logs';
import type { Paginated } from '@/types';

type ActivityLog = {
    id: number;
    action: string;
    description: string;
    created_at: string;
    causer: { id: number; name: string } | null;
};

type Filters = {
    search: string;
};

type Props = {
    activityLogs: Paginated<ActivityLog>;
    filters: Filters;
};

const DEFAULT_FILTERS: Filters = { search: '' };

export default function ActivityLogsIndex({ activityLogs, filters }: Props) {
    const [search, setSearch] = React.useState(filters.search);
    const debounceRef = React.useRef<ReturnType<typeof setTimeout>>(undefined);

    const hasActiveFilters = search !== DEFAULT_FILTERS.search;

    function applyFilters(next: string): void {
        router.get(
            activityLogsIndex.url({
                query: { search: next || undefined },
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

        debounceRef.current = setTimeout(() => applyFilters(value), 400);
    }

    function handleReset(): void {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        setSearch(DEFAULT_FILTERS.search);
        applyFilters('');
    }

    return (
        <>
            <Head title="Activity Log" />

            <div className="space-y-6 p-4">
                <Heading
                    title="Activity Log"
                    description="An audit trail of financial and approval actions, recorded automatically as they happen"
                />

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                    <div className="relative w-full sm:max-w-xs">
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            placeholder="Search by action, description, or user"
                            className="pl-9"
                        />
                    </div>

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
                                <TableHead>Date</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead>Action</TableHead>
                                <TableHead>Description</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {activityLogs.data.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={4}
                                        className="h-24 text-center text-muted-foreground"
                                    >
                                        No activity recorded yet.
                                    </TableCell>
                                </TableRow>
                            )}

                            {activityLogs.data.map((log) => (
                                <TableRow key={log.id}>
                                    <TableCell className="text-muted-foreground">
                                        {formatDateTime(log.created_at)}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {log.causer?.name ?? (
                                            <span className="text-muted-foreground">
                                                &mdash;
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {log.action}
                                    </TableCell>
                                    <TableCell>{log.description}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {activityLogs.last_page > 1 && (
                    <nav className="flex flex-wrap items-center gap-1">
                        {activityLogs.links.map((link, index) => (
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

ActivityLogsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Activity Log',
            href: activityLogsIndex(),
        },
    ],
};
