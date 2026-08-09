import { Form, Head, Link, setLayoutProps, usePage } from '@inertiajs/react';
import { ArrowLeft, Ban, Check, ClipboardList, Mail, PenLine, Pencil, Printer, Send, Trash2, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';
import Heading from '@/components/heading';
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
    create as createGoodsReceiptNote,
    show as showGoodsReceiptNote,
} from '@/routes/goods-receipt-notes';
import { show as showProject } from '@/routes/projects';
import {
    approve,
    cancel,
    check,
    destroy,
    edit,
    index,
    issue,
    print,
    reject,
    voidMethod as voidPurchaseOrder,
} from '@/routes/purchase-orders';
import { update as updateProgress } from '@/routes/purchase-orders/progress';
import { show as showQuotation } from '@/routes/quotations';
import { show as showVendor } from '@/routes/vendors';


type WorkforceOption = {
    id: number;
    full_name: string;
};

type ProgressAction = {
    progress: string;
    label: string;
    icon?: LucideIcon;
    confirmTitle: string;
    confirmDescription: string;
};

function progressActions(progress: string | null): ProgressAction[] {
    switch (progress) {
        case null:
            return [
                {
                    progress: 'sent',
                    label: 'Mark as Sent',
                    icon: Mail,
                    confirmTitle: 'Mark this purchase order as sent?',
                    confirmDescription:
                        'This records that the purchase order has been sent to the vendor.',
                },
            ];
        case 'fully_received':
            return [
                {
                    progress: 'closed',
                    label: 'Mark as Closed',
                    confirmTitle: 'Close this purchase order?',
                    confirmDescription:
                        'This records that the purchase order is fully settled with the vendor.',
                },
            ];
        default:
            return [];
    }
}

type PurchaseOrderItem = {
    id: number;
    reference_number: string | null;
    description: string | null;
    quantity: string;
    unit: string;
    unit_price: string;
    total: string;
    product: {
        id: number;
        uuid: string;
        product_code: string;
        name: string;
    };
};

type PurchaseOrderDiscount = {
    id: number;
    sequence: number;
    label: string;
    discount_type: string;
    discount_value: string;
    base_amount: string;
    discount_amount: string;
};

type GoodsReceiptNoteOption = {
    id: number;
    uuid: string;
    grn_code: string;
    status: string;
    received_date: string;
};

type PurchaseOrder = {
    id: number;
    uuid: string;
    purchase_order_code: string;
    status: string;
    progress: string | null;
    address: string | null;
    attention: string | null;
    phone: string | null;
    fax: string | null;
    quotation_no: string | null;
    quotation_date: string | null;
    project_name: string;
    date: string;
    delivery_date: string | null;
    shipping_method: string | null;
    shipping_terms: string | null;
    notes_html: string | null;
    subtotal: string;
    discount_total: string;
    net_after_discount: string;
    tax_amount: string;
    grand_total: string;
    rejection_reason: string | null;
    issued_at: string | null;
    checked_by_1_at: string | null;
    checked_by_2_at: string | null;
    approved_at: string | null;
    created_at: string;
    updated_at: string;
    project: { id: number; uuid: string; name: string; project_code: string };
    quotation: {
        id: number;
        uuid: string;
        quotation_code: string;
        version_major: number;
        version_minor: number;
    };
    customer: { id: number; name: string };
    vendor: { id: number; uuid: string; name: string; vendor_code: string };
    currency: {
        id: number;
        iso_code: string;
        name: string;
        symbol: string | null;
    };
    tax: { id: number; name: string; rate: string; type: string } | null;
    items: PurchaseOrderItem[];
    discounts: PurchaseOrderDiscount[];
    goods_receipt_notes: GoodsReceiptNoteOption[];
    issued_by: WorkforceOption | null;
    checked_by_first: WorkforceOption | null;
    checked_by_second: WorkforceOption | null;
    approved_by: WorkforceOption | null;
};

type Props = {
    purchaseOrder: PurchaseOrder;
};

export default function PurchaseOrdersShow({ purchaseOrder }: Props) {
    setLayoutProps({
        breadcrumbs: [
            { title: 'Purchase Orders', href: index() },
            {
                title: purchaseOrder.purchase_order_code,
                href: index(),
            },
        ],
    });

    const [rejectionReason, setRejectionReason] = useState('');

    const currencySymbol =
        purchaseOrder.currency.symbol ?? purchaseOrder.currency.iso_code;
    const bothCheckersSigned =
        purchaseOrder.checked_by_first !== null &&
        purchaseOrder.checked_by_second !== null;

    const { auth } = usePage().props;
    const hasWorkforce = auth.workforce_id !== null;
    const canIssue   = hasWorkforce && auth.permissions.includes('purchase-orders.issue');
    const canCheck   = hasWorkforce && auth.permissions.includes('purchase-orders.check');
    const canApprove = hasWorkforce && auth.permissions.includes('purchase-orders.approve');
    const canReject  = auth.permissions.includes('purchase-orders.reject');
    const canCancel  = auth.permissions.includes('purchase-orders.cancel');
    const canVoid    = auth.permissions.includes('purchase-orders.void');

    const progressActionsList =
        purchaseOrder.status === 'approved'
            ? progressActions(purchaseOrder.progress)
            : [];

    return (
        <>
            <Head title={purchaseOrder.purchase_order_code} />

            <div className="mx-auto w-full max-w-5xl space-y-6 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <Heading
                        title={purchaseOrder.purchase_order_code}
                        description={purchaseOrder.project_name}
                    />

                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
                        <Button
                            variant="destructive"
                            asChild
                            className="w-full sm:w-auto"
                        >
                            <Link href={index()}>
                                <ArrowLeft />
                                Back to Purchase Orders
                            </Link>
                        </Button>

                        <Button
                            variant="outline"
                            asChild
                            className="w-full sm:w-auto"
                        >
                            <a
                                href={print.url(purchaseOrder)}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Printer />
                                Print
                            </a>
                        </Button>

                        {(purchaseOrder.status === 'draft' ||
                            purchaseOrder.status === 'approved') && (
                            <Button asChild className="w-full sm:w-auto">
                                <Link href={edit(purchaseOrder)}>
                                    <Pencil />
                                    Edit Purchase Order
                                </Link>
                            </Button>
                        )}

                        {canVoid && purchaseOrder.status === 'approved' && (
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="destructive" className="w-full sm:w-auto">
                                        <Ban />Void Purchase Order
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogTitle>
                                        Void this purchase order?
                                    </DialogTitle>
                                    <DialogDescription>
                                        This marks the approved purchase order
                                        as voided. This action cannot be undone.
                                    </DialogDescription>

                                    <Form
                                        {...voidPurchaseOrder.form(
                                            purchaseOrder,
                                        )}
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
                                                    Void Purchase Order
                                                </Button>
                                            </DialogFooter>
                                        )}
                                    </Form>
                                </DialogContent>
                            </Dialog>
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
                                    {purchaseOrder.status.replaceAll('_', ' ')}
                                </Badge>
                            </dd>
                        </div>

                        {purchaseOrder.progress && (
                            <div>
                                <dt className="text-sm text-muted-foreground">
                                    Progress
                                </dt>
                                <dd>
                                    <Badge
                                        variant="secondary"
                                        className="capitalize"
                                    >
                                        {purchaseOrder.progress.replaceAll(
                                            '_',
                                            ' ',
                                        )}
                                    </Badge>
                                </dd>
                            </div>
                        )}

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Project
                            </dt>
                            <dd className="font-medium">
                                <Link href={showProject(purchaseOrder.project)}>
                                    {purchaseOrder.project.project_code} &mdash;{' '}
                                    {purchaseOrder.project.name}
                                </Link>
                            </dd>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Quotation
                            </dt>
                            <dd className="font-medium">
                                <Link
                                    href={showQuotation(
                                        purchaseOrder.quotation,
                                    )}
                                >
                                    {purchaseOrder.quotation.quotation_code} v
                                    {purchaseOrder.quotation.version_major}.
                                    {purchaseOrder.quotation.version_minor}
                                </Link>
                            </dd>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Customer
                            </dt>
                            <dd className="font-medium">
                                {purchaseOrder.customer.name}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Vendor
                            </dt>
                            <dd className="font-medium">
                                <Link href={showVendor(purchaseOrder.vendor)}>
                                    {purchaseOrder.vendor.vendor_code} &mdash;{' '}
                                    {purchaseOrder.vendor.name}
                                </Link>
                            </dd>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Currency
                            </dt>
                            <dd className="font-medium">
                                {purchaseOrder.currency.iso_code} &mdash;{' '}
                                {purchaseOrder.currency.name}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Vendor address
                            </dt>
                            <dd className="font-medium">
                                {purchaseOrder.address ?? (
                                    <span className="text-muted-foreground">
                                        &mdash;
                                    </span>
                                )}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Attn
                            </dt>
                            <dd className="font-medium">
                                {purchaseOrder.attention ?? (
                                    <span className="text-muted-foreground">
                                        &mdash;
                                    </span>
                                )}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Phone / Fax
                            </dt>
                            <dd className="font-medium">
                                {purchaseOrder.phone ?? '—'} /{' '}
                                {purchaseOrder.fax ?? '—'}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Vendor quotation no.
                            </dt>
                            <dd className="font-medium">
                                {purchaseOrder.quotation_no ?? (
                                    <span className="text-muted-foreground">
                                        &mdash;
                                    </span>
                                )}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Vendor quotation date
                            </dt>
                            <dd className="font-medium">
                                {purchaseOrder.quotation_date ? (
                                    formatDate(purchaseOrder.quotation_date)
                                ) : (
                                    <span className="text-muted-foreground">
                                        &mdash;
                                    </span>
                                )}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Date
                            </dt>
                            <dd className="font-medium">
                                {formatDate(purchaseOrder.date)}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Delivery date
                            </dt>
                            <dd className="font-medium">
                                {purchaseOrder.delivery_date ? (
                                    formatDate(purchaseOrder.delivery_date)
                                ) : (
                                    <span className="text-muted-foreground">
                                        &mdash;
                                    </span>
                                )}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Shipping method
                            </dt>
                            <dd className="font-medium">
                                {purchaseOrder.shipping_method ?? (
                                    <span className="text-muted-foreground">
                                        &mdash;
                                    </span>
                                )}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Shipping terms
                            </dt>
                            <dd className="font-medium">
                                {purchaseOrder.shipping_terms ?? (
                                    <span className="text-muted-foreground">
                                        &mdash;
                                    </span>
                                )}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Created at
                            </dt>
                            <dd className="font-medium">
                                {formatDateTime(purchaseOrder.created_at)}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Last updated
                            </dt>
                            <dd className="font-medium">
                                {formatDateTime(purchaseOrder.updated_at)}
                            </dd>
                        </div>
                    </dl>
                </div>

                <div>
                    <h2 className="mb-4 text-base font-semibold">Notes</h2>
                    {purchaseOrder.notes_html ? (
                        <div
                            className="rich-text-content"
                            dangerouslySetInnerHTML={{
                                __html: purchaseOrder.notes_html,
                            }}
                        />
                    ) : (
                        <span className="text-sm text-muted-foreground">
                            &mdash;
                        </span>
                    )}
                </div>

                <div>
                    <h2 className="mb-4 text-base font-semibold">Line Items</h2>
                    <div className="overflow-hidden rounded-xl border border-border/50">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>No</TableHead>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Qty</TableHead>
                                    <TableHead>Unit</TableHead>
                                    <TableHead>Unit price</TableHead>
                                    <TableHead>Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {purchaseOrder.items.map((item, idx) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="text-muted-foreground">
                                            {idx + 1}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            <div>
                                                {item.product.product_code}{' '}
                                                &mdash; {item.product.name}
                                            </div>
                                            {item.reference_number && (
                                                <div className="text-sm font-normal text-muted-foreground">
                                                    Ref: {item.reference_number}
                                                </div>
                                            )}
                                            {item.description && (
                                                <div className="text-sm font-normal whitespace-pre-line text-muted-foreground">
                                                    {item.description}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {formatNumber(item.quantity)}
                                        </TableCell>
                                        <TableCell>{item.unit}</TableCell>
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

                {purchaseOrder.discounts.length > 0 && (
                    <div>
                        <h2 className="mb-4 text-base font-semibold">
                            Discounts
                        </h2>
                        <div className="overflow-hidden rounded-xl border border-border/50">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>No</TableHead>
                                        <TableHead>Label</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Value</TableHead>
                                        <TableHead>Applied to</TableHead>
                                        <TableHead>Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {purchaseOrder.discounts.map((discount) => (
                                        <TableRow key={discount.id}>
                                            <TableCell className="text-muted-foreground">
                                                {discount.sequence}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {discount.label}
                                            </TableCell>
                                            <TableCell className="capitalize">
                                                {discount.discount_type}
                                            </TableCell>
                                            <TableCell>
                                                {discount.discount_type ===
                                                'percentage'
                                                    ? `${discount.discount_value}%`
                                                    : formatNumber(
                                                          discount.discount_value,
                                                      )}
                                            </TableCell>
                                            <TableCell>
                                                {formatNumber(
                                                    discount.base_amount,
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {formatNumber(
                                                    discount.discount_amount,
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                )}

                <div>
                    <h2 className="mb-4 text-base font-semibold">Summary</h2>
                    <dl className="space-y-2">
                        <div className="flex justify-between">
                            <dt className="text-muted-foreground">Subtotal</dt>
                            <dd className="font-medium">
                                {currencySymbol}{' '}
                                {formatNumber(purchaseOrder.subtotal)}
                            </dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-muted-foreground">
                                Discount total
                            </dt>
                            <dd className="font-medium">
                                {currencySymbol}{' '}
                                {formatNumber(purchaseOrder.discount_total)}
                            </dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-muted-foreground">
                                Net after discount
                            </dt>
                            <dd className="font-medium">
                                {currencySymbol}{' '}
                                {formatNumber(purchaseOrder.net_after_discount)}
                            </dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-muted-foreground">
                                Tax
                                {purchaseOrder.tax &&
                                    ` (${purchaseOrder.tax.name})`}
                            </dt>
                            <dd className="font-medium">
                                {currencySymbol}{' '}
                                {formatNumber(purchaseOrder.tax_amount)}
                            </dd>
                        </div>
                        <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
                            <dt>Grand total</dt>
                            <dd>
                                {currencySymbol}{' '}
                                {formatNumber(purchaseOrder.grand_total)}
                            </dd>
                        </div>
                    </dl>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between gap-2">
                        <h2 className="text-base font-semibold">
                            Goods Receipt Notes
                        </h2>
                        {purchaseOrder.status === 'approved' && (
                            <Button size="sm" asChild>
                                <Link
                                    href={createGoodsReceiptNote({
                                        query: {
                                            purchase_order: purchaseOrder.uuid,
                                        },
                                    })}
                                >
                                    <ClipboardList />
                                    Create GRN
                                </Link>
                            </Button>
                        )}
                    </div>
                    {purchaseOrder.goods_receipt_notes.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            No goods receipt notes have been raised against this
                            purchase order yet.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {purchaseOrder.goods_receipt_notes.map(
                                (goodsReceiptNote) => (
                                    <Link
                                        key={goodsReceiptNote.id}
                                        href={showGoodsReceiptNote(
                                            goodsReceiptNote,
                                        )}
                                        className="flex flex-col gap-2 rounded-lg border p-4 hover:bg-accent sm:flex-row sm:items-center sm:justify-between"
                                    >
                                        <div className="space-y-0.5">
                                            <p className="font-medium">
                                                {goodsReceiptNote.grn_code}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {formatDate(
                                                    goodsReceiptNote.received_date,
                                                )}
                                            </p>
                                        </div>

                                        <Badge
                                            variant="secondary"
                                            className="w-fit capitalize"
                                        >
                                            {goodsReceiptNote.status.replaceAll(
                                                '_',
                                                ' ',
                                            )}
                                        </Badge>
                                    </Link>
                                ),
                            )}
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <h2 className="text-base font-semibold">Workflow</h2>
                    <dl className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Issued
                            </dt>
                            <dd className="font-medium">
                                {purchaseOrder.issued_by &&
                                purchaseOrder.issued_at ? (
                                    `${purchaseOrder.issued_by.full_name} — ${formatDateTime(purchaseOrder.issued_at)}`
                                ) : (
                                    <span className="text-muted-foreground">
                                        &mdash;
                                    </span>
                                )}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Checked (1)
                            </dt>
                            <dd className="font-medium">
                                {purchaseOrder.checked_by_first &&
                                purchaseOrder.checked_by_1_at ? (
                                    `${purchaseOrder.checked_by_first.full_name} — ${formatDateTime(purchaseOrder.checked_by_1_at)}`
                                ) : (
                                    <span className="text-muted-foreground">
                                        &mdash;
                                    </span>
                                )}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Checked (2)
                            </dt>
                            <dd className="font-medium">
                                {purchaseOrder.checked_by_second &&
                                purchaseOrder.checked_by_2_at ? (
                                    `${purchaseOrder.checked_by_second.full_name} — ${formatDateTime(purchaseOrder.checked_by_2_at)}`
                                ) : (
                                    <span className="text-muted-foreground">
                                        &mdash;
                                    </span>
                                )}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Approved
                            </dt>
                            <dd className="font-medium">
                                {purchaseOrder.approved_by &&
                                purchaseOrder.approved_at ? (
                                    `${purchaseOrder.approved_by.full_name} — ${formatDateTime(purchaseOrder.approved_at)}`
                                ) : (
                                    <span className="text-muted-foreground">
                                        &mdash;
                                    </span>
                                )}
                            </dd>
                        </div>

                        {purchaseOrder.rejection_reason && (
                            <div className="sm:col-span-2">
                                <dt className="text-sm text-muted-foreground">
                                    Last rejection reason
                                </dt>
                                <dd className="font-medium whitespace-pre-line">
                                    {purchaseOrder.rejection_reason}
                                </dd>
                            </div>
                        )}
                    </dl>

                    <div className="flex flex-wrap gap-3">
                        {canIssue && purchaseOrder.status === 'draft' && (
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button><Send />Issue</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogTitle>
                                        Issue this purchase order?
                                    </DialogTitle>
                                    <DialogDescription>
                                        You will be recorded as the issuer and
                                        the purchase order will move to
                                        &quot;issued&quot;.
                                    </DialogDescription>

                                    <Form
                                        {...issue.form(purchaseOrder)}
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
                                                    {processing && <Spinner />}
                                                    Issue
                                                </Button>
                                            </DialogFooter>
                                        )}
                                    </Form>
                                </DialogContent>
                            </Dialog>
                        )}

                        {canCheck &&
                            purchaseOrder.status === 'issued' &&
                            !purchaseOrder.checked_by_first && (
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button><PenLine />Sign as Checker 1</Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogTitle>
                                            Sign off as Checker 1?
                                        </DialogTitle>
                                        <DialogDescription>
                                            You will be recorded as Checker 1
                                            on this purchase order.
                                        </DialogDescription>

                                        <Form
                                            {...check.form(purchaseOrder)}
                                            options={{ preserveScroll: true }}
                                        >
                                            {({ processing }) => (
                                                <>
                                                    <input
                                                        type="hidden"
                                                        name="slot"
                                                        value="1"
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
                                                            {processing && <Spinner />}
                                                            Sign off
                                                        </Button>
                                                    </DialogFooter>
                                                </>
                                            )}
                                        </Form>
                                    </DialogContent>
                                </Dialog>
                            )}

                        {canCheck &&
                            purchaseOrder.status === 'issued' &&
                            !purchaseOrder.checked_by_second && (
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button><PenLine />Sign as Checker 2</Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogTitle>
                                            Sign off as Checker 2?
                                        </DialogTitle>
                                        <DialogDescription>
                                            You will be recorded as Checker 2
                                            on this purchase order.
                                        </DialogDescription>

                                        <Form
                                            {...check.form(purchaseOrder)}
                                            options={{ preserveScroll: true }}
                                        >
                                            {({ processing }) => (
                                                <>
                                                    <input
                                                        type="hidden"
                                                        name="slot"
                                                        value="2"
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
                                                            {processing && <Spinner />}
                                                            Sign off
                                                        </Button>
                                                    </DialogFooter>
                                                </>
                                            )}
                                        </Form>
                                    </DialogContent>
                                </Dialog>
                            )}

                        {canApprove &&
                            purchaseOrder.status === 'issued' &&
                            bothCheckersSigned && (
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button><Check />Approve</Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogTitle>
                                            Approve this purchase order?
                                        </DialogTitle>
                                        <DialogDescription>
                                            You will be recorded as the approver
                                            and the purchase order will be marked
                                            approved.
                                        </DialogDescription>

                                        <Form
                                            {...approve.form(purchaseOrder)}
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
                                                        {processing && <Spinner />}
                                                        Approve
                                                    </Button>
                                                </DialogFooter>
                                            )}
                                        </Form>
                                    </DialogContent>
                                </Dialog>
                            )}

                        {canReject && purchaseOrder.status === 'issued' && (
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="destructive">
                                        <X />Reject
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogTitle>
                                        Reject this purchase order?
                                    </DialogTitle>
                                    <DialogDescription>
                                        This reverts the purchase order to draft
                                        and clears its sign-offs.
                                    </DialogDescription>

                                    <Form
                                        {...reject.form(purchaseOrder)}
                                        options={{ preserveScroll: true }}
                                    >
                                        {({ processing }) => (
                                            <>
                                                <div className="grid gap-2 py-2">
                                                    <Label htmlFor="rejection_reason">
                                                        Rejection reason
                                                    </Label>
                                                    <Textarea
                                                        id="rejection_reason"
                                                        name="rejection_reason"
                                                        value={rejectionReason}
                                                        onChange={(e) =>
                                                            setRejectionReason(
                                                                e.target.value,
                                                            )
                                                        }
                                                        rows={3}
                                                    />
                                                </div>
                                                <DialogFooter className="gap-2">
                                                    <DialogClose asChild>
                                                        <Button variant="secondary">
                                                            Cancel
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
                                                        Reject
                                                    </Button>
                                                </DialogFooter>
                                            </>
                                        )}
                                    </Form>
                                </DialogContent>
                            </Dialog>
                        )}

                        {canCancel &&
                            (purchaseOrder.status === 'draft' ||
                                purchaseOrder.status === 'issued') && (
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="destructive">
                                        <Ban />Cancel Purchase Order
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogTitle>
                                        Cancel this purchase order?
                                    </DialogTitle>
                                    <DialogDescription>
                                        This marks the purchase order as
                                        cancelled. This action cannot be undone.
                                    </DialogDescription>

                                    <Form
                                        {...cancel.form(purchaseOrder)}
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
                                                    Cancel Purchase Order
                                                </Button>
                                            </DialogFooter>
                                        )}
                                    </Form>
                                </DialogContent>
                            </Dialog>
                        )}

                    </div>
                </div>

                {progressActionsList.length > 0 && (
                    <div>
                        <h2 className="mb-4 text-base font-semibold">
                            Progress
                        </h2>
                        <div className="flex flex-wrap gap-3">
                            {progressActionsList.map((action) => (
                                <Dialog key={action.progress}>
                                    <DialogTrigger asChild>
                                        <Button>
                                            {action.icon && <action.icon />}
                                            {action.label}
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogTitle>
                                            {action.confirmTitle}
                                        </DialogTitle>
                                        <DialogDescription>
                                            {action.confirmDescription}
                                        </DialogDescription>

                                        <Form
                                            {...updateProgress.form(
                                                purchaseOrder,
                                            )}
                                            options={{
                                                preserveScroll: true,
                                            }}
                                        >
                                            {({ processing }) => (
                                                <>
                                                    <input
                                                        type="hidden"
                                                        name="progress"
                                                        value={action.progress}
                                                    />
                                                    <DialogFooter className="gap-2">
                                                        <DialogClose asChild>
                                                            <Button variant="secondary">
                                                                Cancel
                                                            </Button>
                                                        </DialogClose>

                                                        <Button
                                                            type="submit"
                                                            disabled={
                                                                processing
                                                            }
                                                        >
                                                            {processing && (
                                                                <Spinner />
                                                            )}
                                                            {action.label}
                                                        </Button>
                                                    </DialogFooter>
                                                </>
                                            )}
                                        </Form>
                                    </DialogContent>
                                </Dialog>
                            ))}
                        </div>
                    </div>
                )}

                {purchaseOrder.status === 'draft' && (
                    <div className="space-y-4 rounded-lg border border-destructive/50 p-4">
                        <h2 className="text-base font-semibold text-destructive dark:text-destructive-foreground">
                            Danger Zone
                        </h2>
                        <div className="flex flex-col gap-4 rounded-lg border border-red-100 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-red-200/10 dark:bg-red-700/10">
                            <div className="space-y-0.5 text-red-600 dark:text-red-100">
                                <p className="font-medium">
                                    Delete this purchase order
                                </p>
                                <p className="text-sm">
                                    Once deleted, this purchase order cannot be
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
                                        Delete Purchase Order
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogTitle>
                                        Delete &quot;
                                        {purchaseOrder.purchase_order_code}
                                        &quot;?
                                    </DialogTitle>
                                    <DialogDescription>
                                        This action cannot be undone. This
                                        purchase order will be permanently
                                        deleted.
                                    </DialogDescription>

                                    <Form
                                        {...destroy.form(purchaseOrder)}
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
                                                        Delete Purchase Order
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
