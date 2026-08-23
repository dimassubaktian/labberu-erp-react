import { Form, Head, Link, setLayoutProps } from '@inertiajs/react';
import { ArrowLeft, Pencil, Trash2, Users, X } from 'lucide-react';
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

            <div className="mx-auto w-full max-w-5xl space-y-6 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <Heading
                        title={jobTitle.name}
                        description="Job title details"
                    />

                    <div className="flex flex-col gap-2 sm:flex-row">
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

                <div>
                    <h2 className="mb-4 text-base font-semibold">Details</h2>
                    <dl className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Name
                            </dt>
                            <dd className="font-medium">{jobTitle.name}</dd>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Status
                            </dt>
                            <dd>
                                <Badge
                                    variant={
                                        jobTitle.status === 'active'
                                            ? 'secondary'
                                            : 'outline'
                                    }
                                    className="mt-1 capitalize"
                                >
                                    {jobTitle.status}
                                </Badge>
                            </dd>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Created at
                            </dt>
                            <dd className="font-medium">
                                {formatDateTime(jobTitle.created_at)}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Last updated
                            </dt>
                            <dd className="font-medium">
                                {formatDateTime(jobTitle.updated_at)}
                            </dd>
                        </div>
                    </dl>
                </div>

                <div>
                    <h2 className="mb-4 text-base font-semibold">Workforce</h2>
                    {workforces.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border/50 py-10 text-center">
                            <Users className="size-8 text-muted-foreground" />
                            <p className="text-sm font-medium">
                                No workforce assigned
                            </p>
                            <p className="max-w-sm text-sm text-muted-foreground">
                                No employees are currently assigned to this job
                                title.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-hidden rounded-xl border border-border/50">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Employee code</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {workforces.map((workforce) => (
                                        <TableRow key={workforce.id}>
                                            <TableCell className="font-medium">
                                                <Link
                                                    href={showWorkforce(
                                                        workforce,
                                                    )}
                                                >
                                                    {workforce.employee_code}
                                                </Link>
                                            </TableCell>
                                            <TableCell>
                                                <Link
                                                    href={showWorkforce(
                                                        workforce,
                                                    )}
                                                >
                                                    {workforce.full_name}
                                                </Link>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {workforce.email}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        workforce.status ===
                                                        'active'
                                                            ? 'secondary'
                                                            : 'outline'
                                                    }
                                                    className="capitalize"
                                                >
                                                    {workforce.status}
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
                </div>
            </div>
        </>
    );
}
