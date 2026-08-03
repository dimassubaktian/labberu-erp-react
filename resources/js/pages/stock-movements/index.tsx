import { Head, Link } from '@inertiajs/react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
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

type Props = {
    stockMovements: Paginated<StockMovement>;
};

export default function StockMovementsIndex({ stockMovements }: Props) {
    return (
        <>
            <Head title="Stock Movements" />

            <div className="space-y-6 p-4">
                <Heading
                    title="Stock Movements"
                    description="A ledger of goods received and delivered, recorded automatically when a Goods Receipt Note or Delivery Order is confirmed"
                />

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
                                        {movement.product.product_code} &mdash;{' '}
                                        {movement.product.name}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="secondary"
                                            className="capitalize"
                                        >
                                            {movement.type}
                                        </Badge>
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
