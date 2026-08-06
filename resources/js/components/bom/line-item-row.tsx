import { Trash2 } from 'lucide-react';
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
import {
    TableCell,
    TableRow,
} from '@/components/ui/table';
import { productLabel } from '@/lib/product-options';
import { formatNumber } from '@/lib/utils';
import type { LineItem } from './types';
import { calculateItemTotalCost, discountLabel } from './utils';

type Props = {
    namePrefix: string;
    errorPrefix: string;
    item: LineItem;
    errors: Partial<Record<string, string>>;
    isEditing: boolean;
    onEdit: () => void;
    onRemove: () => void;
};

export function BomLineItemRow({
    namePrefix,
    errorPrefix,
    item,
    errors,
    isEditing,
    onEdit,
    onRemove,
}: Props) {
    const totalCost = calculateItemTotalCost(item);
    const fieldNames = [
        'product_id',
        'description',
        'brand',
        'quantity',
        'unit',
        'unit_cost',
        'discount_type',
        'discount_value',
    ] as const;
    const rowError = fieldNames
        .map((field) => errors[`${errorPrefix}.${field}`])
        .find(Boolean);

    return (
        <TableRow
            data-state={isEditing ? 'selected' : undefined}
            className="cursor-pointer"
            onClick={onEdit}
        >
            <TableCell className="whitespace-normal">
                <input type="hidden" name={`${namePrefix}[product_id]`} value={item.product_id} />
                <input type="hidden" name={`${namePrefix}[description]`} value={item.description} />
                <input type="hidden" name={`${namePrefix}[brand]`} value={item.brand} />
                <input type="hidden" name={`${namePrefix}[quantity]`} value={item.quantity} />
                <input type="hidden" name={`${namePrefix}[unit]`} value={item.unit} />
                <input type="hidden" name={`${namePrefix}[unit_cost]`} value={item.unit_cost} />
                <input
                    type="hidden"
                    name={`${namePrefix}[discount_type]`}
                    value={item.discount_type === 'none' ? '' : item.discount_type}
                />
                <input type="hidden" name={`${namePrefix}[discount_value]`} value={item.discount_value} />
                <div className="font-medium">{productLabel(item.product)}</div>
                {rowError && (
                    <p className="text-xs text-destructive dark:text-destructive-foreground">
                        {rowError}
                    </p>
                )}
            </TableCell>
            <TableCell>
                {item.quantity}
                {item.unit ? ` ${item.unit}` : ''}
            </TableCell>
            <TableCell>{formatNumber(Number(item.unit_cost))}</TableCell>
            <TableCell>{discountLabel(item)}</TableCell>
            <TableCell className="text-right font-medium">{formatNumber(totalCost)}</TableCell>
            <TableCell>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Trash2 className="text-destructive dark:text-destructive-foreground" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent onClick={(e) => e.stopPropagation()}>
                        <DialogTitle>Remove line item?</DialogTitle>
                        <DialogDescription>
                            This will remove &quot;{productLabel(item.product)}&quot; from the bill of
                            materials. This cannot be undone.
                        </DialogDescription>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="outline">
                                    Cancel
                                </Button>
                            </DialogClose>
                            <DialogClose asChild>
                                <Button type="button" variant="destructive" onClick={onRemove}>
                                    Remove
                                </Button>
                            </DialogClose>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </TableCell>
        </TableRow>
    );
}
