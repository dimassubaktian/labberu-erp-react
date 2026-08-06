import { Form, Head, Link, setLayoutProps, usePage } from '@inertiajs/react';
import { ArrowLeft, Ban, Download, PackageCheck, Pencil, Trash2 } from 'lucide-react';
import InputError from '@/components/input-error';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
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
import { cancel, confirm, destroy, edit, index, signedDocument } from '@/routes/delivery-orders';
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
        product_code: string;
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
    const canConfirm = hasWorkforce && auth.permissions.includes('delivery-orders.confirm');
    const canCancel = auth.permissions.includes('delivery-orders.cancel');

    setLayoutProps({
        breadcrumbs: [
            { title: 'Delivery Orders', href: index() },
            { title: deliveryOrder.do_code, href: index() },
        ],
    });

    return (
        <>
            <Head title={deliveryOrder.do_code} />

            <div className="mx-auto w-full max-w-4xl space-y-6 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <Heading
                        title={deliveryOrder.do_code}
                        description={deliveryOrder.quotation.quotation_code}
                    />

                    <div className="flex flex-col gap-2 sm:flex-row">
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

                <div>
                    <h2 className="mb-4 text-base font-semibold">Details</h2>
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
                                    {deliveryOrder.status.replaceAll('_', ' ')}
                                </Badge>
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
                                {deliveryOrder.quotation.project.customer.name}
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
                                        {deliveryOrder.delivered_by.full_name}{' '}
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
                                        href={signedDocument.url(deliveryOrder)}
                                        className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
                                    >
                                        <Download className="size-4" />
                                        Download
                                    </a>
                                </dd>
                            </div>
                        )}

                        {deliveryOrder.remarks && (
                            <div className="sm:col-span-2">
                                <dt className="text-sm text-muted-foreground">
                                    Remarks
                                </dt>
                                <dd className="font-medium whitespace-pre-line">
                                    {deliveryOrder.remarks}
                                </dd>
                            </div>
                        )}
                    </dl>
                </div>

                <div>
                    <h2 className="mb-4 text-base font-semibold">Items</h2>
                    <div className="overflow-hidden rounded-xl border border-border/50">
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
                                            {item.product.product_code} &mdash;{' '}
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
                </div>

                {deliveryOrder.status === 'draft' && canConfirm && (
                    <div>
                        <h2 className="mb-4 text-base font-semibold">
                            Confirm Delivery
                        </h2>
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
                                    You will be recorded as the deliverer. This
                                    locks the order and updates the linked
                                    quotation&apos;s fulfillment progress. This
                                    action cannot be undone.
                                </DialogDescription>

                                <Form
                                    {...confirm.form(deliveryOrder)}
                                    encType="multipart/form-data"
                                    options={{ preserveScroll: true }}
                                >
                                    {({ processing, errors }) => (
                                        <>
                                            <div className="grid gap-2">
                                                <Label htmlFor="signed_document">
                                                    Signed document
                                                </Label>
                                                <Input
                                                    id="signed_document"
                                                    type="file"
                                                    name="signed_document"
                                                    accept=".pdf,.jpg,.jpeg,.png"
                                                />
                                                <InputError message={errors.signed_document} />
                                            </div>
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
                                                    {processing ? <Spinner /> : <PackageCheck />}
                                                    Confirm delivery
                                                </Button>
                                            </DialogFooter>
                                        </>
                                    )}
                                </Form>
                            </DialogContent>
                        </Dialog>
                    </div>
                )}

                {deliveryOrder.status === 'confirmed' && canCancel && (
                    <div className="space-y-4 rounded-lg border border-destructive/50 p-4">
                        <h2 className="text-base font-semibold text-destructive dark:text-destructive-foreground">
                            Danger Zone
                        </h2>
                        <div className="flex flex-col gap-4 rounded-lg border border-red-100 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-red-200/10 dark:bg-red-700/10">
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
                                        {({ processing }) => (
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
                                                    {processing && <Spinner />}
                                                    Cancel Delivery Order
                                                </Button>
                                            </DialogFooter>
                                        )}
                                    </Form>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                )}

                {deliveryOrder.status === 'draft' && (
                    <div className="space-y-4 rounded-lg border border-destructive/50 p-4">
                        <h2 className="text-base font-semibold text-destructive dark:text-destructive-foreground">
                            Danger Zone
                        </h2>
                        <div className="flex flex-col gap-4 rounded-lg border border-red-100 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-red-200/10 dark:bg-red-700/10">
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
                                                        Delete Delivery Order
                                                    </button>
                                                </Button>
                                            </DialogFooter>
                                        )}
                                    </Form>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
