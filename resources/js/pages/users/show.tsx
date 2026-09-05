import { Form, Head, Link, setLayoutProps, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    CalendarDays,
    Mail,
    Pencil,
    ShieldCheck,
    Trash2,
    UserRound,
    UsersRound,
    X,
} from 'lucide-react';
import { StatusBadge } from '@/components/project-badge';
import { Badge } from '@/components/ui/badge';
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
import { formatDateTime } from '@/lib/utils';
import { destroy, edit, index, show } from '@/routes/users';
import { show as showWorkforce } from '@/routes/workforces';

type User = {
    id: number;
    uuid: string;
    name: string;
    email: string;
    status: string;
    workforce: { id: number; uuid: string; full_name: string } | null;
    roles: { id: number; name: string }[];
    created_at: string;
    updated_at: string;
};

type Props = {
    user: User;
};

export default function UsersShow({ user }: Props) {
    const { auth } = usePage().props;
    const isSelf = auth.user?.id === user.id;

    setLayoutProps({
        breadcrumbs: [
            { title: 'Users', href: index() },
            { title: user.name, href: show(user) },
        ],
    });

    return (
        <>
            <Head title={user.name} />

            <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6">
                <section className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
                    <div className="flex flex-col gap-6 bg-linear-to-br from-primary/[0.08] via-card to-card p-5 sm:p-6 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex min-w-0 items-start gap-4">
                            <div className="flex size-14 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary sm:size-16">
                                <UserRound className="size-7" />
                            </div>

                            <div className="min-w-0 space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-sm font-medium text-muted-foreground">
                                        User account
                                    </p>
                                    <StatusBadge
                                        category="active"
                                        value={user.status}
                                    />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-semibold tracking-tight break-words sm:text-3xl">
                                        {user.name}
                                    </h1>
                                    <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground sm:text-base">
                                        <Mail className="size-4 shrink-0" />
                                        <span className="break-all">
                                            {user.email}
                                        </span>
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
                                    Back to Users
                                </Link>
                            </Button>

                            <Button asChild className="w-full sm:w-auto">
                                <Link href={edit(user)}>
                                    <Pencil />
                                    Edit User
                                </Link>
                            </Button>
                        </div>
                    </div>

                    <div className="grid divide-y divide-border/60 border-t border-border/60 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                        <div className="space-y-1 p-4 sm:p-5">
                            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                Account status
                            </p>
                            <StatusBadge
                                category="active"
                                value={user.status}
                            />
                        </div>
                        <div className="space-y-1 p-4 sm:p-5">
                            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                Linked workforce
                            </p>
                            {user.workforce ? (
                                <Link
                                    href={showWorkforce(user.workforce)}
                                    className="font-semibold hover:text-primary hover:underline"
                                >
                                    {user.workforce.full_name}
                                </Link>
                            ) : (
                                <p className="font-semibold text-muted-foreground">
                                    Not linked
                                </p>
                            )}
                        </div>
                        <div className="space-y-1 p-4 sm:p-5">
                            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                Assigned roles
                            </p>
                            <p className="font-semibold">
                                {user.roles.length === 0
                                    ? 'No roles assigned'
                                    : `${user.roles.length} ${user.roles.length === 1 ? 'role' : 'roles'}`}
                            </p>
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
                                        <CardTitle>Account details</CardTitle>
                                        <CardDescription>
                                            Identity and account status for this
                                            user.
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
                                    <div className="space-y-1">
                                        <dt className="text-sm text-muted-foreground">
                                            Full name
                                        </dt>
                                        <dd className="font-medium">
                                            {user.name}
                                        </dd>
                                    </div>
                                    <div className="space-y-2">
                                        <dt className="text-sm text-muted-foreground">
                                            Account status
                                        </dt>
                                        <dd>
                                            <StatusBadge
                                                category="active"
                                                value={user.status}
                                            />
                                        </dd>
                                    </div>
                                    <div className="space-y-1 sm:col-span-2">
                                        <dt className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Mail className="size-4" />
                                            Email address
                                        </dt>
                                        <dd className="font-medium break-all">
                                            {user.email}
                                        </dd>
                                    </div>
                                </dl>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="border-b border-border/60 pb-5">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-lg bg-muted p-2 text-muted-foreground">
                                        <ShieldCheck className="size-5" />
                                    </div>
                                    <div>
                                        <CardTitle>Access roles</CardTitle>
                                        <CardDescription>
                                            Roles determine this user&apos;s
                                            access across the workspace.
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6">
                                {user.roles.length === 0 ? (
                                    <div className="rounded-xl border border-dashed border-border/70 bg-muted/30 p-4 text-sm text-muted-foreground">
                                        No roles have been assigned to this
                                        user.
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {user.roles.map((role) => (
                                            <Badge
                                                key={role.id}
                                                variant="outline"
                                                className="px-3 py-1"
                                            >
                                                {role.name}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader className="border-b border-border/60 pb-5">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-lg bg-muted p-2 text-muted-foreground">
                                        <UsersRound className="size-5" />
                                    </div>
                                    <div>
                                        <CardTitle>Workforce link</CardTitle>
                                        <CardDescription>
                                            Associated workforce record, when
                                            available.
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6">
                                {user.workforce ? (
                                    <div className="space-y-2">
                                        <p className="text-sm text-muted-foreground">
                                            Linked workforce member
                                        </p>
                                        <Link
                                            href={showWorkforce(user.workforce)}
                                            className="text-lg font-semibold hover:text-primary hover:underline"
                                        >
                                            {user.workforce.full_name}
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="rounded-xl border border-dashed border-border/70 bg-muted/30 p-4 text-sm text-muted-foreground">
                                        This user is not linked to a workforce
                                        record.
                                    </div>
                                )}
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
                                            When this account was created and
                                            last updated.
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
                                        {formatDateTime(user.created_at)}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">
                                        Last updated
                                    </p>
                                    <p className="font-medium">
                                        {formatDateTime(user.updated_at)}
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
                                Permanently remove this user account.
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col gap-4 rounded-xl border border-red-100 bg-red-50/70 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-red-200/10 dark:bg-red-700/10">
                        <div className="space-y-0.5 text-red-600 dark:text-red-100">
                            <p className="font-medium">Delete this user</p>
                            <p className="text-sm">
                                {isSelf
                                    ? 'You cannot delete your own account.'
                                    : 'Once deleted, this user will no longer be able to sign in.'}
                            </p>
                        </div>

                        <Dialog>
                            <DialogTrigger asChild>
                                <Button
                                    variant="destructive"
                                    className="w-full sm:w-auto"
                                    disabled={isSelf}
                                >
                                    <Trash2 />
                                    Delete User
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogTitle>
                                    Delete &quot;{user.name}&quot;?
                                </DialogTitle>
                                <DialogDescription>
                                    This action cannot be undone. This user will
                                    no longer be able to sign in.
                                </DialogDescription>

                                <Form
                                    {...destroy.form(user)}
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
                                                    Delete User
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
