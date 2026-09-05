import { Form, Head, Link, setLayoutProps, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    Ban,
    Building2,
    CalendarDays,
    ClipboardList,
    Download,
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
import { Input } from '@/components/ui/input';
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
    signedDocument,
} from '@/routes/delivery-orders';
import { show as showQuotation } from '@/routes/quotations';

type WorkforceOption = {
    id: number;
    full_name: string;
};

type DeliveryOrderItem = {
    id: number;
    quantity_ordered: string;
    unit: string;
    quantity_delivered: string;
    product: {
        id: number;
        name: string;
    };
};

type DeliveryOrder = {
    id: number;
    uuid: string;
    do_code: string;
    status: string;
    delivery_date: string;
    remarks: string | null;
    cancel_reason: string | null;
    delivered_at: string | null;
    signed_document_path: string | null;
    quotation: {
        id: number;
        uuid: string;
        quotation_code: string;
        project: { id: number; customer: { id: number; name: string } };
    };
    items: DeliveryOrderItem[];
    delivered_by: WorkforceOption | null;
};

type Props = {
    deliveryOrder: DeliveryOrder;
};

export default function DeliveryOrdersShow({ deliveryOrder }: Props) {
    const { auth } = usePage().props;
    const hasWorkforce = auth.workforce_id !== null;
    const canConfirm =
        hasWorkforce && auth.permissions.includes('delivery-orders.confirm');
    const canCancel = auth.permissions.includes('delivery-orders.cancel');

    const [cancelReason, setCancelReason] = useState('');

    setLayoutProps({
        breadcrumbs: [
            { title: 'Delivery Orders', href: index() },
            { title: deliveryOrder.do_code, href: index() },
        ],
    });

    return (
        <>
            <Head title={deliveryOrder.do_code} />

            <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6">
                <section className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
                    <div className="flex flex-col gap-6 bg-linear-to-br from-primary/[0.08] via-card to-card p-5 sm:p-6 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex min-w-0 gap-4">
                            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                                <PackageCheck className="size-6" />
                            </div>
                            <div className="min-w-0 space-y-2">
                                <p className="text-sm font-medium text-muted-foreground">
                                    Delivery order
                                </p>
                                <div className="flex flex-wrap items-center gap-2">
                                    <h1 className="truncate text-2xl font-semibold tracking-tight sm:text-3xl">
                                        {deliveryOrder.do_code}
                                    </h1>
                                    <StatusBadge
                                        category="document"
                                        value={deliveryOrder.status}
                                    />
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Quotation{' '}
                                    {deliveryOrder.quotation.quotation_code}
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
                                    Back to Delivery Orders
                                </Link>
                            </Button>

                            <PrintDocumentDialog
                                title="Print delivery order"
                                description="Preview or download the delivery order as a PDF."
                                previewUrl={print.url(deliveryOrder)}
                                downloadUrl={print.url(deliveryOrder, {
                                    query: { download: true },
                                })}
                            />

                            {deliveryOrder.status === 'draft' && (
                                <Button asChild className="w-full sm:w-auto">
                                    <Link href={edit(deliveryOrder)}>
                                        <Pencil />
                                        Edit Delivery Order
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
                                    {deliveryOrder.items.length}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Delivery items
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 sm:p-5">
                            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <CalendarDays className="size-4" />
                            </div>
                            <div>
                                <p className="font-medium">
                                    {formatDate(deliveryOrder.delivery_date)}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Scheduled delivery
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
                                        deliveryOrder.quotation.project.customer
                                            .name
                                    }
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Customer
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <Card>
                    <CardHeader className="border-b border-border/60 pb-5">
                        <CardTitle>Delivery details</CardTitle>
                        <CardDescription>
                            Fulfillment, recipient, and supporting document
                            information.
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
                                        value={deliveryOrder.status}
                                    />
                                </dd>
                            </div>

                            <div>
                                <dt className="text-sm text-muted-foreground">
                                    Quotation
                                </dt>
                                <dd className="font-medium">
                                    <Link
                                        href={showQuotation(
                                            deliveryOrder.quotation,
                                        )}
                                    >
                                        {deliveryOrder.quotation.quotation_code}
                                    </Link>
                                </dd>
                            </div>

                            <div>
                                <dt className="text-sm text-muted-foreground">
                                    Customer
                                </dt>
                                <dd className="font-medium">
                                    {
                                        deliveryOrder.quotation.project.customer
                                            .name
                                    }
                                </dd>
                            </div>

                            <div>
                                <dt className="text-sm text-muted-foreground">
                                    Delivery date
                                </dt>
                                <dd className="font-medium">
                                    {formatDate(deliveryOrder.delivery_date)}
                                </dd>
                            </div>

                            {deliveryOrder.delivered_by &&
                                deliveryOrder.delivered_at && (
                                    <div>
                                        <dt className="text-sm text-muted-foreground">
                                            Delivered by
                                        </dt>
                                        <dd className="font-medium">
                                            {
                                                deliveryOrder.delivered_by
                                                    .full_name
                                            }{' '}
                                            &mdash;{' '}
                                            {formatDateTime(
                                                deliveryOrder.delivered_at,
                                            )}
                                        </dd>
                                    </div>
                                )}

                            {deliveryOrder.signed_document_path && (
                                <div>
                                    <dt className="text-sm text-muted-foreground">
                                        Signed document
                                    </dt>
                                    <dd className="font-medium">
                                        <a
                                            href={signedDocument.url(
                                                deliveryOrder,
                                            )}
                                            className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline dark:text-[oklch(0.72_0.13_160)]"
                                        >
                                            <Download className="size-4" />
                                            Download
                                        </a>
                                    </dd>
                                </div>
                            )}

                            {deliveryOrder.remarks && (
                                <div className="sm:col-span-2 lg:col-span-3">
                                    <dt className="text-sm text-muted-foreground">
                                        Remarks
                                    </dt>
                                    <dd className="font-medium whitespace-pre-line">
                                        {deliveryOrder.remarks}
                                    </dd>
                                </div>
                            )}

                            {deliveryOrder.cancel_reason && (
                                <div className="sm:col-span-2 lg:col-span-3">
                                    <dt className="text-sm text-muted-foreground">
                                        Cancellation reason
                                    </dt>
                                    <dd className="font-medium whitespace-pre-line">
                                        {deliveryOrder.cancel_reason}
                                    </dd>
                                </div>
                            )}
                        </dl>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="gap-3 border-b border-border/60 pb-5 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle>Delivery items</CardTitle>
                            <CardDescription>
                                Quantities ordered and recorded for delivery.
                            </CardDescription>
                        </div>
                        <span className="self-start rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground sm:self-auto">
                            {deliveryOrder.items.length}{' '}
                            {deliveryOrder.items.length === 1
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
                                        <TableHead>Delivered</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {deliveryOrder.items.map((item, idx) => (
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
                                                    item.quantity_delivered,
                                                )}{' '}
                                                {item.unit}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {deliveryOrder.status === 'draft' && canConfirm && (
                    <Card>
                        <CardHeader className="border-b border-border/60 pb-5">
                            <CardTitle>Confirm delivery</CardTitle>
                            <CardDescription>
                                Record the handoff and lock this delivery order.
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
                                        Confirm this delivery order?
                                    </DialogTitle>
                                    <DialogDescription>
                                        You will be recorded as the deliverer.
                                        This locks the order and updates the
                                        linked quotation&apos;s fulfillment
                                        progress. This action cannot be undone.
                                    </DialogDescription>

                                    <Form
                                        {...confirm.form(deliveryOrder)}
                                        encType="multipart/form-data"
                                        options={{ preserveScroll: true }}
                                    >
                                        {({ processing, errors }) => (
                                            <>
                                                <div className="mb-4 grid gap-2">
                                                    <Label htmlFor="signed_document">
                                                        Signed document
                                                    </Label>
                                                    <Input
                                                        id="signed_document"
                                                        type="file"
                                                        name="signed_document"
                                                        accept=".pdf,.jpg,.jpeg,.png"
                                                    />
                                                    <InputError
                                                        message={
                                                            errors.signed_document
                                                        }
                                                    />
                                                    <InputError
                                                        message={errors.items}
                                                    />
                                                </div>
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
                                                        Confirm delivery
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

                {deliveryOrder.status === 'confirmed' && canCancel && (
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
                                    delivery records.
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-4 rounded-xl border border-red-100 bg-red-50/70 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-red-200/10 dark:bg-red-700/10">
                            <div className="space-y-0.5 text-red-600 dark:text-red-100">
                                <p className="font-medium">
                                    Cancel this delivery order
                                </p>
                                <p className="text-sm">
                                    Reverses stock movements and recomputes
                                    quotation progress. This action cannot be
                                    undone.
                                </p>
                            </div>

                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button
                                        variant="destructive"
                                        className="w-full sm:w-auto"
                                    >
                                        <Ban />
                                        Cancel Delivery Order
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogTitle>
                                        Cancel &quot;
                                        {deliveryOrder.do_code}
                                        &quot;?
                                    </DialogTitle>
                                    <DialogDescription>
                                        Stock movements will be reversed and the
                                        quotation&apos;s fulfillment progress
                                        will be recomputed. This action cannot
                                        be undone.
                                    </DialogDescription>

                                    <Form
                                        {...cancel.form(deliveryOrder)}
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
                                                        Cancel Delivery Order
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

                {deliveryOrder.status === 'draft' && (
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
                                    Permanently remove this draft delivery
                                    order.
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-4 rounded-xl border border-red-100 bg-red-50/70 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-red-200/10 dark:bg-red-700/10">
                            <div className="space-y-0.5 text-red-600 dark:text-red-100">
                                <p className="font-medium">
                                    Delete this delivery order
                                </p>
                                <p className="text-sm">
                                    Once deleted, this delivery order cannot be
                                    restored.
                                </p>
                            </div>

                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button
                                        variant="destructive"
                                        className="w-full sm:w-auto"
                                    >
                                        <Trash2 />
                                        Delete Delivery Order
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogTitle>
                                        Delete &quot;
                                        {deliveryOrder.do_code}
                                        &quot;?
                                    </DialogTitle>
                                    <DialogDescription>
                                        This action cannot be undone. This
                                        delivery order will be permanently
                                        deleted.
                                    </DialogDescription>

                                    <Form
                                        {...destroy.form(deliveryOrder)}
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
                                                        Delete Delivery Order
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
