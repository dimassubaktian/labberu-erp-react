import { Form, Head, Link, setLayoutProps } from '@inertiajs/react';
import {
    ArrowLeft,
    CalendarDays,
    FileText,
    FolderKanban,
    Pencil,
    Trash2,
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
import { destroy, edit, index, show } from '@/routes/business-lines';
import { show as showProject } from '@/routes/projects';

type BusinessLine = {
    id: number;
    uuid: string;
    name: string;
    description: string | null;
    status: string;
    created_at: string;
    updated_at: string;
};

type Project = {
    id: number;
    uuid: string;
    project_code: string;
    name: string;
    status: string;
    priority: string;
    customer: { id: number; name: string } | null;
};

type Props = {
    businessLine: BusinessLine;
    projects: Project[];
};

export default function BusinessLinesShow({ businessLine, projects }: Props) {
    setLayoutProps({
        breadcrumbs: [
            { title: 'Business Lines', href: index() },
            { title: businessLine.name, href: show(businessLine) },
        ],
    });

    return (
        <>
            <Head title={businessLine.name} />

            <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6">
                <section className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
                    <div className="flex flex-col gap-6 bg-linear-to-br from-primary/[0.08] via-card to-card p-5 sm:p-6 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex min-w-0 gap-4">
                            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                                <FolderKanban className="size-6" />
                            </div>
                            <div className="min-w-0 space-y-2">
                                <p className="text-sm font-medium text-muted-foreground">
                                    Business line
                                </p>
                                <div className="flex flex-wrap items-center gap-2">
                                    <h1 className="truncate text-2xl font-semibold tracking-tight sm:text-3xl">
                                        {businessLine.name}
                                    </h1>
                                    <StatusBadge
                                        category="active"
                                        value={businessLine.status}
                                    />
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Organize projects around a shared service or
                                    delivery focus.
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
                                    Back
                                </Link>
                            </Button>

                            <Button asChild className="w-full sm:w-auto">
                                <Link href={edit(businessLine)}>
                                    <Pencil />
                                    Edit
                                </Link>
                            </Button>
                        </div>
                    </div>

                    <div className="grid divide-y divide-border/60 border-t border-border/60 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                        <div className="flex items-center gap-3 p-4 sm:p-5">
                            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <FolderKanban className="size-4" />
                            </div>
                            <div>
                                <p className="text-2xl font-semibold tracking-tight">
                                    {projects.length}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Associated projects
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 sm:p-5">
                            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <CalendarDays className="size-4" />
                            </div>
                            <div>
                                <p className="font-medium">
                                    {formatDateTime(businessLine.updated_at)}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Last updated
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <Card>
                    <CardHeader className="border-b border-border/60 pb-5">
                        <div className="flex items-center gap-3">
                            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <FileText className="size-4" />
                            </div>
                            <div>
                                <CardTitle>Business line details</CardTitle>
                                <CardDescription>
                                    Description, current status, and record
                                    activity.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
                            <div>
                                <dt className="text-sm text-muted-foreground">
                                    Name
                                </dt>
                                <dd className="font-medium">
                                    {businessLine.name}
                                </dd>
                            </div>

                            <div>
                                <dt className="text-sm text-muted-foreground">
                                    Status
                                </dt>
                                <dd>
                                    <StatusBadge
                                        category="active"
                                        value={businessLine.status}
                                    />
                                </dd>
                            </div>

                            {businessLine.description && (
                                <div className="sm:col-span-2">
                                    <dt className="text-sm text-muted-foreground">
                                        Description
                                    </dt>
                                    <dd className="font-medium">
                                        {businessLine.description}
                                    </dd>
                                </div>
                            )}

                            <div>
                                <dt className="text-sm text-muted-foreground">
                                    Created at
                                </dt>
                                <dd className="font-medium">
                                    {formatDateTime(businessLine.created_at)}
                                </dd>
                            </div>

                            <div>
                                <dt className="text-sm text-muted-foreground">
                                    Last updated
                                </dt>
                                <dd className="font-medium">
                                    {formatDateTime(businessLine.updated_at)}
                                </dd>
                            </div>
                        </dl>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="gap-3 border-b border-border/60 pb-5 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle>Project portfolio</CardTitle>
                            <CardDescription>
                                Projects categorized under this business line.
                            </CardDescription>
                        </div>
                        <span className="self-start rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground sm:self-auto">
                            {projects.length}{' '}
                            {projects.length === 1 ? 'project' : 'projects'}
                        </span>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {projects.length === 0 ? (
                            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border/60 py-12 text-center">
                                <FolderKanban className="size-8 text-muted-foreground" />
                                <p className="text-sm font-medium">
                                    No projects assigned
                                </p>
                                <p className="max-w-sm text-sm text-muted-foreground">
                                    No projects are currently categorised under
                                    this business line.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-hidden rounded-xl border border-border/60">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Code</TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Customer</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {projects.map((project) => (
                                            <TableRow key={project.id}>
                                                <TableCell className="font-medium">
                                                    <Link
                                                        href={showProject(
                                                            project,
                                                        )}
                                                        className="hover:text-primary hover:underline"
                                                    >
                                                        {project.project_code}
                                                    </Link>
                                                </TableCell>
                                                <TableCell>
                                                    <Link
                                                        href={showProject(
                                                            project,
                                                        )}
                                                        className="font-medium hover:text-primary hover:underline"
                                                    >
                                                        {project.name}
                                                    </Link>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {project.customer?.name ??
                                                        '—'}
                                                </TableCell>
                                                <TableCell>
                                                    <StatusBadge
                                                        category="status"
                                                        value={project.status}
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
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                            <Trash2 className="size-4" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-destructive dark:text-destructive-foreground">
                                Danger zone
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Permanently remove this business line when it
                                has no associated projects.
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col gap-4 rounded-xl border border-red-100 bg-red-50/70 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-red-200/10 dark:bg-red-700/10">
                        <div className="space-y-0.5 text-red-600 dark:text-red-100">
                            <p className="font-medium">
                                Delete this business line
                            </p>
                            <p className="text-sm">
                                Only possible when no projects are assigned.
                            </p>
                        </div>

                        <Dialog>
                            <DialogTrigger asChild>
                                <Button
                                    variant="destructive"
                                    className="w-full sm:w-auto"
                                    disabled={projects.length > 0}
                                >
                                    <Trash2 />
                                    Delete
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogTitle>
                                    Delete &quot;{businessLine.name}&quot;?
                                </DialogTitle>
                                <DialogDescription>
                                    This action cannot be undone. This business
                                    line will be permanently deleted.
                                </DialogDescription>

                                <Form
                                    {...destroy.form(businessLine)}
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
                                                    Delete
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
