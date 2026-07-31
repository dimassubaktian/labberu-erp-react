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
import { create, index as taxesIndex, show } from '@/routes/taxes';
import type { Paginated } from '@/types';

type Tax = {
    id: number;
    uuid: string;
    name: string;
    code: string;
    rate: string;
    type: string;
};

type Props = {
    taxes: Paginated<Tax>;
};

export default function TaxesIndex({ taxes }: Props) {
    return (
        <>
            <Head title="Taxes" />

            <div className="space-y-6 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <Heading
                        title="Taxes"
                        description="Manage the taxes used across your organization"
                    />

                    <Button asChild className="w-full sm:w-auto">
                        <Link href={create()}>
                            <Plus />
                            New Tax
                        </Link>
                    </Button>
                </div>

                <div className="overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Code</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Rate</TableHead>
                                <TableHead>Type</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {taxes.data.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={4}
                                        className="h-24 text-center text-muted-foreground"
                                    >
                                        No taxes found.
                                    </TableCell>
                                </TableRow>
                            )}

                            {taxes.data.map((tax) => (
                                <TableRow key={tax.id}>
                                    <TableCell className="font-medium">
                                        <Link href={show(tax)}>{tax.code}</Link>
                                    </TableCell>
                                    <TableCell>
                                        <Link href={show(tax)}>{tax.name}</Link>
                                    </TableCell>
                                    <TableCell>
                                        {tax.type === 'percentage'
                                            ? `${tax.rate}%`
                                            : tax.rate}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="secondary"
                                            className="capitalize"
                                        >
                                            {tax.type}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {taxes.last_page > 1 && (
                    <nav className="flex flex-wrap items-center gap-1">
                        {taxes.links.map((link, index) => (
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

TaxesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Taxes',
            href: taxesIndex(),
        },
    ],
};
