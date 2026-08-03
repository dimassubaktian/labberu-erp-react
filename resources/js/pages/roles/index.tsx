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
import { create, index as rolesIndex, show } from '@/routes/roles';
import type { Paginated } from '@/types';

type Role = {
    id: number;
    name: string;
    permissions_count: number;
};

type Props = {
    roles: Paginated<Role>;
};

export default function RolesIndex({ roles }: Props) {
    return (
        <>
            <Head title="Roles" />

            <div className="space-y-6 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <Heading
                        title="Roles"
                        description="Manage the roles that grant permissions to users"
                    />

                    <Button asChild className="w-full sm:w-auto">
                        <Link href={create()}>
                            <Plus />
                            New Role
                        </Link>
                    </Button>
                </div>

                <div className="overflow-hidden rounded-xl border border-border/50">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Permissions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {roles.data.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={2}
                                        className="h-24 text-center text-muted-foreground"
                                    >
                                        No roles found.
                                    </TableCell>
                                </TableRow>
                            )}

                            {roles.data.map((role) => (
                                <TableRow key={role.id}>
                                    <TableCell className="font-medium">
                                        <Link href={show(role)}>
                                            {role.name}
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">
                                            {role.permissions_count}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {roles.last_page > 1 && (
                    <nav className="flex flex-wrap items-center gap-1">
                        {roles.links.map((link, index) => (
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

RolesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Roles',
            href: rolesIndex(),
        },
    ],
};
