import { Form, Head, Link, setLayoutProps } from '@inertiajs/react';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import Heading from '@/components/heading';
import { PrintBomDialog } from '@/components/print-bom-dialog';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
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
import {
    destroy as destroyBom,
    edit as editBom,
    show as showBom,
} from '@/routes/quotations/bom';

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

function SubgroupCard({
    subgroup,
    nested = false,
}: {
    subgroup: BomSubgroup;
    nested?: boolean;
}) {
    if (nested) {
        return (
            <div className="space-y-4">
                <h4 className="leading-none font-semibold">{subgroup.name}</h4>

                <MaterialsTable items={subgroup.items} />

                <dl className="flex justify-between border-t border-border pt-4 font-semibold">
                    <dt>Phase subtotal</dt>
                    <dd>{formatNumber(subgroup.subtotal)}</dd>
                </dl>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h4 className="leading-none font-semibold">{subgroup.name}</h4>

            <MaterialsTable items={subgroup.items} />

            <dl className="flex justify-between border-t border-border pt-4 font-semibold">
                <dt>Phase subtotal</dt>
                <dd>{formatNumber(subgroup.subtotal)}</dd>
            </dl>
        </div>
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

            <div className="mx-auto w-full max-w-5xl space-y-6 p-4">
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

                        <PrintBomDialog
                            quotation={quotation}
                            groups={bom.groups.map((group) => ({
                                id: group.id,
                                name: group.name,
                            }))}
                            subgroups={bom.subgroups.map((subgroup) => ({
                                id: subgroup.id,
                                name: subgroup.name,
                            }))}
                            hasUngroupedItems={bom.items.length > 0}
                        />

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
                    <div key={group.id} className="space-y-6">
                        <h2 className="text-base font-semibold">
                            {group.name}
                        </h2>

                        {group.items.length > 0 && (
                            <MaterialsTable items={group.items} />
                        )}

                        {group.subgroups.map((subgroup) => (
                            <SubgroupCard
                                key={subgroup.id}
                                subgroup={subgroup}
                                nested
                            />
                        ))}

                        <dl className="flex justify-between border-t border-border pt-4 font-semibold">
                            <dt>Group subtotal</dt>
                            <dd>{formatNumber(group.subtotal)}</dd>
                        </dl>
                    </div>
                ))}

                {bom.subgroups.map((subgroup) => (
                    <SubgroupCard key={subgroup.id} subgroup={subgroup} />
                ))}

                {bom.items.length > 0 && (
                    <div>
                        <h2 className="mb-4 text-base font-semibold">
                            Ungrouped Materials
                        </h2>
                        <MaterialsTable items={bom.items} />
                    </div>
                )}

                <div>
                    <h2 className="mb-4 text-base font-semibold">
                        Cost Summary
                    </h2>
                    <dl className="space-y-2">
                        <div className="flex justify-between">
                            <dt className="text-muted-foreground">Main cost</dt>
                            <dd className="font-medium">
                                {currencySymbol} {formatNumber(bom.main_cost)}
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
                        <div className="flex justify-between border-t border-border pt-2 font-semibold">
                            <dt>Total cost</dt>
                            <dd>
                                {currencySymbol} {formatNumber(bom.total_cost)}
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
                        <div className="mt-6 border-t border-border pt-4">
                            <p className="text-sm text-muted-foreground">
                                Remarks
                            </p>
                            <p className="font-medium whitespace-pre-line">
                                {bom.remarks}
                            </p>
                        </div>
                    )}
                </div>

                {quotation.status === 'draft' && (
                    <div className="space-y-4 rounded-lg border border-destructive/50 p-4">
                        <h2 className="text-base font-semibold text-destructive dark:text-destructive-foreground">
                            Danger Zone
                        </h2>
                        <div className="flex flex-col gap-4 rounded-lg border border-red-100 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-red-200/10 dark:bg-red-700/10">
                            <div className="space-y-0.5 text-red-600 dark:text-red-100">
                                <p className="font-medium">
                                    Delete this Bill of Materials
                                </p>
                                <p className="text-sm">
                                    Once deleted, this Bill of Materials cannot
                                    be restored. Any purchase order lines
                                    already imported from it will be kept, but
                                    will no longer be linked back to it.
                                </p>
                            </div>

                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button
                                        variant="destructive"
                                        className="w-full sm:w-auto"
                                    >
                                        <Trash2 />
                                        Delete Bill of Materials
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogTitle>
                                        Delete this Bill of Materials?
                                    </DialogTitle>
                                    <DialogDescription>
                                        This action cannot be undone. This Bill
                                        of Materials will be permanently
                                        deleted.
                                    </DialogDescription>

                                    <Form
                                        {...destroyBom.form(quotation)}
                                        options={{ preserveScroll: true }}
                                    >
                                        {({ processing }) => (
                                            <DialogFooter className="gap-2">
                                                <DialogClose asChild>
                                                    <Button variant="secondary">
                                                        Cancel
                                                    </Button>
                                                </DialogClose>

                                                <Button
                                                    variant="destructive"
                                                    disabled={processing}
                                                    asChild
                                                >
                                                    <button type="submit">
                                                        {processing && (
                                                            <Spinner />
                                                        )}
                                                        Delete Bill of Materials
                                                    </button>
                                                </Button>
                                            </DialogFooter>
                                        )}
                                    </Form>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
