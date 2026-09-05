import { Form, Head, Link, setLayoutProps } from '@inertiajs/react';
import {
    ArrowLeft,
    KeyRound,
    Pencil,
    ShieldCheck,
    Trash2,
    Users,
    X,
} from 'lucide-react';
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
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

function permissionLabel(permission: Permission, module: string): string {
    return permission.name
        .slice(module.length + 1)
        .replaceAll('.', ' ')
        .replaceAll('_', ' ');
}

export default function RolesShow({ role, users }: Props) {
    const permissionsByModule = role.permissions.reduce<
        Record<string, Permission[]>
    >((groups, permission) => {
        const module = permission.name.split('.')[0];
        groups[module] = [...(groups[module] ?? []), permission];

        return groups;
    }, {});

    const permissionModules = Object.entries(permissionsByModule);

    setLayoutProps({
        breadcrumbs: [
            { title: 'Roles', href: index() },
            { title: role.name, href: show(role) },
        ],
    });

    return (
        <>
            <Head title={role.name} />

            <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6">
                <section className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
                    <div className="flex flex-col gap-6 bg-linear-to-br from-primary/[0.08] via-card to-card p-5 sm:p-6 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex min-w-0 items-start gap-4">
                            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:size-14">
                                <ShieldCheck className="size-6 sm:size-7" />
                            </div>
                            <div className="min-w-0 space-y-2">
                                <p className="text-sm font-medium text-muted-foreground">
                                    Access role profile
                                </p>
                                <div>
                                    <h1 className="text-2xl font-semibold tracking-tight break-words sm:text-3xl">
                                        {role.name}
                                    </h1>
                                    <p className="mt-1 text-sm text-muted-foreground sm:text-base">
                                        Manage permissions and review assigned
                                        users for this role.
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

                    <div className="grid divide-y divide-border/60 border-t border-border/60 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                        <div className="space-y-1 p-4 sm:p-5">
                            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                Permissions
                            </p>
                            <p className="font-semibold">
                                {role.permissions.length}{' '}
                                {role.permissions.length === 1
                                    ? 'permission'
                                    : 'permissions'}
                            </p>
                        </div>
                        <div className="space-y-1 p-4 sm:p-5">
                            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                Access modules
                            </p>
                            <p className="font-semibold">
                                {permissionModules.length}{' '}
                                {permissionModules.length === 1
                                    ? 'module'
                                    : 'modules'}
                            </p>
                        </div>
                        <div className="space-y-1 p-4 sm:p-5">
                            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                Assigned users
                            </p>
                            <p className="font-semibold">
                                {users.length}{' '}
                                {users.length === 1 ? 'user' : 'users'}
                            </p>
                        </div>
                    </div>
                </section>

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)]">
                    <Card>
                        <CardHeader className="border-b border-border/60 pb-5">
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-muted p-2 text-muted-foreground">
                                    <ShieldCheck className="size-5" />
                                </div>
                                <div>
                                    <CardTitle>Role details</CardTitle>
                                    <CardDescription>
                                        The identity and access scope for this
                                        role.
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
                                <div className="space-y-1">
                                    <dt className="text-sm text-muted-foreground">
                                        Role name
                                    </dt>
                                    <dd className="font-medium">{role.name}</dd>
                                </div>
                                <div className="space-y-1">
                                    <dt className="text-sm text-muted-foreground">
                                        Access scope
                                    </dt>
                                    <dd className="font-medium">
                                        {permissionModules.length === 0
                                            ? 'No assigned access'
                                            : `${permissionModules.length} ${
                                                  permissionModules.length === 1
                                                      ? 'module'
                                                      : 'modules'
                                              }`}
                                    </dd>
                                </div>
                            </dl>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="border-b border-border/60 pb-5">
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-muted p-2 text-muted-foreground">
                                    <KeyRound className="size-5" />
                                </div>
                                <div>
                                    <CardTitle>Access summary</CardTitle>
                                    <CardDescription>
                                        A quick view of the access this role
                                        grants.
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-5 pt-6">
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">
                                    Assigned permissions
                                </p>
                                <p className="text-2xl font-semibold tracking-tight">
                                    {role.permissions.length}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">
                                    Users with this role
                                </p>
                                <p className="text-2xl font-semibold tracking-tight">
                                    {users.length}
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
                                    <KeyRound className="size-5" />
                                </div>
                                <div>
                                    <CardTitle>Permissions</CardTitle>
                                    <CardDescription>
                                        Permissions are grouped by application
                                        module.
                                    </CardDescription>
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {role.permissions.length} total
                            </p>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {role.permissions.length === 0 ? (
                            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border/60 bg-muted/20 px-4 py-12 text-center">
                                <KeyRound className="size-8 text-muted-foreground" />
                                <p className="text-sm font-medium">
                                    No permissions assigned
                                </p>
                                <p className="max-w-sm text-sm text-muted-foreground">
                                    Edit this role to grant access to the
                                    required application modules.
                                </p>
                            </div>
                        ) : (
                            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                {permissionModules.map(
                                    ([module, permissions]) => (
                                        <div
                                            key={module}
                                            className="rounded-xl border border-border/60 bg-muted/20 p-4"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <p className="font-medium">
                                                    {moduleLabel(module)}
                                                </p>
                                                <span className="text-sm text-muted-foreground">
                                                    {permissions.length}
                                                </span>
                                            </div>
                                            <div className="mt-3 flex flex-wrap gap-1.5">
                                                {permissions.map(
                                                    (permission) => (
                                                        <Badge
                                                            key={permission.id}
                                                            variant="outline"
                                                            className="capitalize"
                                                        >
                                                            {permissionLabel(
                                                                permission,
                                                                module,
                                                            )}
                                                        </Badge>
                                                    ),
                                                )}
                                            </div>
                                        </div>
                                    ),
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="border-b border-border/60 pb-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-muted p-2 text-muted-foreground">
                                    <Users className="size-5" />
                                </div>
                                <div>
                                    <CardTitle>Assigned users</CardTitle>
                                    <CardDescription>
                                        Users who currently inherit this role's
                                        access.
                                    </CardDescription>
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {users.length} total
                            </p>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {users.length === 0 ? (
                            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border/60 bg-muted/20 px-4 py-12 text-center">
                                <Users className="size-8 text-muted-foreground" />
                                <p className="text-sm font-medium">
                                    No users assigned
                                </p>
                                <p className="max-w-sm text-sm text-muted-foreground">
                                    Users assigned to this role will appear
                                    here.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-hidden rounded-xl border border-border/60">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>User</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {users.map((user) => (
                                            <TableRow key={user.id}>
                                                <TableCell className="font-medium">
                                                    <Link
                                                        href={showUser(user)}
                                                        className="hover:text-primary hover:underline"
                                                    >
                                                        {user.name}
                                                    </Link>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {user.email}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={
                                                            user.status ===
                                                            'active'
                                                                ? 'secondary'
                                                                : 'outline'
                                                        }
                                                        className="w-fit capitalize"
                                                    >
                                                        {user.status}
                                                    </Badge>
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
                                Permanently remove this role and its configured
                                access.
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col gap-4 rounded-xl border border-red-100 bg-red-50/70 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-red-200/10 dark:bg-red-700/10">
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
                                                    Delete Role
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
