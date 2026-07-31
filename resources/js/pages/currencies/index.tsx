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
import { create, index as currenciesIndex, show } from '@/routes/currencies';
import type { Paginated } from '@/types';

type Currency = {
    id: number;
    uuid: string;
    iso_code: string;
    name: string;
    symbol: string | null;
    status: string;
};

type Props = {
    currencies: Paginated<Currency>;
};

export default function CurrenciesIndex({ currencies }: Props) {
    return (
        <>
            <Head title="Currencies" />

            <div className="space-y-6 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <Heading
                        title="Currencies"
                        description="Manage the currencies used across your organization"
                    />

                    <Button asChild className="w-full sm:w-auto">
                        <Link href={create()}>
                            <Plus />
                            New Currency
                        </Link>
                    </Button>
                </div>

                <div className="overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ISO code</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Symbol</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {currencies.data.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={4}
                                        className="h-24 text-center text-muted-foreground"
                                    >
                                        No currencies found.
                                    </TableCell>
                                </TableRow>
                            )}

                            {currencies.data.map((currency) => (
                                <TableRow key={currency.id}>
                                    <TableCell className="font-medium">
                                        <Link href={show(currency)}>
                                            {currency.iso_code}
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        <Link href={show(currency)}>
                                            {currency.name}
                                        </Link>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {currency.symbol ?? (
                                            <span className="text-muted-foreground">
                                                &mdash;
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={
                                                currency.status === 'active'
                                                    ? 'secondary'
                                                    : 'outline'
                                            }
                                            className="capitalize"
                                        >
                                            {currency.status}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {currencies.last_page > 1 && (
                    <nav className="flex flex-wrap items-center gap-1">
                        {currencies.links.map((link, index) => (
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

CurrenciesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Currencies',
            href: currenciesIndex(),
        },
    ],
};
