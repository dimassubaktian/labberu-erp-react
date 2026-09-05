import { Form, Head, Link, setLayoutProps, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    Ban,
    Building2,
    CalendarDays,
    ClipboardList,
    PackageCheck,
    Pencil,
    Trash2,
    X,
} from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { PrintDocumentDialog } from '@/components/print-document-dialog';
import { StatusBadge } from '@/components/project-badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
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
import { Spinner } from '@/components/ui/spinner';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { formatDate, formatDateTime, formatNumber } from '@/lib/utils';
import {
    cancel,
    confirm,
    destroy,
    edit,
    index,
    print,
} from '@/routes/goods-receipt-notes';
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
    cancel_reason: string | null;
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
};

export default function GoodsReceiptNotesShow({ goodsReceiptNote }: Props) {
    const { auth } = usePage().props;
    const hasWorkforce = auth.workforce_id !== null;
    const canConfirm =
        hasWorkforce &&
        auth.permissions.includes('goods-receipt-notes.confirm');
    const canCancel = auth.permissions.includes('goods-receipt-notes.cancel');

    const [cancelReason, setCancelReason] = useState('');

    setLayoutProps({
        breadcrumbs: [
            { title: 'Goods Receipt Notes', href: index() },
            { title: goodsReceiptNote.grn_code, href: index() },
        ],
    });

    return (
        <>
            <Head title={goodsReceiptNote.grn_code} />

            <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6">
                <section className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
                    <div className="flex flex-col gap-6 bg-linear-to-br from-primary/[0.08] via-card to-card p-5 sm:p-6 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex min-w-0 gap-4">
                            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                                <PackageCheck className="size-6" />
                            </div>
                            <div className="min-w-0 space-y-2">
                                <p className="text-sm font-medium text-muted-foreground">
                                    Goods receipt note
                                </p>
                                <div className="flex flex-wrap items-center gap-2">
                                    <h1 className="truncate text-2xl font-semibold tracking-tight sm:text-3xl">
                                        {goodsReceiptNote.grn_code}
                                    </h1>
                                    <StatusBadge
                                        category="document"
                                        value={goodsReceiptNote.status}
                                    />
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Purchase order{' '}
                                    {
                                        goodsReceiptNote.purchase_order
                                            .purchase_order_code
                                    }
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row lg:shrink-0">
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

                            <PrintDocumentDialog
                                title="Print goods receipt note"
                                description="Preview or download the goods receipt note as a PDF."
                                previewUrl={print.url(goodsReceiptNote)}
                                downloadUrl={print.url(goodsReceiptNote, {
                                    query: { download: true },
                                })}
                            />

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

                    <div className="grid divide-y divide-border/60 border-t border-border/60 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                        <div className="flex items-center gap-3 p-4 sm:p-5">
                            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <ClipboardList className="size-4" />
                            </div>
                            <div>
                                <p className="text-2xl font-semibold tracking-tight">
                                    {goodsReceiptNote.items.length}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Receipt items
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 sm:p-5">
                            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <CalendarDays className="size-4" />
                            </div>
                            <div>
                                <p className="font-medium">
                                    {formatDate(goodsReceiptNote.received_date)}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Received date
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 sm:p-5">
                            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <Building2 className="size-4" />
                            </div>
                            <div className="min-w-0">
                                <p className="truncate font-medium">
                                    {
                                        goodsReceiptNote.purchase_order.vendor
                                            .name
                                    }
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Vendor
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <Card>
                    <CardHeader className="border-b border-border/60 pb-5">
                        <CardTitle>Receipt details</CardTitle>
                        <CardDescription>
                            Receiving status, vendor, and purchase-order
                            context.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                            <div>
                                <dt className="text-sm text-muted-foreground">
                                    Status
                                </dt>
                                <dd>
                                    <StatusBadge
                                        category="document"
                                        value={goodsReceiptNote.status}
                                    />
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
                                <div className="sm:col-span-2 lg:col-span-3">
                                    <dt className="text-sm text-muted-foreground">
                                        Remarks
                                    </dt>
                                    <dd className="font-medium whitespace-pre-line">
                                        {goodsReceiptNote.remarks}
                                    </dd>
                                </div>
                            )}

                            {goodsReceiptNote.cancel_reason && (
                                <div className="sm:col-span-2 lg:col-span-3">
                                    <dt className="text-sm text-muted-foreground">
                                        Cancellation reason
                                    </dt>
                                    <dd className="font-medium whitespace-pre-line">
                                        {goodsReceiptNote.cancel_reason}
                                    </dd>
                                </div>
                            )}
                        </dl>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="gap-3 border-b border-border/60 pb-5 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle>Received items</CardTitle>
                            <CardDescription>
                                Ordered, accepted, and rejected quantities.
                            </CardDescription>
                        </div>
                        <span className="self-start rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground sm:self-auto">
                            {goodsReceiptNote.items.length}{' '}
                            {goodsReceiptNote.items.length === 1
                                ? 'item'
                                : 'items'}
                        </span>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="overflow-hidden rounded-xl border border-border/60">
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
                                                {item.product.name}
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

                {goodsReceiptNote.status === 'draft' && canConfirm && (
                    <Card>
                        <CardHeader className="border-b border-border/60 pb-5">
                            <CardTitle>Confirm receipt</CardTitle>
                            <CardDescription>
                                Record the receipt and lock this goods receipt
                                note.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button>
                                        <PackageCheck />
                                        Confirm
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogTitle>
                                        Confirm this goods receipt note?
                                    </DialogTitle>
                                    <DialogDescription>
                                        You will be recorded as the receiver.
                                        This locks the note and updates the
                                        linked purchase order&apos;s fulfillment
                                        progress. This action cannot be undone.
                                    </DialogDescription>

                                    <Form
                                        {...confirm.form(goodsReceiptNote)}
                                        options={{ preserveScroll: true }}
                                    >
                                        {({ processing }) => (
                                            <DialogFooter className="gap-2">
                                                <DialogClose asChild>
                                                    <Button
                                                        variant="ghost"
                                                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                    >
                                                        <X /> Cancel
                                                    </Button>
                                                </DialogClose>
                                                <Button
                                                    type="submit"
                                                    disabled={processing}
                                                >
                                                    {processing ? (
                                                        <Spinner />
                                                    ) : (
                                                        <PackageCheck />
                                                    )}
                                                    Confirm
                                                </Button>
                                            </DialogFooter>
                                        )}
                                    </Form>
                                </DialogContent>
                            </Dialog>
                        </CardContent>
                    </Card>
                )}

                {goodsReceiptNote.status === 'confirmed' && canCancel && (
                    <section className="space-y-4 rounded-2xl border border-destructive/30 bg-destructive/[0.02] p-4 sm:p-6">
                        <div className="flex items-start gap-3">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                                <Ban className="size-4" />
                            </div>
                            <div>
                                <h2 className="font-semibold text-destructive dark:text-destructive-foreground">
                                    Danger zone
                                </h2>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    These actions reverse or permanently remove
                                    receipt records.
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-4 rounded-xl border border-red-100 bg-red-50/70 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-red-200/10 dark:bg-red-700/10">
                            <div className="space-y-0.5 text-red-600 dark:text-red-100">
                                <p className="font-medium">
                                    Cancel this goods receipt note
                                </p>
                                <p className="text-sm">
                                    Reverses stock movements and recomputes
                                    purchase order progress. This action cannot
                                    be undone.
                                </p>
                            </div>

                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button
                                        variant="destructive"
                                        className="w-full sm:w-auto"
                                    >
                                        <Ban />
                                        Cancel GRN
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogTitle>
                                        Cancel &quot;
                                        {goodsReceiptNote.grn_code}
                                        &quot;?
                                    </DialogTitle>
                                    <DialogDescription>
                                        Stock movements will be reversed and the
                                        purchase order&apos;s fulfillment
                                        progress will be recomputed. This action
                                        cannot be undone.
                                    </DialogDescription>

                                    <Form
                                        {...cancel.form(goodsReceiptNote)}
                                        options={{ preserveScroll: true }}
                                    >
                                        {({ processing, errors }) => (
                                            <>
                                                <div className="grid gap-2 py-2">
                                                    <Label htmlFor="cancel_reason">
                                                        Cancellation reason
                                                    </Label>
                                                    <Textarea
                                                        id="cancel_reason"
                                                        name="cancel_reason"
                                                        value={cancelReason}
                                                        onChange={(e) =>
                                                            setCancelReason(
                                                                e.target.value,
                                                            )
                                                        }
                                                        required
                                                        rows={3}
                                                    />
                                                    <InputError
                                                        message={
                                                            errors.cancel_reason
                                                        }
                                                    />
                                                </div>
                                                <DialogFooter className="gap-2">
                                                    <DialogClose asChild>
                                                        <Button variant="secondary">
                                                            Keep
                                                        </Button>
                                                    </DialogClose>
                                                    <Button
                                                        type="submit"
                                                        variant="destructive"
                                                        disabled={processing}
                                                    >
                                                        {processing && (
                                                            <Spinner />
                                                        )}
                                                        Cancel GRN
                                                    </Button>
                                                </DialogFooter>
                                            </>
                                        )}
                                    </Form>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </section>
                )}

                {goodsReceiptNote.status === 'draft' && (
                    <section className="space-y-4 rounded-2xl border border-destructive/30 bg-destructive/[0.02] p-4 sm:p-6">
                        <div className="flex items-start gap-3">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                                <Trash2 className="size-4" />
                            </div>
                            <div>
                                <h2 className="font-semibold text-destructive dark:text-destructive-foreground">
                                    Danger zone
                                </h2>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Permanently remove this draft goods receipt
                                    note.
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-4 rounded-xl border border-red-100 bg-red-50/70 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-red-200/10 dark:bg-red-700/10">
                            <div className="space-y-0.5 text-red-600 dark:text-red-100">
                                <p className="font-medium">
                                    Delete this goods receipt note
                                </p>
                                <p className="text-sm">
                                    Once deleted, this goods receipt note cannot
                                    be restored.
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
                                        This action cannot be undone. This goods
                                        receipt note will be permanently
                                        deleted.
                                    </DialogDescription>

                                    <Form
                                        {...destroy.form(goodsReceiptNote)}
                                        options={{ preserveScroll: true }}
                                    >
                                        {({ processing }) => (
                                            <DialogFooter className="gap-2">
                                                <DialogClose asChild>
                                                    <Button
                                                        variant="ghost"
                                                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                    >
                                                        <X /> Cancel
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
                    </section>
                )}
            </div>
        </>
    );
}
