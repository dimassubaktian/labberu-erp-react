import { Plus } from 'lucide-react';
import { AsyncCombobox } from '@/components/async-combobox';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { ProductOption } from '@/lib/product-options';
import { productLabel } from '@/lib/product-options';
import { formatNumber } from '@/lib/utils';
import { search as searchProducts } from '@/routes/products';
import type { LineItem } from './types';
import { calculateItemTotalCost, units } from './utils';

type Props = {
    idPrefix: string;
    draft: LineItem;
    errors: Partial<Record<string, string>>;
    errorPrefix?: string;
    isEditing: boolean;
    onDraftChange: (changes: Partial<LineItem>) => void;
    onSubmit: () => void;
    onCancel: () => void;
};

export function BomLineItemForm({
    idPrefix,
    draft,
    errors,
    errorPrefix,
    isEditing,
    onDraftChange,
    onSubmit,
    onCancel,
}: Props) {
    const totalCost = calculateItemTotalCost(draft);

    function fieldError(field: string): string | undefined {
        return errorPrefix ? errors[`${errorPrefix}.${field}`] : undefined;
    }

    function handleProductChange(productId: string, product?: ProductOption): void {
        onDraftChange({
            product_id: productId,
            product: product ?? null,
            description: product?.descriptions ?? '',
            brand: product?.brand ?? '',
            unit: product?.unit ?? '',
            unit_cost: product?.cost ?? '0',
        });
    }

    return (
        <div className="space-y-4 rounded-lg border border-border/50 bg-muted/40 p-4">
            <div className="grid gap-2">
                <Label htmlFor={`${idPrefix}-product`}>Product</Label>
                <AsyncCombobox<ProductOption>
                    id={`${idPrefix}-product`}
                    value={draft.product_id}
                    onValueChange={handleProductChange}
                    searchUrl={searchProducts().url}
                    getOptionId={(product) => String(product.id)}
                    getOptionLabel={productLabel}
                    initialOption={draft.product}
                    placeholder="Select a product"
                />
                <InputError message={fieldError('product_id')} />
            </div>

            <div className="grid gap-2">
                <Label htmlFor={`${idPrefix}-description`}>Description</Label>
                <Textarea
                    id={`${idPrefix}-description`}
                    value={draft.description}
                    onChange={(e) => onDraftChange({ description: e.target.value })}
                    placeholder="Optional"
                    rows={2}
                />
                <InputError message={fieldError('description')} />
            </div>

            <div className="grid gap-2 sm:grid-cols-4">
                <div className="grid gap-2">
                    <Label htmlFor={`${idPrefix}-brand`}>Brand</Label>
                    <Input
                        id={`${idPrefix}-brand`}
                        value={draft.brand}
                        onChange={(e) => onDraftChange({ brand: e.target.value })}
                    />
                    <InputError message={fieldError('brand')} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor={`${idPrefix}-quantity`}>Quantity</Label>
                    <Input
                        id={`${idPrefix}-quantity`}
                        type="number"
                        step="1"
                        min="0.01"
                        value={draft.quantity}
                        onChange={(e) => onDraftChange({ quantity: e.target.value })}
                    />
                    <InputError message={fieldError('quantity')} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor={`${idPrefix}-unit`}>Unit</Label>
                    <Select
                        value={draft.unit}
                        onValueChange={(value) => onDraftChange({ unit: value })}
                    >
                        <SelectTrigger id={`${idPrefix}-unit`} className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {units.map((option) => (
                                <SelectItem key={option} value={option}>
                                    {option}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <InputError message={fieldError('unit')} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor={`${idPrefix}-unit-cost`}>Unit cost</Label>
                    <Input
                        id={`${idPrefix}-unit-cost`}
                        type="number"
                        step="1"
                        min="0"
                        value={draft.unit_cost}
                        onChange={(e) => onDraftChange({ unit_cost: e.target.value })}
                    />
                    <InputError message={fieldError('unit_cost')} />
                </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
                <div className="grid gap-2">
                    <Label htmlFor={`${idPrefix}-discount-type`}>Discount type</Label>
                    <Select
                        value={draft.discount_type}
                        onValueChange={(value) => onDraftChange({ discount_type: value })}
                    >
                        <SelectTrigger id={`${idPrefix}-discount-type`} className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">No discount</SelectItem>
                            <SelectItem value="percentage">Percentage</SelectItem>
                            <SelectItem value="fixed">Fixed amount</SelectItem>
                        </SelectContent>
                    </Select>
                    <InputError message={fieldError('discount_type')} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor={`${idPrefix}-discount-value`}>Discount value</Label>
                    <Input
                        id={`${idPrefix}-discount-value`}
                        type="number"
                        step="1"
                        min="0"
                        value={draft.discount_value}
                        onChange={(e) => onDraftChange({ discount_value: e.target.value })}
                        disabled={draft.discount_type === 'none'}
                        placeholder="Optional"
                    />
                    <InputError message={fieldError('discount_value')} />
                </div>
            </div>

            <dl className="flex justify-between border-t border-border pt-4">
                <dt className="text-sm text-muted-foreground">Total cost</dt>
                <dd className="font-medium">{formatNumber(totalCost)}</dd>
            </dl>

            <div className="flex justify-end gap-2">
                {isEditing && (
                    <Button type="button" variant="outline" onClick={onCancel}>
                        Cancel edit
                    </Button>
                )}
                <Button
                    type="button"
                    disabled={!draft.product_id}
                    onClick={onSubmit}
                >
                    {!isEditing && <Plus />}
                    {isEditing ? 'Update line' : 'Add line'}
                </Button>
            </div>
        </div>
    );
}
