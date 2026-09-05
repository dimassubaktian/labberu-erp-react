import { Form, Head, Link, setLayoutProps } from '@inertiajs/react';
import {
    ArrowLeft,
    Building2,
    ClipboardList,
    MapPin,
    Pencil,
    Search,
    ShoppingCart,
    Trash2,
    UserRound,
    X,
} from 'lucide-react';
import React from 'react';
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
import { show as showPurchaseOrder } from '@/routes/purchase-orders';
import { destroy, edit, index, show } from '@/routes/vendors';

const PO_STATUS_OPTIONS = [
    { value: 'draft', label: 'Draft' },
    { value: 'issued', label: 'Issued' },
    { value: 'approved', label: 'Approved' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'voided', label: 'Voided' },
];

const PO_PROGRESS_OPTIONS = [
    { value: 'sent', label: 'Sent' },
    { value: 'partially_received', label: 'Partially received' },
    { value: 'fully_received', label: 'Fully received' },
    { value: 'closed', label: 'Closed' },
];

type PurchaseOrder = {
    id: number;
    uuid: string;
    purchase_order_code: string;
    status: string;
    progress: string | null;
    grand_total: string;
    created_at: string;
    currency: { iso_code: string; symbol: string | null };
};

type Vendor = {
    id: number;
    uuid: string;
    vendor_code: string;
    name: string;
    attention: string | null;
    phone: string | null;
    fax: string | null;
    address: string | null;
    city: string | null;
    province: string | null;
    country: string | null;
    postal_code: string | null;
    remarks: string | null;
    created_at: string;
    updated_at: string;
};

type Props = {
    vendor: Vendor;
    purchaseOrders: PurchaseOrder[];
};

export default function VendorsShow({ vendor, purchaseOrders }: Props) {
    const [poSearch, setPoSearch] = React.useState('');
    const [poStatus, setPoStatus] = React.useState('all');
    const [poProgress, setPoProgress] = React.useState('all');

    const filteredPurchaseOrders = React.useMemo(() => {
        return purchaseOrders.filter((po) => {
            const matchesSearch =
                poSearch === '' ||
                po.purchase_order_code
                    .toLowerCase()
                    .includes(poSearch.toLowerCase());
            const matchesStatus = poStatus === 'all' || po.status === poStatus;
            const matchesProgress =
                poProgress === 'all' ||
                (poProgress === 'none' && po.progress === null) ||
                po.progress === poProgress;

            return matchesSearch && matchesStatus && matchesProgress;
        });
    }, [purchaseOrders, poSearch, poStatus, poProgress]);

    const hasActivePoFilters =
        poSearch !== '' || poStatus !== 'all' || poProgress !== 'all';

    setLayoutProps({
        breadcrumbs: [
            { title: 'Vendors', href: index() },
            { title: vendor.name, href: show(vendor) },
        ],
    });

    return (
        <>
            <Head title={vendor.name} />

            <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6">
                <section className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
                    <div className="flex flex-col gap-6 bg-linear-to-br from-primary/[0.08] via-card to-card p-5 sm:p-6 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex min-w-0 gap-4">
                            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                                <Building2 className="size-6" />
                            </div>
                            <div className="min-w-0 space-y-2">
                                <p className="text-sm font-medium text-muted-foreground">
                                    Vendor profile
                                </p>
                                <div className="flex flex-wrap items-center gap-2">
                                    <h1 className="truncate text-2xl font-semibold tracking-tight sm:text-3xl">
                                        {vendor.name}
                                    </h1>
                                    <span className="rounded-md border border-primary/15 bg-primary/10 px-2 py-1 font-mono text-xs font-medium text-primary">
                                        {vendor.vendor_code}
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Supplier details, contacts, and purchasing
                                    activity.
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
                                    Back to Vendors
                                </Link>
                            </Button>

                            <Button asChild className="w-full sm:w-auto">
                                <Link href={edit(vendor)}>
                                    <Pencil />
                                    Edit Vendor
                                </Link>
                            </Button>
                        </div>
                    </div>

                    <div className="grid divide-y divide-border/60 border-t border-border/60 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                        <div className="flex items-center gap-3 p-4 sm:p-5">
                            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <ShoppingCart className="size-4" />
                            </div>
                            <div>
                                <p className="text-2xl font-semibold tracking-tight">
                                    {purchaseOrders.length}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Purchase orders
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 sm:p-5">
                            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <UserRound className="size-4" />
                            </div>
                            <div className="min-w-0">
                                <p className="truncate font-medium">
                                    {vendor.attention ?? '\u2014'}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Primary contact
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 sm:p-5">
                            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <MapPin className="size-4" />
                            </div>
                            <div className="min-w-0">
                                <p className="truncate font-medium">
                                    {[vendor.city, vendor.province]
                                        .filter(Boolean)
                                        .join(', ') || '\u2014'}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Location
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <Card>
                    <CardHeader className="border-b border-border/60 pb-5">
                        <div className="flex items-center gap-3">
                            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <UserRound className="size-4" />
                            </div>
                            <div>
                                <CardTitle>Vendor details</CardTitle>
                                <CardDescription>
                                    Contact, location, and account information.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <dl className="grid gap-x-8 gap-y-0 sm:grid-cols-2 lg:grid-cols-3">
                            <div className="border-b border-border/60 py-4 first:pt-0 sm:pt-0">
                                <dt className="text-sm text-muted-foreground">
                                    Vendor code
                                </dt>
                                <dd className="font-medium">
                                    {vendor.vendor_code}
                                </dd>
                            </div>

                            <div className="border-b border-border/60 py-4 sm:pt-0">
                                <dt className="text-sm text-muted-foreground">
                                    Name
                                </dt>
                                <dd className="font-medium">{vendor.name}</dd>
                            </div>

                            <div className="border-b border-border/60 py-4 sm:pt-0 lg:pt-0">
                                <dt className="text-sm text-muted-foreground">
                                    Attention
                                </dt>
                                <dd className="font-medium">
                                    {vendor.attention ?? (
                                        <span className="text-muted-foreground">
                                            &mdash;
                                        </span>
                                    )}
                                </dd>
                            </div>

                            <div className="border-b border-border/60 py-4">
                                <dt className="text-sm text-muted-foreground">
                                    Phone
                                </dt>
                                <dd className="font-medium">
                                    {vendor.phone ?? (
                                        <span className="text-muted-foreground">
                                            &mdash;
                                        </span>
                                    )}
                                </dd>
                            </div>

                            <div className="border-b border-border/60 py-4">
                                <dt className="text-sm text-muted-foreground">
                                    Fax
                                </dt>
                                <dd className="font-medium">
                                    {vendor.fax ?? (
                                        <span className="text-muted-foreground">
                                            &mdash;
                                        </span>
                                    )}
                                </dd>
                            </div>

                            <div className="border-b border-border/60 py-4">
                                <dt className="text-sm text-muted-foreground">
                                    City
                                </dt>
                                <dd className="font-medium">
                                    {vendor.city ?? (
                                        <span className="text-muted-foreground">
                                            &mdash;
                                        </span>
                                    )}
                                </dd>
                            </div>

                            <div className="border-b border-border/60 py-4">
                                <dt className="text-sm text-muted-foreground">
                                    Province
                                </dt>
                                <dd className="font-medium">
                                    {vendor.province ?? (
                                        <span className="text-muted-foreground">
                                            &mdash;
                                        </span>
                                    )}
                                </dd>
                            </div>

                            <div className="border-b border-border/60 py-4">
                                <dt className="text-sm text-muted-foreground">
                                    Country
                                </dt>
                                <dd className="font-medium">
                                    {vendor.country ?? (
                                        <span className="text-muted-foreground">
                                            &mdash;
                                        </span>
                                    )}
                                </dd>
                            </div>

                            <div className="border-b border-border/60 py-4">
                                <dt className="text-sm text-muted-foreground">
                                    Postal code
                                </dt>
                                <dd className="font-medium">
                                    {vendor.postal_code ?? (
                                        <span className="text-muted-foreground">
                                            &mdash;
                                        </span>
                                    )}
                                </dd>
                            </div>

                            <div className="border-b border-border/60 py-4 sm:col-span-2 lg:col-span-3">
                                <dt className="text-sm text-muted-foreground">
                                    Address
                                </dt>
                                <dd className="font-medium whitespace-pre-line">
                                    {vendor.address ?? (
                                        <span className="text-muted-foreground">
                                            &mdash;
                                        </span>
                                    )}
                                </dd>
                            </div>

                            <div className="border-b border-border/60 py-4 sm:col-span-2 lg:col-span-3">
                                <dt className="text-sm text-muted-foreground">
                                    Remarks
                                </dt>
                                <dd className="font-medium whitespace-pre-line">
                                    {vendor.remarks ?? (
                                        <span className="text-muted-foreground">
                                            &mdash;
                                        </span>
                                    )}
                                </dd>
                            </div>

                            <div className="py-4 sm:pb-0">
                                <dt className="text-sm text-muted-foreground">
                                    Created at
                                </dt>
                                <dd className="font-medium">
                                    {formatDateTime(vendor.created_at)}
                                </dd>
                            </div>

                            <div className="py-4 sm:pb-0">
                                <dt className="text-sm text-muted-foreground">
                                    Last updated
                                </dt>
                                <dd className="font-medium">
                                    {formatDateTime(vendor.updated_at)}
                                </dd>
                            </div>
                        </dl>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="gap-4 border-b border-border/60 pb-5 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <ClipboardList className="size-4" />
                            </div>
                            <div>
                                <CardTitle>Purchase orders</CardTitle>
                                <CardDescription>
                                    {purchaseOrders.length} associated
                                    {purchaseOrders.length === 1
                                        ? ' purchase order'
                                        : ' purchase orders'}
                                </CardDescription>
                            </div>
                        </div>
                        <span className="self-start rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                            Showing {filteredPurchaseOrders.length} of{' '}
                            {purchaseOrders.length}
                        </span>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                            <div className="relative w-full sm:max-w-xs">
                                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    value={poSearch}
                                    onChange={(e) =>
                                        setPoSearch(e.target.value)
                                    }
                                    placeholder="Search by PO code"
                                    className="pl-9"
                                />
                            </div>

                            <Select
                                value={poStatus}
                                onValueChange={setPoStatus}
                            >
                                <SelectTrigger className="w-full sm:w-36">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        All statuses
                                    </SelectItem>
                                    {PO_STATUS_OPTIONS.map((opt) => (
                                        <SelectItem
                                            key={opt.value}
                                            value={opt.value}
                                        >
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select
                                value={poProgress}
                                onValueChange={setPoProgress}
                            >
                                <SelectTrigger className="w-full sm:w-48">
                                    <SelectValue placeholder="Progress" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        All progress
                                    </SelectItem>
                                    <SelectItem value="none">
                                        No progress
                                    </SelectItem>
                                    {PO_PROGRESS_OPTIONS.map((opt) => (
                                        <SelectItem
                                            key={opt.value}
                                            value={opt.value}
                                        >
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {hasActivePoFilters && (
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        setPoSearch('');
                                        setPoStatus('all');
                                        setPoProgress('all');
                                    }}
                                    className="w-full text-destructive hover:text-destructive sm:w-auto"
                                >
                                    <X />
                                    Reset filters
                                </Button>
                            )}
                        </div>

                        <div className="overflow-hidden rounded-xl border border-border/60">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>PO code</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Progress</TableHead>
                                        <TableHead>Grand total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredPurchaseOrders.length === 0 && (
                                        <TableRow>
                                            <TableCell
                                                colSpan={5}
                                                className="h-28 text-center text-muted-foreground"
                                            >
                                                No purchase orders match these
                                                filters.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {filteredPurchaseOrders.map((po) => (
                                        <TableRow key={po.id}>
                                            <TableCell className="font-medium">
                                                <Link
                                                    href={showPurchaseOrder({
                                                        purchaseOrder: po,
                                                    })}
                                                    className="hover:text-primary hover:underline"
                                                >
                                                    {po.purchase_order_code}
                                                </Link>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {formatDate(po.created_at)}
                                            </TableCell>
                                            <TableCell>
                                                <StatusBadge
                                                    category="document"
                                                    value={po.status}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {po.progress ? (
                                                    <StatusBadge
                                                        category="progress"
                                                        value={po.progress}
                                                    />
                                                ) : (
                                                    <span className="text-muted-foreground">
                                                        &mdash;
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {po.currency.symbol ??
                                                    po.currency.iso_code}{' '}
                                                {formatNumber(po.grand_total)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

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
                                Permanently remove this vendor and its record.
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col gap-4 rounded-xl border border-red-100 bg-red-50/70 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-red-200/10 dark:bg-red-700/10">
                        <div className="space-y-0.5 text-red-600 dark:text-red-100">
                            <p className="font-medium">Delete this vendor</p>
                            <p className="text-sm">
                                Once deleted, this vendor cannot be restored.
                            </p>
                        </div>

                        <Dialog>
                            <DialogTrigger asChild>
                                <Button
                                    variant="destructive"
                                    className="w-full sm:w-auto"
                                >
                                    <Trash2 />
                                    Delete Vendor
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogTitle>
                                    Delete &quot;{vendor.name}&quot;?
                                </DialogTitle>
                                <DialogDescription>
                                    This action cannot be undone. This vendor
                                    will be permanently deleted.
                                </DialogDescription>

                                <Form
                                    {...destroy.form(vendor)}
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
                                                    {processing && <Spinner />}
                                                    Delete Vendor
                                                </button>
                                            </Button>
                                        </DialogFooter>
                                    )}
                                </Form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </section>
            </div>
        </>
    );
}
