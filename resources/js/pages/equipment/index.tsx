import { Head, Link, router } from '@inertiajs/react';
import {
    AlertTriangle,
    Clock,
    PackageX,
    Plus,
    Search,
    SlidersHorizontal,
    Wrench,
    X,
} from 'lucide-react';
import React from 'react';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { PrintDocumentDialog } from '@/components/print-document-dialog';
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
import { cn, formatDate } from '@/lib/utils';
import {
    create,
    index as equipmentIndex,
    print,
    show,
} from '@/routes/equipment';
import type { Paginated } from '@/types';

type Equipment = {
    id: number;
    uuid: string;
    equipment_code: string;
    name: string;
    category: string | null;
    brand: string | null;
    serial_number: string | null;
    status: string;
    next_calibration_due_date: string | null;
    current_project: { id: number; uuid: string; name: string } | null;
    current_custodian: { id: number; full_name: string } | null;
    open_assignment: { expected_return_at: string | null } | null;
};

type Filters = {
    search: string;
    category: string;
    status: string;
    calibration: string;
    return_status: string;
};

type Props = {
    equipment: Paginated<Equipment>;
    filters: Filters;
    calibrationCounts: { overdue: number; due_soon: number };
    overdueReturnCount: number;
};

const DEFAULT_FILTERS: Filters = {
    search: '',
    category: 'all',
    status: 'all',
    calibration: 'all',
    return_status: 'all',
};

const CATEGORY_OPTIONS = [
    'Multimeter',
    'Clamp Meter',
    'Insulation Tester',
    'Earth Resistance Tester',
    'Power Quality Analyzer',
    'Oscilloscope',
    'Torque Wrench',
    'Pressure Gauge',
    'Thermometer',
    'Caliper',
    'Other',
];

const STATUS_OPTIONS = [
    { value: 'available', label: 'Available' },
    { value: 'in_use', label: 'In use' },
    { value: 'in_calibration', label: 'In calibration' },
    { value: 'under_maintenance', label: 'Under maintenance' },
    { value: 'retired', label: 'Retired' },
    { value: 'lost', label: 'Lost' },
    { value: 'damaged', label: 'Damaged' },
];

function printQuery(filters: Filters): Record<string, string> {
    const query: Record<string, string> = {};

    if (filters.search) {
        query.search = filters.search;
    }

    if (filters.category !== 'all') {
        query.category = filters.category;
    }

    if (filters.status !== 'all') {
        query.status = filters.status;
    }

    if (filters.calibration !== 'all') {
        query.calibration = filters.calibration;
    }

    if (filters.return_status !== 'all') {
        query.return_status = filters.return_status;
    }

    return query;
}

export default function EquipmentIndex({
    equipment,
    filters,
    calibrationCounts,
    overdueReturnCount,
}: Props) {
    const [search, setSearch] = React.useState(filters.search);
    const [category, setCategory] = React.useState(filters.category || 'all');
    const [status, setStatus] = React.useState(filters.status || 'all');
    const [calibration, setCalibration] = React.useState(
        filters.calibration || 'all',
    );
    const [returnStatus, setReturnStatus] = React.useState(
        filters.return_status || 'all',
    );
    const debounceRef = React.useRef<ReturnType<typeof setTimeout>>(undefined);

    const hasActiveFilters =
        search !== DEFAULT_FILTERS.search ||
        category !== DEFAULT_FILTERS.category ||
        status !== DEFAULT_FILTERS.status ||
        calibration !== DEFAULT_FILTERS.calibration ||
        returnStatus !== DEFAULT_FILTERS.return_status;
    const resultSummary =
        equipment.from && equipment.to
            ? `Showing ${equipment.from}–${equipment.to} of ${equipment.total}`
            : 'No equipment found';

    function applyFilters(overrides: Partial<Filters>): void {
        const next = {
            search,
            category,
            status,
            calibration,
            return_status: returnStatus,
            ...overrides,
        };

        router.get(
            equipmentIndex.url({
                query: {
                    search: next.search || undefined,
                    category:
                        next.category !== 'all' ? next.category : undefined,
                    status: next.status !== 'all' ? next.status : undefined,
                    calibration:
                        next.calibration !== 'all'
                            ? next.calibration
                            : undefined,
                    return_status:
                        next.return_status !== 'all'
                            ? next.return_status
                            : undefined,
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

    function handleCategoryChange(value: string): void {
        setCategory(value);
        applyFilters({ category: value });
    }

    function handleStatusChange(value: string): void {
        setStatus(value);
        applyFilters({ status: value });
    }

    function toggleCalibrationFilter(value: string): void {
        const next = calibration === value ? 'all' : value;
        setCalibration(next);
        applyFilters({ calibration: next });
    }

    function toggleReturnFilter(value: string): void {
        const next = returnStatus === value ? 'all' : value;
        setReturnStatus(next);
        applyFilters({ return_status: next });
    }

    function handleReset(): void {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        setSearch(DEFAULT_FILTERS.search);
        setCategory(DEFAULT_FILTERS.category);
        setStatus(DEFAULT_FILTERS.status);
        setCalibration(DEFAULT_FILTERS.calibration);
        setReturnStatus(DEFAULT_FILTERS.return_status);

        router.get(
            equipmentIndex.url(),
            {},
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }

    return (
        <>
            <Head title="Equipment" />

            <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6">
                <section className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
                    <div className="flex flex-col gap-5 bg-linear-to-br from-primary/[0.08] via-card to-card p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-start gap-4">
                            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:size-14">
                                <Wrench className="size-6 sm:size-7" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">
                                    Asset management
                                </p>
                                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                                    Equipment
                                </h1>
                                <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                                    Track equipment availability, assignment,
                                    calibration, and return obligations in one
                                    place.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row lg:shrink-0">
                            <PrintDocumentDialog
                                title="Print equipment list"
                                description="Preview or download the equipment list as a PDF, using your current filters."
                                previewUrl={print.url({
                                    query: printQuery(filters),
                                })}
                                downloadUrl={print.url({
                                    query: {
                                        ...printQuery(filters),
                                        download: 'true',
                                    },
                                })}
                            />

                            <Button asChild className="w-full sm:w-auto">
                                <Link href={create()}>
                                    <Plus />
                                    New Equipment
                                </Link>
                            </Button>
                        </div>
                    </div>

                    <div className="grid divide-y divide-border/60 border-t border-border/60 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                        <div className="space-y-1 p-4 sm:p-5">
                            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                Equipment records
                            </p>
                            <p className="text-lg font-semibold">
                                {equipment.total}
                            </p>
                        </div>
                        <div className="space-y-1 p-4 sm:p-5">
                            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                Current page
                            </p>
                            <p className="text-lg font-semibold">
                                {equipment.current_page} of{' '}
                                {equipment.last_page}
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

                <div className="grid gap-4 sm:grid-cols-3">
                    <button
                        type="button"
                        onClick={() => toggleCalibrationFilter('overdue')}
                        className={cn(
                            'text-left transition-opacity',
                            calibration !== 'all' &&
                                calibration !== 'overdue' &&
                                'opacity-50',
                        )}
                    >
                        <KpiCard
                            label="Calibration Overdue"
                            value={calibrationCounts.overdue}
                            icon={AlertTriangle}
                            highlight={
                                calibrationCounts.overdue > 0
                                    ? 'danger'
                                    : undefined
                            }
                            compact
                        />
                    </button>

                    <button
                        type="button"
                        onClick={() => toggleCalibrationFilter('due_soon')}
                        className={cn(
                            'text-left transition-opacity',
                            calibration !== 'all' &&
                                calibration !== 'due_soon' &&
                                'opacity-50',
                        )}
                    >
                        <KpiCard
                            label="Due Within 30 Days"
                            value={calibrationCounts.due_soon}
                            icon={Clock}
                            highlight={
                                calibrationCounts.due_soon > 0
                                    ? 'warning'
                                    : undefined
                            }
                            compact
                        />
                    </button>

                    <button
                        type="button"
                        onClick={() => toggleReturnFilter('overdue')}
                        className={cn(
                            'text-left transition-opacity',
                            returnStatus !== 'all' &&
                                returnStatus !== 'overdue' &&
                                'opacity-50',
                        )}
                    >
                        <KpiCard
                            label="Return Overdue"
                            value={overdueReturnCount}
                            icon={PackageX}
                            highlight={
                                overdueReturnCount > 0 ? 'danger' : undefined
                            }
                            compact
                        />
                    </button>
                </div>

                <Card>
                    <CardHeader className="gap-5 border-b border-border/60 pb-5 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <CardTitle>Find equipment</CardTitle>
                            <CardDescription>
                                Search the equipment register or narrow it by
                                category and current operational status.
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
                                    placeholder="Search by code, name, serial, or brand"
                                    className="pl-9"
                                />
                            </div>

                            <Select
                                value={category}
                                onValueChange={handleCategoryChange}
                            >
                                <SelectTrigger className="w-full sm:w-48">
                                    <SlidersHorizontal className="size-4 text-muted-foreground" />
                                    <SelectValue placeholder="Category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        All categories
                                    </SelectItem>
                                    {CATEGORY_OPTIONS.map((option) => (
                                        <SelectItem key={option} value={option}>
                                            {option}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select
                                value={status}
                                onValueChange={handleStatusChange}
                            >
                                <SelectTrigger className="w-full sm:w-44">
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
                        <CardTitle>Equipment register</CardTitle>
                        <CardDescription>
                            Review the present location, assigned custody,
                            planned return, and calibration status for each
                            asset.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-muted/40">
                                <TableRow>
                                    <TableHead className="pl-5">
                                        Equipment
                                    </TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Serial number</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Currently at</TableHead>
                                    <TableHead>Expected return</TableHead>
                                    <TableHead>Calibration due</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {equipment.data.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={8} className="h-64">
                                            <div className="flex flex-col items-center justify-center gap-3 text-center">
                                                <div className="rounded-xl bg-muted p-3 text-muted-foreground">
                                                    <Wrench className="size-6" />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="font-medium">
                                                        No equipment found
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        Try clearing a filter or
                                                        add an asset to begin
                                                        building your equipment
                                                        register.
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}

                                {equipment.data.map((item) => {
                                    const today = new Date(
                                        new Date().toDateString(),
                                    );
                                    const isOverdue =
                                        item.next_calibration_due_date !==
                                            null &&
                                        new Date(
                                            item.next_calibration_due_date,
                                        ) < today;
                                    const expectedReturnAt =
                                        item.open_assignment
                                            ?.expected_return_at ?? null;
                                    const isReturnOverdue =
                                        expectedReturnAt !== null &&
                                        new Date(expectedReturnAt) < today;

                                    return (
                                        <TableRow
                                            key={item.id}
                                            className="hover:bg-muted/30"
                                        >
                                            <TableCell className="pl-5 align-top font-medium">
                                                <Link
                                                    href={show(item)}
                                                    className="hover:text-primary hover:underline"
                                                >
                                                    {item.equipment_code}
                                                </Link>
                                            </TableCell>
                                            <TableCell className="min-w-48 align-top">
                                                <Link
                                                    href={show(item)}
                                                    className="font-medium hover:text-primary hover:underline"
                                                >
                                                    {item.name}
                                                </Link>
                                                {item.brand && (
                                                    <p className="mt-1 text-sm text-muted-foreground">
                                                        {item.brand}
                                                    </p>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {item.category ?? (
                                                    <span>&mdash;</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {item.serial_number ?? (
                                                    <span>&mdash;</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="align-top">
                                                <StatusBadge
                                                    category="equipment_status"
                                                    value={item.status}
                                                />
                                            </TableCell>
                                            <TableCell className="min-w-44 align-top text-muted-foreground">
                                                {item.current_project
                                                    ? item.current_project.name
                                                    : item.current_custodian
                                                      ? item.current_custodian
                                                            .full_name
                                                      : 'In storage'}
                                            </TableCell>
                                            <TableCell className="align-top">
                                                {expectedReturnAt ? (
                                                    <span
                                                        className={
                                                            isReturnOverdue
                                                                ? 'text-destructive'
                                                                : 'text-muted-foreground'
                                                        }
                                                    >
                                                        {formatDate(
                                                            expectedReturnAt,
                                                        )}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground">
                                                        &mdash;
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="pr-5 align-top">
                                                {item.next_calibration_due_date ? (
                                                    <span
                                                        className={
                                                            isOverdue
                                                                ? 'text-destructive'
                                                                : 'text-muted-foreground'
                                                        }
                                                    >
                                                        {formatDate(
                                                            item.next_calibration_due_date,
                                                        )}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground">
                                                        &mdash;
                                                    </span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>

                    {equipment.last_page > 1 && (
                        <div className="flex flex-col gap-3 border-t border-border/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-muted-foreground">
                                {resultSummary}
                            </p>
                            <nav className="flex flex-wrap items-center gap-1">
                                {equipment.links.map((link, index) => (
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

EquipmentIndex.layout = {
    breadcrumbs: [
        {
            title: 'Equipment',
            href: equipmentIndex(),
        },
    ],
};
