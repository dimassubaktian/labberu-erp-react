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
import { create, index as businessLinesIndex, show } from '@/routes/business-lines';
import type { Paginated } from '@/types';

type BusinessLine = {
    id: number;
    uuid: string;
    name: string;
    status: string;
};

type Props = {
    businessLines: Paginated<BusinessLine>;
};

export default function BusinessLinesIndex({ businessLines }: Props) {
    return (
        <>
            <Head title="Business Lines" />

            <div className="space-y-6 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <Heading
                        title="Business Lines"
                        description="Categorise projects by the type of business they belong to"
                    />

                    <Button asChild className="w-full sm:w-auto">
                        <Link href={create()}>
                            <Plus />
                            New Business Line
                        </Link>
                    </Button>
                </div>

                <div className="overflow-hidden rounded-xl border border-border/50">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {businessLines.data.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={2}
                                        className="h-24 text-center text-muted-foreground"
                                    >
                                        No business lines found.
                                    </TableCell>
                                </TableRow>
                            )}

                            {businessLines.data.map((businessLine) => (
                                <TableRow key={businessLine.id}>
                                    <TableCell className="font-medium">
                                        <Link href={show(businessLine)}>
                                            {businessLine.name}
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={
                                                businessLine.status === 'active'
                                                    ? 'secondary'
                                                    : 'outline'
                                            }
                                            className="capitalize"
                                        >
                                            {businessLine.status}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {businessLines.last_page > 1 && (
                    <nav className="flex flex-wrap items-center gap-1">
                        {businessLines.links.map((link, index) => (
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

BusinessLinesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Business Lines',
            href: businessLinesIndex(),
        },
    ],
};
