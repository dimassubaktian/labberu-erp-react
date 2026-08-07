import { Form, Head, Link, setLayoutProps } from '@inertiajs/react';
import { ArrowLeft, Pencil, Search, Trash2, X } from 'lucide-react';
import React from 'react';
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
            const matchesStatus =
                poStatus === 'all' || po.status === poStatus;
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

            <div className="mx-auto w-full max-w-5xl space-y-6 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <Heading title={vendor.name} description="Vendor details" />

                    <div className="flex flex-col gap-2 sm:flex-row">
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

                <div>
                    <h2 className="mb-4 text-base font-semibold">Details</h2>
                    <dl className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Vendor code
                            </dt>
                            <dd className="font-medium">
                                {vendor.vendor_code}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Name
                            </dt>
                            <dd className="font-medium">{vendor.name}</dd>
                        </div>

                        <div>
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

                        <div>
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

                        <div>
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

                        <div>
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

                        <div>
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

                        <div>
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

                        <div>
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

                        <div className="sm:col-span-2">
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

                        <div className="sm:col-span-2">
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

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Created at
                            </dt>
                            <dd className="font-medium">
                                {formatDateTime(vendor.created_at)}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Last updated
                            </dt>
                            <dd className="font-medium">
                                {formatDateTime(vendor.updated_at)}
                            </dd>
                        </div>
                    </dl>
                </div>

                <div>
                    <h2 className="mb-4 text-base font-semibold">
                        Purchase Orders
                    </h2>

                    <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                        <div className="relative w-full sm:max-w-xs">
                            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={poSearch}
                                onChange={(e) => setPoSearch(e.target.value)}
                                placeholder="Search by PO code"
                                className="pl-9"
                            />
                        </div>

                        <Select value={poStatus} onValueChange={setPoStatus}>
                            <SelectTrigger className="w-full sm:w-36">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All statuses</SelectItem>
                                {PO_STATUS_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={poProgress} onValueChange={setPoProgress}>
                            <SelectTrigger className="w-full sm:w-48">
                                <SelectValue placeholder="Progress" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All progress</SelectItem>
                                <SelectItem value="none">No progress</SelectItem>
                                {PO_PROGRESS_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
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
                                Reset
                            </Button>
                        )}
                    </div>

                    <div className="overflow-hidden rounded-xl border border-border/50">
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
                                            className="h-24 text-center text-muted-foreground"
                                        >
                                            No purchase orders found.
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
                                            >
                                                {po.purchase_order_code}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {formatDate(po.created_at)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="secondary"
                                                className="capitalize"
                                            >
                                                {po.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {po.progress ? (
                                                <Badge
                                                    variant="secondary"
                                                    className="capitalize"
                                                >
                                                    {po.progress.replaceAll('_', ' ')}
                                                </Badge>
                                            ) : (
                                                <span className="text-muted-foreground">
                                                    &mdash;
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {po.currency.symbol ?? po.currency.iso_code}{' '}
                                            {formatNumber(po.grand_total)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                <div className="space-y-4 rounded-lg border border-destructive/50 p-4">
                    <h2 className="text-base font-semibold text-destructive dark:text-destructive-foreground">
                        Danger Zone
                    </h2>
                    <div className="flex flex-col gap-4 rounded-lg border border-red-100 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-red-200/10 dark:bg-red-700/10">
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
                </div>
            </div>
        </>
    );
}
