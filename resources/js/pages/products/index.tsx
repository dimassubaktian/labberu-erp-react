import { Head, Link, router } from '@inertiajs/react';
import { Plus, Search, X } from 'lucide-react';
import React from 'react';
import Heading from '@/components/heading';
import { StatusBadge } from '@/components/project-badge';
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
import { create, index as productsIndex, show } from '@/routes/products';
import type { Paginated } from '@/types';

type Product = {
    id: number;
    uuid: string;
    product_code: string;
    name: string;
    reference_number: string;
    brand: string;
    type: string;
    status: string;
};

type Filters = {
    search: string;
    type: string;
    status: string;
};

type Props = {
    products: Paginated<Product>;
    filters: Filters;
};

const DEFAULT_FILTERS: Filters = { search: '', type: 'all', status: 'all' };

const TYPE_OPTIONS = [
    { value: 'goods', label: 'Goods' },
    { value: 'service', label: 'Service' },
];

const STATUS_OPTIONS = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
];

function normalizeFilters(filters: Filters): Filters {
    return {
        search: filters.search ?? DEFAULT_FILTERS.search,
        type: filters.type || DEFAULT_FILTERS.type,
        status: filters.status || DEFAULT_FILTERS.status,
    };
}

function EmptyProductsState({
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
                        ? 'No products match your filters'
                        : 'No products yet'}
                </p>
                <p className="text-sm text-muted-foreground">
                    {hasActiveFilters
                        ? 'Try clearing a filter or searching for a different product.'
                        : 'Create a product to start managing your catalog.'}
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
                        New product
                    </Link>
                </Button>
            )}
        </div>
    );
}

export default function ProductsIndex({ products, filters }: Props) {
    const initialFilters = normalizeFilters(filters);
    const isMobile = useIsMobile();
    const [filterState, setFilterStateValue] =
        React.useState<Filters>(initialFilters);
    const filterStateRef = React.useRef(initialFilters);
    const [isUpdating, setIsUpdating] = React.useState(false);
    const debounceRef = React.useRef<ReturnType<typeof setTimeout>>(undefined);

    const hasActiveFilters =
        filterState.search !== DEFAULT_FILTERS.search ||
        filterState.type !== DEFAULT_FILTERS.type ||
        filterState.status !== DEFAULT_FILTERS.status;

    const resultSummary =
        products.from !== null && products.to !== null
            ? `Showing ${products.from}-${products.to} of ${products.total} products`
            : 'No products found';

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
            productsIndex.url({
                query: {
                    search: next.search || undefined,
                    type: next.type !== 'all' ? next.type : undefined,
                    status: next.status !== 'all' ? next.status : undefined,
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

    function handleTypeChange(value: string): void {
        applyFilters({ type: value });
    }

    function handleStatusChange(value: string): void {
        applyFilters({ status: value });
    }

    function handleReset(): void {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        const next = { ...DEFAULT_FILTERS };
        filterStateRef.current = next;
        setFilterStateValue(next);

        router.get(
            productsIndex.url(),
            {},
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }

    return (
        <>
            <Head title="Products" />

            <div className="space-y-6 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <Heading
                        title="Products"
                        description="Manage the products your organization sells or uses"
                    />

                    <Button asChild className="w-full sm:w-auto">
                        <Link href={create()}>
                            <Plus />
                            New Product
                        </Link>
                    </Button>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                    <div className="relative w-full sm:max-w-xs">
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={filterState.search}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            placeholder="Search by code, name, reference, or brand"
                            className="pl-9"
                        />
                    </div>

                    <Select
                        value={filterState.type}
                        onValueChange={handleTypeChange}
                    >
                        <SelectTrigger className="w-full sm:w-36">
                            <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All types</SelectItem>
                            {TYPE_OPTIONS.map((option) => (
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
                        value={filterState.status}
                        onValueChange={handleStatusChange}
                    >
                        <SelectTrigger className="w-full sm:w-40">
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
                    <div
                        className={cn(
                            'transition-opacity',
                            isUpdating && 'opacity-60',
                        )}
                    >
                        {isMobile ? (
                            <div className="divide-y divide-border/50">
                                {products.data.length === 0 ? (
                                    <div className="p-8">
                                        <EmptyProductsState
                                            hasActiveFilters={hasActiveFilters}
                                            onReset={handleReset}
                                        />
                                    </div>
                                ) : (
                                    products.data.map((product) => (
                                        <article
                                            key={product.id}
                                            className="space-y-4 p-4"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="min-w-0">
                                                    <Link
                                                        href={show(product)}
                                                        className="font-mono text-xs font-medium text-muted-foreground hover:text-primary hover:underline"
                                                    >
                                                        {product.product_code}
                                                    </Link>
                                                    <Link
                                                        href={show(product)}
                                                        className="mt-1 block truncate font-medium hover:text-primary hover:underline"
                                                    >
                                                        {product.name}
                                                    </Link>
                                                </div>
                                                <StatusBadge
                                                    category="active"
                                                    value={product.status}
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div className="min-w-0 space-y-1">
                                                    <p className="text-muted-foreground">
                                                        Reference number
                                                    </p>
                                                    <p className="truncate font-medium">
                                                        {product.reference_number ||
                                                            'Not provided'}
                                                    </p>
                                                </div>
                                                <div className="min-w-0 space-y-1">
                                                    <p className="text-muted-foreground">
                                                        Brand
                                                    </p>
                                                    <p className="truncate font-medium">
                                                        {product.brand ||
                                                            'Not provided'}
                                                    </p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-muted-foreground">
                                                        Type
                                                    </p>
                                                    <StatusBadge
                                                        category="product_type"
                                                        value={product.type}
                                                    />
                                                </div>
                                            </div>
                                        </article>
                                    ))
                                )}
                            </div>
                        ) : (
                            <div>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Product code</TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead>
                                                Reference number
                                            </TableHead>
                                            <TableHead>Brand</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {products.data.length === 0 && (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={6}
                                                    className="h-52"
                                                >
                                                    <EmptyProductsState
                                                        hasActiveFilters={
                                                            hasActiveFilters
                                                        }
                                                        onReset={handleReset}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        )}

                                        {products.data.map((product) => (
                                            <TableRow
                                                key={product.id}
                                                className="hover:bg-muted/30"
                                            >
                                                <TableCell className="font-medium">
                                                    <Link
                                                        href={show(product)}
                                                        className="font-mono text-xs hover:text-primary hover:underline"
                                                    >
                                                        {product.product_code}
                                                    </Link>
                                                </TableCell>
                                                <TableCell className="max-w-72">
                                                    <Link
                                                        href={show(product)}
                                                        className="block truncate font-medium hover:text-primary hover:underline"
                                                    >
                                                        {product.name}
                                                    </Link>
                                                </TableCell>
                                                <TableCell className="max-w-56 text-muted-foreground">
                                                    <span className="block truncate">
                                                        {product.reference_number ||
                                                            'Not provided'}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="max-w-48 text-muted-foreground">
                                                    <span className="block truncate">
                                                        {product.brand ||
                                                            'Not provided'}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <StatusBadge
                                                        category="product_type"
                                                        value={product.type}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <StatusBadge
                                                        category="active"
                                                        value={product.status}
                                                    />
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

                        {products.last_page > 1 && (
                            <nav className="flex flex-wrap items-center gap-1">
                                {products.links.map((link, index) => (
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

ProductsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Products',
            href: productsIndex(),
        },
    ],
};
