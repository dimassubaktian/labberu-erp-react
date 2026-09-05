import { Form, Head, Link, setLayoutProps } from '@inertiajs/react';
import {
    ArrowLeft,
    BriefcaseBusiness,
    CalendarDays,
    Mail,
    MapPin,
    Pencil,
    Phone,
    Trash2,
    UserRound,
    X,
} from 'lucide-react';
import { StatusBadge } from '@/components/project-badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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

            <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6">
                <section className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
                    <div className="flex flex-col gap-6 bg-linear-to-br from-primary/[0.08] via-card to-card p-5 sm:p-6 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex min-w-0 items-start gap-4">
                            <Avatar className="size-14 shrink-0 rounded-xl border border-primary/15 sm:size-16">
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
                                <AvatarFallback className="rounded-xl bg-primary/10 text-lg font-semibold text-primary">
                                    {getInitials(workforce.full_name)}
                                </AvatarFallback>
                            </Avatar>

                            <div className="min-w-0 space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Workforce profile
                                    </p>
                                    <StatusBadge
                                        category="active"
                                        value={workforce.status}
                                    />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-semibold tracking-tight break-words sm:text-3xl">
                                        {workforce.full_name}
                                    </h1>
                                    <p className="mt-1 text-sm text-muted-foreground sm:text-base">
                                        {workforce.job_title.name}
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

                    <div className="grid divide-y divide-border/60 border-t border-border/60 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                        <div className="space-y-1 p-4 sm:p-5">
                            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                Employee code
                            </p>
                            <p className="font-semibold">
                                {workforce.employee_code}
                            </p>
                        </div>
                        <div className="space-y-1 p-4 sm:p-5">
                            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                Job title
                            </p>
                            <p className="font-semibold">
                                {workforce.job_title.name}
                            </p>
                        </div>
                        <div className="space-y-1 p-4 sm:p-5">
                            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                Employment status
                            </p>
                            <StatusBadge
                                category="active"
                                value={workforce.status}
                            />
                        </div>
                    </div>
                </section>

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
                    <div className="space-y-6">
                        <Card>
                            <CardHeader className="border-b border-border/60 pb-5">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-lg bg-muted p-2 text-muted-foreground">
                                        <UserRound className="size-5" />
                                    </div>
                                    <div>
                                        <CardTitle>Employee details</CardTitle>
                                        <CardDescription>
                                            Role and personal information for
                                            this workforce member.
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
                                    <div className="space-y-1">
                                        <dt className="text-sm text-muted-foreground">
                                            Employee code
                                        </dt>
                                        <dd className="font-medium">
                                            {workforce.employee_code}
                                        </dd>
                                    </div>
                                    <div className="space-y-1">
                                        <dt className="text-sm text-muted-foreground">
                                            Job title
                                        </dt>
                                        <dd className="font-medium">
                                            {workforce.job_title.name}
                                        </dd>
                                    </div>
                                    <div className="space-y-1">
                                        <dt className="text-sm text-muted-foreground">
                                            Gender
                                        </dt>
                                        <dd className="font-medium capitalize">
                                            {workforce.gender}
                                        </dd>
                                    </div>
                                    <div className="space-y-2">
                                        <dt className="text-sm text-muted-foreground">
                                            Employment status
                                        </dt>
                                        <dd>
                                            <StatusBadge
                                                category="active"
                                                value={workforce.status}
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
                                        <Mail className="size-5" />
                                    </div>
                                    <div>
                                        <CardTitle>
                                            Contact information
                                        </CardTitle>
                                        <CardDescription>
                                            Direct contact details and recorded
                                            address.
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
                                    <div className="space-y-1">
                                        <dt className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Mail className="size-4" />
                                            Email
                                        </dt>
                                        <dd className="font-medium break-all">
                                            {workforce.email}
                                        </dd>
                                    </div>
                                    <div className="space-y-1">
                                        <dt className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Phone className="size-4" />
                                            Phone
                                        </dt>
                                        <dd className="font-medium">
                                            {workforce.phone ?? (
                                                <span className="text-muted-foreground">
                                                    Not provided
                                                </span>
                                            )}
                                        </dd>
                                    </div>
                                    <div className="space-y-1 sm:col-span-2">
                                        <dt className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <MapPin className="size-4" />
                                            Address
                                        </dt>
                                        <dd className="font-medium whitespace-pre-line">
                                            {workforce.address ?? (
                                                <span className="text-muted-foreground">
                                                    Not provided
                                                </span>
                                            )}
                                        </dd>
                                    </div>
                                </dl>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader className="border-b border-border/60 pb-5">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-lg bg-muted p-2 text-muted-foreground">
                                        <BriefcaseBusiness className="size-5" />
                                    </div>
                                    <div>
                                        <CardTitle>Role overview</CardTitle>
                                        <CardDescription>
                                            Current position within the
                                            organization.
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-5 pt-6">
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">
                                        Job title
                                    </p>
                                    <p className="text-lg font-semibold">
                                        {workforce.job_title.name}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">
                                        Employment status
                                    </p>
                                    <StatusBadge
                                        category="active"
                                        value={workforce.status}
                                    />
                                </div>
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
                                            When this workforce record was
                                            created and updated.
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
                                        {formatDateTime(workforce.created_at)}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">
                                        Last updated
                                    </p>
                                    <p className="font-medium">
                                        {formatDateTime(workforce.updated_at)}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

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
                                Permanently remove this workforce record.
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col gap-4 rounded-xl border border-red-100 bg-red-50/70 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-red-200/10 dark:bg-red-700/10">
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
                                                    Delete Workforce
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
