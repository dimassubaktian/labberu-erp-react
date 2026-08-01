import { Head, Link, setLayoutProps } from '@inertiajs/react';
import { ArrowLeft, Pencil } from 'lucide-react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatNumber } from '@/lib/utils';
import { index, show as showQuotation } from '@/routes/quotations';
import { edit as editBom, show as showBom } from '@/routes/quotations/bom';

type BomItem = {
    id: number;
    description: string | null;
    brand: string;
    quantity: string;
    unit: string;
    unit_cost: string;
    discount_type: string | null;
    discount_value: string | null;
    total_cost: string;
    product: {
        id: number;
        product_code: string;
        name: string;
    };
};

type BomSubgroup = {
    id: number;
    name: string;
    subtotal: string;
    items: BomItem[];
};

type BomGroup = {
    id: number;
    name: string;
    subtotal: string;
    items: BomItem[];
    subgroups: BomSubgroup[];
};

type Bom = {
    id: number;
    uuid: string;
    remarks: string | null;
    main_cost: string;
    overhead_percentage: string | null;
    overhead_cost: string;
    total_cost: string;
    selling_percentage: string | null;
    selling_cost: string;
    items: BomItem[];
    subgroups: BomSubgroup[];
    groups: BomGroup[];
};

type QuotationOption = {
    id: number;
    uuid: string;
    quotation_code: string;
    status: string;
    currency: { iso_code: string; symbol: string | null };
};

type Props = {
    quotation: QuotationOption;
    bom: Bom;
};

function MaterialsTable({ items }: { items: BomItem[] }) {
    return (
        <div className="overflow-hidden rounded-xl border border-border/50">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>No</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Brand</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead>Unit cost</TableHead>
                        <TableHead>Discount</TableHead>
                        <TableHead>Total cost</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {items.map((item, index) => (
                        <TableRow key={item.id}>
                            <TableCell className="text-muted-foreground">
                                {index + 1}
                            </TableCell>
                            <TableCell className="font-medium">
                                <div>
                                    {item.product.product_code} &mdash;{' '}
                                    {item.product.name}
                                </div>
                                {item.description && (
                                    <div className="text-sm font-normal whitespace-pre-line text-muted-foreground">
                                        {item.description}
                                    </div>
                                )}
                            </TableCell>
                            <TableCell>{item.brand}</TableCell>
                            <TableCell>{formatNumber(item.quantity)}</TableCell>
                            <TableCell>{item.unit}</TableCell>
                            <TableCell>
                                {formatNumber(item.unit_cost)}
                            </TableCell>
                            <TableCell>
                                {item.discount_type && item.discount_value ? (
                                    item.discount_type === 'percentage' ? (
                                        `${item.discount_value}%`
                                    ) : (
                                        formatNumber(item.discount_value)
                                    )
                                ) : (
                                    <span className="text-muted-foreground">
                                        &mdash;
                                    </span>
                                )}
                            </TableCell>
                            <TableCell>
                                {formatNumber(item.total_cost)}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

function SubgroupCard({ subgroup }: { subgroup: BomSubgroup }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{subgroup.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <MaterialsTable items={subgroup.items} />

                <dl className="flex justify-between border-t border-sidebar-border/70 pt-4 font-semibold dark:border-sidebar-border">
                    <dt>Phase subtotal</dt>
                    <dd>{formatNumber(subgroup.subtotal)}</dd>
                </dl>
            </CardContent>
        </Card>
    );
}

export default function BomsShow({ quotation, bom }: Props) {
    setLayoutProps({
        breadcrumbs: [
            { title: 'Quotations', href: index() },
            { title: quotation.quotation_code, href: showQuotation(quotation) },
            { title: 'Bill of Materials', href: showBom(quotation) },
        ],
    });

    const currencySymbol =
        quotation.currency.symbol ?? quotation.currency.iso_code;

    return (
        <>
            <Head title={`Bill of Materials — ${quotation.quotation_code}`} />

            <div className="mx-auto w-full max-w-4xl space-y-6 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <Heading
                        title="Bill of Materials"
                        description={`For quotation ${quotation.quotation_code}`}
                    />

                    <div className="flex flex-col gap-2 sm:flex-row">
                        <Button
                            variant="destructive"
                            asChild
                            className="w-full sm:w-auto"
                        >
                            <Link href={showQuotation(quotation)}>
                                <ArrowLeft />
                                Back to Quotation
                            </Link>
                        </Button>

                        {quotation.status === 'draft' && (
                            <Button asChild className="w-full sm:w-auto">
                                <Link href={editBom(quotation)}>
                                    <Pencil />
                                    Edit Bill of Materials
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>

                {bom.groups.map((group) => (
                    <Card key={group.id}>
                        <CardHeader>
                            <CardTitle>{group.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {group.items.length > 0 && (
                                <MaterialsTable items={group.items} />
                            )}

                            {group.subgroups.map((subgroup) => (
                                <SubgroupCard
                                    key={subgroup.id}
                                    subgroup={subgroup}
                                />
                            ))}

                            <dl className="flex justify-between border-t border-sidebar-border/70 pt-4 font-semibold dark:border-sidebar-border">
                                <dt>Group subtotal</dt>
                                <dd>{formatNumber(group.subtotal)}</dd>
                            </dl>
                        </CardContent>
                    </Card>
                ))}

                {bom.subgroups.map((subgroup) => (
                    <SubgroupCard key={subgroup.id} subgroup={subgroup} />
                ))}

                {bom.items.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Ungrouped Materials</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <MaterialsTable items={bom.items} />
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>Cost Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <dl className="space-y-2">
                            <div className="flex justify-between">
                                <dt className="text-muted-foreground">
                                    Main cost
                                </dt>
                                <dd className="font-medium">
                                    {currencySymbol}{' '}
                                    {formatNumber(bom.main_cost)}
                                </dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-muted-foreground">
                                    Overhead cost
                                    {bom.overhead_percentage &&
                                        ` (${bom.overhead_percentage}%)`}
                                </dt>
                                <dd className="font-medium">
                                    {currencySymbol}{' '}
                                    {formatNumber(bom.overhead_cost)}
                                </dd>
                            </div>
                            <div className="flex justify-between border-t border-sidebar-border/70 pt-2 font-semibold dark:border-sidebar-border">
                                <dt>Total cost</dt>
                                <dd>
                                    {currencySymbol}{' '}
                                    {formatNumber(bom.total_cost)}
                                </dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-muted-foreground">
                                    Selling cost
                                    {bom.selling_percentage &&
                                        ` (${bom.selling_percentage}%)`}
                                </dt>
                                <dd className="font-medium">
                                    {currencySymbol}{' '}
                                    {formatNumber(bom.selling_cost)}
                                </dd>
                            </div>
                        </dl>

                        {bom.remarks && (
                            <div className="mt-6 border-t border-sidebar-border/70 pt-4 dark:border-sidebar-border">
                                <p className="text-sm text-muted-foreground">
                                    Remarks
                                </p>
                                <p className="font-medium whitespace-pre-line">
                                    {bom.remarks}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
