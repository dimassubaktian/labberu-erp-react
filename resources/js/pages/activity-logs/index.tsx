import { Head, Link, router } from '@inertiajs/react';
import { CalendarDays, ScrollText, Search, ShieldCheck, X } from 'lucide-react';
import React from 'react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn, formatDateTime, formatNumber } from '@/lib/utils';
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
    const resultSummary =
        activityLogs.from && activityLogs.to
            ? `Showing ${activityLogs.from}-${activityLogs.to} of ${activityLogs.total}`
            : 'No recorded activity';

    React.useEffect(() => {
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, []);

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

            <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6">
                <section className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
                    <div className="flex flex-col gap-5 bg-linear-to-br from-primary/[0.08] via-card to-card p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-start gap-4">
                            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:size-14">
                                <ScrollText className="size-6 sm:size-7" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">
                                    Audit trail
                                </p>
                                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                                    Activity log
                                </h1>
                                <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                                    Review automatically recorded financial and
                                    approval activity across your workspace.
                                </p>
                            </div>
                        </div>
                        <div className="rounded-xl border border-border/60 bg-card/80 px-4 py-3 shadow-sm">
                            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                Current result set
                            </p>
                            <p className="mt-1 font-semibold">
                                {resultSummary}
                            </p>
                        </div>
                    </div>

                    <div className="grid divide-y divide-border/60 border-t border-border/60 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                        <div className="space-y-1 p-4 sm:p-5">
                            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                Recorded entries
                            </p>
                            <p className="text-lg font-semibold">
                                {formatNumber(activityLogs.total)}
                            </p>
                        </div>
                        <div className="space-y-1 p-4 sm:p-5">
                            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                Current page
                            </p>
                            <p className="text-lg font-semibold">
                                {activityLogs.current_page} of{' '}
                                {activityLogs.last_page}
                            </p>
                        </div>
                        <div className="space-y-1 p-4 sm:p-5">
                            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                Search filter
                            </p>
                            <p className="text-lg font-semibold">
                                {hasActiveFilters ? 'Active' : 'All activity'}
                            </p>
                        </div>
                    </div>
                </section>

                <Card>
                    <CardHeader className="gap-5 border-b border-border/60 pb-5 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <CardTitle>Find activity</CardTitle>
                            <CardDescription>
                                Search actions, descriptions, and the team
                                members who initiated them.
                            </CardDescription>
                        </div>
                        {hasActiveFilters && (
                            <Button
                                variant="ghost"
                                onClick={handleReset}
                                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                            >
                                <X />
                                Reset filters
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="relative w-full sm:max-w-md">
                            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={(e) =>
                                    handleSearchChange(e.target.value)
                                }
                                placeholder="Search action, description, or user"
                                className="pl-9"
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="overflow-hidden">
                    <CardHeader className="border-b border-border/60 pb-5">
                        <CardTitle>Recorded activity</CardTitle>
                        <CardDescription>
                            Each entry shows what changed, who initiated it, and
                            when it was captured.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-muted/40">
                                <TableRow>
                                    <TableHead className="pl-5">Date</TableHead>
                                    <TableHead>User</TableHead>
                                    <TableHead>Action</TableHead>
                                    <TableHead className="pr-5">
                                        Description
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {activityLogs.data.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-64">
                                            <div className="flex flex-col items-center justify-center gap-3 text-center">
                                                <div className="rounded-xl bg-muted p-3 text-muted-foreground">
                                                    <ShieldCheck className="size-6" />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="font-medium">
                                                        No activity found
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        Try clearing the search,
                                                        or check again after an
                                                        activity is recorded.
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}

                                {activityLogs.data.map((log) => (
                                    <TableRow
                                        key={log.id}
                                        className="hover:bg-muted/30"
                                    >
                                        <TableCell className="pl-5 align-top text-muted-foreground">
                                            <div className="flex items-center gap-2 whitespace-nowrap">
                                                <CalendarDays className="size-4" />
                                                {formatDateTime(log.created_at)}
                                            </div>
                                        </TableCell>
                                        <TableCell className="min-w-40 align-top font-medium">
                                            {log.causer?.name ?? (
                                                <span className="font-normal text-muted-foreground">
                                                    System
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="min-w-40 align-top">
                                            <span className="inline-flex rounded-md bg-primary/10 px-2.5 py-1 text-sm font-medium text-primary">
                                                {log.action}
                                            </span>
                                        </TableCell>
                                        <TableCell className="min-w-72 pr-5 align-top text-muted-foreground">
                                            {log.description}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>

                    {activityLogs.last_page > 1 && (
                        <div className="flex flex-col gap-3 border-t border-border/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-muted-foreground">
                                {resultSummary}
                            </p>
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
                        </div>
                    )}
                </Card>
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
