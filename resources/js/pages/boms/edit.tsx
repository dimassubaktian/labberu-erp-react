import { Form, Head, Link, setLayoutProps } from '@inertiajs/react';
import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { AsyncCombobox } from '@/components/async-combobox';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import type { ProductOption } from '@/lib/product-options';
import { productLabel } from '@/lib/product-options';
import { formatNumber } from '@/lib/utils';
import { search as searchProducts } from '@/routes/products';
import { index, show as showQuotation } from '@/routes/quotations';
import { edit, show as showBom, update } from '@/routes/quotations/bom';

const units = [
    'Pcs',
    'Unit',
    'Set',
    'Box',
    'Roll',
    'Meter',
    'Kg',
    'Liter',
    'Pack',
    'Other',
];

type QuotationOption = {
    id: number;
    uuid: string;
    quotation_code: string;
};

type LineItem = {
    product_id: string;
    product: ProductOption | null;
    description: string;
    brand: string;
    quantity: string;
    unit: string;
    unit_cost: string;
    discount_type: string;
    discount_value: string;
};

type SubgroupState = {
    name: string;
    items: LineItem[];
    draft: LineItem;
    editingItemIndex: number | null;
};

type GroupState = {
    name: string;
    items: LineItem[];
    draft: LineItem;
    editingItemIndex: number | null;
    subgroups: SubgroupState[];
};

type BomItemProp = {
    id: number;
    product_id: number;
    description: string | null;
    brand: string;
    quantity: string;
    unit: string;
    unit_cost: string;
    discount_type: string | null;
    discount_value: string | null;
    product: ProductOption;
};

type BomSubgroupProp = {
    id: number;
    name: string;
    items: BomItemProp[];
};

type BomGroupProp = {
    id: number;
    name: string;
    items: BomItemProp[];
    subgroups: BomSubgroupProp[];
};

type Bom = {
    id: number;
    uuid: string;
    remarks: string | null;
    overhead_percentage: string | null;
    selling_percentage: string | null;
    items: BomItemProp[];
    subgroups: BomSubgroupProp[];
    groups: BomGroupProp[];
};

type Props = {
    quotation: QuotationOption;
    bom: Bom;
};

function toLineItem(item: BomItemProp): LineItem {
    return {
        product_id: String(item.product_id),
        product: item.product,
        description: item.description ?? '',
        brand: item.brand,
        quantity: item.quantity,
        unit: item.unit,
        unit_cost: item.unit_cost,
        discount_type: item.discount_type ?? 'none',
        discount_value: item.discount_value ?? '',
    };
}

function toSubgroupState(subgroup: BomSubgroupProp): SubgroupState {
    return {
        name: subgroup.name,
        items: subgroup.items.map(toLineItem),
        draft: emptyItem(),
        editingItemIndex: null,
    };
}

function emptyItem(): LineItem {
    return {
        product_id: '',
        product: null,
        description: '',
        brand: '',
        quantity: '1',
        unit: '',
        unit_cost: '0',
        discount_type: 'none',
        discount_value: '',
    };
}

function emptySubgroup(): SubgroupState {
    return {
        name: '',
        items: [],
        draft: emptyItem(),
        editingItemIndex: null,
    };
}

function emptyGroup(): GroupState {
    return {
        name: '',
        items: [],
        draft: emptyItem(),
        editingItemIndex: null,
        subgroups: [],
    };
}

function discountLabel(item: LineItem): string {
    if (item.discount_type === 'none' || item.discount_value === '') {
        return '—';
    }

    return item.discount_type === 'percentage'
        ? `${item.discount_value}%`
        : formatNumber(Number(item.discount_value));
}

function applyDiscount(
    lineTotal: number,
    discountType: string,
    discountValue: string,
): number {
    if (discountType === 'none' || discountValue === '') {
        return lineTotal;
    }

    const value = Number(discountValue);

    return discountType === 'percentage'
        ? (lineTotal * value) / 100
        : Math.max(0, lineTotal - Math.min(lineTotal, value));
}

function calculateItemTotalCost(item: LineItem): number {
    const quantity = Number(item.quantity) || 0;
    const unitCost = Number(item.unit_cost) || 0;

    const lineTotal = quantity * unitCost;

    return applyDiscount(lineTotal, item.discount_type, item.discount_value);
}

function calculateItemsSubtotal(items: LineItem[]): number {
    return items.reduce((sum, item) => sum + calculateItemTotalCost(item), 0);
}

type LineItemFormProps = {
    idPrefix: string;
    draft: LineItem;
    errors: Partial<Record<string, string>>;
    errorPrefix?: string;
    isEditing: boolean;
    onDraftChange: (changes: Partial<LineItem>) => void;
    onSubmit: () => void;
    onCancel: () => void;
};

function LineItemForm({
    idPrefix,
    draft,
    errors,
    errorPrefix,
    isEditing,
    onDraftChange,
    onSubmit,
    onCancel,
}: LineItemFormProps) {
    const totalCost = calculateItemTotalCost(draft);

    function fieldError(field: string): string | undefined {
        return errorPrefix ? errors[`${errorPrefix}.${field}`] : undefined;
    }

    function handleProductChange(
        productId: string,
        product?: ProductOption,
    ): void {
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
        <div className="space-y-4 rounded-lg border border-sidebar-border/70 bg-muted/40 p-4 dark:border-sidebar-border">
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
                    onChange={(e) =>
                        onDraftChange({ description: e.target.value })
                    }
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
                        onChange={(e) =>
                            onDraftChange({ brand: e.target.value })
                        }
                    />
                    <InputError message={fieldError('brand')} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor={`${idPrefix}-quantity`}>Quantity</Label>
                    <Input
                        id={`${idPrefix}-quantity`}
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={draft.quantity}
                        onChange={(e) =>
                            onDraftChange({ quantity: e.target.value })
                        }
                    />
                    <InputError message={fieldError('quantity')} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor={`${idPrefix}-unit`}>Unit</Label>
                    <Select
                        value={draft.unit}
                        onValueChange={(value) =>
                            onDraftChange({ unit: value })
                        }
                    >
                        <SelectTrigger
                            id={`${idPrefix}-unit`}
                            className="w-full"
                        >
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
                        step="0.01"
                        min="0"
                        value={draft.unit_cost}
                        onChange={(e) =>
                            onDraftChange({ unit_cost: e.target.value })
                        }
                    />
                    <InputError message={fieldError('unit_cost')} />
                </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
                <div className="grid gap-2">
                    <Label htmlFor={`${idPrefix}-discount-type`}>
                        Discount type
                    </Label>
                    <Select
                        value={draft.discount_type}
                        onValueChange={(value) =>
                            onDraftChange({ discount_type: value })
                        }
                    >
                        <SelectTrigger
                            id={`${idPrefix}-discount-type`}
                            className="w-full"
                        >
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">No discount</SelectItem>
                            <SelectItem value="percentage">
                                Percentage
                            </SelectItem>
                            <SelectItem value="fixed">Fixed amount</SelectItem>
                        </SelectContent>
                    </Select>
                    <InputError message={fieldError('discount_type')} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor={`${idPrefix}-discount-value`}>
                        Discount value
                    </Label>
                    <Input
                        id={`${idPrefix}-discount-value`}
                        type="number"
                        step="0.01"
                        min="0"
                        value={draft.discount_value}
                        onChange={(e) =>
                            onDraftChange({ discount_value: e.target.value })
                        }
                        disabled={draft.discount_type === 'none'}
                        placeholder="Optional"
                    />
                    <InputError message={fieldError('discount_value')} />
                </div>
            </div>

            <dl className="flex justify-between border-t border-sidebar-border/70 pt-4 dark:border-sidebar-border">
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

type LineItemRowProps = {
    namePrefix: string;
    errorPrefix: string;
    item: LineItem;
    errors: Partial<Record<string, string>>;
    isEditing: boolean;
    onEdit: () => void;
    onRemove: () => void;
};

function LineItemRow({
    namePrefix,
    errorPrefix,
    item,
    errors,
    isEditing,
    onEdit,
    onRemove,
}: LineItemRowProps) {
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
                <input
                    type="hidden"
                    name={`${namePrefix}[product_id]`}
                    value={item.product_id}
                />
                <input
                    type="hidden"
                    name={`${namePrefix}[description]`}
                    value={item.description}
                />
                <input
                    type="hidden"
                    name={`${namePrefix}[brand]`}
                    value={item.brand}
                />
                <input
                    type="hidden"
                    name={`${namePrefix}[quantity]`}
                    value={item.quantity}
                />
                <input
                    type="hidden"
                    name={`${namePrefix}[unit]`}
                    value={item.unit}
                />
                <input
                    type="hidden"
                    name={`${namePrefix}[unit_cost]`}
                    value={item.unit_cost}
                />
                <input
                    type="hidden"
                    name={`${namePrefix}[discount_type]`}
                    value={
                        item.discount_type === 'none' ? '' : item.discount_type
                    }
                />
                <input
                    type="hidden"
                    name={`${namePrefix}[discount_value]`}
                    value={item.discount_value}
                />
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
            <TableCell className="text-right font-medium">
                {formatNumber(totalCost)}
            </TableCell>
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
                            This will remove &quot;
                            {productLabel(item.product)}&quot; from the bill of
                            materials. This cannot be undone.
                        </DialogDescription>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="outline">
                                    Cancel
                                </Button>
                            </DialogClose>
                            <DialogClose asChild>
                                <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={onRemove}
                                >
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

type LineItemsSectionProps = {
    idPrefix: string;
    namePrefix: string;
    errorPrefix: string;
    items: LineItem[];
    draft: LineItem;
    editingItemIndex: number | null;
    errors: Partial<Record<string, string>>;
    emptyMessage: string;
    onDraftChange: (changes: Partial<LineItem>) => void;
    onSubmitItem: () => void;
    onCancelItemEdit: () => void;
    onEditItem: (itemIndex: number) => void;
    onRemoveItem: (itemIndex: number) => void;
};

function LineItemsSection({
    idPrefix,
    namePrefix,
    errorPrefix,
    items,
    draft,
    editingItemIndex,
    errors,
    emptyMessage,
    onDraftChange,
    onSubmitItem,
    onCancelItemEdit,
    onEditItem,
    onRemoveItem,
}: LineItemsSectionProps) {
    return (
        <div className="space-y-4">
            <InputError message={errors[errorPrefix]} />

            <LineItemForm
                idPrefix={idPrefix}
                draft={draft}
                errors={errors}
                errorPrefix={
                    editingItemIndex !== null
                        ? `${errorPrefix}.${editingItemIndex}`
                        : undefined
                }
                isEditing={editingItemIndex !== null}
                onDraftChange={onDraftChange}
                onSubmit={onSubmitItem}
                onCancel={onCancelItemEdit}
            />

            {items.length === 0 && (
                <p className="text-sm text-muted-foreground">{emptyMessage}</p>
            )}

            {items.length > 0 && (
                <div className="overflow-hidden rounded-lg border border-sidebar-border/70 dark:border-sidebar-border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Product</TableHead>
                                <TableHead className="w-24">Qty</TableHead>
                                <TableHead className="w-28">
                                    Unit cost
                                </TableHead>
                                <TableHead className="w-24">Discount</TableHead>
                                <TableHead className="w-28 text-right">
                                    Total cost
                                </TableHead>
                                <TableHead className="w-16" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((item, itemIndex) => (
                                <LineItemRow
                                    key={itemIndex}
                                    namePrefix={`${namePrefix}[${itemIndex}]`}
                                    errorPrefix={`${errorPrefix}.${itemIndex}`}
                                    item={item}
                                    errors={errors}
                                    isEditing={editingItemIndex === itemIndex}
                                    onEdit={() => onEditItem(itemIndex)}
                                    onRemove={() => onRemoveItem(itemIndex)}
                                />
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
}

type SubgroupFieldsProps = {
    namePrefix: string;
    errorPrefix: string;
    subgroup: SubgroupState;
    errors: Partial<Record<string, string>>;
    onNameChange: (name: string) => void;
    onDraftChange: (changes: Partial<LineItem>) => void;
    onSubmitItem: () => void;
    onCancelItemEdit: () => void;
    onEditItem: (itemIndex: number) => void;
    onRemoveItem: (itemIndex: number) => void;
    onRemove: () => void;
};

function SubgroupFields({
    namePrefix,
    errorPrefix,
    subgroup,
    errors,
    onNameChange,
    onDraftChange,
    onSubmitItem,
    onCancelItemEdit,
    onEditItem,
    onRemoveItem,
    onRemove,
}: SubgroupFieldsProps) {
    const subtotal = calculateItemsSubtotal(subgroup.items);
    const fieldId = namePrefix.replace(/[[\].]/g, '-');

    return (
        <div className="space-y-4 rounded-lg border border-border/50 p-4">
            <div className="flex items-start justify-between gap-2">
                <div className="grid flex-1 gap-2">
                    <Label htmlFor={`${fieldId}-name`}>Phase name</Label>
                    <Input
                        id={`${fieldId}-name`}
                        name={`${namePrefix}[name]`}
                        placeholder="e.g. Q1, Q2"
                        value={subgroup.name}
                        onChange={(e) => onNameChange(e.target.value)}
                    />
                    <InputError message={errors[`${errorPrefix}.name`]} />
                </div>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="mt-6"
                    onClick={onRemove}
                >
                    <Trash2 className="text-destructive dark:text-destructive-foreground" />
                </Button>
            </div>
            <div className="space-y-4">
                <Label>Materials</Label>

                <LineItemsSection
                    idPrefix={`${fieldId}-item`}
                    namePrefix={`${namePrefix}[items]`}
                    errorPrefix={`${errorPrefix}.items`}
                    items={subgroup.items}
                    draft={subgroup.draft}
                    editingItemIndex={subgroup.editingItemIndex}
                    errors={errors}
                    emptyMessage="No materials in this phase yet. Add one above."
                    onDraftChange={onDraftChange}
                    onSubmitItem={onSubmitItem}
                    onCancelItemEdit={onCancelItemEdit}
                    onEditItem={onEditItem}
                    onRemoveItem={onRemoveItem}
                />

                <dl className="flex justify-between border-t border-sidebar-border/70 pt-4 font-semibold dark:border-sidebar-border">
                    <dt>Phase subtotal</dt>
                    <dd>{formatNumber(subtotal)}</dd>
                </dl>
            </div>
        </div>
    );
}

export default function BomsEdit({ quotation, bom }: Props) {
    setLayoutProps({
        breadcrumbs: [
            { title: 'Quotations', href: index() },
            { title: quotation.quotation_code, href: showQuotation(quotation) },
            { title: 'Bill of Materials', href: showBom(quotation) },
            { title: 'Edit', href: edit(quotation) },
        ],
    });

    const [items, setItems] = useState<LineItem[]>(bom.items.map(toLineItem));
    const [itemDraft, setItemDraft] = useState<LineItem>(emptyItem());
    const [editingItemIndex, setEditingItemIndex] = useState<number | null>(
        null,
    );
    const [subgroups, setSubgroups] = useState<SubgroupState[]>(
        bom.subgroups.map(toSubgroupState),
    );
    const [groups, setGroups] = useState<GroupState[]>(
        bom.groups.map((group) => ({
            name: group.name,
            items: group.items.map(toLineItem),
            draft: emptyItem(),
            editingItemIndex: null,
            subgroups: group.subgroups.map(toSubgroupState),
        })),
    );
    const [overheadPercentage, setOverheadPercentage] = useState(
        bom.overhead_percentage ?? '',
    );
    const [sellingPercentage, setSellingPercentage] = useState(
        bom.selling_percentage ?? '',
    );

    function updateItemDraft(changes: Partial<LineItem>): void {
        setItemDraft((current) => ({ ...current, ...changes }));
    }

    function submitItemDraft(): void {
        if (editingItemIndex !== null) {
            setItems((current) =>
                current.map((item, i) =>
                    i === editingItemIndex ? itemDraft : item,
                ),
            );
        } else {
            setItems((current) => [...current, itemDraft]);
        }

        setItemDraft(emptyItem());
        setEditingItemIndex(null);
    }

    function editItem(index: number): void {
        setItemDraft(items[index]);
        setEditingItemIndex(index);
    }

    function cancelItemEdit(): void {
        setItemDraft(emptyItem());
        setEditingItemIndex(null);
    }

    function removeItem(index: number): void {
        setItems((current) => current.filter((_, i) => i !== index));

        if (editingItemIndex === index) {
            setItemDraft(emptyItem());
            setEditingItemIndex(null);
        } else if (editingItemIndex !== null && editingItemIndex > index) {
            setEditingItemIndex(editingItemIndex - 1);
        }
    }

    function addSubgroup(): void {
        setSubgroups((current) => [...current, emptySubgroup()]);
    }

    function removeSubgroup(subgroupIndex: number): void {
        setSubgroups((current) =>
            current.filter((_, i) => i !== subgroupIndex),
        );
    }

    function updateSubgroupName(subgroupIndex: number, name: string): void {
        setSubgroups((current) =>
            current.map((subgroup, i) =>
                i === subgroupIndex ? { ...subgroup, name } : subgroup,
            ),
        );
    }

    function updateSubgroupDraft(
        subgroupIndex: number,
        changes: Partial<LineItem>,
    ): void {
        setSubgroups((current) =>
            current.map((subgroup, i) =>
                i === subgroupIndex
                    ? {
                          ...subgroup,
                          draft: { ...subgroup.draft, ...changes },
                      }
                    : subgroup,
            ),
        );
    }

    function submitSubgroupItemDraft(subgroupIndex: number): void {
        setSubgroups((current) =>
            current.map((subgroup, i) => {
                if (i !== subgroupIndex) {
                    return subgroup;
                }

                const items =
                    subgroup.editingItemIndex !== null
                        ? subgroup.items.map((item, j) =>
                              j === subgroup.editingItemIndex
                                  ? subgroup.draft
                                  : item,
                          )
                        : [...subgroup.items, subgroup.draft];

                return {
                    ...subgroup,
                    items,
                    draft: emptyItem(),
                    editingItemIndex: null,
                };
            }),
        );
    }

    function editSubgroupItem(subgroupIndex: number, itemIndex: number): void {
        setSubgroups((current) =>
            current.map((subgroup, i) =>
                i === subgroupIndex
                    ? {
                          ...subgroup,
                          draft: subgroup.items[itemIndex],
                          editingItemIndex: itemIndex,
                      }
                    : subgroup,
            ),
        );
    }

    function cancelSubgroupItemEdit(subgroupIndex: number): void {
        setSubgroups((current) =>
            current.map((subgroup, i) =>
                i === subgroupIndex
                    ? {
                          ...subgroup,
                          draft: emptyItem(),
                          editingItemIndex: null,
                      }
                    : subgroup,
            ),
        );
    }

    function removeSubgroupItem(
        subgroupIndex: number,
        itemIndex: number,
    ): void {
        setSubgroups((current) =>
            current.map((subgroup, i) => {
                if (i !== subgroupIndex) {
                    return subgroup;
                }

                const items = subgroup.items.filter((_, j) => j !== itemIndex);

                if (subgroup.editingItemIndex === null) {
                    return { ...subgroup, items };
                }

                if (subgroup.editingItemIndex === itemIndex) {
                    return {
                        ...subgroup,
                        items,
                        draft: emptyItem(),
                        editingItemIndex: null,
                    };
                }

                const editingItemIndex =
                    subgroup.editingItemIndex > itemIndex
                        ? subgroup.editingItemIndex - 1
                        : subgroup.editingItemIndex;

                return { ...subgroup, items, editingItemIndex };
            }),
        );
    }

    function addGroup(): void {
        setGroups((current) => [...current, emptyGroup()]);
    }

    function removeGroup(groupIndex: number): void {
        setGroups((current) => current.filter((_, i) => i !== groupIndex));
    }

    function updateGroup(
        groupIndex: number,
        changes: Partial<GroupState>,
    ): void {
        setGroups((current) =>
            current.map((group, i) =>
                i === groupIndex ? { ...group, ...changes } : group,
            ),
        );
    }

    function updateGroupDraft(
        groupIndex: number,
        changes: Partial<LineItem>,
    ): void {
        setGroups((current) =>
            current.map((group, i) =>
                i === groupIndex
                    ? { ...group, draft: { ...group.draft, ...changes } }
                    : group,
            ),
        );
    }

    function submitGroupItemDraft(groupIndex: number): void {
        setGroups((current) =>
            current.map((group, i) => {
                if (i !== groupIndex) {
                    return group;
                }

                const items =
                    group.editingItemIndex !== null
                        ? group.items.map((item, j) =>
                              j === group.editingItemIndex ? group.draft : item,
                          )
                        : [...group.items, group.draft];

                return {
                    ...group,
                    items,
                    draft: emptyItem(),
                    editingItemIndex: null,
                };
            }),
        );
    }

    function editGroupItem(groupIndex: number, itemIndex: number): void {
        setGroups((current) =>
            current.map((group, i) =>
                i === groupIndex
                    ? {
                          ...group,
                          draft: group.items[itemIndex],
                          editingItemIndex: itemIndex,
                      }
                    : group,
            ),
        );
    }

    function cancelGroupItemEdit(groupIndex: number): void {
        setGroups((current) =>
            current.map((group, i) =>
                i === groupIndex
                    ? { ...group, draft: emptyItem(), editingItemIndex: null }
                    : group,
            ),
        );
    }

    function removeGroupItem(groupIndex: number, itemIndex: number): void {
        setGroups((current) =>
            current.map((group, i) => {
                if (i !== groupIndex) {
                    return group;
                }

                const items = group.items.filter((_, j) => j !== itemIndex);

                if (group.editingItemIndex === null) {
                    return { ...group, items };
                }

                if (group.editingItemIndex === itemIndex) {
                    return {
                        ...group,
                        items,
                        draft: emptyItem(),
                        editingItemIndex: null,
                    };
                }

                const editingItemIndex =
                    group.editingItemIndex > itemIndex
                        ? group.editingItemIndex - 1
                        : group.editingItemIndex;

                return { ...group, items, editingItemIndex };
            }),
        );
    }

    function addGroupSubgroup(groupIndex: number): void {
        setGroups((current) =>
            current.map((group, i) =>
                i === groupIndex
                    ? {
                          ...group,
                          subgroups: [...group.subgroups, emptySubgroup()],
                      }
                    : group,
            ),
        );
    }

    function removeGroupSubgroup(
        groupIndex: number,
        subgroupIndex: number,
    ): void {
        setGroups((current) =>
            current.map((group, i) =>
                i === groupIndex
                    ? {
                          ...group,
                          subgroups: group.subgroups.filter(
                              (_, j) => j !== subgroupIndex,
                          ),
                      }
                    : group,
            ),
        );
    }

    function updateGroupSubgroupName(
        groupIndex: number,
        subgroupIndex: number,
        name: string,
    ): void {
        setGroups((current) =>
            current.map((group, i) =>
                i === groupIndex
                    ? {
                          ...group,
                          subgroups: group.subgroups.map((subgroup, j) =>
                              j === subgroupIndex
                                  ? { ...subgroup, name }
                                  : subgroup,
                          ),
                      }
                    : group,
            ),
        );
    }

    function updateGroupSubgroupDraft(
        groupIndex: number,
        subgroupIndex: number,
        changes: Partial<LineItem>,
    ): void {
        setGroups((current) =>
            current.map((group, i) =>
                i === groupIndex
                    ? {
                          ...group,
                          subgroups: group.subgroups.map((subgroup, j) =>
                              j === subgroupIndex
                                  ? {
                                        ...subgroup,
                                        draft: {
                                            ...subgroup.draft,
                                            ...changes,
                                        },
                                    }
                                  : subgroup,
                          ),
                      }
                    : group,
            ),
        );
    }

    function submitGroupSubgroupItemDraft(
        groupIndex: number,
        subgroupIndex: number,
    ): void {
        setGroups((current) =>
            current.map((group, i) => {
                if (i !== groupIndex) {
                    return group;
                }

                return {
                    ...group,
                    subgroups: group.subgroups.map((subgroup, j) => {
                        if (j !== subgroupIndex) {
                            return subgroup;
                        }

                        const items =
                            subgroup.editingItemIndex !== null
                                ? subgroup.items.map((item, k) =>
                                      k === subgroup.editingItemIndex
                                          ? subgroup.draft
                                          : item,
                                  )
                                : [...subgroup.items, subgroup.draft];

                        return {
                            ...subgroup,
                            items,
                            draft: emptyItem(),
                            editingItemIndex: null,
                        };
                    }),
                };
            }),
        );
    }

    function editGroupSubgroupItem(
        groupIndex: number,
        subgroupIndex: number,
        itemIndex: number,
    ): void {
        setGroups((current) =>
            current.map((group, i) =>
                i === groupIndex
                    ? {
                          ...group,
                          subgroups: group.subgroups.map((subgroup, j) =>
                              j === subgroupIndex
                                  ? {
                                        ...subgroup,
                                        draft: subgroup.items[itemIndex],
                                        editingItemIndex: itemIndex,
                                    }
                                  : subgroup,
                          ),
                      }
                    : group,
            ),
        );
    }

    function cancelGroupSubgroupItemEdit(
        groupIndex: number,
        subgroupIndex: number,
    ): void {
        setGroups((current) =>
            current.map((group, i) =>
                i === groupIndex
                    ? {
                          ...group,
                          subgroups: group.subgroups.map((subgroup, j) =>
                              j === subgroupIndex
                                  ? {
                                        ...subgroup,
                                        draft: emptyItem(),
                                        editingItemIndex: null,
                                    }
                                  : subgroup,
                          ),
                      }
                    : group,
            ),
        );
    }

    function removeGroupSubgroupItem(
        groupIndex: number,
        subgroupIndex: number,
        itemIndex: number,
    ): void {
        setGroups((current) =>
            current.map((group, i) => {
                if (i !== groupIndex) {
                    return group;
                }

                return {
                    ...group,
                    subgroups: group.subgroups.map((subgroup, j) => {
                        if (j !== subgroupIndex) {
                            return subgroup;
                        }

                        const items = subgroup.items.filter(
                            (_, k) => k !== itemIndex,
                        );

                        if (subgroup.editingItemIndex === null) {
                            return { ...subgroup, items };
                        }

                        if (subgroup.editingItemIndex === itemIndex) {
                            return {
                                ...subgroup,
                                items,
                                draft: emptyItem(),
                                editingItemIndex: null,
                            };
                        }

                        const editingItemIndex =
                            subgroup.editingItemIndex > itemIndex
                                ? subgroup.editingItemIndex - 1
                                : subgroup.editingItemIndex;

                        return { ...subgroup, items, editingItemIndex };
                    }),
                };
            }),
        );
    }

    const ungroupedSubtotal = calculateItemsSubtotal(items);
    const topSubgroupSubtotals = subgroups.map((subgroup) =>
        calculateItemsSubtotal(subgroup.items),
    );
    const topSubgroupsTotal = topSubgroupSubtotals.reduce(
        (sum, subtotal) => sum + subtotal,
        0,
    );
    const groupTotals = groups.map((group) => {
        const directSubtotal = calculateItemsSubtotal(group.items);
        const subgroupSubtotals = group.subgroups.map((subgroup) =>
            calculateItemsSubtotal(subgroup.items),
        );
        const subgroupsTotal = subgroupSubtotals.reduce(
            (sum, subtotal) => sum + subtotal,
            0,
        );

        return {
            subgroupSubtotals,
            total: directSubtotal + subgroupsTotal,
        };
    });
    const groupsTotal = groupTotals.reduce(
        (sum, group) => sum + group.total,
        0,
    );
    const mainCost = ungroupedSubtotal + topSubgroupsTotal + groupsTotal;
    const overheadCost =
        overheadPercentage !== ''
            ? (mainCost * Number(overheadPercentage)) / 100
            : 0;
    const totalCost = mainCost + overheadCost;
    const sellingCost =
        sellingPercentage !== ''
            ? (totalCost * Number(sellingPercentage)) / 100
            : totalCost;

    return (
        <>
            <Head
                title={`Edit Bill of Materials — ${quotation.quotation_code}`}
            />

            <div className="mx-auto w-full max-w-4xl space-y-6 p-4">
                <Heading
                    title="Edit Bill of Materials"
                    description={`For quotation ${quotation.quotation_code}`}
                />

                <Form {...update.form(quotation)} className="space-y-6">
                    {({ processing, errors }) => (
                        <>
                            {groups.map((group, groupIndex) => {
                                const groupNamePrefix = `groups[${groupIndex}]`;
                                const groupErrorPrefix = `groups.${groupIndex}`;
                                const { total: groupSubtotal } =
                                    groupTotals[groupIndex];

                                return (
                                    <div
                                        key={groupIndex}
                                        className="space-y-4 rounded-lg border border-border/50 p-4"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="grid flex-1 gap-2">
                                                <Label
                                                    htmlFor={`group-${groupIndex}-name`}
                                                >
                                                    Group name
                                                </Label>
                                                <Input
                                                    id={`group-${groupIndex}-name`}
                                                    name={`${groupNamePrefix}[name]`}
                                                    placeholder="e.g. Control Panel, Sensor Assembly"
                                                    value={group.name}
                                                    onChange={(e) =>
                                                        updateGroup(
                                                            groupIndex,
                                                            {
                                                                name: e.target
                                                                    .value,
                                                            },
                                                        )
                                                    }
                                                />
                                                <InputError
                                                    message={
                                                        errors[
                                                            `${groupErrorPrefix}.name`
                                                        ]
                                                    }
                                                />
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="mt-6"
                                                onClick={() =>
                                                    removeGroup(groupIndex)
                                                }
                                            >
                                                <Trash2 className="text-destructive dark:text-destructive-foreground" />
                                            </Button>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="space-y-4">
                                                <Label>
                                                    Ungrouped materials
                                                </Label>

                                                <LineItemsSection
                                                    idPrefix={`group-${groupIndex}-item`}
                                                    namePrefix={`${groupNamePrefix}[items]`}
                                                    errorPrefix={`${groupErrorPrefix}.items`}
                                                    items={group.items}
                                                    draft={group.draft}
                                                    editingItemIndex={
                                                        group.editingItemIndex
                                                    }
                                                    errors={errors}
                                                    emptyMessage="No materials directly in this group. Add one above, or put materials inside a phase below."
                                                    onDraftChange={(changes) =>
                                                        updateGroupDraft(
                                                            groupIndex,
                                                            changes,
                                                        )
                                                    }
                                                    onSubmitItem={() =>
                                                        submitGroupItemDraft(
                                                            groupIndex,
                                                        )
                                                    }
                                                    onCancelItemEdit={() =>
                                                        cancelGroupItemEdit(
                                                            groupIndex,
                                                        )
                                                    }
                                                    onEditItem={(itemIndex) =>
                                                        editGroupItem(
                                                            groupIndex,
                                                            itemIndex,
                                                        )
                                                    }
                                                    onRemoveItem={(itemIndex) =>
                                                        removeGroupItem(
                                                            groupIndex,
                                                            itemIndex,
                                                        )
                                                    }
                                                />
                                            </div>

                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <Label>Phases</Label>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        onClick={() =>
                                                            addGroupSubgroup(
                                                                groupIndex,
                                                            )
                                                        }
                                                    >
                                                        <Plus />
                                                        Add phase
                                                    </Button>
                                                </div>

                                                {group.subgroups.map(
                                                    (
                                                        subgroup,
                                                        subgroupIndex,
                                                    ) => (
                                                        <SubgroupFields
                                                            key={subgroupIndex}
                                                            namePrefix={`${groupNamePrefix}[subgroups][${subgroupIndex}]`}
                                                            errorPrefix={`${groupErrorPrefix}.subgroups.${subgroupIndex}`}
                                                            subgroup={subgroup}
                                                            errors={errors}
                                                            onNameChange={(
                                                                name,
                                                            ) =>
                                                                updateGroupSubgroupName(
                                                                    groupIndex,
                                                                    subgroupIndex,
                                                                    name,
                                                                )
                                                            }
                                                            onDraftChange={(
                                                                changes,
                                                            ) =>
                                                                updateGroupSubgroupDraft(
                                                                    groupIndex,
                                                                    subgroupIndex,
                                                                    changes,
                                                                )
                                                            }
                                                            onSubmitItem={() =>
                                                                submitGroupSubgroupItemDraft(
                                                                    groupIndex,
                                                                    subgroupIndex,
                                                                )
                                                            }
                                                            onCancelItemEdit={() =>
                                                                cancelGroupSubgroupItemEdit(
                                                                    groupIndex,
                                                                    subgroupIndex,
                                                                )
                                                            }
                                                            onEditItem={(
                                                                itemIndex,
                                                            ) =>
                                                                editGroupSubgroupItem(
                                                                    groupIndex,
                                                                    subgroupIndex,
                                                                    itemIndex,
                                                                )
                                                            }
                                                            onRemoveItem={(
                                                                itemIndex,
                                                            ) =>
                                                                removeGroupSubgroupItem(
                                                                    groupIndex,
                                                                    subgroupIndex,
                                                                    itemIndex,
                                                                )
                                                            }
                                                            onRemove={() =>
                                                                removeGroupSubgroup(
                                                                    groupIndex,
                                                                    subgroupIndex,
                                                                )
                                                            }
                                                        />
                                                    ),
                                                )}
                                            </div>

                                            <dl className="flex justify-between border-t border-sidebar-border/70 pt-4 font-semibold dark:border-sidebar-border">
                                                <dt>Group subtotal</dt>
                                                <dd>
                                                    {formatNumber(
                                                        groupSubtotal,
                                                    )}
                                                </dd>
                                            </dl>
                                        </div>
                                    </div>
                                );
                            })}

                            <Button type="button" onClick={addGroup}>
                                <Plus />
                                Add group
                            </Button>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label className="text-base">
                                        Ungrouped Phases
                                    </Label>
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={addSubgroup}
                                    >
                                        <Plus />
                                        Add phase
                                    </Button>
                                </div>

                                {subgroups.map((subgroup, subgroupIndex) => (
                                    <SubgroupFields
                                        key={subgroupIndex}
                                        namePrefix={`subgroups[${subgroupIndex}]`}
                                        errorPrefix={`subgroups.${subgroupIndex}`}
                                        subgroup={subgroup}
                                        errors={errors}
                                        onNameChange={(name) =>
                                            updateSubgroupName(
                                                subgroupIndex,
                                                name,
                                            )
                                        }
                                        onDraftChange={(changes) =>
                                            updateSubgroupDraft(
                                                subgroupIndex,
                                                changes,
                                            )
                                        }
                                        onSubmitItem={() =>
                                            submitSubgroupItemDraft(
                                                subgroupIndex,
                                            )
                                        }
                                        onCancelItemEdit={() =>
                                            cancelSubgroupItemEdit(
                                                subgroupIndex,
                                            )
                                        }
                                        onEditItem={(itemIndex) =>
                                            editSubgroupItem(
                                                subgroupIndex,
                                                itemIndex,
                                            )
                                        }
                                        onRemoveItem={(itemIndex) =>
                                            removeSubgroupItem(
                                                subgroupIndex,
                                                itemIndex,
                                            )
                                        }
                                        onRemove={() =>
                                            removeSubgroup(subgroupIndex)
                                        }
                                    />
                                ))}
                            </div>

                            <div className="space-y-4">
                                <h2 className="text-base font-semibold">
                                    Ungrouped Materials
                                </h2>
                                <LineItemsSection
                                    idPrefix="ungrouped-item"
                                    namePrefix="items"
                                    errorPrefix="items"
                                    items={items}
                                    draft={itemDraft}
                                    editingItemIndex={editingItemIndex}
                                    errors={errors}
                                    emptyMessage="No ungrouped materials. Add one above, or put materials inside a group or phase."
                                    onDraftChange={updateItemDraft}
                                    onSubmitItem={submitItemDraft}
                                    onCancelItemEdit={cancelItemEdit}
                                    onEditItem={editItem}
                                    onRemoveItem={removeItem}
                                />
                            </div>

                            <div className="space-y-6">
                                <h2 className="text-base font-semibold">
                                    Cost Summary
                                </h2>
                                <div className="grid gap-2 sm:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="overhead_percentage">
                                            Overhead percentage
                                        </Label>
                                        <Input
                                            id="overhead_percentage"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            name="overhead_percentage"
                                            value={overheadPercentage}
                                            onChange={(e) =>
                                                setOverheadPercentage(
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Optional"
                                        />
                                        <InputError
                                            message={errors.overhead_percentage}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="selling_percentage">
                                            Selling percentage
                                        </Label>
                                        <Input
                                            id="selling_percentage"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            name="selling_percentage"
                                            value={sellingPercentage}
                                            onChange={(e) =>
                                                setSellingPercentage(
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Optional"
                                        />
                                        <InputError
                                            message={errors.selling_percentage}
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="remarks">Remarks</Label>
                                    <Textarea
                                        id="remarks"
                                        name="remarks"
                                        defaultValue={bom.remarks ?? ''}
                                        placeholder="Optional"
                                    />
                                    <InputError message={errors.remarks} />
                                </div>

                                <dl className="space-y-2 border-t border-sidebar-border/70 pt-4 dark:border-sidebar-border">
                                    <div className="flex justify-between">
                                        <dt className="text-muted-foreground">
                                            Main cost
                                        </dt>
                                        <dd className="font-medium">
                                            {formatNumber(mainCost)}
                                        </dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-muted-foreground">
                                            Overhead cost
                                        </dt>
                                        <dd className="font-medium">
                                            {formatNumber(overheadCost)}
                                        </dd>
                                    </div>
                                    <div className="flex justify-between border-t border-sidebar-border/70 pt-2 font-semibold dark:border-sidebar-border">
                                        <dt>Total cost</dt>
                                        <dd>{formatNumber(totalCost)}</dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-muted-foreground">
                                            Selling cost
                                        </dt>
                                        <dd className="font-medium">
                                            {formatNumber(sellingCost)}
                                        </dd>
                                    </div>
                                </dl>
                            </div>

                            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                <Button type="button" variant="outline" asChild>
                                    <Link href={showBom(quotation)}>
                                        Cancel
                                    </Link>
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing && <Spinner />}
                                    Save changes
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}
