import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowDownLeft,
    ArrowUpRight,
    Boxes,
    CalendarDays,
    Package,
    Search,
    SlidersHorizontal,
    X,
} from 'lucide-react';
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
import { cn, formatDate, formatNumber } from '@/lib/utils';
import { show as showDeliveryOrder } from '@/routes/delivery-orders';
import { show as showGoodsReceiptNote } from '@/routes/goods-receipt-notes';
import { show as showProduct } from '@/routes/products';
import { index as stockMovementsIndex } from '@/routes/stock-movements';
import type { Paginated } from '@/types';

type StockMovement = {
    id: number;
    type: string;
    quantity: string;
    movement_date: string;
    product: {
        id: number;
        uuid: string;
        product_code: string;
        name: string;
        reference_number: string;
        unit: string;
    };
    goods_receipt_note_item: {
        id: number;
        goods_receipt_note: {
            id: number;
            uuid: string;
            grn_code: string;
            purchase_order: {
                id: number;
                vendor: { id: number; name: string };
            };
        };
    } | null;
    delivery_order_item: {
        id: number;
        delivery_order: {
            id: number;
            uuid: string;
            do_code: string;
            quotation: {
                id: number;
                project: {
                    id: number;
                    customer: { id: number; name: string };
                };
            };
        };
    } | null;
    stock_adjustment: {
        id: number;
        reason: string;
    } | null;
};

type Filters = {
    search: string;
    type: string;
};

type Props = {
    stockMovements: Paginated<StockMovement>;
    filters: Filters;
};

const DEFAULT_FILTERS: Filters = { search: '', type: 'all' };

const TYPE_OPTIONS = [
    { value: 'in', label: 'In' },
    { value: 'out', label: 'Out' },
];

export default function StockMovementsIndex({
    stockMovements,
    filters,
}: Props) {
    const [search, setSearch] = React.useState(filters.search);
    const [type, setType] = React.useState(filters.type || 'all');
    const debounceRef = React.useRef<ReturnType<typeof setTimeout>>(undefined);

    const hasActiveFilters =
        search !== DEFAULT_FILTERS.search || type !== DEFAULT_FILTERS.type;
    const resultSummary =
        stockMovements.from && stockMovements.to
            ? `Showing ${stockMovements.from}–${stockMovements.to} of ${stockMovements.total}`
            : 'No movements recorded';

    function applyFilters(overrides: Partial<Filters>): void {
        const next = { search, type, ...overrides };

        router.get(
            stockMovementsIndex.url({
                query: {
                    search: next.search || undefined,
                    type: next.type !== 'all' ? next.type : undefined,
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

    function handleReset(): void {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        setSearch(DEFAULT_FILTERS.search);
        setType(DEFAULT_FILTERS.type);

        router.get(
            stockMovementsIndex.url(),
            {},
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }

    return (
        <>
            <Head title="Stock Movements" />

            <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6">
                <section className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
                    <div className="flex flex-col gap-5 bg-linear-to-br from-primary/[0.08] via-card to-card p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-start gap-4">
                            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:size-14">
                                <Boxes className="size-6 sm:size-7" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">
                                    Inventory activity
                                </p>
                                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                                    Stock movements
                                </h1>
                                <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                                    A live ledger of goods received, delivered,
                                    and adjusted across your inventory.
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
                                Recorded movements
                            </p>
                            <p className="text-lg font-semibold">
                                {formatNumber(stockMovements.total)}
                            </p>
                        </div>
                        <div className="space-y-1 p-4 sm:p-5">
                            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                Current page
                            </p>
                            <p className="text-lg font-semibold">
                                {stockMovements.current_page} of{' '}
                                {stockMovements.last_page}
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
                            <CardTitle>Find movements</CardTitle>
                            <CardDescription>
                                Search by product or narrow the ledger by
                                movement direction.
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
                                    placeholder="Search code, name, or reference"
                                    className="pl-9"
                                />
                            </div>

                            <Select
                                value={type}
                                onValueChange={handleTypeChange}
                            >
                                <SelectTrigger className="w-full sm:w-44">
                                    <SlidersHorizontal className="size-4 text-muted-foreground" />
                                    <SelectValue placeholder="Movement type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        All movement types
                                    </SelectItem>
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
                        </div>
                    </CardContent>
                </Card>

                <Card className="overflow-hidden">
                    <CardHeader className="border-b border-border/60 pb-5">
                        <CardTitle>Activity ledger</CardTitle>
                        <CardDescription>
                            Trace each inventory change back to its originating
                            document or adjustment.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-muted/40">
                                <TableRow>
                                    <TableHead className="pl-5">Date</TableHead>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Movement</TableHead>
                                    <TableHead className="text-right">
                                        Quantity
                                    </TableHead>
                                    <TableHead className="pr-5">
                                        Source
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {stockMovements.data.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-64">
                                            <div className="flex flex-col items-center justify-center gap-3 text-center">
                                                <div className="rounded-xl bg-muted p-3 text-muted-foreground">
                                                    <Boxes className="size-6" />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="font-medium">
                                                        No stock movements found
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        Try clearing a filter or
                                                        check again after a
                                                        stock document is
                                                        confirmed.
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}

                                {stockMovements.data.map((movement) => {
                                    const isIncoming = movement.type === 'in';
                                    const source =
                                        movement.goods_receipt_note_item ??
                                        movement.delivery_order_item;

                                    return (
                                        <TableRow
                                            key={movement.id}
                                            className="hover:bg-muted/30"
                                        >
                                            <TableCell className="pl-5 align-top text-muted-foreground">
                                                <div className="flex items-center gap-2 whitespace-nowrap">
                                                    <CalendarDays className="size-4" />
                                                    {formatDate(
                                                        movement.movement_date,
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="min-w-56 align-top">
                                                <Link
                                                    href={showProduct(
                                                        movement.product,
                                                    )}
                                                    className="group block space-y-1"
                                                >
                                                    <p className="font-medium group-hover:text-primary group-hover:underline">
                                                        {movement.product.name}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {
                                                            movement.product
                                                                .product_code
                                                        }
                                                        {movement.product
                                                            .reference_number &&
                                                            ` · ${movement.product.reference_number}`}
                                                    </p>
                                                </Link>
                                            </TableCell>
                                            <TableCell className="align-top">
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className={cn(
                                                            'flex size-7 items-center justify-center rounded-full',
                                                            isIncoming
                                                                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                                                                : 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
                                                        )}
                                                    >
                                                        {isIncoming ? (
                                                            <ArrowDownLeft className="size-4" />
                                                        ) : (
                                                            <ArrowUpRight className="size-4" />
                                                        )}
                                                    </span>
                                                    <StatusBadge
                                                        category="inventory_movement"
                                                        value={movement.type}
                                                    />
                                                </div>
                                            </TableCell>
                                            <TableCell
                                                className={cn(
                                                    'text-right align-top font-semibold whitespace-nowrap',
                                                    isIncoming
                                                        ? 'text-emerald-700 dark:text-emerald-300'
                                                        : 'text-amber-700 dark:text-amber-300',
                                                )}
                                            >
                                                {isIncoming ? '+' : '−'}
                                                {formatNumber(
                                                    movement.quantity,
                                                )}{' '}
                                                <span className="font-medium text-muted-foreground">
                                                    {movement.product.unit}
                                                </span>
                                            </TableCell>
                                            <TableCell className="min-w-48 pr-5 align-top text-sm">
                                                {movement.goods_receipt_note_item && (
                                                    <div className="space-y-1">
                                                        <Link
                                                            href={showGoodsReceiptNote(
                                                                movement
                                                                    .goods_receipt_note_item
                                                                    .goods_receipt_note,
                                                            )}
                                                            className="font-medium hover:text-primary hover:underline"
                                                        >
                                                            Goods receipt ·{' '}
                                                            {
                                                                movement
                                                                    .goods_receipt_note_item
                                                                    .goods_receipt_note
                                                                    .grn_code
                                                            }
                                                        </Link>
                                                        <p className="text-muted-foreground">
                                                            {
                                                                movement
                                                                    .goods_receipt_note_item
                                                                    .goods_receipt_note
                                                                    .purchase_order
                                                                    .vendor.name
                                                            }
                                                        </p>
                                                    </div>
                                                )}
                                                {movement.delivery_order_item && (
                                                    <div className="space-y-1">
                                                        <Link
                                                            href={showDeliveryOrder(
                                                                movement
                                                                    .delivery_order_item
                                                                    .delivery_order,
                                                            )}
                                                            className="font-medium hover:text-primary hover:underline"
                                                        >
                                                            Delivery order ·{' '}
                                                            {
                                                                movement
                                                                    .delivery_order_item
                                                                    .delivery_order
                                                                    .do_code
                                                            }
                                                        </Link>
                                                        <p className="text-muted-foreground">
                                                            {
                                                                movement
                                                                    .delivery_order_item
                                                                    .delivery_order
                                                                    .quotation
                                                                    .project
                                                                    .customer
                                                                    .name
                                                            }
                                                        </p>
                                                    </div>
                                                )}
                                                {movement.stock_adjustment && (
                                                    <div className="flex items-start gap-2 text-muted-foreground">
                                                        <Package className="mt-0.5 size-4 shrink-0" />
                                                        <span>
                                                            Adjustment ·{' '}
                                                            {
                                                                movement
                                                                    .stock_adjustment
                                                                    .reason
                                                            }
                                                        </span>
                                                    </div>
                                                )}
                                                {!source &&
                                                    !movement.stock_adjustment &&
                                                    '—'}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>

                    {stockMovements.last_page > 1 && (
                        <div className="flex flex-col gap-3 border-t border-border/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-muted-foreground">
                                {resultSummary}
                            </p>
                            <nav className="flex flex-wrap items-center gap-1">
                                {stockMovements.links.map((link, index) => (
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

StockMovementsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Stock Movements',
            href: stockMovementsIndex(),
        },
    ],
};
