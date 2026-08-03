import { Head, Link } from '@inertiajs/react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn, formatDate, formatNumber } from '@/lib/utils';
import {
    create,
    index as stockAdjustmentsIndex,
} from '@/routes/stock-adjustments';
import type { Paginated } from '@/types';

type StockAdjustment = {
    id: number;
    type: string;
    quantity: string;
    reason: string;
    note: string | null;
    created_at: string;
    product: {
        id: number;
        product_code: string;
        name: string;
        unit: string;
    };
    adjusted_by: {
        id: number;
        name: string;
    };
};

type Props = {
    stockAdjustments: Paginated<StockAdjustment>;
};

export default function StockAdjustmentsIndex({ stockAdjustments }: Props) {
    return (
        <>
            <Head title="Stock Adjustments" />

            <div className="space-y-6 p-4">
                <div className="flex items-center justify-between gap-4">
                    <Heading
                        title="Stock Adjustments"
                        description="Manual corrections to a product's stock on hand, such as stock counts, damage, loss, or initial loads"
                    />
                    <Button asChild>
                        <Link href={create()}>New Adjustment</Link>
                    </Button>
                </div>

                <div className="overflow-hidden rounded-xl border border-border/50">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Product</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Quantity</TableHead>
                                <TableHead>Reason</TableHead>
                                <TableHead>Note</TableHead>
                                <TableHead>Adjusted by</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {stockAdjustments.data.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={7}
                                        className="h-24 text-center text-muted-foreground"
                                    >
                                        No stock adjustments found.
                                    </TableCell>
                                </TableRow>
                            )}

                            {stockAdjustments.data.map((adjustment) => (
                                <TableRow key={adjustment.id}>
                                    <TableCell className="text-muted-foreground">
                                        {formatDate(adjustment.created_at)}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {adjustment.product.product_code}{' '}
                                        &mdash; {adjustment.product.name}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="secondary"
                                            className="capitalize"
                                        >
                                            {adjustment.type}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {formatNumber(adjustment.quantity)}{' '}
                                        {adjustment.product.unit}
                                    </TableCell>
                                    <TableCell>{adjustment.reason}</TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {adjustment.note}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {adjustment.adjusted_by.name}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {stockAdjustments.last_page > 1 && (
                    <nav className="flex flex-wrap items-center gap-1">
                        {stockAdjustments.links.map((link, index) => (
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

StockAdjustmentsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Stock Adjustments',
            href: stockAdjustmentsIndex(),
        },
    ],
};
