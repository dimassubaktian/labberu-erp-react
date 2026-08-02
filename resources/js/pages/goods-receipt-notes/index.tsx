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
    index as goodsReceiptNotesIndex,
    show,
} from '@/routes/goods-receipt-notes';
import type { Paginated } from '@/types';

type GoodsReceiptNote = {
    id: number;
    uuid: string;
    grn_code: string;
    received_date: string;
    status: string;
    purchase_order: {
        id: number;
        purchase_order_code: string;
        vendor: { id: number; name: string };
    };
};

type Props = {
    goodsReceiptNotes: Paginated<GoodsReceiptNote>;
};

export default function GoodsReceiptNotesIndex({ goodsReceiptNotes }: Props) {
    return (
        <>
            <Head title="Goods Receipt Notes" />

            <div className="space-y-6 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <Heading
                        title="Goods Receipt Notes"
                        description="Record what arrived against approved purchase orders"
                    />

                    <Button asChild className="w-full sm:w-auto">
                        <Link href={create()}>
                            <Plus />
                            New Goods Receipt Note
                        </Link>
                    </Button>
                </div>

                <div className="overflow-hidden rounded-xl border border-border/50">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>GRN code</TableHead>
                                <TableHead>Purchase order</TableHead>
                                <TableHead>Vendor</TableHead>
                                <TableHead>Received date</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {goodsReceiptNotes.data.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={5}
                                        className="h-24 text-center text-muted-foreground"
                                    >
                                        No goods receipt notes found.
                                    </TableCell>
                                </TableRow>
                            )}

                            {goodsReceiptNotes.data.map((goodsReceiptNote) => (
                                <TableRow key={goodsReceiptNote.id}>
                                    <TableCell className="font-medium">
                                        <Link href={show(goodsReceiptNote)}>
                                            {goodsReceiptNote.grn_code}
                                        </Link>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {
                                            goodsReceiptNote.purchase_order
                                                .purchase_order_code
                                        }
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {
                                            goodsReceiptNote.purchase_order
                                                .vendor.name
                                        }
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {formatDate(
                                            goodsReceiptNote.received_date,
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="secondary"
                                            className="capitalize"
                                        >
                                            {goodsReceiptNote.status.replaceAll(
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

                {goodsReceiptNotes.last_page > 1 && (
                    <nav className="flex flex-wrap items-center gap-1">
                        {goodsReceiptNotes.links.map((link, index) => (
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

GoodsReceiptNotesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Goods Receipt Notes',
            href: goodsReceiptNotesIndex(),
        },
    ],
};
