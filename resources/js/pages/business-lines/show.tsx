import { Form, Head, Link, setLayoutProps } from '@inertiajs/react';
import { ArrowLeft, FolderKanban, Pencil, Trash2 } from 'lucide-react';
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

            <div className="mx-auto w-full max-w-5xl space-y-6 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <Heading
                        title={businessLine.name}
                        description="Business line details"
                    />

                    <div className="flex flex-col gap-2 sm:flex-row">
                        <Button
                            variant="outline"
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

                <div>
                    <h2 className="mb-4 text-base font-semibold">Details</h2>
                    <dl className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Name
                            </dt>
                            <dd className="font-medium">{businessLine.name}</dd>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Status
                            </dt>
                            <dd>
                                <Badge
                                    variant={
                                        businessLine.status === 'active'
                                            ? 'secondary'
                                            : 'outline'
                                    }
                                    className="mt-1 capitalize"
                                >
                                    {businessLine.status}
                                </Badge>
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
                </div>

                <div>
                    <h2 className="mb-4 text-base font-semibold">
                        Projects ({projects.length})
                    </h2>
                    {projects.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border/50 py-10 text-center">
                            <FolderKanban className="size-8 text-muted-foreground" />
                            <p className="text-sm font-medium">
                                No projects assigned
                            </p>
                            <p className="max-w-sm text-sm text-muted-foreground">
                                No projects are currently categorised under this
                                business line.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-hidden rounded-xl border border-border/50">
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
                                                    href={showProject(project)}
                                                >
                                                    {project.project_code}
                                                </Link>
                                            </TableCell>
                                            <TableCell>
                                                <Link
                                                    href={showProject(project)}
                                                >
                                                    {project.name}
                                                </Link>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {project.customer?.name ?? '—'}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className="capitalize"
                                                >
                                                    {project.status.replace(
                                                        '_',
                                                        ' ',
                                                    )}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>

                <div className="space-y-4 rounded-lg border border-destructive/50 p-4">
                    <h2 className="text-base font-semibold text-destructive dark:text-destructive-foreground">
                        Danger Zone
                    </h2>
                    <div className="flex flex-col gap-4 rounded-lg border border-red-100 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-red-200/10 dark:bg-red-700/10">
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
            </div>
        </>
    );
}
