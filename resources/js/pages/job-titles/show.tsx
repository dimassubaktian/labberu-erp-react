import { Form, Head, Link, setLayoutProps } from '@inertiajs/react';
import {
    ArrowLeft,
    BriefcaseBusiness,
    CalendarDays,
    Pencil,
    Trash2,
    Users,
    X,
} from 'lucide-react';
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
import { Spinner } from '@/components/ui/spinner';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatDateTime } from '@/lib/utils';
import { destroy, edit, index, show } from '@/routes/job-titles';
import { show as showWorkforce } from '@/routes/workforces';

type JobTitle = {
    id: number;
    uuid: string;
    name: string;
    status: string;
    created_at: string;
    updated_at: string;
};

type Workforce = {
    id: number;
    uuid: string;
    employee_code: string;
    full_name: string;
    email: string;
    status: string;
};

type Props = {
    jobTitle: JobTitle;
    workforces: Workforce[];
};

export default function JobTitlesShow({ jobTitle, workforces }: Props) {
    setLayoutProps({
        breadcrumbs: [
            { title: 'Job Titles', href: index() },
            { title: jobTitle.name, href: show(jobTitle) },
        ],
    });

    return (
        <>
            <Head title={jobTitle.name} />

            <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6">
                <section className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
                    <div className="flex flex-col gap-6 bg-linear-to-br from-primary/[0.08] via-card to-card p-5 sm:p-6 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex min-w-0 items-start gap-4">
                            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:size-14">
                                <BriefcaseBusiness className="size-6 sm:size-7" />
                            </div>
                            <div className="min-w-0 space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Job title profile
                                    </p>
                                    <StatusBadge
                                        category="active"
                                        value={jobTitle.status}
                                    />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-semibold tracking-tight break-words sm:text-3xl">
                                        {jobTitle.name}
                                    </h1>
                                    <p className="mt-1 text-sm text-muted-foreground sm:text-base">
                                        Role definition and assigned workforce.
                                    </p>
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
                                    Back to Job Titles
                                </Link>
                            </Button>

                            <Button asChild className="w-full sm:w-auto">
                                <Link href={edit(jobTitle)}>
                                    <Pencil />
                                    Edit Job Title
                                </Link>
                            </Button>
                        </div>
                    </div>

                    <div className="grid divide-y divide-border/60 border-t border-border/60 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                        <div className="space-y-1 p-4 sm:p-5">
                            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                Status
                            </p>
                            <StatusBadge
                                category="active"
                                value={jobTitle.status}
                            />
                        </div>
                        <div className="space-y-1 p-4 sm:p-5">
                            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                Assigned workforce
                            </p>
                            <p className="font-semibold">
                                {workforces.length}{' '}
                                {workforces.length === 1
                                    ? 'employee'
                                    : 'employees'}
                            </p>
                        </div>
                        <div className="space-y-1 p-4 sm:p-5">
                            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                Last updated
                            </p>
                            <p className="font-semibold">
                                {formatDateTime(jobTitle.updated_at)}
                            </p>
                        </div>
                    </div>
                </section>

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
                    <Card>
                        <CardHeader className="border-b border-border/60 pb-5">
                            <CardTitle>Role details</CardTitle>
                            <CardDescription>
                                The current role name and availability status.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
                                <div className="space-y-1">
                                    <dt className="text-sm text-muted-foreground">
                                        Job title
                                    </dt>
                                    <dd className="font-medium">
                                        {jobTitle.name}
                                    </dd>
                                </div>
                                <div className="space-y-2">
                                    <dt className="text-sm text-muted-foreground">
                                        Status
                                    </dt>
                                    <dd>
                                        <StatusBadge
                                            category="active"
                                            value={jobTitle.status}
                                        />
                                    </dd>
                                </div>
                            </dl>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="border-b border-border/60 pb-5">
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-muted p-2 text-muted-foreground">
                                    <CalendarDays className="size-5" />
                                </div>
                                <div>
                                    <CardTitle>Record timeline</CardTitle>
                                    <CardDescription>
                                        Job title record activity.
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-5 pt-6">
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">
                                    Created at
                                </p>
                                <p className="font-medium">
                                    {formatDateTime(jobTitle.created_at)}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">
                                    Last updated
                                </p>
                                <p className="font-medium">
                                    {formatDateTime(jobTitle.updated_at)}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader className="border-b border-border/60 pb-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-muted p-2 text-muted-foreground">
                                    <Users className="size-5" />
                                </div>
                                <div>
                                    <CardTitle>Assigned workforce</CardTitle>
                                    <CardDescription>
                                        Employees currently using this job
                                        title.
                                    </CardDescription>
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {workforces.length} total
                            </p>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {workforces.length === 0 ? (
                            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border/60 bg-muted/20 px-4 py-12 text-center">
                                <Users className="size-8 text-muted-foreground" />
                                <p className="text-sm font-medium">
                                    No workforce assigned
                                </p>
                                <p className="max-w-sm text-sm text-muted-foreground">
                                    Employees assigned to this job title will
                                    appear here.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-hidden rounded-xl border border-border/60">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Employee</TableHead>
                                            <TableHead>Contact</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {workforces.map((workforce) => (
                                            <TableRow key={workforce.id}>
                                                <TableCell>
                                                    <Link
                                                        href={showWorkforce(
                                                            workforce,
                                                        )}
                                                        className="block hover:text-primary hover:underline"
                                                    >
                                                        <p className="font-medium">
                                                            {
                                                                workforce.full_name
                                                            }
                                                        </p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {
                                                                workforce.employee_code
                                                            }
                                                        </p>
                                                    </Link>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {workforce.email}
                                                </TableCell>
                                                <TableCell>
                                                    <StatusBadge
                                                        category="active"
                                                        value={workforce.status}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <section className="space-y-4 rounded-2xl border border-destructive/30 bg-destructive/[0.02] p-4 sm:p-6">
                    <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-destructive/10 p-2 text-destructive">
                            <Trash2 className="size-5" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-destructive">
                                Danger zone
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Permanently remove this job title record.
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col gap-4 rounded-xl border border-red-100 bg-red-50/70 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-red-200/10 dark:bg-red-700/10">
                        <div className="space-y-0.5 text-red-600 dark:text-red-100">
                            <p className="font-medium">Delete this job title</p>
                            <p className="text-sm">
                                Once deleted, this job title cannot be restored.
                            </p>
                        </div>

                        <Dialog>
                            <DialogTrigger asChild>
                                <Button
                                    variant="destructive"
                                    className="w-full sm:w-auto"
                                >
                                    <Trash2 />
                                    Delete Job Title
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogTitle>
                                    Delete &quot;{jobTitle.name}&quot;?
                                </DialogTitle>
                                <DialogDescription>
                                    This action cannot be undone. This job title
                                    will be permanently deleted.
                                </DialogDescription>

                                <Form
                                    {...destroy.form(jobTitle)}
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
                                                    Delete Job Title
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
