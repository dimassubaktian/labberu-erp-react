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
import { cn, formatDate, formatNumber } from '@/lib/utils';
import { create, index as quotationsIndex, show } from '@/routes/quotations';
import type { Paginated } from '@/types';

type Quotation = {
    id: number;
    uuid: string;
    quotation_code: string;
    version_major: number;
    version_minor: number;
    status: string;
    valid_until: string | null;
    total: string;
    project: {
        id: number;
        name: string;
        customer: {
            id: number;
            name: string;
        };
    };
    currency: {
        id: number;
        iso_code: string;
        symbol: string | null;
    };
};

type Props = {
    quotations: Paginated<Quotation>;
};

export default function QuotationsIndex({ quotations }: Props) {
    return (
        <>
            <Head title="Quotations" />

            <div className="space-y-6 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <Heading
                        title="Quotations"
                        description="Manage quotations for your projects"
                    />

                    <Button asChild className="w-full sm:w-auto">
                        <Link href={create()}>
                            <Plus />
                            New Quotation
                        </Link>
                    </Button>
                </div>

                <div className="overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Quotation code</TableHead>
                                <TableHead>Project</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Version</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Valid until</TableHead>
                                <TableHead>Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {quotations.data.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={7}
                                        className="h-24 text-center text-muted-foreground"
                                    >
                                        No quotations found.
                                    </TableCell>
                                </TableRow>
                            )}

                            {quotations.data.map((quotation) => (
                                <TableRow key={quotation.id}>
                                    <TableCell className="font-medium">
                                        <Link href={show(quotation)}>
                                            {quotation.quotation_code}
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        {quotation.project.name}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {quotation.project.customer.name}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {quotation.version_major}.
                                        {quotation.version_minor}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="secondary"
                                            className="capitalize"
                                        >
                                            {quotation.status.replaceAll(
                                                '_',
                                                ' ',
                                            )}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {quotation.valid_until ? (
                                            formatDate(quotation.valid_until)
                                        ) : (
                                            <span className="text-muted-foreground">
                                                &mdash;
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {quotation.currency.symbol ??
                                            quotation.currency.iso_code}{' '}
                                        {formatNumber(quotation.total)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {quotations.last_page > 1 && (
                    <nav className="flex flex-wrap items-center gap-1">
                        {quotations.links.map((link, index) => (
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

QuotationsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Quotations',
            href: quotationsIndex(),
        },
    ],
};
