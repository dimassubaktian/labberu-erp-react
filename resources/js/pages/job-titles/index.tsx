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
import { create, index as jobTitlesIndex, show } from '@/routes/job-titles';
import type { Paginated } from '@/types';

type JobTitle = {
    id: number;
    uuid: string;
    name: string;
    status: string;
};

type Props = {
    jobTitles: Paginated<JobTitle>;
};

export default function JobTitlesIndex({ jobTitles }: Props) {
    return (
        <>
            <Head title="Job Titles" />

            <div className="space-y-6 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <Heading
                        title="Job Titles"
                        description="Manage the job titles used across your organization"
                    />

                    <Button asChild className="w-full sm:w-auto">
                        <Link href={create()}>
                            <Plus />
                            New Job Title
                        </Link>
                    </Button>
                </div>

                <div className="overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {jobTitles.data.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={2}
                                        className="h-24 text-center text-muted-foreground"
                                    >
                                        No job titles found.
                                    </TableCell>
                                </TableRow>
                            )}

                            {jobTitles.data.map((jobTitle) => (
                                <TableRow key={jobTitle.id}>
                                    <TableCell className="font-medium">
                                        <Link href={show(jobTitle)}>
                                            {jobTitle.name}
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={
                                                jobTitle.status === 'active'
                                                    ? 'secondary'
                                                    : 'outline'
                                            }
                                            className="capitalize"
                                        >
                                            {jobTitle.status}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {jobTitles.last_page > 1 && (
                    <nav className="flex flex-wrap items-center gap-1">
                        {jobTitles.links.map((link, index) => (
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

JobTitlesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Job Titles',
            href: jobTitlesIndex(),
        },
    ],
};
