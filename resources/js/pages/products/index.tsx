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

export default function ProductsIndex({ products, filters }: Props) {
    const [search, setSearch] = React.useState(filters.search);
    const [type, setType] = React.useState(filters.type || 'all');
    const [status, setStatus] = React.useState(filters.status || 'all');
    const debounceRef = React.useRef<ReturnType<typeof setTimeout>>(undefined);

    const hasActiveFilters =
        search !== DEFAULT_FILTERS.search ||
        type !== DEFAULT_FILTERS.type ||
        status !== DEFAULT_FILTERS.status;

    function applyFilters(overrides: Partial<Filters>): void {
        const next = { search, type, status, ...overrides };

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
        setSearch(value);

        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => {
            applyFilters({ search: value });
        }, 400);
    }

    function handleTypeChange(value: string): void {
        setType(value);
        applyFilters({ type: value });
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
        setType(DEFAULT_FILTERS.type);
        setStatus(DEFAULT_FILTERS.status);

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
                            value={search}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            placeholder="Search by code, name, reference, or brand"
                            className="pl-9"
                        />
                    </div>

                    <Select value={type} onValueChange={handleTypeChange}>
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

                    <Select value={status} onValueChange={handleStatusChange}>
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
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Product code</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Reference number</TableHead>
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
                                        className="h-24 text-center text-muted-foreground"
                                    >
                                        No products found.
                                    </TableCell>
                                </TableRow>
                            )}

                            {products.data.map((product) => (
                                <TableRow key={product.id}>
                                    <TableCell className="font-medium">
                                        <Link href={show(product)}>
                                            {product.product_code}
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        <Link href={show(product)}>
                                            {product.name}
                                        </Link>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {product.reference_number}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {product.brand}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="secondary"
                                            className="capitalize"
                                        >
                                            {product.type}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={
                                                product.status === 'active'
                                                    ? 'secondary'
                                                    : 'outline'
                                            }
                                            className="capitalize"
                                        >
                                            {product.status}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
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
