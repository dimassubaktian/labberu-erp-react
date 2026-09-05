import { Head, Link, router } from '@inertiajs/react';
import { MapPin, Plus, Search, SlidersHorizontal, X } from 'lucide-react';
import React from 'react';
import { StatusBadge } from '@/components/project-badge';
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
import {
    create,
    index as equipmentLocationsIndex,
    show,
} from '@/routes/equipment-locations';
import type { Paginated } from '@/types';

type EquipmentLocation = {
    id: number;
    uuid: string;
    name: string;
    code: string | null;
    description: string | null;
    is_active: boolean;
};

type Filters = {
    search: string;
    status: string;
};

type Props = {
    locations: Paginated<EquipmentLocation>;
    filters: Filters;
};

const DEFAULT_FILTERS: Filters = { search: '', status: 'all' };

const STATUS_OPTIONS = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
];

export default function EquipmentLocationsIndex({ locations, filters }: Props) {
    const [search, setSearch] = React.useState(filters.search);
    const [status, setStatus] = React.useState(filters.status || 'all');
    const debounceRef = React.useRef<ReturnType<typeof setTimeout>>(undefined);

    const hasActiveFilters =
        search !== DEFAULT_FILTERS.search || status !== DEFAULT_FILTERS.status;
    const resultSummary =
        locations.from && locations.to
            ? `Showing ${locations.from}–${locations.to} of ${locations.total}`
            : 'No locations found';

    function applyFilters(overrides: Partial<Filters>): void {
        const next = { search, status, ...overrides };

        router.get(
            equipmentLocationsIndex.url({
                query: {
                    search: next.search || undefined,
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

    function handleStatusChange(value: string): void {
        setStatus(value);
        applyFilters({ status: value });
    }

    function handleReset(): void {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        setSearch(DEFAULT_FILTERS.search);
        setStatus(DEFAULT_FILTERS.status);

        router.get(
            equipmentLocationsIndex.url(),
            {},
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }

    return (
        <>
            <Head title="Equipment Locations" />

            <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6">
                <section className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
                    <div className="flex flex-col gap-5 bg-linear-to-br from-primary/[0.08] via-card to-card p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-start gap-4">
                            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:size-14">
                                <MapPin className="size-6 sm:size-7" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">
                                    Asset storage
                                </p>
                                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                                    Equipment locations
                                </h1>
                                <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                                    Define the physical locations used to store
                                    and track your equipment.
                                </p>
                            </div>
                        </div>
                        <Button asChild className="w-full sm:w-auto">
                            <Link href={create()}>
                                <Plus />
                                New location
                            </Link>
                        </Button>
                    </div>

                    <div className="grid divide-y divide-border/60 border-t border-border/60 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                        <div className="space-y-1 p-4 sm:p-5">
                            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                Location records
                            </p>
                            <p className="text-lg font-semibold">
                                {locations.total}
                            </p>
                        </div>
                        <div className="space-y-1 p-4 sm:p-5">
                            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                Current page
                            </p>
                            <p className="text-lg font-semibold">
                                {locations.current_page} of{' '}
                                {locations.last_page}
                            </p>
                        </div>
                        <div className="space-y-1 p-4 sm:p-5">
                            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                Applied filters
                            </p>
                            <p className="text-lg font-semibold">
                                {hasActiveFilters ? 'Active' : 'None'}
                            </p>
                        </div>
                    </div>
                </section>

                <Card>
                    <CardHeader className="gap-5 border-b border-border/60 pb-5 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <CardTitle>Find locations</CardTitle>
                            <CardDescription>
                                Search the storage register or filter by the
                                location’s current status.
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
                        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                            <div className="relative w-full sm:max-w-md">
                                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    value={search}
                                    onChange={(e) =>
                                        handleSearchChange(e.target.value)
                                    }
                                    placeholder="Search by code or name"
                                    className="pl-9"
                                />
                            </div>

                            <Select
                                value={status}
                                onValueChange={handleStatusChange}
                            >
                                <SelectTrigger className="w-full sm:w-36">
                                    <SlidersHorizontal className="size-4 text-muted-foreground" />
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        All statuses
                                    </SelectItem>
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
                        </div>
                    </CardContent>
                </Card>

                <Card className="overflow-hidden">
                    <CardHeader className="border-b border-border/60 pb-5">
                        <CardTitle>Storage register</CardTitle>
                        <CardDescription>
                            Browse the available storage locations and their
                            operational state.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-muted/40">
                                <TableRow>
                                    <TableHead className="pl-5">
                                        Location
                                    </TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {locations.data.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-64">
                                            <div className="flex flex-col items-center justify-center gap-3 text-center">
                                                <div className="rounded-xl bg-muted p-3 text-muted-foreground">
                                                    <MapPin className="size-6" />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="font-medium">
                                                        No locations found
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        Try clearing a filter or
                                                        add a storage location
                                                        to get started.
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}

                                {locations.data.map((location) => (
                                    <TableRow
                                        key={location.id}
                                        className="hover:bg-muted/30"
                                    >
                                        <TableCell className="pl-5 align-top font-medium">
                                            <Link
                                                href={show(location)}
                                                className="hover:text-primary hover:underline"
                                            >
                                                {location.code ?? (
                                                    <span className="text-muted-foreground">
                                                        &mdash;
                                                    </span>
                                                )}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="min-w-52 align-top">
                                            <Link
                                                href={show(location)}
                                                className="font-medium hover:text-primary hover:underline"
                                            >
                                                {location.name}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="max-w-md align-top text-muted-foreground">
                                            {location.description ?? (
                                                <span className="text-muted-foreground">
                                                    &mdash;
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="pr-5 align-top">
                                            <StatusBadge
                                                category="active"
                                                value={
                                                    location.is_active
                                                        ? 'active'
                                                        : 'inactive'
                                                }
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>

                    {locations.last_page > 1 && (
                        <div className="flex flex-col gap-3 border-t border-border/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-muted-foreground">
                                {resultSummary}
                            </p>
                            <nav className="flex flex-wrap items-center gap-1">
                                {locations.links.map((link, index) => (
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

EquipmentLocationsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Equipment Locations',
            href: equipmentLocationsIndex(),
        },
    ],
};
