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
import { create, index as workforcesIndex, show } from '@/routes/workforces';
import type { Paginated } from '@/types';

type Workforce = {
    id: number;
    uuid: string;
    employee_code: string;
    full_name: string;
    email: string;
    status: string;
    job_title: {
        id: number;
        name: string;
    };
};

type Props = {
    workforces: Paginated<Workforce>;
};

export default function WorkforcesIndex({ workforces }: Props) {
    return (
        <>
            <Head title="Workforces" />

            <div className="space-y-6 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <Heading
                        title="Workforces"
                        description="Manage the employees in your organization"
                    />

                    <Button asChild className="w-full sm:w-auto">
                        <Link href={create()}>
                            <Plus />
                            New Workforce
                        </Link>
                    </Button>
                </div>

                <div className="overflow-hidden rounded-xl border border-border/50">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Employee code</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Job title</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {workforces.data.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={5}
                                        className="h-24 text-center text-muted-foreground"
                                    >
                                        No workforces found.
                                    </TableCell>
                                </TableRow>
                            )}

                            {workforces.data.map((workforce) => (
                                <TableRow key={workforce.id}>
                                    <TableCell>
                                        <Link href={show(workforce)}>
                                            {workforce.employee_code}
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        <Link href={show(workforce)}>
                                            {workforce.full_name}
                                        </Link>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {workforce.job_title.name}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {workforce.email}
                                    </TableCell>
                                    <TableCell>
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
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {workforces.last_page > 1 && (
                    <nav className="flex flex-wrap items-center gap-1">
                        {workforces.links.map((link, index) => (
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

WorkforcesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Workforces',
            href: workforcesIndex(),
        },
    ],
};
