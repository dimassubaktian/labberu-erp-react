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
import { cn, formatDate } from '@/lib/utils';
import {
    create,
    index as deliveryOrdersIndex,
    show,
} from '@/routes/delivery-orders';
import type { Paginated } from '@/types';

type DeliveryOrder = {
    id: number;
    uuid: string;
    do_code: string;
    delivery_date: string;
    status: string;
    quotation: {
        id: number;
        quotation_code: string;
        project: {
            id: number;
            customer: { id: number; name: string };
        };
    };
};

type Props = {
    deliveryOrders: Paginated<DeliveryOrder>;
};

export default function DeliveryOrdersIndex({ deliveryOrders }: Props) {
    return (
        <>
            <Head title="Delivery Orders" />

            <div className="space-y-6 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <Heading
                        title="Delivery Orders"
                        description="Record what was shipped against approved quotations"
                    />

                    <Button asChild className="w-full sm:w-auto">
                        <Link href={create()}>
                            <Plus />
                            New Delivery Order
                        </Link>
                    </Button>
                </div>

                <div className="overflow-hidden rounded-xl border border-border/50">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>DO code</TableHead>
                                <TableHead>Quotation</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Delivery date</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {deliveryOrders.data.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={5}
                                        className="h-24 text-center text-muted-foreground"
                                    >
                                        No delivery orders found.
                                    </TableCell>
                                </TableRow>
                            )}

                            {deliveryOrders.data.map((deliveryOrder) => (
                                <TableRow key={deliveryOrder.id}>
                                    <TableCell className="font-medium">
                                        <Link href={show(deliveryOrder)}>
                                            {deliveryOrder.do_code}
                                        </Link>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {deliveryOrder.quotation.quotation_code}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {
                                            deliveryOrder.quotation.project
                                                .customer.name
                                        }
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {formatDate(
                                            deliveryOrder.delivery_date,
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="secondary"
                                            className="capitalize"
                                        >
                                            {deliveryOrder.status.replaceAll(
                                                '_',
                                                ' ',
                                            )}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {deliveryOrders.last_page > 1 && (
                    <nav className="flex flex-wrap items-center gap-1">
                        {deliveryOrders.links.map((link, index) => (
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

DeliveryOrdersIndex.layout = {
    breadcrumbs: [
        {
            title: 'Delivery Orders',
            href: deliveryOrdersIndex(),
        },
    ],
};
