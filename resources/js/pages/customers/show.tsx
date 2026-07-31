import { Form, Head, Link, setLayoutProps } from '@inertiajs/react';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
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
import { Spinner } from '@/components/ui/spinner';
import { formatDate, formatDateTime } from '@/lib/utils';
import { destroy, edit, index, show } from '@/routes/customers';
import { show as showProject } from '@/routes/projects';

type Project = {
    id: number;
    uuid: string;
    project_code: string;
    name: string;
    status: string;
    priority: string;
    request_date: string;
};

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
    setLayoutProps({
        breadcrumbs: [
            { title: 'Customers', href: index() },
            { title: customer.name, href: show(customer) },
        ],
    });

    return (
        <>
            <Head title={customer.name} />

            <div className="mx-auto w-full max-w-3xl space-y-6 p-4">
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

                <Card>
                    <CardHeader>
                        <CardTitle>Details</CardTitle>
                    </CardHeader>
                    <CardContent>
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
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Projects</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {customer.projects.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No projects found.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {customer.projects.map((project) => (
                                    <Link
                                        key={project.id}
                                        href={showProject(project)}
                                        className="block rounded-lg border border-sidebar-border/70 p-4 transition-colors hover:bg-accent dark:border-sidebar-border"
                                    >
                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                            <div>
                                                <p className="font-medium">
                                                    {project.name}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {project.project_code}
                                                    {' · '}
                                                    {formatDate(
                                                        project.request_date,
                                                    )}
                                                </p>
                                            </div>

                                            <div className="flex gap-2">
                                                <Badge
                                                    variant="secondary"
                                                    className="capitalize"
                                                >
                                                    {project.status.replace(
                                                        '_',
                                                        ' ',
                                                    )}
                                                </Badge>
                                                <Badge
                                                    variant="outline"
                                                    className="capitalize"
                                                >
                                                    {project.priority}
                                                </Badge>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

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
                                    Delete this customer
                                </p>
                                <p className="text-sm">
                                    Once deleted, this customer cannot be
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
                                        Delete Customer
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogTitle>
                                        Delete &quot;{customer.name}&quot;?
                                    </DialogTitle>
                                    <DialogDescription>
                                        This action cannot be undone. This
                                        customer will be permanently deleted.
                                    </DialogDescription>

                                    <Form
                                        {...destroy.form(customer)}
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
                                                        Delete Customer
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
            </div>
        </>
    );
}
