import { Head, Link } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { create, index as usersIndex, show } from '@/routes/users';
import type { Paginated } from '@/types';

type User = {
    id: number;
    uuid: string;
    name: string;
    email: string;
    status: string;
    workforce: { id: number; full_name: string } | null;
    roles: { id: number; name: string }[];
};

type Props = {
    users: Paginated<User>;
};

export default function UsersIndex({ users }: Props) {
    return (
        <>
            <Head title="Users" />

            <div className="space-y-6 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <Heading
                        title="Users"
                        description="Manage the accounts that can sign in to this application"
                    />

                    <Button asChild className="w-full sm:w-auto">
                        <Link href={create()}>
                            <Plus />
                            New User
                        </Link>
                    </Button>
                </div>

                <div className="overflow-hidden rounded-xl border border-border/50">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Workforce</TableHead>
                                <TableHead>Roles</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.data.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={5}
                                        className="h-24 text-center text-muted-foreground"
                                    >
                                        No users found.
                                    </TableCell>
                                </TableRow>
                            )}

                            {users.data.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">
                                        <Link href={show(user)}>
                                            {user.name}
                                        </Link>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {user.email}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {user.workforce?.full_name ?? '—'}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {user.roles.length === 0 ? (
                                                <span className="text-muted-foreground">
                                                    —
                                                </span>
                                            ) : (
                                                user.roles.map((role) => (
                                                    <Badge
                                                        key={role.id}
                                                        variant="outline"
                                                    >
                                                        {role.name}
                                                    </Badge>
                                                ))
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={
                                                user.status === 'active'
                                                    ? 'secondary'
                                                    : 'outline'
                                            }
                                            className="capitalize"
                                        >
                                            {user.status}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {users.last_page > 1 && (
                    <nav className="flex flex-wrap items-center gap-1">
                        {users.links.map((link, index) => (
                            <Link
                                key={index}
                                href={link.url ?? '#'}
                                preserveScroll
                                className={cn(
                                    'rounded-md px-3 py-1.5 text-sm',
                                    link.active
                                        ? 'bg-primary text-primary-foreground'
                                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                                    !link.url &&
                                        'pointer-events-none opacity-50',
                                )}
                                dangerouslySetInnerHTML={{
                                    __html: link.label,
                                }}
                            />
                        ))}
                    </nav>
                )}
            </div>
        </>
    );
}

UsersIndex.layout = {
    breadcrumbs: [
        {
            title: 'Users',
            href: usersIndex(),
        },
    ],
};
