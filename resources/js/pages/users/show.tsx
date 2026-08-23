import { Form, Head, Link, setLayoutProps, usePage } from '@inertiajs/react';
import { ArrowLeft, Pencil, Trash2, X } from 'lucide-react';
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

            <div className="mx-auto w-full max-w-5xl space-y-6 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <Heading title={user.name} description="User details" />

                    <div className="flex flex-col gap-2 sm:flex-row">
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

                <div>
                    <h2 className="mb-4 text-base font-semibold">Details</h2>
                    <dl className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Name
                            </dt>
                            <dd className="font-medium">{user.name}</dd>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Email
                            </dt>
                            <dd className="font-medium">{user.email}</dd>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Status
                            </dt>
                            <dd>
                                <Badge
                                    variant={
                                        user.status === 'active'
                                            ? 'secondary'
                                            : 'outline'
                                    }
                                    className="mt-1 capitalize"
                                >
                                    {user.status}
                                </Badge>
                            </dd>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Linked workforce
                            </dt>
                            <dd className="font-medium">
                                {user.workforce ? (
                                    <Link href={showWorkforce(user.workforce)}>
                                        {user.workforce.full_name}
                                    </Link>
                                ) : (
                                    '—'
                                )}
                            </dd>
                        </div>

                        <div className="sm:col-span-2">
                            <dt className="text-sm text-muted-foreground">
                                Roles
                            </dt>
                            <dd className="mt-1 flex flex-wrap gap-1">
                                {user.roles.length === 0 ? (
                                    <span className="text-sm font-medium">
                                        —
                                    </span>
                                ) : (
                                    user.roles.map((role) => (
                                        <Badge key={role.id} variant="outline">
                                            {role.name}
                                        </Badge>
                                    ))
                                )}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Created at
                            </dt>
                            <dd className="font-medium">
                                {formatDateTime(user.created_at)}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Last updated
                            </dt>
                            <dd className="font-medium">
                                {formatDateTime(user.updated_at)}
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
                </div>
            </div>
        </>
    );
}
