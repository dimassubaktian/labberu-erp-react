import { Head, Link, router } from '@inertiajs/react';
import { AlertTriangle, Clock, PackageX, Plus, Search, X } from 'lucide-react';
import React from 'react';
import { KpiCard } from '@/components/dashboard/kpi-card';
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
import { create, index as equipmentIndex, show } from '@/routes/equipment';
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

const STATUS_VARIANTS: Record<string, 'secondary' | 'outline' | 'destructive'> = {
    available: 'secondary',
    in_use: 'secondary',
    in_calibration: 'outline',
    under_maintenance: 'outline',
    retired: 'outline',
    lost: 'destructive',
    damaged: 'destructive',
};

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
                    category: next.category !== 'all' ? next.category : undefined,
                    status: next.status !== 'all' ? next.status : undefined,
                    calibration:
                        next.calibration !== 'all' ? next.calibration : undefined,
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

            <div className="space-y-6 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <Heading
                        title="Equipment"
                        description="Manage the tools and equipment your organization owns"
                    />

                    <Button asChild className="w-full sm:w-auto">
                        <Link href={create()}>
                            <Plus />
                            New Equipment
                        </Link>
                    </Button>
                </div>

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

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                    <div className="relative w-full sm:max-w-xs">
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            placeholder="Search by code, name, serial, or brand"
                            className="pl-9"
                        />
                    </div>

                    <Select value={category} onValueChange={handleCategoryChange}>
                        <SelectTrigger className="w-full sm:w-48">
                            <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All categories</SelectItem>
                            {CATEGORY_OPTIONS.map((option) => (
                                <SelectItem key={option} value={option}>
                                    {option}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={status} onValueChange={handleStatusChange}>
                        <SelectTrigger className="w-full sm:w-44">
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
                                <TableHead>Equipment code</TableHead>
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
                                    <TableCell
                                        colSpan={8}
                                        className="h-24 text-center text-muted-foreground"
                                    >
                                        No equipment found.
                                    </TableCell>
                                </TableRow>
                            )}

                            {equipment.data.map((item) => {
                                const today = new Date(
                                    new Date().toDateString(),
                                );
                                const isOverdue =
                                    item.next_calibration_due_date !== null &&
                                    new Date(item.next_calibration_due_date) <
                                        today;
                                const expectedReturnAt =
                                    item.open_assignment?.expected_return_at ??
                                    null;
                                const isReturnOverdue =
                                    expectedReturnAt !== null &&
                                    new Date(expectedReturnAt) < today;

                                return (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">
                                            <Link href={show(item)}>
                                                {item.equipment_code}
                                            </Link>
                                        </TableCell>
                                        <TableCell>
                                            <Link href={show(item)}>
                                                {item.name}
                                            </Link>
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
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    STATUS_VARIANTS[
                                                        item.status
                                                    ] ?? 'secondary'
                                                }
                                                className="capitalize"
                                            >
                                                {item.status.replaceAll(
                                                    '_',
                                                    ' ',
                                                )}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {item.current_project
                                                ? item.current_project.name
                                                : item.current_custodian
                                                  ? item.current_custodian
                                                        .full_name
                                                  : 'In storage'}
                                        </TableCell>
                                        <TableCell>
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
                                        <TableCell>
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
                </div>

                {equipment.last_page > 1 && (
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
                )}
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
