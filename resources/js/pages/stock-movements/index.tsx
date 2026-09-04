import { Head, Link, router } from '@inertiajs/react';
import { Search, X } from 'lucide-react';
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
import { cn, formatDate, formatNumber } from '@/lib/utils';
import { show as showDeliveryOrder } from '@/routes/delivery-orders';
import { show as showGoodsReceiptNote } from '@/routes/goods-receipt-notes';
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

            <div className="space-y-6 p-4">
                <Heading
                    title="Stock Movements"
                    description="A ledger of goods received and delivered, recorded automatically when a Goods Receipt Note or Delivery Order is confirmed"
                />

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                    <div className="relative w-full sm:max-w-xs">
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            placeholder="Search by code, name, or reference"
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
                                <TableHead>Product</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Quantity</TableHead>
                                <TableHead>Source</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {stockMovements.data.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={5}
                                        className="h-24 text-center text-muted-foreground"
                                    >
                                        No stock movements found.
                                    </TableCell>
                                </TableRow>
                            )}

                            {stockMovements.data.map((movement) => (
                                <TableRow key={movement.id}>
                                    <TableCell className="text-muted-foreground">
                                        {formatDate(movement.movement_date)}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        <div>
                                            {movement.product.product_code}{' '}
                                            &mdash; {movement.product.name}
                                        </div>
                                        {movement.product.reference_number && (
                                            <div className="text-sm text-muted-foreground">
                                                {
                                                    movement.product
                                                        .reference_number
                                                }
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <StatusBadge
                                            category="inventory_movement"
                                            value={movement.type}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {formatNumber(movement.quantity)}{' '}
                                        {movement.product.unit}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {movement.goods_receipt_note_item && (
                                            <Link
                                                href={showGoodsReceiptNote(
                                                    movement
                                                        .goods_receipt_note_item
                                                        .goods_receipt_note,
                                                )}
                                            >
                                                {
                                                    movement
                                                        .goods_receipt_note_item
                                                        .goods_receipt_note
                                                        .grn_code
                                                }
                                            </Link>
                                        )}
                                        {movement.delivery_order_item && (
                                            <Link
                                                href={showDeliveryOrder(
                                                    movement.delivery_order_item
                                                        .delivery_order,
                                                )}
                                            >
                                                {
                                                    movement.delivery_order_item
                                                        .delivery_order.do_code
                                                }
                                            </Link>
                                        )}
                                        {movement.stock_adjustment && (
                                            <span>
                                                Adjustment &mdash;{' '}
                                                {
                                                    movement.stock_adjustment
                                                        .reason
                                                }
                                            </span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {stockMovements.last_page > 1 && (
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
                )}
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
