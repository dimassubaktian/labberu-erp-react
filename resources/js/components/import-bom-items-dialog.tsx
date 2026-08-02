import { useHttp } from '@inertiajs/react';
import { Import } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
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
import { index as bomItems } from '@/routes/quotations/bom-items';

type BomItemOption = {
    id: number;
    group_name: string | null;
    subgroup_name: string | null;
    product: {
        id: number;
        product_code: string;
        name: string;
        reference_number: string;
    };
    description: string | null;
    brand: string;
    quantity: string;
    unit: string;
    unit_cost: string;
    imported: number;
    remaining: number;
};

export type ImportedBomItem = {
    product_id: string;
    reference_number: string;
    description: string;
    quantity: string;
    unit: string;
    unit_price: string;
    bom_item_id: string;
    initialProduct: {
        id: number;
        product_code: string;
        name: string;
        reference_number: string;
        descriptions: string;
        unit: string;
        cost: string;
    };
};

type ImportBomItemsDialogProps = {
    quotationId: string;
    disabled?: boolean;
    onImport: (items: ImportedBomItem[]) => void;
};

function locationLabel(row: BomItemOption): string | null {
    if (row.group_name && row.subgroup_name) {
        return `${row.group_name} / ${row.subgroup_name}`;
    }

    return row.group_name ?? row.subgroup_name;
}

export function ImportBomItemsDialog({
    quotationId,
    disabled,
    onImport,
}: ImportBomItemsDialogProps) {
    const { submit } = useHttp();

    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState<BomItemOption[]>([]);
    const [selected, setSelected] = useState<Record<number, boolean>>({});
    const [quantities, setQuantities] = useState<Record<number, string>>({});

    async function handleOpenChange(nextOpen: boolean): Promise<void> {
        setOpen(nextOpen);

        if (!nextOpen) {
            return;
        }

        setLoading(true);
        setSelected({});

        try {
            const response = (await submit(bomItems(quotationId))) as {
                data: BomItemOption[];
            };
            setItems(response.data);
            setQuantities(
                Object.fromEntries(
                    response.data.map((row) => [row.id, String(row.remaining)]),
                ),
            );
        } catch {
            setItems([]);
            setQuantities({});
        } finally {
            setLoading(false);
        }
    }

    function toggleSelected(id: number): void {
        setSelected((current) => ({ ...current, [id]: !current[id] }));
    }

    function handleImport(): void {
        const toImport: ImportedBomItem[] = items
            .filter((row) => selected[row.id] && Number(quantities[row.id]) > 0)
            .map((row) => ({
                product_id: String(row.product.id),
                reference_number: row.product.reference_number ?? '',
                description: row.description ?? '',
                quantity: quantities[row.id],
                unit: row.unit,
                unit_price: row.unit_cost,
                bom_item_id: String(row.id),
                initialProduct: {
                    id: row.product.id,
                    product_code: row.product.product_code,
                    name: row.product.name,
                    reference_number: row.product.reference_number ?? '',
                    descriptions: row.description ?? '',
                    unit: row.unit,
                    cost: row.unit_cost,
                },
            }));

        onImport(toImport);
        setOpen(false);
    }

    const selectedCount = items.filter((row) => selected[row.id]).length;

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={disabled}
                >
                    <Import />
                    Import from BOM
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Import from Bill of Materials</DialogTitle>
                    <DialogDescription>
                        Select the materials to purchase from this vendor. Not
                        every material needs to come from the same PO — the
                        quantity defaults to what hasn&apos;t been imported into
                        another purchase order yet, but you can adjust it.
                    </DialogDescription>
                </DialogHeader>

                {loading && (
                    <div className="flex items-center justify-center py-10">
                        <Spinner />
                    </div>
                )}

                {!loading && items.length === 0 && (
                    <p className="py-10 text-center text-sm text-muted-foreground">
                        This quotation has no Bill of Materials, or it has no
                        line items yet.
                    </p>
                )}

                {!loading && items.length > 0 && (
                    <div className="max-h-[60vh] overflow-hidden rounded-xl border border-border/50">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead />
                                    <TableHead>Material</TableHead>
                                    <TableHead>BOM qty</TableHead>
                                    <TableHead>Remaining</TableHead>
                                    <TableHead>Import qty</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.map((row) => (
                                    <TableRow key={row.id}>
                                        <TableCell>
                                            <Checkbox
                                                checked={!!selected[row.id]}
                                                onCheckedChange={() =>
                                                    toggleSelected(row.id)
                                                }
                                            />
                                        </TableCell>
                                        <TableCell className="whitespace-normal">
                                            <div className="font-medium">
                                                {row.product.product_code}{' '}
                                                &mdash; {row.product.name}
                                            </div>
                                            {locationLabel(row) && (
                                                <div className="text-sm text-muted-foreground">
                                                    {locationLabel(row)}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {formatNumber(row.quantity)}{' '}
                                            {row.unit}
                                        </TableCell>
                                        <TableCell>
                                            {formatNumber(row.remaining)}{' '}
                                            {row.unit}
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                className="w-28"
                                                disabled={!selected[row.id]}
                                                value={
                                                    quantities[row.id] ?? '0'
                                                }
                                                onChange={(e) =>
                                                    setQuantities(
                                                        (current) => ({
                                                            ...current,
                                                            [row.id]:
                                                                e.target.value,
                                                        }),
                                                    )
                                                }
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setOpen(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleImport}
                        disabled={selectedCount === 0}
                    >
                        Import selected ({selectedCount})
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
