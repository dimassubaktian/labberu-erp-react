import { Form, Head, Link, setLayoutProps } from '@inertiajs/react';
import {
    ArrowLeft,
    Ban,
    CalendarDays,
    ClipboardList,
    CircleOff,
    CircleDollarSign,
    Download,
    Package,
    Pencil,
    Plus,
    Search,
    Trash2,
    TrendingUp,
    Upload,
    X,
} from 'lucide-react';
import React from 'react';
import { AsyncCombobox } from '@/components/async-combobox';
import { KpiCard } from '@/components/dashboard/kpi-card';
import InputError from '@/components/input-error';
import { ProjectBadge } from '@/components/project-badge';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { formatDate, formatDateTime, formatNumber } from '@/lib/utils';
import { show as showCustomer } from '@/routes/customers';
import { show as showDeliveryOrder } from '@/routes/delivery-orders';
import {
    search as searchEquipment,
    show as showEquipment,
} from '@/routes/equipment';
import { show as showInvoice } from '@/routes/invoices';
import {
    cancel,
    destroy,
    edit,
    index,
    show,
    voidMethod as voidProject,
} from '@/routes/projects';
import {
    destroy as destroyAttachment,
    download as downloadAttachment,
    store as storeAttachment,
} from '@/routes/projects/attachments';
import { store as storeEquipmentCheckout } from '@/routes/projects/equipment-checkouts';
import { show as showPurchaseInvoice } from '@/routes/purchase-invoices';
import { show as showPurchaseOrder } from '@/routes/purchase-orders';
import {
    create as createQuotation,
    show as showQuotation,
} from '@/routes/quotations';

function formatFileSize(bytes: number): string {
    if (bytes < 1024) {
        return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type Project = {
    id: number;
    uuid: string;
    project_code: string;
    name: string;
    request_date: string;
    description: string | null;
    cancel_reason: string | null;
    void_reason: string | null;
    status: string;
    sales_status: string | null;
    po_status: string | null;
    billing_status: string | null;
    priority: string;
    equipment_calibration_max_age_months: number | null;
    start_date: string | null;
    end_date: string | null;
    completed_at: string | null;
    estimate_contract_value: string | null;
    estimate_cost: string | null;
    actual_cost: string | null;
    actual_contract_value: string | null;
    created_at: string;
    updated_at: string;
    customer: {
        id: number;
        uuid: string;
        name: string;
    };
    person_in_charge: {
        id: number;
        full_name: string;
    } | null;
    attachments: Attachment[];
};

type EquipmentAssignmentHistory = {
    id: number;
    uuid: string;
    checked_out_at: string;
    returned_at: string | null;
    notes: string | null;
    calibration_compliant: boolean | null;
    equipment: {
        id: number;
        uuid: string;
        equipment_code: string;
        name: string;
        category: string | null;
    };
    custodian: { id: number; full_name: string } | null;
    creator: { id: number; name: string };
};

type EquipmentOption = {
    id: number;
    uuid: string;
    equipment_code: string;
    name: string;
    category: string | null;
};

type WorkforceOption = {
    id: number;
    full_name: string;
};

type Attachment = {
    id: number;
    uuid: string;
    name: string;
    original_name: string;
    size: number;
    created_at: string;
    uploader: { id: number; name: string };
};

type Quotation = {
    id: number;
    uuid: string;
    quotation_code: string;
    version_major: number;
    version_minor: number;
    status: string;
    is_current: boolean;
    valid_until: string | null;
    total: string;
    currency: {
        id: number;
        iso_code: string;
        symbol: string | null;
    };
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

type QuotationVersion = {
    id: number;
    quotation_code: string;
    version_major: number;
    version_minor: number;
};

type DeliveryOrder = {
    id: number;
    uuid: string;
    do_code: string;
    status: string;
    delivery_date: string;
    quotation: QuotationVersion;
};

type Invoice = {
    id: number;
    uuid: string;
    invoice_code: string;
    status: string;
    payment_status: string | null;
    invoice_date: string;
    total: string;
    quotation: QuotationVersion;
};

type PurchaseInvoice = {
    id: number;
    uuid: string;
    purchase_invoice_code: string;
    status: string;
    payment_status: string | null;
    invoice_date: string;
    total: string;
    purchase_order: {
        id: number;
        purchase_order_code: string;
        currency: {
            id: number;
            iso_code: string;
            symbol: string | null;
        };
    };
};

type Props = {
    project: Project;
    plannedCost: string | null;
    quotations: Quotation[];
    purchaseOrders: PurchaseOrder[];
    deliveryOrders: DeliveryOrder[];
    invoices: Invoice[];
    purchaseInvoices: PurchaseInvoice[];
    workforces: WorkforceOption[];
    equipmentAssignments: EquipmentAssignmentHistory[];
};

const QUOTATION_STATUS_OPTIONS = [
    { value: 'draft', label: 'Draft' },
    { value: 'request_for_approval', label: 'Request for approval' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'voided', label: 'Voided' },
    { value: 'cancelled', label: 'Cancelled' },
];

const PURCHASE_ORDER_STATUS_OPTIONS = [
    { value: 'draft', label: 'Draft' },
    { value: 'issued', label: 'Issued' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'voided', label: 'Voided' },
];

const DELIVERY_ORDER_STATUS_OPTIONS = [
    { value: 'draft', label: 'Draft' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'cancelled', label: 'Cancelled' },
];

const INVOICE_STATUS_OPTIONS = [
    { value: 'draft', label: 'Draft' },
    { value: 'issued', label: 'Issued' },
];

const INVOICE_PAYMENT_OPTIONS = [
    { value: 'paid', label: 'Paid' },
    { value: 'partially_paid', label: 'Partially paid' },
];

const PURCHASE_INVOICE_STATUS_OPTIONS = [
    { value: 'draft', label: 'Draft' },
    { value: 'issued', label: 'Issued' },
];

const PURCHASE_INVOICE_PAYMENT_OPTIONS = [
    { value: 'paid', label: 'Paid' },
    { value: 'partially_paid', label: 'Partially paid' },
];

export default function ProjectsShow({
    project,
    plannedCost,
    quotations,
    purchaseOrders,
    deliveryOrders,
    invoices,
    purchaseInvoices,
    workforces,
    equipmentAssignments,
}: Props) {
    const [checkoutEquipmentId, setCheckoutEquipmentId] = React.useState('');
    const [checkoutCustodianId, setCheckoutCustodianId] =
        React.useState('none');

    const costVariance =
        plannedCost && project.actual_cost
            ? Number(project.actual_cost) - Number(plannedCost)
            : null;

    // Delivery orders and invoices hang off quotations, purchase invoices off purchase
    // orders, so these two cover every document raised against the project.
    const hasRelatedDocuments =
        quotations.length > 0 || purchaseOrders.length > 0;

    const [quotationSearch, setQuotationSearch] = React.useState('');
    const [quotationStatus, setQuotationStatus] = React.useState('all');
    const [purchaseOrderSearch, setPurchaseOrderSearch] = React.useState('');
    const [purchaseOrderStatus, setPurchaseOrderStatus] = React.useState('all');
    const [deliveryOrderSearch, setDeliveryOrderSearch] = React.useState('');
    const [deliveryOrderStatus, setDeliveryOrderStatus] = React.useState('all');
    const [invoiceSearch, setInvoiceSearch] = React.useState('');
    const [invoiceStatus, setInvoiceStatus] = React.useState('all');
    const [invoicePaymentStatus, setInvoicePaymentStatus] =
        React.useState('all');
    const [purchaseInvoiceSearch, setPurchaseInvoiceSearch] =
        React.useState('');
    const [purchaseInvoiceStatus, setPurchaseInvoiceStatus] =
        React.useState('all');
    const [purchaseInvoicePaymentStatus, setPurchaseInvoicePaymentStatus] =
        React.useState('all');

    const filteredQuotations = React.useMemo(() => {
        const search = quotationSearch.trim().toLowerCase();

        return quotations.filter((quotation) => {
            const matchesSearch =
                search === '' ||
                quotation.quotation_code.toLowerCase().includes(search);
            const matchesStatus =
                quotationStatus === 'all' ||
                quotation.status === quotationStatus;

            return matchesSearch && matchesStatus;
        });
    }, [quotations, quotationSearch, quotationStatus]);

    const filteredPurchaseOrders = React.useMemo(() => {
        const search = purchaseOrderSearch.trim().toLowerCase();

        return purchaseOrders.filter((purchaseOrder) => {
            const matchesSearch =
                search === '' ||
                purchaseOrder.purchase_order_code
                    .toLowerCase()
                    .includes(search) ||
                purchaseOrder.vendor.name.toLowerCase().includes(search);
            const matchesStatus =
                purchaseOrderStatus === 'all' ||
                purchaseOrder.status === purchaseOrderStatus;

            return matchesSearch && matchesStatus;
        });
    }, [purchaseOrders, purchaseOrderSearch, purchaseOrderStatus]);

    const filteredDeliveryOrders = React.useMemo(() => {
        const search = deliveryOrderSearch.trim().toLowerCase();

        return deliveryOrders.filter((deliveryOrder) => {
            const matchesSearch =
                search === '' ||
                deliveryOrder.do_code.toLowerCase().includes(search);
            const matchesStatus =
                deliveryOrderStatus === 'all' ||
                deliveryOrder.status === deliveryOrderStatus;

            return matchesSearch && matchesStatus;
        });
    }, [deliveryOrders, deliveryOrderSearch, deliveryOrderStatus]);

    const filteredInvoices = React.useMemo(() => {
        const search = invoiceSearch.trim().toLowerCase();

        return invoices.filter((invoice) => {
            const matchesSearch =
                search === '' ||
                invoice.invoice_code.toLowerCase().includes(search);
            const matchesStatus =
                invoiceStatus === 'all' || invoice.status === invoiceStatus;
            const matchesPaymentStatus =
                invoicePaymentStatus === 'all' ||
                invoice.payment_status === invoicePaymentStatus;

            return matchesSearch && matchesStatus && matchesPaymentStatus;
        });
    }, [invoices, invoiceSearch, invoiceStatus, invoicePaymentStatus]);

    const filteredPurchaseInvoices = React.useMemo(() => {
        const search = purchaseInvoiceSearch.trim().toLowerCase();

        return purchaseInvoices.filter((purchaseInvoice) => {
            const matchesSearch =
                search === '' ||
                purchaseInvoice.purchase_invoice_code
                    .toLowerCase()
                    .includes(search) ||
                purchaseInvoice.purchase_order.purchase_order_code
                    .toLowerCase()
                    .includes(search);
            const matchesStatus =
                purchaseInvoiceStatus === 'all' ||
                purchaseInvoice.status === purchaseInvoiceStatus;
            const matchesPaymentStatus =
                purchaseInvoicePaymentStatus === 'all' ||
                purchaseInvoice.payment_status === purchaseInvoicePaymentStatus;

            return matchesSearch && matchesStatus && matchesPaymentStatus;
        });
    }, [
        purchaseInvoices,
        purchaseInvoiceSearch,
        purchaseInvoiceStatus,
        purchaseInvoicePaymentStatus,
    ]);

    const formatAmount = (amount: string | null) =>
        amount ? formatNumber(amount) : '\u2014';

    setLayoutProps({
        breadcrumbs: [
            { title: 'Projects', href: index() },
            { title: project.name, href: show(project) },
        ],
    });

    return (
        <>
            <Head title={project.name} />

            <div className="mx-auto w-full max-w-6xl space-y-8 p-4 sm:p-6">
                <section className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-card via-card to-primary/5 p-6 shadow-sm sm:p-8">
                    <div className="pointer-events-none absolute -top-24 -right-24 size-64 rounded-full bg-primary/5 blur-3xl" />
                    <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 space-y-4">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full border border-border/70 bg-background/70 px-3 py-1 font-mono text-xs font-medium tracking-wide text-muted-foreground">
                                    {project.project_code}
                                </span>
                                <ProjectBadge
                                    category="status"
                                    value={project.status}
                                />
                                <ProjectBadge
                                    category="priority"
                                    value={project.priority}
                                />
                            </div>

                            <div>
                                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                                    {project.name}
                                </h1>
                                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                                    <Link
                                        href={showCustomer(project.customer)}
                                        className="font-medium text-foreground underline-offset-4 hover:underline"
                                    >
                                        {project.customer.name}
                                    </Link>
                                    <span className="text-border">/</span>
                                    <span>
                                        Requested{' '}
                                        {formatDate(project.request_date)}
                                    </span>
                                    {project.person_in_charge && (
                                        <>
                                            <span className="text-border">
                                                /
                                            </span>
                                            <span>
                                                PIC:{' '}
                                                {
                                                    project.person_in_charge
                                                        .full_name
                                                }
                                            </span>
                                        </>
                                    )}
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
                                    Back to Projects
                                </Link>
                            </Button>

                            <Button asChild className="w-full sm:w-auto">
                                <Link href={edit(project)}>
                                    <Pencil />
                                    Edit Project
                                </Link>
                            </Button>
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <KpiCard
                        label="Estimated contract value"
                        value={formatAmount(project.estimate_contract_value)}
                        icon={CircleDollarSign}
                        className="min-h-24"
                        labelClassName="text-xs leading-snug sm:text-sm"
                        valueClassName="text-lg leading-tight break-words sm:text-xl"
                        compact
                    />
                    <KpiCard
                        label="Planned cost (BOM)"
                        value={formatAmount(plannedCost)}
                        icon={ClipboardList}
                        className="min-h-24"
                        labelClassName="text-xs leading-snug sm:text-sm"
                        valueClassName="text-lg leading-tight break-words sm:text-xl"
                        compact
                    />
                    <KpiCard
                        label="Actual cost (invoiced)"
                        value={formatAmount(project.actual_cost)}
                        icon={TrendingUp}
                        className="min-h-24"
                        labelClassName="text-xs leading-snug sm:text-sm"
                        valueClassName="text-lg leading-tight break-words sm:text-xl"
                        highlight={
                            costVariance !== null && costVariance > 0
                                ? 'danger'
                                : undefined
                        }
                        compact
                    />
                    <KpiCard
                        label="Project request date"
                        value={formatDate(project.request_date)}
                        icon={CalendarDays}
                        className="min-h-24"
                        labelClassName="text-xs leading-snug sm:text-sm"
                        valueClassName="text-lg leading-tight break-words sm:text-xl"
                        compact
                    />
                </section>

                <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                    <div className="border-b bg-muted/20 px-6 py-5">
                        <h2 className="font-semibold">Project overview</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Key information, schedule, and financial context for
                            this project.
                        </p>
                    </div>
                    <dl className="grid gap-x-8 gap-y-5 p-6 sm:grid-cols-2">
                        <div className="border-b border-border/60 pb-2 sm:col-span-2">
                            <h3 className="text-sm font-semibold tracking-wide text-foreground">
                                Project identity
                            </h3>
                        </div>
                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Project code
                            </dt>
                            <dd className="font-medium">
                                {project.project_code}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Name
                            </dt>
                            <dd className="font-medium">{project.name}</dd>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Customer
                            </dt>
                            <dd className="font-medium">
                                <Link
                                    href={showCustomer(project.customer)}
                                    className="hover:underline"
                                >
                                    {project.customer.name}
                                </Link>
                            </dd>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Person in charge
                            </dt>
                            <dd className="font-medium">
                                {project.person_in_charge?.full_name ?? (
                                    <span className="text-muted-foreground">
                                        &mdash;
                                    </span>
                                )}
                            </dd>
                        </div>

                        <div className="border-b border-border/60 pb-2 sm:col-span-2">
                            <h3 className="text-sm font-semibold tracking-wide text-foreground">
                                Project health
                            </h3>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Status
                            </dt>
                            <dd>
                                <ProjectBadge
                                    category="status"
                                    value={project.status}
                                />
                            </dd>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Sales status
                            </dt>
                            <dd>
                                {project.sales_status ? (
                                    <ProjectBadge
                                        category="sales"
                                        value={project.sales_status}
                                    />
                                ) : (
                                    <span className="text-muted-foreground">
                                        &mdash;
                                    </span>
                                )}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                PO status
                            </dt>
                            <dd>
                                {project.po_status ? (
                                    <ProjectBadge
                                        category="po"
                                        value={project.po_status}
                                    />
                                ) : (
                                    <span className="text-muted-foreground">
                                        &mdash;
                                    </span>
                                )}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Billing status
                            </dt>
                            <dd>
                                {project.billing_status ? (
                                    <ProjectBadge
                                        category="billing"
                                        value={project.billing_status}
                                    />
                                ) : (
                                    <span className="text-muted-foreground">
                                        &mdash;
                                    </span>
                                )}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Priority
                            </dt>
                            <dd>
                                <ProjectBadge
                                    category="priority"
                                    value={project.priority}
                                />
                            </dd>
                        </div>

                        <div className="border-b border-border/60 pb-2 sm:col-span-2">
                            <h3 className="text-sm font-semibold tracking-wide text-foreground">
                                Schedule & operations
                            </h3>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Required equipment calibration recency
                            </dt>
                            <dd className="font-medium">
                                {project.equipment_calibration_max_age_months ? (
                                    `Within ${project.equipment_calibration_max_age_months} month(s)`
                                ) : (
                                    <span className="text-muted-foreground">
                                        No requirement
                                    </span>
                                )}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Request date
                            </dt>
                            <dd className="font-medium">
                                {formatDate(project.request_date)}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Start date
                            </dt>
                            <dd className="font-medium">
                                {project.start_date ? (
                                    formatDate(project.start_date)
                                ) : (
                                    <span className="text-muted-foreground">
                                        &mdash;
                                    </span>
                                )}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                End date
                            </dt>
                            <dd className="font-medium">
                                {project.end_date ? (
                                    formatDate(project.end_date)
                                ) : (
                                    <span className="text-muted-foreground">
                                        &mdash;
                                    </span>
                                )}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Completed at
                            </dt>
                            <dd className="font-medium">
                                {project.completed_at ? (
                                    formatDateTime(project.completed_at)
                                ) : (
                                    <span className="text-muted-foreground">
                                        &mdash;
                                    </span>
                                )}
                            </dd>
                        </div>

                        <div className="border-b border-border/60 pb-2 sm:col-span-2">
                            <h3 className="text-sm font-semibold tracking-wide text-foreground">
                                Financial overview
                            </h3>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Estimated contract value
                            </dt>
                            <dd className="font-medium">
                                {project.estimate_contract_value ? (
                                    formatNumber(
                                        project.estimate_contract_value,
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
                                Estimated cost
                            </dt>
                            <dd className="font-medium">
                                {project.estimate_cost ? (
                                    formatNumber(project.estimate_cost)
                                ) : (
                                    <span className="text-muted-foreground">
                                        &mdash;
                                    </span>
                                )}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Planned cost (BOM)
                            </dt>
                            <dd className="font-medium">
                                {plannedCost ? (
                                    formatNumber(plannedCost)
                                ) : (
                                    <span className="text-muted-foreground">
                                        &mdash;
                                    </span>
                                )}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Actual cost (invoiced)
                            </dt>
                            <dd className="font-medium">
                                {project.actual_cost ? (
                                    <>
                                        {formatNumber(project.actual_cost)}
                                        {costVariance !== null && (
                                            <span
                                                className={
                                                    costVariance > 0
                                                        ? 'ml-2 text-sm text-destructive dark:text-destructive-foreground'
                                                        : 'ml-2 text-sm text-muted-foreground'
                                                }
                                            >
                                                {costVariance > 0 ? '+' : ''}
                                                {formatNumber(
                                                    String(costVariance),
                                                )}{' '}
                                                vs plan
                                            </span>
                                        )}
                                    </>
                                ) : (
                                    <span className="text-muted-foreground">
                                        Nothing invoiced yet
                                    </span>
                                )}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Actual contract value
                            </dt>
                            <dd className="font-medium">
                                {project.actual_contract_value ? (
                                    formatNumber(project.actual_contract_value)
                                ) : (
                                    <span className="text-muted-foreground">
                                        &mdash;
                                    </span>
                                )}
                            </dd>
                        </div>

                        <div className="border-b border-border/60 pb-2 sm:col-span-2">
                            <h3 className="text-sm font-semibold tracking-wide text-foreground">
                                Notes & audit
                            </h3>
                        </div>

                        <div className="sm:col-span-2">
                            <dt className="text-sm text-muted-foreground">
                                Description
                            </dt>
                            <dd className="font-medium whitespace-pre-line">
                                {project.description ?? (
                                    <span className="text-muted-foreground">
                                        &mdash;
                                    </span>
                                )}
                            </dd>
                        </div>

                        {project.cancel_reason && (
                            <div className="sm:col-span-2">
                                <dt className="text-sm text-muted-foreground">
                                    Cancellation reason
                                </dt>
                                <dd className="font-medium whitespace-pre-line">
                                    {project.cancel_reason}
                                </dd>
                            </div>
                        )}

                        {project.void_reason && (
                            <div className="sm:col-span-2">
                                <dt className="text-sm text-muted-foreground">
                                    Void reason
                                </dt>
                                <dd className="font-medium whitespace-pre-line">
                                    {project.void_reason}
                                </dd>
                            </div>
                        )}

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Created at
                            </dt>
                            <dd className="font-medium">
                                {formatDateTime(project.created_at)}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Last updated
                            </dt>
                            <dd className="font-medium">
                                {formatDateTime(project.updated_at)}
                            </dd>
                        </div>
                    </dl>
                </section>

                <Tabs
                    defaultValue="quotations"
                    className="overflow-hidden rounded-2xl border bg-card shadow-sm"
                >
                    <div className="flex flex-col gap-4 border-b bg-muted/20 px-4 py-4 sm:px-6">
                        <div>
                            <h2 className="font-semibold">Project activity</h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Documents, files, and equipment connected to
                                this project.
                            </p>
                        </div>
                        <TabsList className="h-auto w-full flex-wrap justify-start gap-1 overflow-x-auto rounded-lg bg-background/80 p-1">
                            <TabsTrigger value="quotations">
                                Quotations
                                <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                    {quotations.length}
                                </span>
                            </TabsTrigger>
                            <TabsTrigger value="purchase-orders">
                                Purchase Orders
                                <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                    {purchaseOrders.length}
                                </span>
                            </TabsTrigger>
                            <TabsTrigger value="delivery-orders">
                                Delivery Orders
                                <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                    {deliveryOrders.length}
                                </span>
                            </TabsTrigger>
                            <TabsTrigger value="invoices">
                                Invoices
                                <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                    {invoices.length}
                                </span>
                            </TabsTrigger>
                            <TabsTrigger value="purchase-invoices">
                                Purchase Invoices
                                <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                    {purchaseInvoices.length}
                                </span>
                            </TabsTrigger>
                            <TabsTrigger value="attachments">
                                Attachments
                                <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                    {project.attachments.length}
                                </span>
                            </TabsTrigger>
                            <TabsTrigger value="equipment">
                                Equipment
                                <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                    {equipmentAssignments.length}
                                </span>
                            </TabsTrigger>
                        </TabsList>
                    </div>
                    <TabsContent
                        value="quotations"
                        className="space-y-4 px-4 py-6 sm:px-6"
                    >
                        <div className="flex items-center justify-between gap-2">
                            <h2 className="text-base font-semibold">
                                Quotations
                            </h2>
                            <Button size="sm" asChild>
                                <Link
                                    href={createQuotation({
                                        query: {
                                            project: project.uuid,
                                        },
                                    })}
                                >
                                    <Plus />
                                    New Quotation
                                </Link>
                            </Button>
                        </div>
                        {quotations.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No quotations have been created for this project
                                yet.
                            </p>
                        ) : (
                            <>
                                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                                    <div className="relative w-full sm:max-w-xs">
                                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            value={quotationSearch}
                                            onChange={(event) =>
                                                setQuotationSearch(
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="Search by quotation code"
                                            className="pl-9"
                                        />
                                    </div>

                                    <Select
                                        value={quotationStatus}
                                        onValueChange={setQuotationStatus}
                                    >
                                        <SelectTrigger className="w-full sm:w-52">
                                            <SelectValue placeholder="Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                All statuses
                                            </SelectItem>
                                            {QUOTATION_STATUS_OPTIONS.map(
                                                (option) => (
                                                    <SelectItem
                                                        key={option.value}
                                                        value={option.value}
                                                    >
                                                        {option.label}
                                                    </SelectItem>
                                                ),
                                            )}
                                        </SelectContent>
                                    </Select>

                                    {(quotationSearch !== '' ||
                                        quotationStatus !== 'all') && (
                                        <Button
                                            variant="ghost"
                                            onClick={() => {
                                                setQuotationSearch('');
                                                setQuotationStatus('all');
                                            }}
                                            className="w-full text-destructive hover:text-destructive sm:w-auto dark:text-destructive-foreground dark:hover:text-destructive-foreground"
                                        >
                                            <X />
                                            Reset
                                        </Button>
                                    )}
                                </div>

                                <div className="overflow-hidden rounded-xl border border-border/50">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>
                                                    Quotation code
                                                </TableHead>
                                                <TableHead>Version</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>
                                                    Valid until
                                                </TableHead>
                                                <TableHead>Total</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredQuotations.length ===
                                                0 && (
                                                <TableRow>
                                                    <TableCell
                                                        colSpan={5}
                                                        className="h-24 text-center text-muted-foreground"
                                                    >
                                                        No quotations match your
                                                        filters.
                                                    </TableCell>
                                                </TableRow>
                                            )}

                                            {filteredQuotations.map(
                                                (quotation) => (
                                                    <TableRow
                                                        key={quotation.id}
                                                    >
                                                        <TableCell className="font-medium">
                                                            <Link
                                                                href={showQuotation(
                                                                    quotation,
                                                                )}
                                                            >
                                                                {
                                                                    quotation.quotation_code
                                                                }
                                                            </Link>
                                                        </TableCell>
                                                        <TableCell className="text-muted-foreground">
                                                            v
                                                            {
                                                                quotation.version_major
                                                            }
                                                            .
                                                            {
                                                                quotation.version_minor
                                                            }
                                                            {quotation.is_current &&
                                                                ' (current)'}
                                                        </TableCell>
                                                        <TableCell>
                                                            <ProjectBadge
                                                                category="document"
                                                                value={
                                                                    quotation.status
                                                                }
                                                            />
                                                        </TableCell>
                                                        <TableCell className="text-muted-foreground">
                                                            {quotation.valid_until ? (
                                                                formatDate(
                                                                    quotation.valid_until,
                                                                )
                                                            ) : (
                                                                <span className="text-muted-foreground">
                                                                    &mdash;
                                                                </span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-muted-foreground">
                                                            {quotation.currency
                                                                .symbol ??
                                                                quotation
                                                                    .currency
                                                                    .iso_code}{' '}
                                                            {formatNumber(
                                                                quotation.total,
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                ),
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </>
                        )}
                    </TabsContent>

                    <TabsContent
                        value="purchase-orders"
                        className="space-y-4 px-4 py-6 sm:px-6"
                    >
                        <h2 className="text-base font-semibold">
                            Purchase Orders
                        </h2>
                        {purchaseOrders.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No purchase orders have been raised for this
                                project yet.
                            </p>
                        ) : (
                            <>
                                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                                    <div className="relative w-full sm:max-w-xs">
                                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            value={purchaseOrderSearch}
                                            onChange={(event) =>
                                                setPurchaseOrderSearch(
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="Search by PO code or vendor"
                                            className="pl-9"
                                        />
                                    </div>

                                    <Select
                                        value={purchaseOrderStatus}
                                        onValueChange={setPurchaseOrderStatus}
                                    >
                                        <SelectTrigger className="w-full sm:w-52">
                                            <SelectValue placeholder="Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                All statuses
                                            </SelectItem>
                                            {PURCHASE_ORDER_STATUS_OPTIONS.map(
                                                (option) => (
                                                    <SelectItem
                                                        key={option.value}
                                                        value={option.value}
                                                    >
                                                        {option.label}
                                                    </SelectItem>
                                                ),
                                            )}
                                        </SelectContent>
                                    </Select>

                                    {(purchaseOrderSearch !== '' ||
                                        purchaseOrderStatus !== 'all') && (
                                        <Button
                                            variant="ghost"
                                            onClick={() => {
                                                setPurchaseOrderSearch('');
                                                setPurchaseOrderStatus('all');
                                            }}
                                            className="w-full text-destructive hover:text-destructive sm:w-auto dark:text-destructive-foreground dark:hover:text-destructive-foreground"
                                        >
                                            <X />
                                            Reset
                                        </Button>
                                    )}
                                </div>

                                <div className="overflow-hidden rounded-xl border border-border/50">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>
                                                    Purchase order code
                                                </TableHead>
                                                <TableHead>Vendor</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Total</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredPurchaseOrders.length ===
                                                0 && (
                                                <TableRow>
                                                    <TableCell
                                                        colSpan={4}
                                                        className="h-24 text-center text-muted-foreground"
                                                    >
                                                        No purchase orders match
                                                        your filters.
                                                    </TableCell>
                                                </TableRow>
                                            )}

                                            {filteredPurchaseOrders.map(
                                                (purchaseOrder) => (
                                                    <TableRow
                                                        key={purchaseOrder.id}
                                                    >
                                                        <TableCell className="font-medium">
                                                            <Link
                                                                href={showPurchaseOrder(
                                                                    purchaseOrder,
                                                                )}
                                                            >
                                                                {
                                                                    purchaseOrder.purchase_order_code
                                                                }
                                                            </Link>
                                                        </TableCell>
                                                        <TableCell className="text-muted-foreground">
                                                            {
                                                                purchaseOrder
                                                                    .vendor.name
                                                            }
                                                        </TableCell>
                                                        <TableCell>
                                                            <ProjectBadge
                                                                category="document"
                                                                value={
                                                                    purchaseOrder.status
                                                                }
                                                            />
                                                        </TableCell>
                                                        <TableCell className="text-muted-foreground">
                                                            {purchaseOrder
                                                                .currency
                                                                .symbol ??
                                                                purchaseOrder
                                                                    .currency
                                                                    .iso_code}{' '}
                                                            {formatNumber(
                                                                purchaseOrder.grand_total,
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                ),
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </>
                        )}
                    </TabsContent>

                    <TabsContent
                        value="delivery-orders"
                        className="space-y-4 px-4 py-6 sm:px-6"
                    >
                        <h2 className="text-base font-semibold">
                            Delivery Orders
                        </h2>
                        {deliveryOrders.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No delivery orders have been raised for this
                                project yet.
                            </p>
                        ) : (
                            <>
                                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                                    <div className="relative w-full sm:max-w-xs">
                                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            value={deliveryOrderSearch}
                                            onChange={(event) =>
                                                setDeliveryOrderSearch(
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="Search by DO code"
                                            className="pl-9"
                                        />
                                    </div>

                                    <Select
                                        value={deliveryOrderStatus}
                                        onValueChange={setDeliveryOrderStatus}
                                    >
                                        <SelectTrigger className="w-full sm:w-52">
                                            <SelectValue placeholder="Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                All statuses
                                            </SelectItem>
                                            {DELIVERY_ORDER_STATUS_OPTIONS.map(
                                                (option) => (
                                                    <SelectItem
                                                        key={option.value}
                                                        value={option.value}
                                                    >
                                                        {option.label}
                                                    </SelectItem>
                                                ),
                                            )}
                                        </SelectContent>
                                    </Select>

                                    {(deliveryOrderSearch !== '' ||
                                        deliveryOrderStatus !== 'all') && (
                                        <Button
                                            variant="ghost"
                                            onClick={() => {
                                                setDeliveryOrderSearch('');
                                                setDeliveryOrderStatus('all');
                                            }}
                                            className="w-full text-destructive hover:text-destructive sm:w-auto dark:text-destructive-foreground dark:hover:text-destructive-foreground"
                                        >
                                            <X />
                                            Reset
                                        </Button>
                                    )}
                                </div>

                                <div className="overflow-hidden rounded-xl border border-border/50">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>DO code</TableHead>
                                                <TableHead>Quotation</TableHead>
                                                <TableHead>
                                                    Delivery date
                                                </TableHead>
                                                <TableHead>Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredDeliveryOrders.length ===
                                                0 && (
                                                <TableRow>
                                                    <TableCell
                                                        colSpan={4}
                                                        className="h-24 text-center text-muted-foreground"
                                                    >
                                                        No delivery orders match
                                                        your filters.
                                                    </TableCell>
                                                </TableRow>
                                            )}

                                            {filteredDeliveryOrders.map(
                                                (deliveryOrder) => (
                                                    <TableRow
                                                        key={deliveryOrder.id}
                                                    >
                                                        <TableCell className="font-medium">
                                                            <Link
                                                                href={showDeliveryOrder(
                                                                    deliveryOrder,
                                                                )}
                                                            >
                                                                {
                                                                    deliveryOrder.do_code
                                                                }
                                                            </Link>
                                                        </TableCell>
                                                        <TableCell className="text-muted-foreground">
                                                            v
                                                            {
                                                                deliveryOrder
                                                                    .quotation
                                                                    .version_major
                                                            }
                                                            .
                                                            {
                                                                deliveryOrder
                                                                    .quotation
                                                                    .version_minor
                                                            }
                                                        </TableCell>
                                                        <TableCell className="text-muted-foreground">
                                                            {formatDate(
                                                                deliveryOrder.delivery_date,
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            <ProjectBadge
                                                                category="document"
                                                                value={
                                                                    deliveryOrder.status
                                                                }
                                                            />
                                                        </TableCell>
                                                    </TableRow>
                                                ),
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </>
                        )}
                    </TabsContent>

                    <TabsContent
                        value="invoices"
                        className="space-y-4 px-4 py-6 sm:px-6"
                    >
                        <h2 className="text-base font-semibold">Invoices</h2>
                        {invoices.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No invoices have been raised for this project
                                yet.
                            </p>
                        ) : (
                            <>
                                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                                    <div className="relative w-full sm:max-w-xs">
                                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            value={invoiceSearch}
                                            onChange={(event) =>
                                                setInvoiceSearch(
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="Search by invoice code"
                                            className="pl-9"
                                        />
                                    </div>

                                    <Select
                                        value={invoiceStatus}
                                        onValueChange={setInvoiceStatus}
                                    >
                                        <SelectTrigger className="w-full sm:w-40">
                                            <SelectValue placeholder="Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                All statuses
                                            </SelectItem>
                                            {INVOICE_STATUS_OPTIONS.map(
                                                (option) => (
                                                    <SelectItem
                                                        key={option.value}
                                                        value={option.value}
                                                    >
                                                        {option.label}
                                                    </SelectItem>
                                                ),
                                            )}
                                        </SelectContent>
                                    </Select>

                                    <Select
                                        value={invoicePaymentStatus}
                                        onValueChange={setInvoicePaymentStatus}
                                    >
                                        <SelectTrigger className="w-full sm:w-44">
                                            <SelectValue placeholder="Payment" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                All payments
                                            </SelectItem>
                                            {INVOICE_PAYMENT_OPTIONS.map(
                                                (option) => (
                                                    <SelectItem
                                                        key={option.value}
                                                        value={option.value}
                                                    >
                                                        {option.label}
                                                    </SelectItem>
                                                ),
                                            )}
                                        </SelectContent>
                                    </Select>

                                    {(invoiceSearch !== '' ||
                                        invoiceStatus !== 'all' ||
                                        invoicePaymentStatus !== 'all') && (
                                        <Button
                                            variant="ghost"
                                            onClick={() => {
                                                setInvoiceSearch('');
                                                setInvoiceStatus('all');
                                                setInvoicePaymentStatus('all');
                                            }}
                                            className="w-full text-destructive hover:text-destructive sm:w-auto dark:text-destructive-foreground dark:hover:text-destructive-foreground"
                                        >
                                            <X />
                                            Reset
                                        </Button>
                                    )}
                                </div>

                                <div className="overflow-hidden rounded-xl border border-border/50">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>
                                                    Invoice code
                                                </TableHead>
                                                <TableHead>Quotation</TableHead>
                                                <TableHead>
                                                    Invoice date
                                                </TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Payment</TableHead>
                                                <TableHead>Total</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredInvoices.length === 0 && (
                                                <TableRow>
                                                    <TableCell
                                                        colSpan={6}
                                                        className="h-24 text-center text-muted-foreground"
                                                    >
                                                        No invoices match your
                                                        filters.
                                                    </TableCell>
                                                </TableRow>
                                            )}

                                            {filteredInvoices.map((invoice) => (
                                                <TableRow key={invoice.id}>
                                                    <TableCell className="font-medium">
                                                        <Link
                                                            href={showInvoice(
                                                                invoice,
                                                            )}
                                                        >
                                                            {
                                                                invoice.invoice_code
                                                            }
                                                        </Link>
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground">
                                                        v
                                                        {
                                                            invoice.quotation
                                                                .version_major
                                                        }
                                                        .
                                                        {
                                                            invoice.quotation
                                                                .version_minor
                                                        }
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground">
                                                        {formatDate(
                                                            invoice.invoice_date,
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <ProjectBadge
                                                            category="document"
                                                            value={
                                                                invoice.status
                                                            }
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        {invoice.payment_status ? (
                                                            <ProjectBadge
                                                                category="payment"
                                                                value={
                                                                    invoice.payment_status
                                                                }
                                                            />
                                                        ) : (
                                                            <span className="text-muted-foreground">
                                                                &mdash;
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground">
                                                        {formatNumber(
                                                            invoice.total,
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </>
                        )}
                    </TabsContent>

                    <TabsContent
                        value="purchase-invoices"
                        className="space-y-4 px-4 py-6 sm:px-6"
                    >
                        <h2 className="text-base font-semibold">
                            Purchase Invoices
                        </h2>
                        {purchaseInvoices.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No purchase invoices have been raised for this
                                project yet.
                            </p>
                        ) : (
                            <>
                                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                                    <div className="relative w-full sm:max-w-xs">
                                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            value={purchaseInvoiceSearch}
                                            onChange={(event) =>
                                                setPurchaseInvoiceSearch(
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="Search by invoice or PO code"
                                            className="pl-9"
                                        />
                                    </div>

                                    <Select
                                        value={purchaseInvoiceStatus}
                                        onValueChange={setPurchaseInvoiceStatus}
                                    >
                                        <SelectTrigger className="w-full sm:w-40">
                                            <SelectValue placeholder="Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                All statuses
                                            </SelectItem>
                                            {PURCHASE_INVOICE_STATUS_OPTIONS.map(
                                                (option) => (
                                                    <SelectItem
                                                        key={option.value}
                                                        value={option.value}
                                                    >
                                                        {option.label}
                                                    </SelectItem>
                                                ),
                                            )}
                                        </SelectContent>
                                    </Select>

                                    <Select
                                        value={purchaseInvoicePaymentStatus}
                                        onValueChange={
                                            setPurchaseInvoicePaymentStatus
                                        }
                                    >
                                        <SelectTrigger className="w-full sm:w-44">
                                            <SelectValue placeholder="Payment" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                All payments
                                            </SelectItem>
                                            {PURCHASE_INVOICE_PAYMENT_OPTIONS.map(
                                                (option) => (
                                                    <SelectItem
                                                        key={option.value}
                                                        value={option.value}
                                                    >
                                                        {option.label}
                                                    </SelectItem>
                                                ),
                                            )}
                                        </SelectContent>
                                    </Select>

                                    {(purchaseInvoiceSearch !== '' ||
                                        purchaseInvoiceStatus !== 'all' ||
                                        purchaseInvoicePaymentStatus !==
                                            'all') && (
                                        <Button
                                            variant="ghost"
                                            onClick={() => {
                                                setPurchaseInvoiceSearch('');
                                                setPurchaseInvoiceStatus('all');
                                                setPurchaseInvoicePaymentStatus(
                                                    'all',
                                                );
                                            }}
                                            className="w-full text-destructive hover:text-destructive sm:w-auto dark:text-destructive-foreground dark:hover:text-destructive-foreground"
                                        >
                                            <X />
                                            Reset
                                        </Button>
                                    )}
                                </div>

                                <div className="overflow-hidden rounded-xl border border-border/50">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>
                                                    Invoice code
                                                </TableHead>
                                                <TableHead>
                                                    Purchase order
                                                </TableHead>
                                                <TableHead>
                                                    Invoice date
                                                </TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Payment</TableHead>
                                                <TableHead>Total</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredPurchaseInvoices.length ===
                                                0 && (
                                                <TableRow>
                                                    <TableCell
                                                        colSpan={6}
                                                        className="h-24 text-center text-muted-foreground"
                                                    >
                                                        No purchase invoices
                                                        match your filters.
                                                    </TableCell>
                                                </TableRow>
                                            )}

                                            {filteredPurchaseInvoices.map(
                                                (purchaseInvoice) => (
                                                    <TableRow
                                                        key={purchaseInvoice.id}
                                                    >
                                                        <TableCell className="font-medium">
                                                            <Link
                                                                href={showPurchaseInvoice(
                                                                    purchaseInvoice,
                                                                )}
                                                            >
                                                                {
                                                                    purchaseInvoice.purchase_invoice_code
                                                                }
                                                            </Link>
                                                        </TableCell>
                                                        <TableCell className="text-muted-foreground">
                                                            {
                                                                purchaseInvoice
                                                                    .purchase_order
                                                                    .purchase_order_code
                                                            }
                                                        </TableCell>
                                                        <TableCell className="text-muted-foreground">
                                                            {formatDate(
                                                                purchaseInvoice.invoice_date,
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            <ProjectBadge
                                                                category="document"
                                                                value={
                                                                    purchaseInvoice.status
                                                                }
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            {purchaseInvoice.payment_status ? (
                                                                <ProjectBadge
                                                                    category="payment"
                                                                    value={
                                                                        purchaseInvoice.payment_status
                                                                    }
                                                                />
                                                            ) : (
                                                                <span className="text-muted-foreground">
                                                                    &mdash;
                                                                </span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-muted-foreground">
                                                            {purchaseInvoice
                                                                .purchase_order
                                                                .currency
                                                                .symbol ??
                                                                purchaseInvoice
                                                                    .purchase_order
                                                                    .currency
                                                                    .iso_code}{' '}
                                                            {formatNumber(
                                                                purchaseInvoice.total,
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                ),
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </>
                        )}
                    </TabsContent>

                    <TabsContent
                        value="attachments"
                        className="space-y-4 px-4 py-6 sm:px-6"
                    >
                        <h2 className="text-base font-semibold">Attachments</h2>
                        <Form
                            {...storeAttachment.form(project)}
                            encType="multipart/form-data"
                            options={{ preserveScroll: true }}
                            resetOnSuccess
                        >
                            {({ processing, errors }) => (
                                <div className="flex flex-col gap-4 rounded-lg border border-border/50 p-4 sm:flex-row sm:items-end">
                                    <div className="grid flex-1 gap-2">
                                        <Label htmlFor="attachment-name">
                                            Document name
                                        </Label>
                                        <Input
                                            id="attachment-name"
                                            name="name"
                                            placeholder="e.g. Customer PO"
                                        />
                                        <InputError message={errors.name} />
                                    </div>

                                    <div className="grid flex-1 gap-2">
                                        <Label htmlFor="attachment-file">
                                            File
                                        </Label>
                                        <Input
                                            id="attachment-file"
                                            type="file"
                                            name="file"
                                        />
                                        <InputError message={errors.file} />
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="w-full sm:w-auto"
                                    >
                                        {processing ? <Spinner /> : <Upload />}
                                        Upload
                                    </Button>
                                </div>
                            )}
                        </Form>

                        {project.attachments.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No supporting documents have been uploaded for
                                this project yet.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {project.attachments.map((attachment) => (
                                    <div
                                        key={attachment.id}
                                        className="flex flex-col gap-3 rounded-lg border border-border/50 p-4 sm:flex-row sm:items-center sm:justify-between"
                                    >
                                        <div className="space-y-0.5">
                                            <p className="font-medium">
                                                {attachment.name}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {formatFileSize(
                                                    attachment.size,
                                                )}{' '}
                                                &middot; Uploaded by{' '}
                                                {attachment.uploader.name} on{' '}
                                                {formatDate(
                                                    attachment.created_at,
                                                )}
                                            </p>
                                        </div>

                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                asChild
                                            >
                                                <a
                                                    href={downloadAttachment.url(
                                                        {
                                                            project,
                                                            attachment,
                                                        },
                                                    )}
                                                >
                                                    <Download />
                                                    Download
                                                </a>
                                            </Button>

                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                    >
                                                        <Trash2 />
                                                        Delete
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogTitle>
                                                        Delete &quot;
                                                        {attachment.name}
                                                        &quot;?
                                                    </DialogTitle>
                                                    <DialogDescription>
                                                        This action cannot be
                                                        undone. This file will
                                                        be permanently deleted.
                                                    </DialogDescription>

                                                    <Form
                                                        {...destroyAttachment.form(
                                                            {
                                                                project,
                                                                attachment,
                                                            },
                                                        )}
                                                        options={{
                                                            preserveScroll: true,
                                                        }}
                                                    >
                                                        {({ processing }) => (
                                                            <DialogFooter className="gap-2">
                                                                <DialogClose
                                                                    asChild
                                                                >
                                                                    <Button
                                                                        variant="ghost"
                                                                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                                    >
                                                                        <X />{' '}
                                                                        Cancel
                                                                    </Button>
                                                                </DialogClose>

                                                                <Button
                                                                    variant="destructive"
                                                                    disabled={
                                                                        processing
                                                                    }
                                                                    asChild
                                                                >
                                                                    <button type="submit">
                                                                        {processing && (
                                                                            <Spinner />
                                                                        )}
                                                                        Delete
                                                                    </button>
                                                                </Button>
                                                            </DialogFooter>
                                                        )}
                                                    </Form>
                                                </DialogContent>
                                            </Dialog>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent
                        value="equipment"
                        className="space-y-4 px-4 py-6 sm:px-6"
                    >
                        <h2 className="text-base font-semibold">Equipment</h2>

                        {project.equipment_calibration_max_age_months && (
                            <p className="text-sm text-muted-foreground">
                                This project only allows equipment calibrated
                                within the last{' '}
                                {project.equipment_calibration_max_age_months}{' '}
                                month(s). The picker below only offers tools
                                that currently qualify.
                            </p>
                        )}

                        <Form
                            {...storeEquipmentCheckout.form(project)}
                            encType="multipart/form-data"
                            options={{ preserveScroll: true }}
                            onSuccess={() => {
                                setCheckoutEquipmentId('');
                                setCheckoutCustodianId('none');
                            }}
                        >
                            {({ processing, errors }) => (
                                <div className="space-y-4 rounded-lg border border-border/50 p-4">
                                    <h3 className="text-sm font-semibold">
                                        Check out a tool to this project
                                    </h3>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label htmlFor="equipment_id">
                                                Equipment
                                            </Label>
                                            <input
                                                type="hidden"
                                                name="equipment_id"
                                                value={checkoutEquipmentId}
                                            />
                                            <AsyncCombobox<EquipmentOption>
                                                id="equipment_id"
                                                value={checkoutEquipmentId}
                                                onValueChange={
                                                    setCheckoutEquipmentId
                                                }
                                                searchUrl={
                                                    searchEquipment({
                                                        query: {
                                                            project: project.id,
                                                        },
                                                    }).url
                                                }
                                                getOptionId={(item) =>
                                                    String(item.id)
                                                }
                                                getOptionLabel={(item) =>
                                                    `${item.equipment_code}: ${item.name}`
                                                }
                                                placeholder="Select an available tool"
                                            />
                                            <InputError
                                                message={errors.equipment_id}
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="custodian_id">
                                                Custodian
                                            </Label>
                                            <input
                                                type="hidden"
                                                name="custodian_id"
                                                value={
                                                    checkoutCustodianId ===
                                                    'none'
                                                        ? ''
                                                        : checkoutCustodianId
                                                }
                                            />
                                            <Select
                                                value={checkoutCustodianId}
                                                onValueChange={
                                                    setCheckoutCustodianId
                                                }
                                            >
                                                <SelectTrigger
                                                    id="custodian_id"
                                                    className="w-full"
                                                >
                                                    <SelectValue placeholder="Optional" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">
                                                        None
                                                    </SelectItem>
                                                    {workforces.map(
                                                        (workforce) => (
                                                            <SelectItem
                                                                key={
                                                                    workforce.id
                                                                }
                                                                value={String(
                                                                    workforce.id,
                                                                )}
                                                            >
                                                                {
                                                                    workforce.full_name
                                                                }
                                                            </SelectItem>
                                                        ),
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            <InputError
                                                message={errors.custodian_id}
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="checked_out_at">
                                                Checked out at
                                            </Label>
                                            <Input
                                                id="checked_out_at"
                                                type="datetime-local"
                                                name="checked_out_at"
                                                required
                                                defaultValue={new Date()
                                                    .toISOString()
                                                    .slice(0, 16)}
                                            />
                                            <InputError
                                                message={errors.checked_out_at}
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="expected_return_at">
                                                Expected return date
                                            </Label>
                                            <Input
                                                id="expected_return_at"
                                                type="date"
                                                name="expected_return_at"
                                                placeholder="Optional"
                                            />
                                            <InputError
                                                message={
                                                    errors.expected_return_at
                                                }
                                            />
                                        </div>

                                        <div className="grid gap-2 sm:col-span-2">
                                            <Label htmlFor="checkout_notes">
                                                Notes
                                            </Label>
                                            <Textarea
                                                id="checkout_notes"
                                                name="notes"
                                                placeholder="Optional"
                                            />
                                            <InputError
                                                message={errors.notes}
                                            />
                                        </div>

                                        <div className="grid gap-2 sm:col-span-2">
                                            <Label htmlFor="checkout_photo">
                                                Proof photo
                                            </Label>
                                            <Input
                                                id="checkout_photo"
                                                type="file"
                                                name="checkout_photo"
                                                accept="image/png,image/jpeg"
                                                capture="environment"
                                            />
                                            <p className="text-sm text-muted-foreground">
                                                Optional photo of the equipment
                                                as checked out.
                                            </p>
                                            <InputError
                                                message={errors.checkout_photo}
                                            />
                                        </div>
                                    </div>

                                    <Button type="submit" disabled={processing}>
                                        {processing ? <Spinner /> : <Package />}
                                        Check out
                                    </Button>
                                </div>
                            )}
                        </Form>

                        {equipmentAssignments.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No equipment has been checked out to this
                                project yet.
                            </p>
                        ) : (
                            <div className="overflow-hidden rounded-xl border border-border/50">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>
                                                Equipment code
                                            </TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Category</TableHead>
                                            <TableHead>Custodian</TableHead>
                                            <TableHead>Checked out</TableHead>
                                            <TableHead>Returned</TableHead>
                                            <TableHead>Remarks</TableHead>
                                            {project.equipment_calibration_max_age_months && (
                                                <TableHead>
                                                    Calibration
                                                </TableHead>
                                            )}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {equipmentAssignments.map(
                                            (assignment) => (
                                                <TableRow key={assignment.id}>
                                                    <TableCell className="font-medium">
                                                        <Link
                                                            href={showEquipment(
                                                                assignment.equipment,
                                                            )}
                                                        >
                                                            {
                                                                assignment
                                                                    .equipment
                                                                    .equipment_code
                                                            }
                                                        </Link>
                                                    </TableCell>
                                                    <TableCell>
                                                        {
                                                            assignment.equipment
                                                                .name
                                                        }
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground">
                                                        {assignment.equipment
                                                            .category ?? (
                                                            <span>&mdash;</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground">
                                                        {assignment.custodian
                                                            ?.full_name ?? (
                                                            <span>&mdash;</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground">
                                                        {formatDateTime(
                                                            assignment.checked_out_at,
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {assignment.returned_at ? (
                                                            <span className="text-muted-foreground">
                                                                {formatDateTime(
                                                                    assignment.returned_at,
                                                                )}
                                                            </span>
                                                        ) : (
                                                            <ProjectBadge
                                                                category="equipment"
                                                                value="active"
                                                                label="Active"
                                                            />
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="max-w-xs text-muted-foreground">
                                                        {assignment.notes ?? (
                                                            <span>&mdash;</span>
                                                        )}
                                                    </TableCell>
                                                    {project.equipment_calibration_max_age_months && (
                                                        <TableCell>
                                                            {assignment.calibration_compliant ===
                                                            null ? (
                                                                <span className="text-muted-foreground">
                                                                    &mdash;
                                                                </span>
                                                            ) : assignment.calibration_compliant ? (
                                                                <ProjectBadge
                                                                    category="calibration"
                                                                    value="compliant"
                                                                    label="Compliant"
                                                                />
                                                            ) : (
                                                                <ProjectBadge
                                                                    category="calibration"
                                                                    value="non_compliant"
                                                                    label="Non-compliant"
                                                                />
                                                            )}
                                                        </TableCell>
                                                    )}
                                                </TableRow>
                                            ),
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>

                <section className="space-y-4 rounded-2xl border border-destructive/30 bg-destructive/[0.02] p-4 sm:p-6">
                    <div className="flex items-start gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                            <CircleOff className="size-4" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-destructive dark:text-destructive-foreground">
                                Danger zone
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                These actions change or permanently remove the
                                project record.
                            </p>
                        </div>
                    </div>
                    {!['cancelled', 'voided', 'completed'].includes(
                        project.status,
                    ) && (
                        <div className="flex flex-col gap-4 rounded-xl border border-red-100 bg-red-50/70 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-red-200/10 dark:bg-red-700/10">
                            <div className="space-y-0.5 text-red-600 dark:text-red-100">
                                <p className="font-medium">
                                    Cancel this project
                                </p>
                                <p className="text-sm">
                                    Use this when the deal falls through, such
                                    as a lost bid or a customer withdrawal. The
                                    status will no longer update automatically.
                                </p>
                            </div>

                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button
                                        variant="destructive"
                                        className="w-full sm:w-auto"
                                    >
                                        <Ban />
                                        Cancel Project
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogTitle>
                                        Cancel &quot;{project.name}&quot;?
                                    </DialogTitle>
                                    <DialogDescription>
                                        This marks the project as cancelled.
                                        This action cannot be undone.
                                    </DialogDescription>

                                    <Form
                                        {...cancel.form(project)}
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
                                                        required
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
                                                        Cancel Project
                                                    </Button>
                                                </DialogFooter>
                                            </>
                                        )}
                                    </Form>
                                </DialogContent>
                            </Dialog>
                        </div>
                    )}

                    {!['voided', 'completed'].includes(project.status) && (
                        <div className="flex flex-col gap-4 rounded-xl border border-red-100 bg-red-50/70 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-red-200/10 dark:bg-red-700/10">
                            <div className="space-y-0.5 text-red-600 dark:text-red-100">
                                <p className="font-medium">Void this project</p>
                                <p className="text-sm">
                                    Use this when the project was created by
                                    mistake, such as a duplicate of another
                                    project. The record is kept for audit but
                                    stops counting as live work.
                                </p>
                            </div>

                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button
                                        variant="destructive"
                                        className="w-full sm:w-auto"
                                    >
                                        <CircleOff />
                                        Void Project
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogTitle>
                                        Void &quot;{project.name}&quot;?
                                    </DialogTitle>
                                    <DialogDescription>
                                        Void this project as created in error,
                                        for example a duplicate. This action
                                        cannot be undone.
                                    </DialogDescription>

                                    <Form
                                        {...voidProject.form(project)}
                                        options={{ preserveScroll: true }}
                                    >
                                        {({ processing, errors }) => (
                                            <>
                                                <div className="grid gap-2 py-2">
                                                    <Label htmlFor="void_reason">
                                                        Void reason
                                                    </Label>
                                                    <Textarea
                                                        id="void_reason"
                                                        name="void_reason"
                                                        required
                                                    />
                                                    <InputError
                                                        message={
                                                            errors.void_reason
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
                                                        Void Project
                                                    </Button>
                                                </DialogFooter>
                                            </>
                                        )}
                                    </Form>
                                </DialogContent>
                            </Dialog>
                        </div>
                    )}

                    {!hasRelatedDocuments && (
                        <div className="flex flex-col gap-4 rounded-xl border border-red-100 bg-red-50/70 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-red-200/10 dark:bg-red-700/10">
                            <div className="space-y-0.5 text-red-600 dark:text-red-100">
                                <p className="font-medium">
                                    Delete this project
                                </p>
                                <p className="text-sm">
                                    Once deleted, this project cannot be
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
                                        Delete Project
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogTitle>
                                        Delete &quot;{project.name}&quot;?
                                    </DialogTitle>
                                    <DialogDescription>
                                        This action cannot be undone. This
                                        project will be permanently deleted.
                                    </DialogDescription>

                                    <Form
                                        {...destroy.form(project)}
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
                                                        Delete Project
                                                    </button>
                                                </Button>
                                            </DialogFooter>
                                        )}
                                    </Form>
                                </DialogContent>
                            </Dialog>
                        </div>
                    )}
                </section>
            </div>
        </>
    );
}
