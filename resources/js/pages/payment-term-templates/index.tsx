import { Head, Link, router } from '@inertiajs/react';
import { Plus, Search, X } from 'lucide-react';
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
import { useIsMobile } from '@/hooks/use-mobile';
import { cn, formatDateTime } from '@/lib/utils';
import {
    create,
    index as paymentTermTemplatesIndex,
    show,
} from '@/routes/payment-term-templates';
import type { Paginated } from '@/types';

type PaymentTermTemplate = {
    id: number;
    uuid: string;
    name: string;
    updated_at: string;
};

type Filters = {
    search: string;
};

type Props = {
    paymentTermTemplates: Paginated<PaymentTermTemplate>;
    filters: Filters;
};

const DEFAULT_FILTERS: Filters = { search: '' };

function normalizeFilters(filters: Filters): Filters {
    return {
        search: filters.search ?? DEFAULT_FILTERS.search,
    };
}

function EmptyPaymentTermTemplatesState({
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
                        ? 'No payment term templates match your search'
                        : 'No payment term templates yet'}
                </p>
                <p className="text-sm text-muted-foreground">
                    {hasActiveFilters
                        ? 'Try clearing the search or using a different template name.'
                        : 'Create a template to reuse payment terms across quotations.'}
                </p>
            </div>
            {hasActiveFilters ? (
                <Button variant="outline" size="sm" onClick={onReset}>
                    <X />
                    Clear search
                </Button>
            ) : (
                <Button asChild size="sm">
                    <Link href={create()}>
                        <Plus />
                        New template
                    </Link>
                </Button>
            )}
        </div>
    );
}

export default function PaymentTermTemplatesIndex({
    paymentTermTemplates,
    filters,
}: Props) {
    const initialFilters = normalizeFilters(filters);
    const isMobile = useIsMobile();
    const [filterState, setFilterStateValue] =
        React.useState<Filters>(initialFilters);
    const filterStateRef = React.useRef(initialFilters);
    const [isUpdating, setIsUpdating] = React.useState(false);
    const debounceRef = React.useRef<ReturnType<typeof setTimeout>>(undefined);

    const hasActiveFilters = filterState.search !== DEFAULT_FILTERS.search;

    const resultSummary =
        paymentTermTemplates.from !== null && paymentTermTemplates.to !== null
            ? `Showing ${paymentTermTemplates.from}-${paymentTermTemplates.to} of ${paymentTermTemplates.total} templates`
            : 'No templates found';

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
            paymentTermTemplatesIndex.url({
                query: {
                    search: next.search || undefined,
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

    function handleReset(): void {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        const next = { ...DEFAULT_FILTERS };
        filterStateRef.current = next;
        setFilterStateValue(next);

        router.get(
            paymentTermTemplatesIndex.url(),
            {},
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }

    return (
        <>
            <Head title="Payment Term Templates" />

            <div className="space-y-6 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <Heading
                        title="Payment Term Templates"
                        description="Manage reusable payment term templates for quotations"
                    />

                    <Button asChild className="w-full sm:w-auto">
                        <Link href={create()}>
                            <Plus />
                            New Template
                        </Link>
                    </Button>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                    <div className="relative w-full sm:max-w-xs">
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={filterState.search}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            placeholder="Search by name"
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
                    <div
                        className={cn(
                            'transition-opacity',
                            isUpdating && 'opacity-60',
                        )}
                    >
                        {isMobile ? (
                            <div className="divide-y divide-border/50">
                                {paymentTermTemplates.data.length === 0 ? (
                                    <div className="p-8">
                                        <EmptyPaymentTermTemplatesState
                                            hasActiveFilters={hasActiveFilters}
                                            onReset={handleReset}
                                        />
                                    </div>
                                ) : (
                                    paymentTermTemplates.data.map(
                                        (template) => (
                                            <article
                                                key={template.id}
                                                className="space-y-4 p-4"
                                            >
                                                <Link
                                                    href={show(template)}
                                                    className="block truncate font-medium hover:text-primary hover:underline"
                                                >
                                                    {template.name}
                                                </Link>
                                                <div className="space-y-1 text-sm">
                                                    <p className="text-muted-foreground">
                                                        Last updated
                                                    </p>
                                                    <p className="font-medium">
                                                        {formatDateTime(
                                                            template.updated_at,
                                                        )}
                                                    </p>
                                                </div>
                                            </article>
                                        ),
                                    )
                                )}
                            </div>
                        ) : (
                            <div>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Last updated</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paymentTermTemplates.data.length ===
                                            0 && (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={2}
                                                    className="h-52"
                                                >
                                                    <EmptyPaymentTermTemplatesState
                                                        hasActiveFilters={
                                                            hasActiveFilters
                                                        }
                                                        onReset={handleReset}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        )}

                                        {paymentTermTemplates.data.map(
                                            (template) => (
                                                <TableRow
                                                    key={template.id}
                                                    className="hover:bg-muted/30"
                                                >
                                                    <TableCell className="max-w-72 font-medium">
                                                        <Link
                                                            href={show(
                                                                template,
                                                            )}
                                                            className="block truncate hover:text-primary hover:underline"
                                                        >
                                                            {template.name}
                                                        </Link>
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap text-muted-foreground">
                                                        {formatDateTime(
                                                            template.updated_at,
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ),
                                        )}
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

                        {paymentTermTemplates.last_page > 1 && (
                            <nav className="flex flex-wrap items-center gap-1">
                                {paymentTermTemplates.links.map(
                                    (link, index) => (
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
                                    ),
                                )}
                            </nav>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

PaymentTermTemplatesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Payment Term Templates',
            href: paymentTermTemplatesIndex(),
        },
    ],
};
