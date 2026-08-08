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

export default function PaymentTermTemplatesIndex({
    paymentTermTemplates,
    filters,
}: Props) {
    const [search, setSearch] = React.useState(filters.search);
    const debounceRef = React.useRef<ReturnType<typeof setTimeout>>(undefined);

    const hasActiveFilters = search !== DEFAULT_FILTERS.search;

    function applyFilters(overrides: Partial<Filters>): void {
        const next = { search, ...overrides };

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
        setSearch(value);

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

        setSearch(DEFAULT_FILTERS.search);

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
                            value={search}
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
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Last updated</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paymentTermTemplates.data.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={2}
                                        className="h-24 text-center text-muted-foreground"
                                    >
                                        No payment term templates found.
                                    </TableCell>
                                </TableRow>
                            )}

                            {paymentTermTemplates.data.map((template) => (
                                <TableRow key={template.id}>
                                    <TableCell className="font-medium">
                                        <Link href={show(template)}>
                                            {template.name}
                                        </Link>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {formatDateTime(template.updated_at)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {paymentTermTemplates.last_page > 1 && (
                    <nav className="flex flex-wrap items-center gap-1">
                        {paymentTermTemplates.links.map((link, index) => (
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

PaymentTermTemplatesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Payment Term Templates',
            href: paymentTermTemplatesIndex(),
        },
    ],
};
