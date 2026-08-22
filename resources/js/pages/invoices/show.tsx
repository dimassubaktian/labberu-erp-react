import { Form, Head, Link, setLayoutProps } from '@inertiajs/react';
import {
    ArrowLeft,
    Ban,
    Banknote,
    CircleCheck,
    Download,
    Pencil,
    SendHorizonal,
    Trash2,
} from 'lucide-react';
import { useRef, useState } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { PrintDocumentDialog } from '@/components/print-document-dialog';
import { RichTextEditor } from '@/components/rich-text-editor';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { destroy, edit, index, issue, print } from '@/routes/invoices';
import { update as updatePaymentTerms } from '@/routes/invoices/payment-terms';
import {
    cancel as cancelPayment,
    proof as proofPayment,
    store as storePayment,
} from '@/routes/invoices/payments';
import { show as showQuotation } from '@/routes/quotations';

type InvoiceItem = {
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

type InvoicePayment = {
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

type Invoice = {
    id: number;
    uuid: string;
    invoice_code: string;
    status: string;
    payment_status: string | null;
    invoice_date: string;
    due_date: string;
    remarks: string | null;
    payment_terms_html: string | null;
    subtotal: string;
    discount_amount: string;
    tax_amount: string;
    total: string;
    issued_at: string | null;
    quotation: {
        id: number;
        uuid: string;
        quotation_code: string;
        project: { id: number; customer: { id: number; name: string } };
        currency: { id: number; iso_code: string; symbol: string | null };
    };
    tax: { id: number; name: string; rate: string; type: string } | null;
    payment_term_template: { id: number; uuid: string; name: string } | null;
    items: InvoiceItem[];
    payments: InvoicePayment[];
};

type PaymentTermTemplateOption = {
    id: number;
    uuid: string;
    name: string;
    content: string;
};

type Props = {
    invoice: Invoice;
    paymentTermTemplates: PaymentTermTemplateOption[];
};

function PaymentTermsDialog({
    invoice,
    paymentTermTemplates,
}: {
    invoice: Invoice;
    paymentTermTemplates: PaymentTermTemplateOption[];
}) {
    const [open, setOpen] = useState(false);
    const [templateId, setTemplateId] = useState('none');
    const [termsHtml, setTermsHtml] = useState('');

    function handleOpenChange(next: boolean): void {
        if (next) {
            setTemplateId(
                invoice.payment_term_template
                    ? String(invoice.payment_term_template.id)
                    : 'none',
            );
            setTermsHtml(invoice.payment_terms_html ?? '');
        }

        setOpen(next);
    }

    function handleTemplateChange(value: string): void {
        setTemplateId(value);

        const template = paymentTermTemplates.find(
            (option) => String(option.id) === value,
        );

        if (template) {
            setTermsHtml(template.content);
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button size="sm">
                    <Pencil />
                    Edit
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogTitle>Edit payment terms</DialogTitle>
                <DialogDescription>
                    Payment terms can be changed after the invoice is issued.
                    The updated terms appear on the printed invoice.
                </DialogDescription>

                <Form
                    {...updatePaymentTerms.form(invoice)}
                    options={{ preserveScroll: true }}
                    onSuccess={() => setOpen(false)}
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2 py-2">
                                <Label htmlFor="payment_term_template_id">
                                    Template
                                </Label>
                                <input
                                    type="hidden"
                                    name="payment_term_template_id"
                                    value={
                                        templateId === 'none' ? '' : templateId
                                    }
                                />
                                <Select
                                    value={templateId}
                                    onValueChange={handleTemplateChange}
                                >
                                    <SelectTrigger
                                        id="payment_term_template_id"
                                        className="w-full"
                                    >
                                        <SelectValue placeholder="Select a template" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">
                                            No template
                                        </SelectItem>
                                        {paymentTermTemplates.map(
                                            (template) => (
                                                <SelectItem
                                                    key={template.id}
                                                    value={String(template.id)}
                                                >
                                                    {template.name}
                                                </SelectItem>
                                            ),
                                        )}
                                    </SelectContent>
                                </Select>
                                <InputError
                                    message={errors.payment_term_template_id}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="payment_terms_html">
                                    Terms &amp; conditions
                                </Label>
                                <RichTextEditor
                                    id="payment_terms_html"
                                    name="payment_terms_html"
                                    value={termsHtml}
                                    onChange={setTermsHtml}
                                    error={errors.payment_terms_html}
                                />
                                <InputError
                                    message={errors.payment_terms_html}
                                />
                            </div>

                            <DialogFooter className="gap-2">
                                <DialogClose asChild>
                                    <Button variant="secondary">Cancel</Button>
                                </DialogClose>

                                <Button type="submit" disabled={processing}>
                                    {processing && <Spinner />}
                                    Save Payment Terms
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}

export default function InvoicesShow({ invoice, paymentTermTemplates }: Props) {
    setLayoutProps({
        breadcrumbs: [
            { title: 'Invoices', href: index() },
            { title: invoice.invoice_code, href: index() },
        ],
    });

    const [paymentMethod, setPaymentMethod] = useState('none');
    const amountRef = useRef<HTMLInputElement>(null);

    const currencySymbol =
        invoice.quotation.currency.symbol ??
        invoice.quotation.currency.iso_code;
    const totalPaid = invoice.payments.reduce(
        (sum, payment) =>
            payment.cancelled_at ? sum : sum + Number(payment.amount),
        0,
    );
    const balanceDue = Number(invoice.total) - totalPaid;

    return (
        <>
            <Head title={invoice.invoice_code} />

            <div className="mx-auto w-full max-w-5xl space-y-6 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <Heading
                        title={invoice.invoice_code}
                        description={invoice.quotation.quotation_code}
                    />

                    <div className="flex flex-col gap-2 sm:flex-row">
                        <Button
                            variant="destructive"
                            asChild
                            className="w-full sm:w-auto"
                        >
                            <Link href={index()}>
                                <ArrowLeft />
                                Back to Invoices
                            </Link>
                        </Button>

                        <PrintDocumentDialog
                            title="Print invoice"
                            description="Preview or download the invoice as a PDF."
                            previewUrl={print.url(invoice)}
                            downloadUrl={print.url(invoice, {
                                query: { download: true },
                            })}
                        />

                        {invoice.status === 'draft' && (
                            <Button asChild className="w-full sm:w-auto">
                                <Link href={edit(invoice)}>
                                    <Pencil />
                                    Edit Invoice
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
                                    {invoice.status.replaceAll('_', ' ')}
                                </Badge>
                            </dd>
                        </div>

                        {invoice.payment_status && (
                            <div>
                                <dt className="text-sm text-muted-foreground">
                                    Payment
                                </dt>
                                <dd>
                                    <Badge
                                        variant="secondary"
                                        className="capitalize"
                                    >
                                        {invoice.payment_status.replaceAll(
                                            '_',
                                            ' ',
                                        )}
                                    </Badge>
                                </dd>
                            </div>
                        )}

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Quotation
                            </dt>
                            <dd className="font-medium">
                                <Link href={showQuotation(invoice.quotation)}>
                                    {invoice.quotation.quotation_code}
                                </Link>
                            </dd>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Customer
                            </dt>
                            <dd className="font-medium">
                                {invoice.quotation.project.customer.name}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Invoice date
                            </dt>
                            <dd className="font-medium">
                                {formatDate(invoice.invoice_date)}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Due date
                            </dt>
                            <dd className="font-medium">
                                {formatDate(invoice.due_date)}
                            </dd>
                        </div>

                        {invoice.issued_at && (
                            <div>
                                <dt className="text-sm text-muted-foreground">
                                    Issued at
                                </dt>
                                <dd className="font-medium">
                                    {formatDateTime(invoice.issued_at)}
                                </dd>
                            </div>
                        )}

                        {invoice.remarks && (
                            <div className="sm:col-span-2">
                                <dt className="text-sm text-muted-foreground">
                                    Remarks
                                </dt>
                                <dd className="font-medium whitespace-pre-line">
                                    {invoice.remarks}
                                </dd>
                            </div>
                        )}

                        <div className="sm:col-span-2">
                            <dt className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
                                <span>
                                    Payment Terms
                                    {invoice.payment_term_template && (
                                        <>
                                            :{' '}
                                            {invoice.payment_term_template.name}
                                        </>
                                    )}
                                </span>
                                <PaymentTermsDialog
                                    invoice={invoice}
                                    paymentTermTemplates={paymentTermTemplates}
                                />
                            </dt>
                            <dd className="mt-1 font-medium">
                                {invoice.payment_terms_html ? (
                                    <div
                                        className="rich-text-content"
                                        dangerouslySetInnerHTML={{
                                            __html: invoice.payment_terms_html,
                                        }}
                                    />
                                ) : (
                                    <span className="text-muted-foreground">
                                        &mdash;
                                    </span>
                                )}
                            </dd>
                        </div>
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
                                    <TableHead>Qty invoiced</TableHead>
                                    <TableHead>Unit price</TableHead>
                                    <TableHead>Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {invoice.items.map((item, idx) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="text-muted-foreground">
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
                                        <TableCell>
                                            {formatNumber(item.total)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                <div>
                    <h2 className="mb-4 text-base font-semibold">Summary</h2>
                    <dl className="space-y-2">
                        <div className="flex justify-between">
                            <dt className="text-muted-foreground">Subtotal</dt>
                            <dd className="font-medium">
                                {currencySymbol}{' '}
                                {formatNumber(invoice.subtotal)}
                            </dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-muted-foreground">Discount</dt>
                            <dd className="font-medium">
                                {currencySymbol}{' '}
                                {formatNumber(invoice.discount_amount)}
                            </dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-muted-foreground">
                                Tax
                                {invoice.tax && ` (${invoice.tax.name})`}
                            </dt>
                            <dd className="font-medium">
                                {currencySymbol}{' '}
                                {formatNumber(invoice.tax_amount)}
                            </dd>
                        </div>
                        <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
                            <dt>Total</dt>
                            <dd>
                                {currencySymbol} {formatNumber(invoice.total)}
                            </dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-muted-foreground">
                                Amount paid
                            </dt>
                            <dd className="font-medium">
                                {currencySymbol} {formatNumber(totalPaid)}
                            </dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-muted-foreground">
                                Balance due
                            </dt>
                            <dd className="font-medium">
                                {currencySymbol} {formatNumber(balanceDue)}
                            </dd>
                        </div>
                    </dl>
                </div>

                {invoice.status === 'draft' && (
                    <div>
                        <h2 className="mb-4 text-base font-semibold">
                            Issue Invoice
                        </h2>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button>
                                    <SendHorizonal />
                                    Issue
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogTitle>Issue this invoice?</DialogTitle>
                                <DialogDescription>
                                    This locks the invoice from further edits
                                    and makes it ready to receive payments.
                                </DialogDescription>

                                <Form
                                    {...issue.form(invoice)}
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
                    </div>
                )}

                {invoice.status === 'issued' && (
                    <div className="space-y-6">
                        <h2 className="text-base font-semibold">Payments</h2>
                        {invoice.payments.length > 0 && (
                            <div className="overflow-hidden rounded-xl border border-border/50">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Amount</TableHead>
                                            <TableHead>Method</TableHead>
                                            <TableHead>Recorded by</TableHead>
                                            <TableHead>Proof</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead />
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {invoice.payments.map((payment) => (
                                            <TableRow key={payment.id}>
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
                                                        <span>&mdash;</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {payment.recorded_by
                                                        ?.name ?? (
                                                        <span>&mdash;</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {payment.proof_of_payment_path ? (
                                                        <a
                                                            href={proofPayment.url(
                                                                {
                                                                    invoice,
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
                                                            <Badge
                                                                variant="secondary"
                                                                className="text-destructive dark:text-destructive-foreground"
                                                            >
                                                                Cancelled
                                                            </Badge>
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
                                                                    Cancel this
                                                                    payment?
                                                                </DialogTitle>
                                                                <DialogDescription>
                                                                    This will
                                                                    recalculate
                                                                    the
                                                                    invoice&apos;s
                                                                    payment
                                                                    status. This
                                                                    action
                                                                    cannot be
                                                                    undone.
                                                                </DialogDescription>

                                                                <Form
                                                                    {...cancelPayment.form(
                                                                        {
                                                                            invoice,
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
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}

                        {balanceDue > 0 && (
                            <Form
                                noValidate
                                {...storePayment.form(invoice)}
                                encType="multipart/form-data"
                                options={{ preserveScroll: true }}
                                resetOnSuccess
                            >
                                {({ processing, errors }) => (
                                    <div className="grid gap-4 rounded-lg border border-border/50 p-4">
                                        <div className="flex justify-end">
                                            <Button
                                                type="button"
                                                variant="default"
                                                size="sm"
                                                onClick={() => {
                                                    if (amountRef.current) {
                                                        amountRef.current.value =
                                                            String(balanceDue);
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
                                                        paymentMethod === 'none'
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
                    </div>
                )}

                {invoice.status === 'draft' && (
                    <div className="space-y-4 rounded-lg border border-destructive/50 p-4">
                        <h2 className="text-base font-semibold text-destructive dark:text-destructive-foreground">
                            Danger Zone
                        </h2>
                        <div className="flex flex-col gap-4 rounded-lg border border-red-100 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-red-200/10 dark:bg-red-700/10">
                            <div className="space-y-0.5 text-red-600 dark:text-red-100">
                                <p className="font-medium">
                                    Delete this invoice
                                </p>
                                <p className="text-sm">
                                    Once deleted, this invoice cannot be
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
                                        Delete Invoice
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogTitle>
                                        Delete &quot;
                                        {invoice.invoice_code}&quot;?
                                    </DialogTitle>
                                    <DialogDescription>
                                        This action cannot be undone. This
                                        invoice will be permanently deleted.
                                    </DialogDescription>

                                    <Form
                                        {...destroy.form(invoice)}
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
                                                        Delete Invoice
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
