import { Form, Head, Link, setLayoutProps } from '@inertiajs/react';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
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
import { destroy, edit, index, show } from '@/routes/roles';
import { show as showUser } from '@/routes/users';

type Permission = {
    id: number;
    name: string;
};

type Role = {
    id: number;
    name: string;
    permissions: Permission[];
};

type User = {
    id: number;
    uuid: string;
    name: string;
    email: string;
    status: string;
};

type Props = {
    role: Role;
    users: User[];
};

function moduleLabel(module: string): string {
    return module
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

export default function RolesShow({ role, users }: Props) {
    const permissionsByModule = role.permissions.reduce<
        Record<string, Permission[]>
    >((groups, permission) => {
        const module = permission.name.split('.')[0];
        groups[module] = [...(groups[module] ?? []), permission];

        return groups;
    }, {});

    setLayoutProps({
        breadcrumbs: [
            { title: 'Roles', href: index() },
            { title: role.name, href: show(role) },
        ],
    });

    return (
        <>
            <Head title={role.name} />

            <div className="mx-auto w-full max-w-3xl space-y-6 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <Heading title={role.name} description="Role details" />

                    <div className="flex flex-col gap-2 sm:flex-row">
                        <Button
                            variant="destructive"
                            asChild
                            className="w-full sm:w-auto"
                        >
                            <Link href={index()}>
                                <ArrowLeft />
                                Back to Roles
                            </Link>
                        </Button>

                        <Button asChild className="w-full sm:w-auto">
                            <Link href={edit(role)}>
                                <Pencil />
                                Edit Role
                            </Link>
                        </Button>
                    </div>
                </div>

                <div>
                    <h2 className="mb-4 text-base font-semibold">
                        Permissions
                    </h2>
                    {role.permissions.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            This role has no permissions.
                        </p>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2">
                            {Object.entries(permissionsByModule).map(
                                ([module, permissions]) => (
                                    <div key={module}>
                                        <p className="mb-2 text-sm font-medium">
                                            {moduleLabel(module)}
                                        </p>
                                        <div className="flex flex-wrap gap-1">
                                            {permissions.map((permission) => (
                                                <Badge
                                                    key={permission.id}
                                                    variant="outline"
                                                    className="capitalize"
                                                >
                                                    {permission.name
                                                        .slice(
                                                            module.length + 1,
                                                        )
                                                        .replaceAll('.', ' ')
                                                        .replaceAll('_', ' ')}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                ),
                            )}
                        </div>
                    )}
                </div>

                <div>
                    <h2 className="mb-4 text-base font-semibold">
                        Users with this role
                    </h2>
                    {users.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            No users are assigned to this role.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {users.map((user) => (
                                <Link
                                    key={user.id}
                                    href={showUser(user)}
                                    className="block rounded-lg border border-sidebar-border/70 p-4 transition-colors hover:bg-accent dark:border-sidebar-border"
                                >
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <p className="font-medium">
                                                {user.name}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {user.email}
                                            </p>
                                        </div>

                                        <Badge
                                            variant={
                                                user.status === 'active'
                                                    ? 'secondary'
                                                    : 'outline'
                                            }
                                            className="w-fit capitalize"
                                        >
                                            {user.status}
                                        </Badge>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                <div className="space-y-4 rounded-lg border border-destructive/50 p-4">
                    <h2 className="text-base font-semibold text-destructive dark:text-destructive-foreground">
                        Danger Zone
                    </h2>
                    <div className="flex flex-col gap-4 rounded-lg border border-red-100 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-red-200/10 dark:bg-red-700/10">
                        <div className="space-y-0.5 text-red-600 dark:text-red-100">
                            <p className="font-medium">Delete this role</p>
                            <p className="text-sm">
                                Once deleted, this role cannot be restored.
                            </p>
                        </div>

                        <Dialog>
                            <DialogTrigger asChild>
                                <Button
                                    variant="destructive"
                                    className="w-full sm:w-auto"
                                >
                                    <Trash2 />
                                    Delete Role
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogTitle>
                                    Delete &quot;{role.name}&quot;?
                                </DialogTitle>
                                <DialogDescription>
                                    This action cannot be undone. This role will
                                    be permanently deleted.
                                </DialogDescription>

                                <Form
                                    {...destroy.form(role)}
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
                                                    Delete Role
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
