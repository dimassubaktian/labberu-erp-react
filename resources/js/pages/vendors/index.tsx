import { Head, Link } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import Heading from '@/components/heading';
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
import { create, index as vendorsIndex, show } from '@/routes/vendors';
import type { Paginated } from '@/types';

type Vendor = {
    id: number;
    uuid: string;
    vendor_code: string;
    name: string;
    attention: string | null;
    phone: string | null;
    city: string | null;
};

type Props = {
    vendors: Paginated<Vendor>;
};

export default function VendorsIndex({ vendors }: Props) {
    return (
        <>
            <Head title="Vendors" />

            <div className="space-y-6 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <Heading
                        title="Vendors"
                        description="Manage the vendors your organization works with"
                    />

                    <Button asChild className="w-full sm:w-auto">
                        <Link href={create()}>
                            <Plus />
                            New Vendor
                        </Link>
                    </Button>
                </div>

                <div className="overflow-hidden rounded-xl border border-border/50">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Vendor code</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Attention</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>City</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {vendors.data.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={5}
                                        className="h-24 text-center text-muted-foreground"
                                    >
                                        No vendors found.
                                    </TableCell>
                                </TableRow>
                            )}

                            {vendors.data.map((vendor) => (
                                <TableRow key={vendor.id}>
                                    <TableCell className="font-medium">
                                        <Link href={show(vendor)}>
                                            {vendor.vendor_code}
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        <Link href={show(vendor)}>
                                            {vendor.name}
                                        </Link>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {vendor.attention ?? (
                                            <span className="text-muted-foreground">
                                                &mdash;
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {vendor.phone ?? (
                                            <span className="text-muted-foreground">
                                                &mdash;
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {vendor.city ?? (
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

                {vendors.last_page > 1 && (
                    <nav className="flex flex-wrap items-center gap-1">
                        {vendors.links.map((link, index) => (
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

VendorsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Vendors',
            href: vendorsIndex(),
        },
    ],
};
