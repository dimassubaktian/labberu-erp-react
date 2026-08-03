import { Form, Head, Link, setLayoutProps } from '@inertiajs/react';
import { ArrowLeft, GitBranch, Pencil, Trash2 } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDate, formatDateTime, formatNumber } from '@/lib/utils';
import {
    create as createDeliveryOrder,
    show as showDeliveryOrder,
} from '@/routes/delivery-orders';
import {
    create as createInvoice,
    show as showInvoice,
} from '@/routes/invoices';
import { show as showProject } from '@/routes/projects';
import { show as showPurchaseOrder } from '@/routes/purchase-orders';
import { destroy, edit, index, show } from '@/routes/quotations';
import {
    create as createBom,
    edit as editBom,
    show as showBom,
} from '@/routes/quotations/bom';
import { update as updateProgress } from '@/routes/quotations/progress';
import { store as storeRevision } from '@/routes/quotations/revisions';
import { update as updateStatus } from '@/routes/quotations/status';

type StatusAction = {
    status: string;
    label: string;
    variant?: 'default' | 'outline' | 'destructive';
    confirmTitle: string;
    confirmDescription: string;
};

function statusActions(status: string): StatusAction[] {
    switch (status) {
        case 'draft':
            return [
                {
                    status: 'request_for_approval',
                    label: 'Submit for Approval',
                    confirmTitle: 'Submit this quotation for approval?',
                    confirmDescription:
                        'The quotation will be locked from further edits until it is approved or rejected.',
                },
                {
                    status: 'cancelled',
                    label: 'Cancel Quotation',
                    variant: 'destructive',
                    confirmTitle: 'Cancel this quotation?',
                    confirmDescription:
                        'This marks the quotation as cancelled. This action cannot be undone.',
                },
            ];
        case 'request_for_approval':
            return [
                {
                    status: 'approved',
                    label: 'Approve',
                    confirmTitle: 'Approve this quotation?',
                    confirmDescription:
                        'You will be recorded as the approver and the quotation will be marked approved.',
                },
                {
                    status: 'rejected',
                    label: 'Reject',
                    variant: 'destructive',
                    confirmTitle: 'Reject this quotation?',
                    confirmDescription:
                        'This marks the quotation as rejected. This action cannot be undone.',
                },
                {
                    status: 'cancelled',
                    label: 'Cancel Quotation',
                    variant: 'destructive',
                    confirmTitle: 'Cancel this quotation?',
                    confirmDescription:
                        'This marks the quotation as cancelled. This action cannot be undone.',
                },
            ];
        case 'approved':
            return [
                {
                    status: 'voided',
                    label: 'Void Quotation',
                    variant: 'destructive',
                    confirmTitle: 'Void this quotation?',
                    confirmDescription:
                        'This marks the approved quotation as voided. This action cannot be undone.',
                },
            ];
        default:
            return [];
    }
}

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
                    confirmTitle: 'Mark this quotation as sent?',
                    confirmDescription:
                        'This records that the quotation has been sent to the customer.',
                },
            ];
        case 'sent':
            return [
                {
                    progress: 'accepted',
                    label: 'Mark as Accepted',
                    confirmTitle: 'Mark this quotation as accepted?',
                    confirmDescription:
                        'This records that the customer has accepted the quotation.',
                },
            ];
        case 'accepted':
            return [
                {
                    progress: 'converted',
                    label: 'Mark as Converted',
                    confirmTitle: 'Mark this quotation as converted?',
                    confirmDescription:
                        'This records that the quotation has been converted into further work, e.g. a purchase order.',
                },
            ];
        case 'converted':
            return [
                {
                    progress: 'partially_delivered',
                    label: 'Mark as Partially Delivered',
                    confirmTitle: 'Mark this quotation as partially delivered?',
                    confirmDescription:
                        'This records that some, but not all, of the goods have been delivered.',
                },
                {
                    progress: 'fully_delivered',
                    label: 'Mark as Fully Delivered',
                    confirmTitle: 'Mark this quotation as fully delivered?',
                    confirmDescription:
                        'This records that all goods on the quotation have been delivered.',
                },
            ];
        case 'partially_delivered':
            return [
                {
                    progress: 'fully_delivered',
                    label: 'Mark as Fully Delivered',
                    confirmTitle: 'Mark this quotation as fully delivered?',
                    confirmDescription:
                        'This records that all goods on the quotation have been delivered.',
                },
            ];
        default:
            return [];
    }
}

type QuotationItem = {
    id: number;
    description: string | null;
    quantity: string;
    unit: string;
    unit_price: string;
    unit_cost: string;
    discount_type: string | null;
    discount_value: string | null;
    total_price: string;
    total_cost: string;
    margin: string;
    margin_percent: string;
    product: {
        id: number;
        uuid: string;
        product_code: string;
        name: string;
    };
};

type QuotationGroup = {
    id: number;
    name: string;
    discount_type: string | null;
    discount_value: string | null;
    subtotal: string;
    discount_amount: string;
    tax_amount: string;
    total: string;
    tax: { id: number; name: string; rate: string; type: string } | null;
    items: QuotationItem[];
};

type Quotation = {
    id: number;
    uuid: string;
    quotation_code: string;
    version_major: number;
    version_minor: number;
    status: string;
    progress: string | null;
    is_current: boolean;
    valid_until: string | null;
    discount_type: string | null;
    discount_value: string | null;
    subtotal: string;
    discount_amount: string;
    tax_amount: string;
    total: string;
    remarks: string | null;
    approved_at: string | null;
    created_at: string;
    updated_at: string;
    project: {
        id: number;
        uuid: string;
        name: string;
        project_code: string;
        customer: { id: number; name: string };
    };
    currency: {
        id: number;
        iso_code: string;
        name: string;
        symbol: string | null;
    };
    tax: { id: number; name: string; rate: string; type: string } | null;
    approver: { id: number; name: string } | null;
    items: QuotationItem[];
    groups: QuotationGroup[];
    bom: Bom | null;
    purchase_orders: PurchaseOrder[];
    delivery_orders: DeliveryOrder[];
    invoices: Invoice[];
};

type Bom = {
    id: number;
    uuid: string;
    main_cost: string;
    overhead_percentage: string | null;
    overhead_cost: string;
    total_cost: string;
    selling_percentage: string | null;
    selling_cost: string;
};

type PurchaseOrder = {
    id: number;
    uuid: string;
    purchase_order_code: string;
    status: string;
    grand_total: string;
    currency: {
        id: number;
        iso_code: string;
        symbol: string | null;
    };
    vendor: {
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
};

type Invoice = {
    id: number;
    uuid: string;
    invoice_code: string;
    status: string;
    payment_status: string | null;
    invoice_date: string;
};

type HistoryEntry = {
    id: number;
    uuid: string;
    version_major: number;
    version_minor: number;
    status: string;
    is_current: boolean;
    created_at: string;
};

type Props = {
    quotation: Quotation;
    history: HistoryEntry[];
};

export default function QuotationsShow({ quotation, history }: Props) {
    setLayoutProps({
        breadcrumbs: [
            { title: 'Quotations', href: index() },
            { title: quotation.quotation_code, href: show(quotation) },
        ],
    });

    const [versionType, setVersionType] = useState('minor');

    const currencySymbol =
        quotation.currency.symbol ?? quotation.currency.iso_code;
    const actions = statusActions(quotation.status);
    const progressActionsList =
        quotation.status === 'approved'
            ? progressActions(quotation.progress)
            : [];

    return (
        <>
            <Head title={quotation.quotation_code} />

            <div className="mx-auto w-full max-w-4xl space-y-6 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <Heading
                        title={quotation.quotation_code}
                        description={`Version ${quotation.version_major}.${quotation.version_minor}`}
                    />

                    <div className="flex flex-col gap-2 sm:flex-row">
                        <Button
                            variant="destructive"
                            asChild
                            className="w-full sm:w-auto"
                        >
                            <Link href={index()}>
                                <ArrowLeft />
                                Back to Quotations
                            </Link>
                        </Button>

                        {quotation.status === 'draft' && (
                            <Button asChild className="w-full sm:w-auto">
                                <Link href={edit(quotation)}>
                                    <Pencil />
                                    Edit Quotation
                                </Link>
                            </Button>
                        )}

                        {quotation.status !== 'draft' &&
                            quotation.is_current && (
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="w-full sm:w-auto"
                                        >
                                            <GitBranch />
                                            Create Revision
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogTitle>
                                            Create a revision of &quot;
                                            {quotation.quotation_code}&quot;?
                                        </DialogTitle>
                                        <DialogDescription>
                                            This creates a new draft version you
                                            can edit. The current version is
                                            kept as history.
                                        </DialogDescription>

                                        <Form
                                            {...storeRevision.form(quotation)}
                                            options={{ preserveScroll: true }}
                                        >
                                            {({ processing }) => (
                                                <>
                                                    <input
                                                        type="hidden"
                                                        name="version_type"
                                                        value={versionType}
                                                    />
                                                    <div className="grid gap-2 py-2">
                                                        <Label htmlFor="version_type">
                                                            Revision type
                                                        </Label>
                                                        <Select
                                                            value={versionType}
                                                            onValueChange={
                                                                setVersionType
                                                            }
                                                        >
                                                            <SelectTrigger
                                                                id="version_type"
                                                                className="w-full"
                                                            >
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="minor">
                                                                    Minor
                                                                    &mdash;
                                                                    internal
                                                                    revision
                                                                </SelectItem>
                                                                <SelectItem value="major">
                                                                    Major
                                                                    &mdash;
                                                                    customer
                                                                    requested
                                                                    change
                                                                </SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

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
                                                            Create Revision
                                                        </Button>
                                                    </DialogFooter>
                                                </>
                                            )}
                                        </Form>
                                    </DialogContent>
                                </Dialog>
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
                                        {quotation.status.replaceAll('_', ' ')}
                                    </Badge>
                                </dd>
                            </div>

                            {quotation.progress && (
                                <div>
                                    <dt className="text-sm text-muted-foreground">
                                        Progress
                                    </dt>
                                    <dd>
                                        <Badge
                                            variant="secondary"
                                            className="capitalize"
                                        >
                                            {quotation.progress.replaceAll(
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
                                    <Link href={showProject(quotation.project)}>
                                        {quotation.project.project_code} &mdash;{' '}
                                        {quotation.project.name}
                                    </Link>
                                </dd>
                            </div>

                            <div>
                                <dt className="text-sm text-muted-foreground">
                                    Customer
                                </dt>
                                <dd className="font-medium">
                                    {quotation.project.customer.name}
                                </dd>
                            </div>

                            <div>
                                <dt className="text-sm text-muted-foreground">
                                    Currency
                                </dt>
                                <dd className="font-medium">
                                    {quotation.currency.iso_code} &mdash;{' '}
                                    {quotation.currency.name}
                                </dd>
                            </div>

                            <div>
                                <dt className="text-sm text-muted-foreground">
                                    Valid until
                                </dt>
                                <dd className="font-medium">
                                    {quotation.valid_until ? (
                                        formatDate(quotation.valid_until)
                                    ) : (
                                        <span className="text-muted-foreground">
                                            &mdash;
                                        </span>
                                    )}
                                </dd>
                            </div>

                            <div>
                                <dt className="text-sm text-muted-foreground">
                                    Overall tax
                                </dt>
                                <dd className="font-medium">
                                    {quotation.tax ? (
                                        `${quotation.tax.name} (${
                                            quotation.tax.type === 'percentage'
                                                ? `${quotation.tax.rate}%`
                                                : quotation.tax.rate
                                        })`
                                    ) : (
                                        <span className="text-muted-foreground">
                                            &mdash;
                                        </span>
                                    )}
                                </dd>
                            </div>

                            <div>
                                <dt className="text-sm text-muted-foreground">
                                    Overall discount
                                </dt>
                                <dd className="font-medium">
                                    {quotation.discount_type &&
                                    quotation.discount_value ? (
                                        quotation.discount_type ===
                                        'percentage' ? (
                                            `${quotation.discount_value}%`
                                        ) : (
                                            `${currencySymbol} ${formatNumber(quotation.discount_value)}`
                                        )
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
                                    {quotation.approver &&
                                    quotation.approved_at ? (
                                        `${quotation.approver.name} — ${formatDateTime(quotation.approved_at)}`
                                    ) : (
                                        <span className="text-muted-foreground">
                                            &mdash;
                                        </span>
                                    )}
                                </dd>
                            </div>

                            <div className="sm:col-span-2">
                                <dt className="text-sm text-muted-foreground">
                                    Remarks
                                </dt>
                                <dd className="font-medium whitespace-pre-line">
                                    {quotation.remarks ?? (
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
                                    {formatDateTime(quotation.created_at)}
                                </dd>
                            </div>

                            <div>
                                <dt className="text-sm text-muted-foreground">
                                    Last updated
                                </dt>
                                <dd className="font-medium">
                                    {formatDateTime(quotation.updated_at)}
                                </dd>
                            </div>
                        </dl>
                    </CardContent>
                </Card>

                {actions.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Workflow</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-wrap gap-3">
                            {actions.map((action) => (
                                <Dialog key={action.status}>
                                    <DialogTrigger asChild>
                                        <Button
                                            variant={
                                                action.variant ?? 'default'
                                            }
                                        >
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
                                            {...updateStatus.form(quotation)}
                                            options={{
                                                preserveScroll: true,
                                            }}
                                        >
                                            {({ processing }) => (
                                                <>
                                                    <input
                                                        type="hidden"
                                                        name="status"
                                                        value={action.status}
                                                    />
                                                    <DialogFooter className="gap-2">
                                                        <DialogClose asChild>
                                                            <Button variant="secondary">
                                                                Cancel
                                                            </Button>
                                                        </DialogClose>

                                                        <Button
                                                            type="submit"
                                                            variant={
                                                                action.variant ??
                                                                'default'
                                                            }
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
                                            {...updateProgress.form(quotation)}
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

                {quotation.groups.map((group) => (
                    <Card key={group.id}>
                        <CardHeader>
                            <CardTitle>{group.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="overflow-hidden rounded-xl border border-border/50">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>No</TableHead>
                                            <TableHead>Product</TableHead>
                                            <TableHead>Qty</TableHead>
                                            <TableHead>Unit</TableHead>
                                            <TableHead>Unit price</TableHead>
                                            <TableHead>Unit cost</TableHead>
                                            <TableHead>Total price</TableHead>
                                            <TableHead>Total cost</TableHead>
                                            <TableHead>Margin</TableHead>
                                            <TableHead>Margin %</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {group.items.map((item, index) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="text-muted-foreground">
                                                    {index + 1}
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    <div>
                                                        {
                                                            item.product
                                                                .product_code
                                                        }{' '}
                                                        &mdash;{' '}
                                                        {item.product.name}
                                                    </div>
                                                    {item.description && (
                                                        <div className="text-sm font-normal whitespace-pre-line text-muted-foreground">
                                                            {item.description}
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {formatNumber(
                                                        item.quantity,
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {item.unit}
                                                </TableCell>
                                                <TableCell>
                                                    {formatNumber(
                                                        item.unit_price,
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {formatNumber(
                                                        item.unit_cost,
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {formatNumber(
                                                        item.total_price,
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {formatNumber(
                                                        item.total_cost,
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {formatNumber(item.margin)}
                                                </TableCell>
                                                <TableCell>
                                                    {item.margin_percent}%
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            <dl className="space-y-2">
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">
                                        Group subtotal
                                    </dt>
                                    <dd className="font-medium">
                                        {currencySymbol}{' '}
                                        {formatNumber(group.subtotal)}
                                    </dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">
                                        Group discount
                                        {group.discount_type &&
                                            group.discount_value &&
                                            ` (${
                                                group.discount_type ===
                                                'percentage'
                                                    ? `${group.discount_value}%`
                                                    : `${currencySymbol} ${formatNumber(group.discount_value)}`
                                            })`}
                                    </dt>
                                    <dd className="font-medium">
                                        {currencySymbol}{' '}
                                        {formatNumber(group.discount_amount)}
                                    </dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">
                                        Group tax
                                        {group.tax && ` (${group.tax.name})`}
                                    </dt>
                                    <dd className="font-medium">
                                        {currencySymbol}{' '}
                                        {formatNumber(group.tax_amount)}
                                    </dd>
                                </div>
                                <div className="flex justify-between border-t border-sidebar-border/70 pt-2 text-base font-semibold dark:border-sidebar-border">
                                    <dt>Group total</dt>
                                    <dd>
                                        {currencySymbol}{' '}
                                        {formatNumber(group.total)}
                                    </dd>
                                </div>
                            </dl>
                        </CardContent>
                    </Card>
                ))}

                {quotation.items.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Ungrouped items</CardTitle>
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
                                            <TableHead>Unit cost</TableHead>
                                            <TableHead>Total price</TableHead>
                                            <TableHead>Total cost</TableHead>
                                            <TableHead>Margin</TableHead>
                                            <TableHead>Margin %</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {quotation.items.map((item, index) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="text-muted-foreground">
                                                    {index + 1}
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    <div>
                                                        {
                                                            item.product
                                                                .product_code
                                                        }{' '}
                                                        &mdash;{' '}
                                                        {item.product.name}
                                                    </div>
                                                    {item.description && (
                                                        <div className="text-sm font-normal whitespace-pre-line text-muted-foreground">
                                                            {item.description}
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {formatNumber(
                                                        item.quantity,
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {item.unit}
                                                </TableCell>
                                                <TableCell>
                                                    {formatNumber(
                                                        item.unit_price,
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {formatNumber(
                                                        item.unit_cost,
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {formatNumber(
                                                        item.total_price,
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {formatNumber(
                                                        item.total_cost,
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {formatNumber(item.margin)}
                                                </TableCell>
                                                <TableCell>
                                                    {item.margin_percent}%
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            <dl className="space-y-2">
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">
                                        Subtotal
                                    </dt>
                                    <dd className="font-medium">
                                        {currencySymbol}{' '}
                                        {formatNumber(
                                            quotation.items.reduce(
                                                (sum, item) =>
                                                    sum +
                                                    Number(item.total_price),
                                                0,
                                            ),
                                        )}
                                    </dd>
                                </div>
                            </dl>
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>Overall Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <dl className="space-y-2">
                            <div className="flex justify-between">
                                <dt className="text-muted-foreground">
                                    Subtotal
                                </dt>
                                <dd className="font-medium">
                                    {currencySymbol}{' '}
                                    {formatNumber(quotation.subtotal)}
                                </dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-muted-foreground">
                                    Discount
                                </dt>
                                <dd className="font-medium">
                                    {currencySymbol}{' '}
                                    {formatNumber(quotation.discount_amount)}
                                </dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-muted-foreground">Tax</dt>
                                <dd className="font-medium">
                                    {currencySymbol}{' '}
                                    {formatNumber(quotation.tax_amount)}
                                </dd>
                            </div>
                            <div className="flex justify-between border-t border-sidebar-border/70 pt-2 text-base font-semibold dark:border-sidebar-border">
                                <dt>Total</dt>
                                <dd>
                                    {currencySymbol}{' '}
                                    {formatNumber(quotation.total)}
                                </dd>
                            </div>
                        </dl>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent>
                        <Tabs defaultValue="bom">
                            <TabsList>
                                <TabsTrigger value="bom">
                                    Bill of Materials
                                </TabsTrigger>
                                <TabsTrigger value="purchase-orders">
                                    Purchase Orders
                                </TabsTrigger>
                                <TabsTrigger value="delivery-orders">
                                    Delivery Orders
                                </TabsTrigger>
                                <TabsTrigger value="invoices">
                                    Invoices
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="bom" className="space-y-4">
                                {quotation.status === 'draft' &&
                                    !quotation.bom && (
                                        <div className="flex justify-end">
                                            <Button size="sm" asChild>
                                                <Link href={createBom(quotation)}>
                                                    Create BOM
                                                </Link>
                                            </Button>
                                        </div>
                                    )}

                                {quotation.bom ? (
                                    <div className="space-y-4">
                                        <dl className="space-y-2">
                                            <div className="flex justify-between">
                                                <dt className="text-muted-foreground">
                                                    Main cost
                                                </dt>
                                                <dd className="font-medium">
                                                    {currencySymbol}{' '}
                                                    {formatNumber(
                                                        quotation.bom
                                                            .main_cost,
                                                    )}
                                                </dd>
                                            </div>
                                            <div className="flex justify-between">
                                                <dt className="text-muted-foreground">
                                                    Overhead cost
                                                    {quotation.bom
                                                        .overhead_percentage &&
                                                        ` (${quotation.bom.overhead_percentage}%)`}
                                                </dt>
                                                <dd className="font-medium">
                                                    {currencySymbol}{' '}
                                                    {formatNumber(
                                                        quotation.bom
                                                            .overhead_cost,
                                                    )}
                                                </dd>
                                            </div>
                                            <div className="flex justify-between border-t border-sidebar-border/70 pt-2 font-semibold dark:border-sidebar-border">
                                                <dt>Total cost</dt>
                                                <dd>
                                                    {currencySymbol}{' '}
                                                    {formatNumber(
                                                        quotation.bom
                                                            .total_cost,
                                                    )}
                                                </dd>
                                            </div>
                                            <div className="flex justify-between">
                                                <dt className="text-muted-foreground">
                                                    Selling cost
                                                    {quotation.bom
                                                        .selling_percentage &&
                                                        ` (${quotation.bom.selling_percentage}%)`}
                                                </dt>
                                                <dd className="font-medium">
                                                    {currencySymbol}{' '}
                                                    {formatNumber(
                                                        quotation.bom
                                                            .selling_cost,
                                                    )}
                                                </dd>
                                            </div>
                                        </dl>

                                        <div className="flex flex-col gap-2 sm:flex-row">
                                            <Button
                                                variant="outline"
                                                className="w-full sm:w-auto"
                                                asChild
                                            >
                                                <Link href={showBom(quotation)}>
                                                    View Bill of Materials
                                                </Link>
                                            </Button>

                                            {quotation.status === 'draft' && (
                                                <Button
                                                    className="w-full sm:w-auto"
                                                    asChild
                                                >
                                                    <Link
                                                        href={editBom(
                                                            quotation,
                                                        )}
                                                    >
                                                        Edit Bill of Materials
                                                    </Link>
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        No bill of materials has been created
                                        for this quotation yet.
                                    </p>
                                )}
                            </TabsContent>

                            <TabsContent
                                value="purchase-orders"
                                className="space-y-4"
                            >
                                {quotation.purchase_orders.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        No purchase orders have been raised
                                        against this quotation yet.
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {quotation.purchase_orders.map(
                                            (purchaseOrder) => (
                                                <Link
                                                    key={purchaseOrder.id}
                                                    href={showPurchaseOrder(
                                                        purchaseOrder,
                                                    )}
                                                    className="flex flex-col gap-2 rounded-lg border p-4 hover:bg-accent sm:flex-row sm:items-center sm:justify-between"
                                                >
                                                    <div className="space-y-0.5">
                                                        <p className="font-medium">
                                                            {
                                                                purchaseOrder.purchase_order_code
                                                            }
                                                        </p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {
                                                                purchaseOrder
                                                                    .vendor
                                                                    .name
                                                            }
                                                        </p>
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        <span className="font-medium">
                                                            {purchaseOrder
                                                                .currency
                                                                .symbol ??
                                                                purchaseOrder
                                                                    .currency
                                                                    .iso_code}{' '}
                                                            {formatNumber(
                                                                purchaseOrder.grand_total,
                                                            )}
                                                        </span>
                                                        <Badge
                                                            variant="secondary"
                                                            className="capitalize"
                                                        >
                                                            {purchaseOrder.status.replaceAll(
                                                                '_',
                                                                ' ',
                                                            )}
                                                        </Badge>
                                                    </div>
                                                </Link>
                                            ),
                                        )}
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent
                                value="delivery-orders"
                                className="space-y-4"
                            >
                                {quotation.status === 'approved' && (
                                    <div className="flex justify-end">
                                        <Button size="sm" asChild>
                                            <Link
                                                href={createDeliveryOrder({
                                                    query: {
                                                        quotation:
                                                            quotation.uuid,
                                                    },
                                                })}
                                            >
                                                Create DO
                                            </Link>
                                        </Button>
                                    </div>
                                )}

                                {quotation.delivery_orders.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        No delivery orders have been raised
                                        against this quotation yet.
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {quotation.delivery_orders.map(
                                            (deliveryOrder) => (
                                                <Link
                                                    key={deliveryOrder.id}
                                                    href={showDeliveryOrder(
                                                        deliveryOrder,
                                                    )}
                                                    className="flex flex-col gap-2 rounded-lg border p-4 hover:bg-accent sm:flex-row sm:items-center sm:justify-between"
                                                >
                                                    <div className="space-y-0.5">
                                                        <p className="font-medium">
                                                            {
                                                                deliveryOrder.do_code
                                                            }
                                                        </p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {formatDate(
                                                                deliveryOrder.delivery_date,
                                                            )}
                                                        </p>
                                                    </div>

                                                    <Badge
                                                        variant="secondary"
                                                        className="w-fit capitalize"
                                                    >
                                                        {deliveryOrder.status.replaceAll(
                                                            '_',
                                                            ' ',
                                                        )}
                                                    </Badge>
                                                </Link>
                                            ),
                                        )}
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="invoices" className="space-y-4">
                                {quotation.status === 'approved' && (
                                    <div className="flex justify-end">
                                        <Button size="sm" asChild>
                                            <Link
                                                href={createInvoice({
                                                    query: {
                                                        quotation:
                                                            quotation.uuid,
                                                    },
                                                })}
                                            >
                                                Create Invoice
                                            </Link>
                                        </Button>
                                    </div>
                                )}

                                {quotation.invoices.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        No invoices have been raised against
                                        this quotation yet.
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {quotation.invoices.map((invoice) => (
                                            <Link
                                                key={invoice.id}
                                                href={showInvoice(invoice)}
                                                className="flex flex-col gap-2 rounded-lg border p-4 hover:bg-accent sm:flex-row sm:items-center sm:justify-between"
                                            >
                                                <div className="space-y-0.5">
                                                    <p className="font-medium">
                                                        {invoice.invoice_code}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {formatDate(
                                                            invoice.invoice_date,
                                                        )}
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {invoice.payment_status && (
                                                        <Badge
                                                            variant="secondary"
                                                            className="w-fit capitalize"
                                                        >
                                                            {invoice.payment_status.replaceAll(
                                                                '_',
                                                                ' ',
                                                            )}
                                                        </Badge>
                                                    )}
                                                    <Badge
                                                        variant="secondary"
                                                        className="w-fit capitalize"
                                                    >
                                                        {invoice.status.replaceAll(
                                                            '_',
                                                            ' ',
                                                        )}
                                                    </Badge>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>

                {history.length > 1 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Revision History</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {history.map((entry) =>
                                entry.id === quotation.id ? (
                                    <div
                                        key={entry.id}
                                        className="rounded-lg border border-primary bg-accent p-4"
                                    >
                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                            <div>
                                                <p className="font-medium">
                                                    Version{' '}
                                                    {entry.version_major}.
                                                    {entry.version_minor}{' '}
                                                    <span className="text-muted-foreground">
                                                        (viewing)
                                                    </span>
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {formatDate(
                                                        entry.created_at,
                                                    )}
                                                </p>
                                            </div>

                                            <div className="flex gap-2">
                                                {entry.is_current && (
                                                    <Badge>Current</Badge>
                                                )}
                                                <Badge
                                                    variant="secondary"
                                                    className="capitalize"
                                                >
                                                    {entry.status.replaceAll(
                                                        '_',
                                                        ' ',
                                                    )}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <Link
                                        key={entry.id}
                                        href={show(entry)}
                                        className="block rounded-lg border border-sidebar-border/70 p-4 transition-colors hover:bg-accent dark:border-sidebar-border"
                                    >
                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                            <div>
                                                <p className="font-medium">
                                                    Version{' '}
                                                    {entry.version_major}.
                                                    {entry.version_minor}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {formatDate(
                                                        entry.created_at,
                                                    )}
                                                </p>
                                            </div>

                                            <div className="flex gap-2">
                                                {entry.is_current && (
                                                    <Badge>Current</Badge>
                                                )}
                                                <Badge
                                                    variant="secondary"
                                                    className="capitalize"
                                                >
                                                    {entry.status.replaceAll(
                                                        '_',
                                                        ' ',
                                                    )}
                                                </Badge>
                                            </div>
                                        </div>
                                    </Link>
                                ),
                            )}
                        </CardContent>
                    </Card>
                )}

                {quotation.status === 'draft' && history.length <= 1 && (
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
                                        Delete this quotation
                                    </p>
                                    <p className="text-sm">
                                        Once deleted, this quotation cannot be
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
                                            Delete Quotation
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogTitle>
                                            Delete &quot;
                                            {quotation.quotation_code}&quot;?
                                        </DialogTitle>
                                        <DialogDescription>
                                            This action cannot be undone. This
                                            quotation will be permanently
                                            deleted.
                                        </DialogDescription>

                                        <Form
                                            {...destroy.form(quotation)}
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
                                                            Delete Quotation
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
