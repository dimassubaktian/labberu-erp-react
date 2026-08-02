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
import { cn, formatDate } from '@/lib/utils';
import { create, index as invoicesIndex, show } from '@/routes/invoices';
import type { Paginated } from '@/types';

type Invoice = {
    id: number;
    uuid: string;
    invoice_code: string;
    invoice_date: string;
    due_date: string;
    status: string;
    payment_status: string | null;
    quotation: {
        id: number;
        quotation_code: string;
        project: {
            id: number;
            customer: { id: number; name: string };
        };
    };
};

type Props = {
    invoices: Paginated<Invoice>;
};

export default function InvoicesIndex({ invoices }: Props) {
    return (
        <>
            <Head title="Invoices" />

            <div className="space-y-6 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <Heading
                        title="Invoices"
                        description="Bill customers against approved quotations"
                    />

                    <Button asChild className="w-full sm:w-auto">
                        <Link href={create()}>
                            <Plus />
                            New Invoice
                        </Link>
                    </Button>
                </div>

                <div className="overflow-hidden rounded-xl border border-border/50">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Invoice code</TableHead>
                                <TableHead>Quotation</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Invoice date</TableHead>
                                <TableHead>Due date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Payment</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {invoices.data.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={7}
                                        className="h-24 text-center text-muted-foreground"
                                    >
                                        No invoices found.
                                    </TableCell>
                                </TableRow>
                            )}

                            {invoices.data.map((invoice) => (
                                <TableRow key={invoice.id}>
                                    <TableCell className="font-medium">
                                        <Link href={show(invoice)}>
                                            {invoice.invoice_code}
                                        </Link>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {invoice.quotation.quotation_code}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {
                                            invoice.quotation.project.customer
                                                .name
                                        }
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {formatDate(invoice.invoice_date)}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {formatDate(invoice.due_date)}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="secondary"
                                            className="capitalize"
                                        >
                                            {invoice.status.replaceAll(
                                                '_',
                                                ' ',
                                            )}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {invoice.payment_status ? (
                                            <Badge
                                                variant="secondary"
                                                className="capitalize"
                                            >
                                                {invoice.payment_status.replaceAll(
                                                    '_',
                                                    ' ',
                                                )}
                                            </Badge>
                                        ) : (
                                            <span className="text-muted-foreground">
                                                &mdash;
                                            </span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {invoices.last_page > 1 && (
                    <nav className="flex flex-wrap items-center gap-1">
                        {invoices.links.map((link, index) => (
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

InvoicesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Invoices',
            href: invoicesIndex(),
        },
    ],
};
