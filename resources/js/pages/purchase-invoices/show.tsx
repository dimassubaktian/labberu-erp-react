import { Form, Head, Link, setLayoutProps } from '@inertiajs/react';
import {
    ArrowLeft,
    Ban,
    Banknote,
    CircleDollarSign,
    CircleCheck,
    Download,
    FileText,
    Pencil,
    SendHorizonal,
    Trash2,
    X,
} from 'lucide-react';
import { useRef, useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { formatDate, formatDateTime, formatNumber } from '@/lib/utils';
import { destroy, edit, index, issue } from '@/routes/purchase-invoices';
import {
    cancel as cancelPayment,
    proof as proofPayment,
    store as storePayment,
} from '@/routes/purchase-invoices/payments';
import { show as showPurchaseOrder } from '@/routes/purchase-orders';

type PurchaseInvoiceItem = {
    id: number;
    quantity_ordered: string;
    unit: string;
    unit_price: string;
    quantity_invoiced: string;
    total: string;
    product: {
        id: number;
        name: string;
    };
};

type PurchaseInvoicePayment = {
    id: number;
    amount: string;
    payment_date: string;
    method: string | null;
    remarks: string | null;
    proof_of_payment_path: string | null;
    recorded_by: { id: number; name: string } | null;
    cancelled_at: string | null;
    cancel_reason: string | null;
    cancelled_by: { id: number; name: string } | null;
};

type PurchaseInvoice = {
    id: number;
    uuid: string;
    purchase_invoice_code: string;
    status: string;
    payment_status: string | null;
    invoice_date: string;
    due_date: string;
    remarks: string | null;
    subtotal: string;
    discount_amount: string;
    tax_amount: string;
    total: string;
    issued_at: string | null;
    purchase_order: {
        id: number;
        uuid: string;
        purchase_order_code: string;
        vendor: { id: number; name: string };
        currency: { id: number; iso_code: string; symbol: string | null };
    };
    tax: { id: number; name: string; rate: string; type: string } | null;
    items: PurchaseInvoiceItem[];
    payments: PurchaseInvoicePayment[];
};

type Props = {
    purchaseInvoice: PurchaseInvoice;
};

export default function PurchaseInvoicesShow({ purchaseInvoice }: Props) {
    setLayoutProps({
        breadcrumbs: [
            { title: 'Purchase Invoices', href: index() },
            {
                title: purchaseInvoice.purchase_invoice_code,
                href: index(),
            },
        ],
    });

    const [paymentMethod, setPaymentMethod] = useState('none');
    const amountRef = useRef<HTMLInputElement>(null);

    const currencySymbol =
        purchaseInvoice.purchase_order.currency.symbol ??
        purchaseInvoice.purchase_order.currency.iso_code;
    const totalPaid = purchaseInvoice.payments.reduce(
        (sum, payment) =>
            payment.cancelled_at ? sum : sum + Number(payment.amount),
        0,
    );
    const balanceDue = Number(purchaseInvoice.total) - totalPaid;

    return (
        <>
            <Head title={purchaseInvoice.purchase_invoice_code} />

            <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6">
                <section className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
                    <div className="flex flex-col gap-6 bg-linear-to-br from-primary/[0.08] via-card to-card p-5 sm:p-6 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex min-w-0 items-start gap-4">
                            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:size-14">
                                <FileText className="size-6 sm:size-7" />
                            </div>
                            <div className="min-w-0 space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Purchase invoice
                                    </p>
                                    <StatusBadge
                                        category="document"
                                        value={purchaseInvoice.status}
                                    />
                                    {purchaseInvoice.payment_status && (
                                        <StatusBadge
                                            category="payment"
                                            value={
                                                purchaseInvoice.payment_status
                                            }
                                        />
                                    )}
                                </div>
                                <div>
                                    <h1 className="text-2xl font-semibold tracking-tight break-words sm:text-3xl">
                                        {purchaseInvoice.purchase_invoice_code}
                                    </h1>
                                    <p className="mt-1 text-sm text-muted-foreground sm:text-base">
                                        {
                                            purchaseInvoice.purchase_order
                                                .vendor.name
                                        }{' '}
                                        · Purchase order{' '}
                                        {
                                            purchaseInvoice.purchase_order
                                                .purchase_order_code
                                        }
                                    </p>
                                </div>
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
                                    Back to Purchase Invoices
                                </Link>
                            </Button>

                            {purchaseInvoice.status === 'draft' && (
                                <Button asChild className="w-full sm:w-auto">
                                    <Link href={edit(purchaseInvoice)}>
                                        <Pencil />
                                        Edit Purchase Invoice
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="grid divide-y divide-border/60 border-t border-border/60 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                        <div className="space-y-1 p-4 sm:p-5">
                            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                Invoice date
                            </p>
                            <p className="font-semibold">
                                {formatDate(purchaseInvoice.invoice_date)}
                            </p>
                        </div>
                        <div className="space-y-1 p-4 sm:p-5">
                            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                Due date
                            </p>
                            <p className="font-semibold">
                                {formatDate(purchaseInvoice.due_date)}
                            </p>
                        </div>
                        <div className="space-y-1 p-4 sm:p-5">
                            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                Amount payable
                            </p>
                            <p className="font-semibold">
                                {currencySymbol}{' '}
                                {formatNumber(purchaseInvoice.total)}
                            </p>
                        </div>
                    </div>
                </section>

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(20rem,0.75fr)]">
                    <Card>
                        <CardHeader className="border-b border-border/60 pb-5">
                            <CardTitle>Payable details</CardTitle>
                            <CardDescription>
                                Vendor, source document, and payable dates.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
                                <div className="space-y-1">
                                    <dt className="text-sm text-muted-foreground">
                                        Vendor
                                    </dt>
                                    <dd className="font-medium">
                                        {
                                            purchaseInvoice.purchase_order
                                                .vendor.name
                                        }
                                    </dd>
                                </div>
                                <div className="space-y-1">
                                    <dt className="text-sm text-muted-foreground">
                                        Purchase order
                                    </dt>
                                    <dd className="font-medium">
                                        <Link
                                            href={showPurchaseOrder(
                                                purchaseInvoice.purchase_order,
                                            )}
                                            className="hover:text-primary hover:underline"
                                        >
                                            {
                                                purchaseInvoice.purchase_order
                                                    .purchase_order_code
                                            }
                                        </Link>
                                    </dd>
                                </div>
                                <div className="space-y-1">
                                    <dt className="text-sm text-muted-foreground">
                                        Invoice date
                                    </dt>
                                    <dd className="font-medium">
                                        {formatDate(
                                            purchaseInvoice.invoice_date,
                                        )}
                                    </dd>
                                </div>
                                <div className="space-y-1">
                                    <dt className="text-sm text-muted-foreground">
                                        Due date
                                    </dt>
                                    <dd className="font-medium">
                                        {formatDate(purchaseInvoice.due_date)}
                                    </dd>
                                </div>
                                {purchaseInvoice.issued_at && (
                                    <div className="space-y-1">
                                        <dt className="text-sm text-muted-foreground">
                                            Issued at
                                        </dt>
                                        <dd className="font-medium">
                                            {formatDateTime(
                                                purchaseInvoice.issued_at,
                                            )}
                                        </dd>
                                    </div>
                                )}
                            </dl>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="border-b border-border/60 pb-5">
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-muted p-2 text-muted-foreground">
                                    <CircleDollarSign className="size-5" />
                                </div>
                                <div>
                                    <CardTitle>Payment overview</CardTitle>
                                    <CardDescription>
                                        Paid amount and remaining payable.
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-5 pt-6">
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">
                                    Amount payable
                                </p>
                                <p className="text-xl font-semibold tracking-tight">
                                    {currencySymbol}{' '}
                                    {formatNumber(purchaseInvoice.total)}
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4 border-t border-border/60 pt-5">
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">
                                        Amount paid
                                    </p>
                                    <p className="font-semibold">
                                        {currencySymbol}{' '}
                                        {formatNumber(totalPaid)}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">
                                        Balance due
                                    </p>
                                    <p className="font-semibold">
                                        {currencySymbol}{' '}
                                        {formatNumber(balanceDue)}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {purchaseInvoice.remarks && (
                    <Card>
                        <CardHeader className="border-b border-border/60 pb-5">
                            <CardTitle>Remarks</CardTitle>
                            <CardDescription>
                                Additional notes for this purchase invoice.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <p className="text-sm leading-6 whitespace-pre-line text-muted-foreground">
                                {purchaseInvoice.remarks}
                            </p>
                        </CardContent>
                    </Card>
                )}

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(20rem,0.75fr)]">
                    <Card className="overflow-hidden">
                        <CardHeader className="border-b border-border/60 pb-5">
                            <CardTitle>Invoice items</CardTitle>
                            <CardDescription>
                                {purchaseInvoice.items.length} line item
                                {purchaseInvoice.items.length === 1 ? '' : 's'}{' '}
                                received from this vendor.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-muted/40">
                                    <TableRow>
                                        <TableHead className="pl-5">
                                            No
                                        </TableHead>
                                        <TableHead>Product</TableHead>
                                        <TableHead>Qty invoiced</TableHead>
                                        <TableHead>Unit price</TableHead>
                                        <TableHead className="pr-5 text-right">
                                            Total
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {purchaseInvoice.items.map((item, idx) => (
                                        <TableRow
                                            key={item.id}
                                            className="hover:bg-muted/30"
                                        >
                                            <TableCell className="pl-5 text-muted-foreground">
                                                {idx + 1}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {item.product.name}
                                            </TableCell>
                                            <TableCell>
                                                {formatNumber(
                                                    item.quantity_invoiced,
                                                )}{' '}
                                                {item.unit}
                                            </TableCell>
                                            <TableCell>
                                                {formatNumber(item.unit_price)}
                                            </TableCell>
                                            <TableCell className="pr-5 text-right font-medium">
                                                {formatNumber(item.total)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="border-b border-border/60 pb-5">
                            <CardTitle>Payable summary</CardTitle>
                            <CardDescription>
                                Calculated totals and payment balance.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <dl className="space-y-3">
                                <div className="flex justify-between gap-4">
                                    <dt className="text-muted-foreground">
                                        Subtotal
                                    </dt>
                                    <dd className="font-medium">
                                        {currencySymbol}{' '}
                                        {formatNumber(purchaseInvoice.subtotal)}
                                    </dd>
                                </div>
                                <div className="flex justify-between gap-4">
                                    <dt className="text-muted-foreground">
                                        Discount
                                    </dt>
                                    <dd className="font-medium">
                                        {currencySymbol}{' '}
                                        {formatNumber(
                                            purchaseInvoice.discount_amount,
                                        )}
                                    </dd>
                                </div>
                                <div className="flex justify-between gap-4">
                                    <dt className="text-muted-foreground">
                                        Tax
                                        {purchaseInvoice.tax &&
                                            ` (${purchaseInvoice.tax.name})`}
                                    </dt>
                                    <dd className="font-medium">
                                        {currencySymbol}{' '}
                                        {formatNumber(
                                            purchaseInvoice.tax_amount,
                                        )}
                                    </dd>
                                </div>
                                <div className="flex justify-between gap-4 border-t border-border pt-3 text-base font-semibold">
                                    <dt>Total</dt>
                                    <dd>
                                        {currencySymbol}{' '}
                                        {formatNumber(purchaseInvoice.total)}
                                    </dd>
                                </div>
                                <div className="flex justify-between gap-4">
                                    <dt className="text-muted-foreground">
                                        Amount paid
                                    </dt>
                                    <dd className="font-medium">
                                        {currencySymbol}{' '}
                                        {formatNumber(totalPaid)}
                                    </dd>
                                </div>
                                <div className="flex justify-between gap-4">
                                    <dt className="text-muted-foreground">
                                        Balance due
                                    </dt>
                                    <dd className="font-medium">
                                        {currencySymbol}{' '}
                                        {formatNumber(balanceDue)}
                                    </dd>
                                </div>
                            </dl>
                        </CardContent>
                    </Card>
                </div>

                {purchaseInvoice.status === 'draft' && (
                    <Card>
                        <CardHeader className="border-b border-border/60 pb-5">
                            <CardTitle>Issue purchase invoice</CardTitle>
                            <CardDescription>
                                Lock this purchase invoice and make it ready to
                                record payments.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button>
                                        <SendHorizonal />
                                        Issue
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogTitle>
                                        Issue this purchase invoice?
                                    </DialogTitle>
                                    <DialogDescription>
                                        This locks the purchase invoice from
                                        further edits and makes it ready to
                                        receive payments.
                                    </DialogDescription>

                                    <Form
                                        {...issue.form(purchaseInvoice)}
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
                                                        <SendHorizonal />
                                                    )}
                                                    Issue
                                                </Button>
                                            </DialogFooter>
                                        )}
                                    </Form>
                                </DialogContent>
                            </Dialog>
                        </CardContent>
                    </Card>
                )}

                {purchaseInvoice.status === 'issued' && (
                    <Card>
                        <CardHeader className="border-b border-border/60 pb-5">
                            <CardTitle>Payments</CardTitle>
                            <CardDescription>
                                Review recorded vendor payments or add the next
                                payment against the outstanding balance.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            {purchaseInvoice.payments.length > 0 && (
                                <div className="overflow-hidden rounded-xl border border-border/60">
                                    <Table>
                                        <TableHeader className="bg-muted/40">
                                            <TableRow>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Amount</TableHead>
                                                <TableHead>Method</TableHead>
                                                <TableHead>
                                                    Recorded by
                                                </TableHead>
                                                <TableHead>Proof</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead />
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {purchaseInvoice.payments.map(
                                                (payment) => (
                                                    <TableRow
                                                        key={payment.id}
                                                        className="hover:bg-muted/30"
                                                    >
                                                        <TableCell>
                                                            {formatDate(
                                                                payment.payment_date,
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="font-medium">
                                                            {currencySymbol}{' '}
                                                            {formatNumber(
                                                                payment.amount,
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-muted-foreground">
                                                            {payment.method ?? (
                                                                <span>
                                                                    &mdash;
                                                                </span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-muted-foreground">
                                                            {payment.recorded_by
                                                                ?.name ?? (
                                                                <span>
                                                                    &mdash;
                                                                </span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            {payment.proof_of_payment_path ? (
                                                                <a
                                                                    href={proofPayment.url(
                                                                        {
                                                                            purchaseInvoice,
                                                                            payment,
                                                                        },
                                                                    )}
                                                                    className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline dark:text-[oklch(0.72_0.13_160)]"
                                                                >
                                                                    <Download className="size-4" />
                                                                    Download
                                                                </a>
                                                            ) : (
                                                                <span className="text-muted-foreground">
                                                                    &mdash;
                                                                </span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            {payment.cancelled_at ? (
                                                                <div className="space-y-0.5">
                                                                    <StatusBadge
                                                                        category="cancelled"
                                                                        value="cancelled"
                                                                        label="Cancelled"
                                                                    />
                                                                    {payment.cancel_reason && (
                                                                        <p className="text-xs text-muted-foreground">
                                                                            {
                                                                                payment.cancel_reason
                                                                            }
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <span className="text-muted-foreground">
                                                                    &mdash;
                                                                </span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            {!payment.cancelled_at && (
                                                                <Dialog>
                                                                    <DialogTrigger
                                                                        asChild
                                                                    >
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="icon"
                                                                        >
                                                                            <Ban className="text-destructive dark:text-destructive-foreground" />
                                                                        </Button>
                                                                    </DialogTrigger>
                                                                    <DialogContent>
                                                                        <DialogTitle>
                                                                            Cancel
                                                                            this
                                                                            payment?
                                                                        </DialogTitle>
                                                                        <DialogDescription>
                                                                            This
                                                                            will
                                                                            recalculate
                                                                            the
                                                                            purchase
                                                                            invoice&apos;s
                                                                            payment
                                                                            status.
                                                                            This
                                                                            action
                                                                            cannot
                                                                            be
                                                                            undone.
                                                                        </DialogDescription>

                                                                        <Form
                                                                            {...cancelPayment.form(
                                                                                {
                                                                                    purchaseInvoice,
                                                                                    payment,
                                                                                },
                                                                            )}
                                                                            options={{
                                                                                preserveScroll: true,
                                                                            }}
                                                                        >
                                                                            {({
                                                                                processing,
                                                                                errors,
                                                                            }) => (
                                                                                <>
                                                                                    <div className="grid gap-2 py-2">
                                                                                        <Label htmlFor="cancel_reason">
                                                                                            Cancellation
                                                                                            reason
                                                                                        </Label>
                                                                                        <Textarea
                                                                                            id="cancel_reason"
                                                                                            name="cancel_reason"
                                                                                            required
                                                                                            rows={
                                                                                                3
                                                                                            }
                                                                                        />
                                                                                        <p className="text-sm text-destructive dark:text-destructive-foreground">
                                                                                            {
                                                                                                errors.cancel_reason
                                                                                            }
                                                                                        </p>
                                                                                    </div>
                                                                                    <DialogFooter className="gap-2">
                                                                                        <DialogClose
                                                                                            asChild
                                                                                        >
                                                                                            <Button variant="secondary">
                                                                                                Keep
                                                                                            </Button>
                                                                                        </DialogClose>
                                                                                        <Button
                                                                                            type="submit"
                                                                                            variant="destructive"
                                                                                            disabled={
                                                                                                processing
                                                                                            }
                                                                                        >
                                                                                            {processing && (
                                                                                                <Spinner />
                                                                                            )}
                                                                                            Cancel
                                                                                            Payment
                                                                                        </Button>
                                                                                    </DialogFooter>
                                                                                </>
                                                                            )}
                                                                        </Form>
                                                                    </DialogContent>
                                                                </Dialog>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                ),
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}

                            {balanceDue > 0 && (
                                <Form
                                    noValidate
                                    {...storePayment.form(purchaseInvoice)}
                                    encType="multipart/form-data"
                                    options={{ preserveScroll: true }}
                                    resetOnSuccess
                                >
                                    {({ processing, errors }) => (
                                        <div className="grid gap-4 rounded-xl border border-border/60 bg-muted/20 p-4">
                                            <div className="flex justify-end">
                                                <Button
                                                    type="button"
                                                    variant="default"
                                                    size="sm"
                                                    onClick={() => {
                                                        if (amountRef.current) {
                                                            amountRef.current.value =
                                                                String(
                                                                    balanceDue,
                                                                );
                                                        }
                                                    }}
                                                >
                                                    <Banknote />
                                                    Pay all remaining
                                                </Button>
                                            </div>

                                            <div className="grid gap-2 sm:grid-cols-2">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="amount">
                                                        Amount
                                                    </Label>
                                                    <Input
                                                        ref={amountRef}
                                                        id="amount"
                                                        type="number"
                                                        step="1"
                                                        name="amount"
                                                        defaultValue="0"
                                                    />
                                                    <p className="text-sm text-destructive dark:text-destructive-foreground">
                                                        {errors.amount}
                                                    </p>
                                                </div>

                                                <div className="grid gap-2">
                                                    <Label htmlFor="payment_date">
                                                        Payment date
                                                    </Label>
                                                    <Input
                                                        id="payment_date"
                                                        type="date"
                                                        name="payment_date"
                                                        defaultValue={new Date()
                                                            .toISOString()
                                                            .slice(0, 10)}
                                                    />
                                                    <p className="text-sm text-destructive dark:text-destructive-foreground">
                                                        {errors.payment_date}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="grid gap-2 sm:grid-cols-2 sm:items-start">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="method">
                                                        Method
                                                    </Label>
                                                    <input
                                                        type="hidden"
                                                        name="method"
                                                        value={
                                                            paymentMethod ===
                                                            'none'
                                                                ? ''
                                                                : paymentMethod
                                                        }
                                                    />
                                                    <Select
                                                        value={paymentMethod}
                                                        onValueChange={
                                                            setPaymentMethod
                                                        }
                                                    >
                                                        <SelectTrigger
                                                            id="method"
                                                            className="w-full"
                                                        >
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="none">
                                                                None
                                                            </SelectItem>
                                                            <SelectItem value="Bank Transfer">
                                                                Bank Transfer
                                                            </SelectItem>
                                                            <SelectItem value="Card">
                                                                Card
                                                            </SelectItem>
                                                            <SelectItem value="QRIS">
                                                                QRIS
                                                            </SelectItem>
                                                            <SelectItem value="Cash">
                                                                Cash
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <p className="text-sm text-destructive dark:text-destructive-foreground">
                                                        {errors.method}
                                                    </p>
                                                </div>

                                                <div className="grid gap-2">
                                                    <Label htmlFor="remarks">
                                                        Remarks
                                                    </Label>
                                                    <Textarea
                                                        id="remarks"
                                                        name="remarks"
                                                        placeholder="Optional"
                                                        rows={1}
                                                    />
                                                    <p className="text-sm text-destructive dark:text-destructive-foreground">
                                                        {errors.remarks}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="proof_of_payment">
                                                    Proof of payment
                                                </Label>
                                                <Input
                                                    id="proof_of_payment"
                                                    type="file"
                                                    name="proof_of_payment"
                                                    accept=".pdf,.jpg,.jpeg,.png"
                                                />
                                                <p className="text-sm text-destructive dark:text-destructive-foreground">
                                                    {errors.proof_of_payment}
                                                </p>
                                            </div>

                                            <div>
                                                <Button
                                                    type="submit"
                                                    disabled={processing}
                                                >
                                                    {processing ? (
                                                        <Spinner />
                                                    ) : (
                                                        <CircleCheck />
                                                    )}
                                                    Record Payment
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </Form>
                            )}
                        </CardContent>
                    </Card>
                )}

                {purchaseInvoice.status === 'draft' && (
                    <section className="space-y-4 rounded-2xl border border-destructive/30 bg-destructive/[0.02] p-4 sm:p-6">
                        <div className="flex items-start gap-3">
                            <div className="rounded-lg bg-destructive/10 p-2 text-destructive">
                                <Trash2 className="size-5" />
                            </div>
                            <div>
                                <h2 className="font-semibold text-destructive">
                                    Danger zone
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    Permanently remove this draft purchase
                                    invoice.
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-4 rounded-lg border border-red-100 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-red-200/10 dark:bg-red-700/10">
                            <div className="space-y-0.5 text-red-600 dark:text-red-100">
                                <p className="font-medium">
                                    Delete this purchase invoice
                                </p>
                                <p className="text-sm">
                                    Once deleted, this purchase invoice cannot
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
                                        Delete Purchase Invoice
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogTitle>
                                        Delete &quot;
                                        {purchaseInvoice.purchase_invoice_code}
                                        &quot;?
                                    </DialogTitle>
                                    <DialogDescription>
                                        This action cannot be undone. This
                                        purchase invoice will be permanently
                                        deleted.
                                    </DialogDescription>

                                    <Form
                                        {...destroy.form(purchaseInvoice)}
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
                                                        Delete Purchase Invoice
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
