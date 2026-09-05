import { Form, Head, Link, setLayoutProps } from '@inertiajs/react';
import {
    ArrowLeft,
    Building2,
    ClipboardList,
    MapPin,
    Pencil,
    Plus,
    Search,
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
import { formatDate, formatDateTime } from '@/lib/utils';
import { destroy, edit, index, show } from '@/routes/customers';
import {
    create as createProject,
    show as showProject,
} from '@/routes/projects';

type Project = {
    id: number;
    uuid: string;
    project_code: string;
    name: string;
    status: string;
    sales_status: string | null;
    po_status: string | null;
    billing_status: string | null;
    priority: string;
    request_date: string;
};

const PROJECT_STATUS_OPTIONS = [
    { value: 'planning', label: 'Planning' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
];

type Customer = {
    id: number;
    uuid: string;
    customer_code: string;
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
    projects: Project[];
};

type Props = {
    customer: Customer;
};

export default function CustomersShow({ customer }: Props) {
    const [projectSearch, setProjectSearch] = React.useState('');
    const [projectStatus, setProjectStatus] = React.useState('all');

    const filteredProjects = React.useMemo(() => {
        return customer.projects.filter((p) => {
            const matchesSearch =
                projectSearch === '' ||
                p.name.toLowerCase().includes(projectSearch.toLowerCase()) ||
                p.project_code
                    .toLowerCase()
                    .includes(projectSearch.toLowerCase());
            const matchesStatus =
                projectStatus === 'all' || p.status === projectStatus;

            return matchesSearch && matchesStatus;
        });
    }, [customer.projects, projectSearch, projectStatus]);

    const hasActiveProjectFilters =
        projectSearch !== '' || projectStatus !== 'all';

    setLayoutProps({
        breadcrumbs: [
            { title: 'Customers', href: index() },
            { title: customer.name, href: show(customer) },
        ],
    });

    return (
        <>
            <Head title={customer.name} />

            <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6">
                <section className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
                    <div className="flex flex-col gap-6 bg-linear-to-br from-primary/[0.08] via-card to-card p-5 sm:p-6 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex min-w-0 gap-4">
                            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                                <Building2 className="size-6" />
                            </div>
                            <div className="min-w-0 space-y-2">
                                <p className="text-sm font-medium text-muted-foreground">
                                    Customer profile
                                </p>
                                <div className="flex flex-wrap items-center gap-2">
                                    <h1 className="truncate text-2xl font-semibold tracking-tight sm:text-3xl">
                                        {customer.name}
                                    </h1>
                                    <span className="rounded-md border border-primary/15 bg-primary/10 px-2 py-1 font-mono text-xs font-medium text-primary">
                                        {customer.customer_code}
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Account details, contacts, and associated
                                    project activity.
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
                                    Back to Customers
                                </Link>
                            </Button>

                            <Button asChild className="w-full sm:w-auto">
                                <Link href={edit(customer)}>
                                    <Pencil />
                                    Edit Customer
                                </Link>
                            </Button>
                        </div>
                    </div>

                    <div className="grid divide-y divide-border/60 border-t border-border/60 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                        <div className="flex items-center gap-3 p-4 sm:p-5">
                            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <ClipboardList className="size-4" />
                            </div>
                            <div>
                                <p className="text-2xl font-semibold tracking-tight">
                                    {customer.projects.length}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Associated projects
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 sm:p-5">
                            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <UserRound className="size-4" />
                            </div>
                            <div className="min-w-0">
                                <p className="truncate font-medium">
                                    {customer.attention ?? '\u2014'}
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
                                    {[customer.city, customer.province]
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
                                <CardTitle>Customer details</CardTitle>
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
                                    Customer code
                                </dt>
                                <dd className="font-medium">
                                    {customer.customer_code}
                                </dd>
                            </div>

                            <div className="border-b border-border/60 py-4 sm:pt-0">
                                <dt className="text-sm text-muted-foreground">
                                    Name
                                </dt>
                                <dd className="font-medium">{customer.name}</dd>
                            </div>

                            <div className="border-b border-border/60 py-4 sm:pt-0 lg:pt-0">
                                <dt className="text-sm text-muted-foreground">
                                    Attention
                                </dt>
                                <dd className="font-medium">
                                    {customer.attention ?? (
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
                                    {customer.phone ?? (
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
                                    {customer.fax ?? (
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
                                    {customer.city ?? (
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
                                    {customer.province ?? (
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
                                    {customer.country ?? (
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
                                    {customer.postal_code ?? (
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
                                    {customer.address ?? (
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
                                    {customer.remarks ?? (
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
                                    {formatDateTime(customer.created_at)}
                                </dd>
                            </div>

                            <div className="py-4 sm:pb-0">
                                <dt className="text-sm text-muted-foreground">
                                    Last updated
                                </dt>
                                <dd className="font-medium">
                                    {formatDateTime(customer.updated_at)}
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
                                <CardTitle>Projects</CardTitle>
                                <CardDescription>
                                    {customer.projects.length} associated
                                    {customer.projects.length === 1
                                        ? ' project'
                                        : ' projects'}
                                </CardDescription>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 sm:items-end">
                            <span className="self-start rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground sm:self-auto">
                                Showing {filteredProjects.length} of{' '}
                                {customer.projects.length}
                            </span>
                            <Button
                                asChild
                                size="sm"
                                className="w-full sm:w-auto"
                            >
                                <Link
                                    href={createProject({
                                        query: { customer: customer.uuid },
                                    })}
                                >
                                    <Plus />
                                    Add Project
                                </Link>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                            <div className="relative w-full sm:max-w-xs">
                                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    value={projectSearch}
                                    onChange={(e) =>
                                        setProjectSearch(e.target.value)
                                    }
                                    placeholder="Search by code or name"
                                    className="pl-9"
                                />
                            </div>

                            <Select
                                value={projectStatus}
                                onValueChange={setProjectStatus}
                            >
                                <SelectTrigger className="w-full sm:w-40">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        All statuses
                                    </SelectItem>
                                    {PROJECT_STATUS_OPTIONS.map((opt) => (
                                        <SelectItem
                                            key={opt.value}
                                            value={opt.value}
                                        >
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {hasActiveProjectFilters && (
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        setProjectSearch('');
                                        setProjectStatus('all');
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
                                        <TableHead>Project code</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Sales</TableHead>
                                        <TableHead>PO</TableHead>
                                        <TableHead>Billing</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredProjects.length === 0 && (
                                        <TableRow>
                                            <TableCell
                                                colSpan={7}
                                                className="h-28 text-center text-muted-foreground"
                                            >
                                                No projects match these filters.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {filteredProjects.map((project) => (
                                        <TableRow key={project.id}>
                                            <TableCell className="font-medium">
                                                <Link
                                                    href={showProject(project)}
                                                    className="hover:text-primary hover:underline"
                                                >
                                                    {project.project_code}
                                                </Link>
                                            </TableCell>
                                            <TableCell>
                                                <Link
                                                    href={showProject(project)}
                                                    className="font-medium hover:text-primary hover:underline"
                                                >
                                                    {project.name}
                                                </Link>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {formatDate(
                                                    project.request_date,
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <StatusBadge
                                                    category="status"
                                                    value={project.status}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {project.sales_status ? (
                                                    <StatusBadge
                                                        category="sales"
                                                        value={
                                                            project.sales_status
                                                        }
                                                    />
                                                ) : (
                                                    <span className="text-muted-foreground">
                                                        &mdash;
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {project.po_status ? (
                                                    <StatusBadge
                                                        category="po"
                                                        value={
                                                            project.po_status
                                                        }
                                                    />
                                                ) : (
                                                    <span className="text-muted-foreground">
                                                        &mdash;
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {project.billing_status ? (
                                                    <StatusBadge
                                                        category="billing"
                                                        value={
                                                            project.billing_status
                                                        }
                                                    />
                                                ) : (
                                                    <span className="text-muted-foreground">
                                                        &mdash;
                                                    </span>
                                                )}
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
                                Permanently remove this customer and its record.
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col gap-4 rounded-xl border border-red-100 bg-red-50/70 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-red-200/10 dark:bg-red-700/10">
                        <div className="space-y-0.5 text-red-600 dark:text-red-100">
                            <p className="font-medium">Delete this customer</p>
                            <p className="text-sm">
                                Once deleted, this customer cannot be restored.
                            </p>
                        </div>

                        <Dialog>
                            <DialogTrigger asChild>
                                <Button
                                    variant="destructive"
                                    className="w-full sm:w-auto"
                                >
                                    <Trash2 />
                                    Delete Customer
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogTitle>
                                    Delete &quot;{customer.name}&quot;?
                                </DialogTitle>
                                <DialogDescription>
                                    This action cannot be undone. This customer
                                    will be permanently deleted.
                                </DialogDescription>

                                <Form
                                    {...destroy.form(customer)}
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
                                                    Delete Customer
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
