import { Head, Link } from '@inertiajs/react';
import { Plus } from 'lucide-react';
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
    index as purchaseOrdersIndex,
    show,
} from '@/routes/purchase-orders';
import type { Paginated } from '@/types';

type PurchaseOrder = {
    id: number;
    uuid: string;
    purchase_order_code: string;
    date: string;
    status: string;
    grand_total: string;
    project: {
        id: number;
        name: string;
    };
    customer: {
        id: number;
        name: string;
    };
    vendor: {
        id: number;
        name: string;
    };
    currency: {
        id: number;
        iso_code: string;
        symbol: string | null;
    };
};

type Props = {
    purchaseOrders: Paginated<PurchaseOrder>;
};

export default function PurchaseOrdersIndex({ purchaseOrders }: Props) {
    return (
        <>
            <Head title="Purchase Orders" />

            <div className="space-y-6 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <Heading
                        title="Purchase Orders"
                        description="Manage purchase orders raised against vendors"
                    />

                    <Button asChild className="w-full sm:w-auto">
                        <Link href={create()}>
                            <Plus />
                            New Purchase Order
                        </Link>
                    </Button>
                </div>

                <div className="overflow-hidden rounded-xl border border-border/50">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>PO code</TableHead>
                                <TableHead>Project</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Vendor</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Grand total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {purchaseOrders.data.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={7}
                                        className="h-24 text-center text-muted-foreground"
                                    >
                                        No purchase orders found.
                                    </TableCell>
                                </TableRow>
                            )}

                            {purchaseOrders.data.map((purchaseOrder) => (
                                <TableRow key={purchaseOrder.id}>
                                    <TableCell className="font-medium">
                                        <Link href={show(purchaseOrder)}>
                                            {purchaseOrder.purchase_order_code}
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        {purchaseOrder.project.name}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {purchaseOrder.customer.name}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {purchaseOrder.vendor.name}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {formatDate(purchaseOrder.date)}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="secondary"
                                            className="capitalize"
                                        >
                                            {purchaseOrder.status.replaceAll(
                                                '_',
                                                ' ',
                                            )}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {purchaseOrder.currency.symbol ??
                                            purchaseOrder.currency
                                                .iso_code}{' '}
                                        {formatNumber(
                                            purchaseOrder.grand_total,
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {purchaseOrders.last_page > 1 && (
                    <nav className="flex flex-wrap items-center gap-1">
                        {purchaseOrders.links.map((link, index) => (
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

PurchaseOrdersIndex.layout = {
    breadcrumbs: [
        {
            title: 'Purchase Orders',
            href: purchaseOrdersIndex(),
        },
    ],
};
