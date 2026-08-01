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
import { formatDate, formatDateTime, formatNumber } from '@/lib/utils';
import { destroy, edit, index, show } from '@/routes/projects';
import { show as showQuotation } from '@/routes/quotations';

type Project = {
    id: number;
    uuid: string;
    project_code: string;
    name: string;
    request_date: string;
    description: string | null;
    status: string;
    priority: string;
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
        name: string;
    };
    person_in_charge: {
        id: number;
        full_name: string;
    } | null;
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

type Props = {
    project: Project;
    quotations: Quotation[];
};

export default function ProjectsShow({ project, quotations }: Props) {
    setLayoutProps({
        breadcrumbs: [
            { title: 'Projects', href: index() },
            { title: project.name, href: show(project) },
        ],
    });

    return (
        <>
            <Head title={project.name} />

            <div className="mx-auto w-full max-w-3xl space-y-6 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <Heading
                        title={project.name}
                        description="Project details"
                    />

                    <div className="flex flex-col gap-2 sm:flex-row">
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

                <Card>
                    <CardHeader>
                        <CardTitle>Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <dl className="grid gap-4 sm:grid-cols-2">
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
                                    {project.customer.name}
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

                            <div>
                                <dt className="text-sm text-muted-foreground">
                                    Status
                                </dt>
                                <dd>
                                    <Badge
                                        variant="secondary"
                                        className="capitalize"
                                    >
                                        {project.status.replace('_', ' ')}
                                    </Badge>
                                </dd>
                            </div>

                            <div>
                                <dt className="text-sm text-muted-foreground">
                                    Priority
                                </dt>
                                <dd>
                                    <Badge
                                        variant="outline"
                                        className="capitalize"
                                    >
                                        {project.priority}
                                    </Badge>
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
                                    Actual cost
                                </dt>
                                <dd className="font-medium">
                                    {project.actual_cost ? (
                                        formatNumber(project.actual_cost)
                                    ) : (
                                        <span className="text-muted-foreground">
                                            &mdash;
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
                                        formatNumber(
                                            project.actual_contract_value,
                                        )
                                    ) : (
                                        <span className="text-muted-foreground">
                                            &mdash;
                                        </span>
                                    )}
                                </dd>
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
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Quotations</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {quotations.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No quotations have been created for this project
                                yet.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {quotations.map((quotation) => (
                                    <Link
                                        key={quotation.id}
                                        href={showQuotation(quotation)}
                                        className="flex flex-col gap-2 rounded-lg border p-4 hover:bg-accent sm:flex-row sm:items-center sm:justify-between"
                                    >
                                        <div className="space-y-0.5">
                                            <p className="font-medium">
                                                {quotation.quotation_code}
                                                <span className="ml-2 text-sm font-normal text-muted-foreground">
                                                    v{quotation.version_major}.
                                                    {quotation.version_minor}
                                                    {quotation.is_current &&
                                                        ' (current)'}
                                                </span>
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                Valid until{' '}
                                                {quotation.valid_until ? (
                                                    formatDate(
                                                        quotation.valid_until,
                                                    )
                                                ) : (
                                                    <span>&mdash;</span>
                                                )}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <span className="font-medium">
                                                {quotation.currency.symbol ??
                                                    quotation.currency
                                                        .iso_code}{' '}
                                                {formatNumber(quotation.total)}
                                            </span>
                                            <Badge
                                                variant="secondary"
                                                className="capitalize"
                                            >
                                                {quotation.status.replaceAll(
                                                    '_',
                                                    ' ',
                                                )}
                                            </Badge>
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
                                                        Delete Project
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
