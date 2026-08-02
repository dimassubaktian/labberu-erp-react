import { Form, Head, Link, setLayoutProps } from '@inertiajs/react';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatDate, formatDateTime, formatNumber } from '@/lib/utils';
import { confirm, destroy, edit, index } from '@/routes/goods-receipt-notes';
import { show as showPurchaseOrder } from '@/routes/purchase-orders';

type WorkforceOption = {
    id: number;
    full_name: string;
};

type GoodsReceiptNoteItem = {
    id: number;
    quantity_ordered: string;
    unit: string;
    quantity_accepted: string;
    quantity_rejected: string;
    rejection_reason: string | null;
    product: {
        id: number;
        product_code: string;
        name: string;
    };
};

type GoodsReceiptNote = {
    id: number;
    uuid: string;
    grn_code: string;
    status: string;
    received_date: string;
    remarks: string | null;
    received_at: string | null;
    purchase_order: {
        id: number;
        uuid: string;
        purchase_order_code: string;
        vendor: { id: number; name: string };
    };
    items: GoodsReceiptNoteItem[];
    received_by: WorkforceOption | null;
};

type Props = {
    goodsReceiptNote: GoodsReceiptNote;
    workforces: WorkforceOption[];
};

function WorkforceSelect({
    id,
    name,
    value,
    onValueChange,
    workforces,
}: {
    id: string;
    name: string;
    value: string;
    onValueChange: (value: string) => void;
    workforces: WorkforceOption[];
}) {
    return (
        <div className="grid gap-2 py-2">
            <Label htmlFor={id}>Received by</Label>
            <input type="hidden" name={name} value={value} />
            <Select value={value} onValueChange={onValueChange}>
                <SelectTrigger id={id} className="w-full">
                    <SelectValue placeholder="Select a workforce member" />
                </SelectTrigger>
                <SelectContent>
                    {workforces.map((workforce) => (
                        <SelectItem
                            key={workforce.id}
                            value={String(workforce.id)}
                        >
                            {workforce.full_name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}

export default function GoodsReceiptNotesShow({
    goodsReceiptNote,
    workforces,
}: Props) {
    setLayoutProps({
        breadcrumbs: [
            { title: 'Goods Receipt Notes', href: index() },
            { title: goodsReceiptNote.grn_code, href: index() },
        ],
    });

    const [receivedById, setReceivedById] = useState('');

    return (
        <>
            <Head title={goodsReceiptNote.grn_code} />

            <div className="mx-auto w-full max-w-4xl space-y-6 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <Heading
                        title={goodsReceiptNote.grn_code}
                        description={
                            goodsReceiptNote.purchase_order.purchase_order_code
                        }
                    />

                    <div className="flex flex-col gap-2 sm:flex-row">
                        <Button
                            variant="destructive"
                            asChild
                            className="w-full sm:w-auto"
                        >
                            <Link href={index()}>
                                <ArrowLeft />
                                Back to Goods Receipt Notes
                            </Link>
                        </Button>

                        {goodsReceiptNote.status === 'draft' && (
                            <Button asChild className="w-full sm:w-auto">
                                <Link href={edit(goodsReceiptNote)}>
                                    <Pencil />
                                    Edit Goods Receipt Note
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <dl className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <dt className="text-sm text-muted-foreground">
                                    Status
                                </dt>
                                <dd>
                                    <Badge
                                        variant="secondary"
                                        className="capitalize"
                                    >
                                        {goodsReceiptNote.status.replaceAll(
                                            '_',
                                            ' ',
                                        )}
                                    </Badge>
                                </dd>
                            </div>

                            <div>
                                <dt className="text-sm text-muted-foreground">
                                    Purchase order
                                </dt>
                                <dd className="font-medium">
                                    <Link
                                        href={showPurchaseOrder(
                                            goodsReceiptNote.purchase_order,
                                        )}
                                    >
                                        {
                                            goodsReceiptNote.purchase_order
                                                .purchase_order_code
                                        }
                                    </Link>
                                </dd>
                            </div>

                            <div>
                                <dt className="text-sm text-muted-foreground">
                                    Vendor
                                </dt>
                                <dd className="font-medium">
                                    {
                                        goodsReceiptNote.purchase_order.vendor
                                            .name
                                    }
                                </dd>
                            </div>

                            <div>
                                <dt className="text-sm text-muted-foreground">
                                    Received date
                                </dt>
                                <dd className="font-medium">
                                    {formatDate(goodsReceiptNote.received_date)}
                                </dd>
                            </div>

                            {goodsReceiptNote.received_by &&
                                goodsReceiptNote.received_at && (
                                    <div>
                                        <dt className="text-sm text-muted-foreground">
                                            Received by
                                        </dt>
                                        <dd className="font-medium">
                                            {
                                                goodsReceiptNote.received_by
                                                    .full_name
                                            }{' '}
                                            &mdash;{' '}
                                            {formatDateTime(
                                                goodsReceiptNote.received_at,
                                            )}
                                        </dd>
                                    </div>
                                )}

                            {goodsReceiptNote.remarks && (
                                <div className="sm:col-span-2">
                                    <dt className="text-sm text-muted-foreground">
                                        Remarks
                                    </dt>
                                    <dd className="font-medium whitespace-pre-line">
                                        {goodsReceiptNote.remarks}
                                    </dd>
                                </div>
                            )}
                        </dl>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Items</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-hidden rounded-xl border border-border/50">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>No</TableHead>
                                        <TableHead>Product</TableHead>
                                        <TableHead>Ordered</TableHead>
                                        <TableHead>Accepted</TableHead>
                                        <TableHead>Rejected</TableHead>
                                        <TableHead>Rejection reason</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {goodsReceiptNote.items.map((item, idx) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="text-muted-foreground">
                                                {idx + 1}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {item.product.product_code}{' '}
                                                &mdash; {item.product.name}
                                            </TableCell>
                                            <TableCell>
                                                {formatNumber(
                                                    item.quantity_ordered,
                                                )}{' '}
                                                {item.unit}
                                            </TableCell>
                                            <TableCell>
                                                {formatNumber(
                                                    item.quantity_accepted,
                                                )}{' '}
                                                {item.unit}
                                            </TableCell>
                                            <TableCell>
                                                {formatNumber(
                                                    item.quantity_rejected,
                                                )}{' '}
                                                {item.unit}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {item.rejection_reason ?? (
                                                    <span>&mdash;</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {goodsReceiptNote.status === 'draft' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Confirm Receipt</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button>Confirm</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogTitle>
                                        Confirm this goods receipt note?
                                    </DialogTitle>
                                    <DialogDescription>
                                        This locks the note and updates the
                                        linked purchase order&apos;s fulfillment
                                        progress. This action cannot be undone.
                                    </DialogDescription>

                                    <Form
                                        {...confirm.form(goodsReceiptNote)}
                                        options={{ preserveScroll: true }}
                                    >
                                        {({ processing }) => (
                                            <>
                                                <WorkforceSelect
                                                    id="received_by_id"
                                                    name="received_by_id"
                                                    value={receivedById}
                                                    onValueChange={
                                                        setReceivedById
                                                    }
                                                    workforces={workforces}
                                                />
                                                <DialogFooter className="gap-2">
                                                    <DialogClose asChild>
                                                        <Button variant="secondary">
                                                            Cancel
                                                        </Button>
                                                    </DialogClose>
                                                    <Button
                                                        type="submit"
                                                        disabled={processing}
                                                    >
                                                        {processing && (
                                                            <Spinner />
                                                        )}
                                                        Confirm
                                                    </Button>
                                                </DialogFooter>
                                            </>
                                        )}
                                    </Form>
                                </DialogContent>
                            </Dialog>
                        </CardContent>
                    </Card>
                )}

                {goodsReceiptNote.status === 'draft' && (
                    <Card className="border-destructive/50">
                        <CardHeader>
                            <CardTitle className="text-destructive">
                                Danger Zone
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col gap-4 rounded-lg border border-red-100 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-red-200/10 dark:bg-red-700/10">
                                <div className="space-y-0.5 text-red-600 dark:text-red-100">
                                    <p className="font-medium">
                                        Delete this goods receipt note
                                    </p>
                                    <p className="text-sm">
                                        Once deleted, this goods receipt note
                                        cannot be restored.
                                    </p>
                                </div>

                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button
                                            variant="destructive"
                                            className="w-full sm:w-auto"
                                        >
                                            <Trash2 />
                                            Delete Goods Receipt Note
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogTitle>
                                            Delete &quot;
                                            {goodsReceiptNote.grn_code}
                                            &quot;?
                                        </DialogTitle>
                                        <DialogDescription>
                                            This action cannot be undone. This
                                            goods receipt note will be
                                            permanently deleted.
                                        </DialogDescription>

                                        <Form
                                            {...destroy.form(goodsReceiptNote)}
                                            options={{ preserveScroll: true }}
                                        >
                                            {({ processing }) => (
                                                <DialogFooter className="gap-2">
                                                    <DialogClose asChild>
                                                        <Button variant="secondary">
                                                            Cancel
                                                        </Button>
                                                    </DialogClose>

                                                    <Button
                                                        variant="destructive"
                                                        disabled={processing}
                                                        asChild
                                                    >
                                                        <button type="submit">
                                                            {processing && (
                                                                <Spinner />
                                                            )}
                                                            Delete Goods Receipt
                                                            Note
                                                        </button>
                                                    </Button>
                                                </DialogFooter>
                                            )}
                                        </Form>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </>
    );
}
