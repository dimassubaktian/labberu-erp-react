import { Form, Head, Link, setLayoutProps } from '@inertiajs/react';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import Heading from '@/components/heading';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { useInitials } from '@/hooks/use-initials';
import { formatDateTime } from '@/lib/utils';
import { destroy, edit, index, photo, show } from '@/routes/workforces';

type Workforce = {
    id: number;
    uuid: string;
    employee_code: string;
    full_name: string;
    email: string;
    phone: string | null;
    address: string | null;
    gender: string;
    photo: string | null;
    status: string;
    created_at: string;
    updated_at: string;
    job_title: {
        id: number;
        name: string;
    };
};

type Props = {
    workforce: Workforce;
};

export default function WorkforcesShow({ workforce }: Props) {
    const getInitials = useInitials();

    setLayoutProps({
        breadcrumbs: [
            { title: 'Workforces', href: index() },
            { title: workforce.full_name, href: show(workforce) },
        ],
    });

    return (
        <>
            <Head title={workforce.full_name} />

            <div className="mx-auto w-full max-w-5xl space-y-6 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <Heading
                        title={workforce.full_name}
                        description="Workforce details"
                    />

                    <div className="flex flex-col gap-2 sm:flex-row">
                        <Button
                            variant="destructive"
                            asChild
                            className="w-full sm:w-auto"
                        >
                            <Link href={index()}>
                                <ArrowLeft />
                                Back to Workforces
                            </Link>
                        </Button>

                        <Button asChild className="w-full sm:w-auto">
                            <Link href={edit(workforce)}>
                                <Pencil />
                                Edit Workforce
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:text-left">
                    <Avatar className="size-20 sm:size-24">
                        {workforce.photo && (
                            <AvatarImage
                                src={
                                    photo(workforce, {
                                        query: {
                                            v: workforce.updated_at,
                                        },
                                    }).url
                                }
                                alt={workforce.full_name}
                            />
                        )}
                        <AvatarFallback className="text-lg">
                            {getInitials(workforce.full_name)}
                        </AvatarFallback>
                    </Avatar>

                    <div className="space-y-1.5">
                        <p className="text-lg font-semibold">
                            {workforce.full_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {workforce.employee_code} &middot;{' '}
                            {workforce.job_title.name}
                        </p>
                        <Badge
                            variant={
                                workforce.status === 'active'
                                    ? 'secondary'
                                    : 'outline'
                            }
                            className="capitalize"
                        >
                            {workforce.status}
                        </Badge>
                    </div>
                </div>

                <div>
                    <h2 className="mb-4 text-base font-semibold">Details</h2>
                    <dl className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Employee code
                            </dt>
                            <dd className="font-medium">
                                {workforce.employee_code}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Job title
                            </dt>
                            <dd className="font-medium">
                                {workforce.job_title.name}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Email
                            </dt>
                            <dd className="font-medium break-all">
                                {workforce.email}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Phone
                            </dt>
                            <dd className="font-medium">
                                {workforce.phone ?? (
                                    <span className="text-muted-foreground">
                                        &mdash;
                                    </span>
                                )}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Gender
                            </dt>
                            <dd className="font-medium capitalize">
                                {workforce.gender}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Status
                            </dt>
                            <dd>
                                <Badge
                                    variant={
                                        workforce.status === 'active'
                                            ? 'secondary'
                                            : 'outline'
                                    }
                                    className="mt-1 capitalize"
                                >
                                    {workforce.status}
                                </Badge>
                            </dd>
                        </div>

                        <div className="sm:col-span-2">
                            <dt className="text-sm text-muted-foreground">
                                Address
                            </dt>
                            <dd className="font-medium whitespace-pre-line">
                                {workforce.address ?? (
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
                                {formatDateTime(workforce.created_at)}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Last updated
                            </dt>
                            <dd className="font-medium">
                                {formatDateTime(workforce.updated_at)}
                            </dd>
                        </div>
                    </dl>
                </div>

                <div className="space-y-4 rounded-lg border border-destructive/50 p-4">
                    <h2 className="text-base font-semibold text-destructive dark:text-destructive-foreground">
                        Danger Zone
                    </h2>
                    <div className="flex flex-col gap-4 rounded-lg border border-red-100 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-red-200/10 dark:bg-red-700/10">
                        <div className="space-y-0.5 text-red-600 dark:text-red-100">
                            <p className="font-medium">
                                Delete this workforce member
                            </p>
                            <p className="text-sm">
                                Once deleted, this workforce member cannot be
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
                                    Delete Workforce
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogTitle>
                                    Delete &quot;{workforce.full_name}
                                    &quot;?
                                </DialogTitle>
                                <DialogDescription>
                                    This action cannot be undone. This workforce
                                    member will be permanently deleted.
                                </DialogDescription>

                                <Form
                                    {...destroy.form(workforce)}
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
                                                    Delete Workforce
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
