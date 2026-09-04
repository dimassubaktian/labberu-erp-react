import { Form, Head, Link, setLayoutProps } from '@inertiajs/react';
import { ArrowLeft, Pencil, Search, Trash2, X } from 'lucide-react';
import React from 'react';
import Heading from '@/components/heading';
import { StatusBadge } from '@/components/project-badge';
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
import { formatDate, formatDateTime } from '@/lib/utils';
import { destroy, edit, index, show } from '@/routes/customers';
import { show as showProject } from '@/routes/projects';

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

            <div className="mx-auto w-full max-w-5xl space-y-6 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <Heading
                        title={customer.name}
                        description="Customer details"
                    />

                    <div className="flex flex-col gap-2 sm:flex-row">
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

                <div>
                    <h2 className="mb-4 text-base font-semibold">Details</h2>
                    <dl className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Customer code
                            </dt>
                            <dd className="font-medium">
                                {customer.customer_code}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Name
                            </dt>
                            <dd className="font-medium">{customer.name}</dd>
                        </div>

                        <div>
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

                        <div>
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

                        <div>
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

                        <div>
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

                        <div>
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

                        <div>
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

                        <div>
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

                        <div className="sm:col-span-2">
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

                        <div className="sm:col-span-2">
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

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Created at
                            </dt>
                            <dd className="font-medium">
                                {formatDateTime(customer.created_at)}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Last updated
                            </dt>
                            <dd className="font-medium">
                                {formatDateTime(customer.updated_at)}
                            </dd>
                        </div>
                    </dl>
                </div>

                <div>
                    <h2 className="mb-4 text-base font-semibold">Projects</h2>

                    <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
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
                                Reset
                            </Button>
                        )}
                    </div>

                    <div className="overflow-hidden rounded-xl border border-border/50">
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
                                            className="h-24 text-center text-muted-foreground"
                                        >
                                            No projects found.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {filteredProjects.map((project) => (
                                    <TableRow key={project.id}>
                                        <TableCell className="font-medium">
                                            <Link href={showProject(project)}>
                                                {project.project_code}
                                            </Link>
                                        </TableCell>
                                        <TableCell>
                                            <Link href={showProject(project)}>
                                                {project.name}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {formatDate(project.request_date)}
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
                                                    value={project.sales_status}
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
                                                    value={project.po_status}
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
                </div>

                <div className="space-y-4 rounded-lg border border-destructive/50 p-4">
                    <h2 className="text-base font-semibold text-destructive dark:text-destructive-foreground">
                        Danger Zone
                    </h2>
                    <div className="flex flex-col gap-4 rounded-lg border border-red-100 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-red-200/10 dark:bg-red-700/10">
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
                </div>
            </div>
        </>
    );
}
