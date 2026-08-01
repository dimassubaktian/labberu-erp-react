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
import { Textarea } from '@/components/ui/textarea';
import { formatDate, formatDateTime, formatNumber } from '@/lib/utils';
import { show as showProject } from '@/routes/projects';
import {
    approve,
    cancel,
    check,
    destroy,
    edit,
    index,
    issue,
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
                    confirmTitle: 'Mark this purchase order as sent?',
                    confirmDescription:
                        'This records that the purchase order has been sent to the vendor.',
                },
            ];
        case 'sent':
            return [
                {
                    progress: 'partially_received',
                    label: 'Mark as Partially Received',
                    confirmTitle:
                        'Mark this purchase order as partially received?',
                    confirmDescription:
                        'This records that some, but not all, of the goods have been received.',
                },
                {
                    progress: 'fully_received',
                    label: 'Mark as Fully Received',
                    confirmTitle: 'Mark this purchase order as fully received?',
                    confirmDescription:
                        'This records that all goods on the purchase order have been received.',
                },
            ];
        case 'partially_received':
            return [
                {
                    progress: 'fully_received',
                    label: 'Mark as Fully Received',
                    confirmTitle: 'Mark this purchase order as fully received?',
                    confirmDescription:
                        'This records that all goods on the purchase order have been received.',
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

type PurchaseOrder = {
    id: number;
    uuid: string;
    purchase_order_code: string;
    status: string;
    progress: string | null;
    address: string | null;
    phone: string | null;
    fax: string | null;
    quotation_no: string | null;
    quotation_date: string | null;
    project_name: string;
    date: string;
    delivery_date: string | null;
    shipping_method: string | null;
    shipping_terms: string | null;
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
    issued_by: WorkforceOption | null;
    checked_by_first: WorkforceOption | null;
    checked_by_second: WorkforceOption | null;
    approved_by: WorkforceOption | null;
};

type Props = {
    purchaseOrder: PurchaseOrder;
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
            <Label htmlFor={id}>Workforce member</Label>
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

export default function PurchaseOrdersShow({
    purchaseOrder,
    workforces,
}: Props) {
    setLayoutProps({
        breadcrumbs: [
            { title: 'Purchase Orders', href: index() },
            {
                title: purchaseOrder.purchase_order_code,
                href: index(),
            },
        ],
    });

    const [issuedById, setIssuedById] = useState('');
    const [checkedById1, setCheckedById1] = useState('');
    const [checkedById2, setCheckedById2] = useState('');
    const [approvedById, setApprovedById] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');

    const currencySymbol =
        purchaseOrder.currency.symbol ?? purchaseOrder.currency.iso_code;
    const bothCheckersSigned =
        purchaseOrder.checked_by_first !== null &&
        purchaseOrder.checked_by_second !== null;
    const progressActionsList =
        purchaseOrder.status === 'approved'
            ? progressActions(purchaseOrder.progress)
            : [];

    return (
        <>
            <Head title={purchaseOrder.purchase_order_code} />

            <div className="mx-auto w-full max-w-4xl space-y-6 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <Heading
                        title={purchaseOrder.purchase_order_code}
                        description={purchaseOrder.project_name}
                    />

                    <div className="flex flex-col gap-2 sm:flex-row">
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

                        {(purchaseOrder.status === 'draft' ||
                            purchaseOrder.status === 'approved') && (
                            <Button asChild className="w-full sm:w-auto">
                                <Link href={edit(purchaseOrder)}>
                                    <Pencil />
                                    Edit Purchase Order
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
                                        {purchaseOrder.status.replaceAll(
                                            '_',
                                            ' ',
                                        )}
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
                                    <Link
                                        href={showProject(
                                            purchaseOrder.project,
                                        )}
                                    >
                                        {purchaseOrder.project.project_code}{' '}
                                        &mdash; {purchaseOrder.project.name}
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
                                        {purchaseOrder.quotation.quotation_code}{' '}
                                        v{purchaseOrder.quotation.version_major}
                                        .{purchaseOrder.quotation.version_minor}
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
                                    <Link
                                        href={showVendor(purchaseOrder.vendor)}
                                    >
                                        {purchaseOrder.vendor.vendor_code}{' '}
                                        &mdash; {purchaseOrder.vendor.name}
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
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Line Items</CardTitle>
                    </CardHeader>
                    <CardContent>
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
                                                        Ref:{' '}
                                                        {item.reference_number}
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
                    </CardContent>
                </Card>

                {purchaseOrder.discounts.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Discounts</CardTitle>
                        </CardHeader>
                        <CardContent>
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
                                        {purchaseOrder.discounts.map(
                                            (discount) => (
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
                                            ),
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <dl className="space-y-2">
                            <div className="flex justify-between">
                                <dt className="text-muted-foreground">
                                    Subtotal
                                </dt>
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
                                    {formatNumber(
                                        purchaseOrder.net_after_discount,
                                    )}
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
                            <div className="flex justify-between border-t border-sidebar-border/70 pt-2 text-base font-semibold dark:border-sidebar-border">
                                <dt>Grand total</dt>
                                <dd>
                                    {currencySymbol}{' '}
                                    {formatNumber(purchaseOrder.grand_total)}
                                </dd>
                            </div>
                        </dl>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Workflow</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
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
                            {purchaseOrder.status === 'draft' && (
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button>Issue</Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogTitle>
                                            Issue this purchase order?
                                        </DialogTitle>
                                        <DialogDescription>
                                            The purchase order will move to
                                            &quot;issued&quot; and become
                                            available for checking.
                                        </DialogDescription>

                                        <Form
                                            {...issue.form(purchaseOrder)}
                                            options={{ preserveScroll: true }}
                                        >
                                            {({ processing }) => (
                                                <>
                                                    <WorkforceSelect
                                                        id="issued_by_id"
                                                        name="issued_by_id"
                                                        value={issuedById}
                                                        onValueChange={
                                                            setIssuedById
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
                                                            disabled={
                                                                processing
                                                            }
                                                        >
                                                            {processing && (
                                                                <Spinner />
                                                            )}
                                                            Issue
                                                        </Button>
                                                    </DialogFooter>
                                                </>
                                            )}
                                        </Form>
                                    </DialogContent>
                                </Dialog>
                            )}

                            {purchaseOrder.status === 'issued' &&
                                !purchaseOrder.checked_by_first && (
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button>Sign as Checker 1</Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogTitle>
                                                Sign off as Checker 1?
                                            </DialogTitle>
                                            <DialogDescription>
                                                This records your sign-off on
                                                this purchase order.
                                            </DialogDescription>

                                            <Form
                                                {...check.form(purchaseOrder)}
                                                options={{
                                                    preserveScroll: true,
                                                }}
                                            >
                                                {({ processing }) => (
                                                    <>
                                                        <input
                                                            type="hidden"
                                                            name="slot"
                                                            value="1"
                                                        />
                                                        <WorkforceSelect
                                                            id="checked_by_id_1"
                                                            name="checked_by_id"
                                                            value={checkedById1}
                                                            onValueChange={
                                                                setCheckedById1
                                                            }
                                                            workforces={
                                                                workforces
                                                            }
                                                        />
                                                        <DialogFooter className="gap-2">
                                                            <DialogClose
                                                                asChild
                                                            >
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
                                                                Sign off
                                                            </Button>
                                                        </DialogFooter>
                                                    </>
                                                )}
                                            </Form>
                                        </DialogContent>
                                    </Dialog>
                                )}

                            {purchaseOrder.status === 'issued' &&
                                !purchaseOrder.checked_by_second && (
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button>Sign as Checker 2</Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogTitle>
                                                Sign off as Checker 2?
                                            </DialogTitle>
                                            <DialogDescription>
                                                This records your sign-off on
                                                this purchase order.
                                            </DialogDescription>

                                            <Form
                                                {...check.form(purchaseOrder)}
                                                options={{
                                                    preserveScroll: true,
                                                }}
                                            >
                                                {({ processing }) => (
                                                    <>
                                                        <input
                                                            type="hidden"
                                                            name="slot"
                                                            value="2"
                                                        />
                                                        <WorkforceSelect
                                                            id="checked_by_id_2"
                                                            name="checked_by_id"
                                                            value={checkedById2}
                                                            onValueChange={
                                                                setCheckedById2
                                                            }
                                                            workforces={
                                                                workforces
                                                            }
                                                        />
                                                        <DialogFooter className="gap-2">
                                                            <DialogClose
                                                                asChild
                                                            >
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
                                                                Sign off
                                                            </Button>
                                                        </DialogFooter>
                                                    </>
                                                )}
                                            </Form>
                                        </DialogContent>
                                    </Dialog>
                                )}

                            {purchaseOrder.status === 'issued' &&
                                bothCheckersSigned && (
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button>Approve</Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogTitle>
                                                Approve this purchase order?
                                            </DialogTitle>
                                            <DialogDescription>
                                                This marks the purchase order as
                                                approved.
                                            </DialogDescription>

                                            <Form
                                                {...approve.form(purchaseOrder)}
                                                options={{
                                                    preserveScroll: true,
                                                }}
                                            >
                                                {({ processing }) => (
                                                    <>
                                                        <WorkforceSelect
                                                            id="approved_by_id"
                                                            name="approved_by_id"
                                                            value={approvedById}
                                                            onValueChange={
                                                                setApprovedById
                                                            }
                                                            workforces={
                                                                workforces
                                                            }
                                                        />
                                                        <DialogFooter className="gap-2">
                                                            <DialogClose
                                                                asChild
                                                            >
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
                                                                Approve
                                                            </Button>
                                                        </DialogFooter>
                                                    </>
                                                )}
                                            </Form>
                                        </DialogContent>
                                    </Dialog>
                                )}

                            {purchaseOrder.status === 'issued' && (
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button variant="destructive">
                                            Reject
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogTitle>
                                            Reject this purchase order?
                                        </DialogTitle>
                                        <DialogDescription>
                                            This reverts the purchase order to
                                            draft and clears its sign-offs.
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
                                                            value={
                                                                rejectionReason
                                                            }
                                                            onChange={(e) =>
                                                                setRejectionReason(
                                                                    e.target
                                                                        .value,
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
                                                            disabled={
                                                                processing
                                                            }
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

                            {(purchaseOrder.status === 'draft' ||
                                purchaseOrder.status === 'issued') && (
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button variant="destructive">
                                            Cancel Purchase Order
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogTitle>
                                            Cancel this purchase order?
                                        </DialogTitle>
                                        <DialogDescription>
                                            This marks the purchase order as
                                            cancelled. This action cannot be
                                            undone.
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
                                                        {processing && (
                                                            <Spinner />
                                                        )}
                                                        Cancel Purchase Order
                                                    </Button>
                                                </DialogFooter>
                                            )}
                                        </Form>
                                    </DialogContent>
                                </Dialog>
                            )}

                            {purchaseOrder.status === 'approved' && (
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button variant="destructive">
                                            Void Purchase Order
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogTitle>
                                            Void this purchase order?
                                        </DialogTitle>
                                        <DialogDescription>
                                            This marks the approved purchase
                                            order as voided. This action cannot
                                            be undone.
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
                                                        {processing && (
                                                            <Spinner />
                                                        )}
                                                        Void Purchase Order
                                                    </Button>
                                                </DialogFooter>
                                            )}
                                        </Form>
                                    </DialogContent>
                                </Dialog>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {progressActionsList.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Progress</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-wrap gap-3">
                            {progressActionsList.map((action) => (
                                <Dialog key={action.progress}>
                                    <DialogTrigger asChild>
                                        <Button>{action.label}</Button>
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
                        </CardContent>
                    </Card>
                )}

                {purchaseOrder.status === 'draft' && (
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
                                        Delete this purchase order
                                    </p>
                                    <p className="text-sm">
                                        Once deleted, this purchase order cannot
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
                                                            Delete Purchase
                                                            Order
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
