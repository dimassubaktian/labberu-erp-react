import { Form, Head, Link } from '@inertiajs/react';
import { ArrowRightLeft, Import, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { AsyncCombobox } from '@/components/async-combobox';
import { BomFormSection } from '@/components/bom/bom-form-section';
import type { ImportFromBom } from '@/components/bom/types';
import { Combobox } from '@/components/combobox';
import Heading from '@/components/heading';
import { ImportBomStructureDialog } from '@/components/import-bom-structure-dialog';
import InputError from '@/components/input-error';
import { ReorderButtons } from '@/components/reorder-buttons';
import { RichTextEditor } from '@/components/rich-text-editor';
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import type { ProductOption } from '@/lib/product-options';
import { productLabel } from '@/lib/product-options';
import { formatNumber, swapAdjacent } from '@/lib/utils';
import { search as searchProducts } from '@/routes/products';
import { search as searchProjects } from '@/routes/projects';
import { create, index, store } from '@/routes/quotations';

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

type ProjectOption = {
    id: number;
    name: string;
    project_code: string;
    customer: { id: number; name: string };
};

type CurrencyOption = {
    id: number;
    iso_code: string;
    name: string;
    symbol: string | null;
    base_currency: boolean;
};

type TaxOption = {
    id: number;
    name: string;
    rate: string;
    type: string;
};

type PaymentTermTemplateOption = {
    id: number;
    uuid: string;
    name: string;
    content: string;
};

type LineItem = {
    product_id: string;
    product: ProductOption | null;
    description: string;
    quantity: string;
    unit: string;
    unit_price: string;
    unit_cost: string;
    discount_type: string;
    discount_value: string;
};

type GroupState = {
    name: string;
    discount_type: string;
    discount_value: string;
    tax_id: string;
    items: LineItem[];
    draft: LineItem;
    editingItemIndex: number | null;
};

type LocationKey =
    { type: 'ungrouped' } | { type: 'group'; groupIndex: number };

type Props = {
    initialProject: ProjectOption | null;
    currencies: CurrencyOption[];
    taxes: TaxOption[];
    paymentTermTemplates: PaymentTermTemplateOption[];
};

function defaultValidUntil(): string {
    const date = new Date();
    date.setDate(date.getDate() + 7);

    return date.toISOString().slice(0, 10);
}

function emptyItem(): LineItem {
    return {
        product_id: '',
        product: null,
        description: '',
        quantity: '1',
        unit: '',
        unit_price: '0',
        unit_cost: '0',
        discount_type: 'none',
        discount_value: '',
    };
}

function emptyGroup(): GroupState {
    return {
        name: '',
        discount_type: 'none',
        discount_value: '',
        tax_id: 'none',
        items: [],
        draft: emptyItem(),
        editingItemIndex: null,
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

function calculateDiscount(
    base: number,
    discountType: string,
    discountValue: string,
): number {
    if (discountType === 'none' || discountValue === '') {
        return 0;
    }

    const value = Number(discountValue);

    return discountType === 'percentage'
        ? Math.min(base, (base * value) / 100)
        : Math.min(base, value);
}

function calculateItemTotals(item: LineItem) {
    const quantity = Number(item.quantity) || 0;
    const unitPrice = Number(item.unit_price) || 0;
    const unitCost = Number(item.unit_cost) || 0;

    const lineTotal = quantity * unitPrice;
    const totalPrice =
        lineTotal -
        calculateDiscount(lineTotal, item.discount_type, item.discount_value);
    const totalCost = quantity * unitCost;
    const margin = totalPrice - totalCost;
    const marginPercent = totalPrice > 0 ? (margin / totalPrice) * 100 : 0;

    return { totalPrice, totalCost, margin, marginPercent };
}

function calculateItemsSubtotal(items: LineItem[]): number {
    return items.reduce(
        (sum, item) => sum + calculateItemTotals(item).totalPrice,
        0,
    );
}

function encodeLocation(location: LocationKey): string {
    return location.type === 'ungrouped'
        ? 'ungrouped'
        : `group:${location.groupIndex}`;
}

function decodeLocation(value: string): LocationKey {
    const [type, groupIndex] = value.split(':');

    return type === 'group'
        ? { type: 'group', groupIndex: Number(groupIndex) }
        : { type: 'ungrouped' };
}

function locationsEqual(a: LocationKey, b: LocationKey): boolean {
    return encodeLocation(a) === encodeLocation(b);
}

function listDestinations(
    groups: GroupState[],
): { value: string; label: string }[] {
    return [
        { value: 'ungrouped', label: 'Ungrouped items' },
        ...groups.map((group, groupIndex) => ({
            value: `group:${groupIndex}`,
            label: group.name || `Group ${groupIndex + 1}`,
        })),
    ];
}

function calculateGroupTotals(group: GroupState, taxes: TaxOption[]) {
    const subtotal = calculateItemsSubtotal(group.items);
    const discountAmount = calculateDiscount(
        subtotal,
        group.discount_type,
        group.discount_value,
    );
    const discountedSubtotal = subtotal - discountAmount;
    const tax = taxes.find((t) => String(t.id) === group.tax_id);
    const taxAmount = tax
        ? tax.type === 'percentage'
            ? (discountedSubtotal * Number(tax.rate)) / 100
            : Number(tax.rate)
        : 0;

    return {
        subtotal,
        discountAmount,
        taxAmount,
        total: discountedSubtotal + taxAmount,
    };
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
    const totals = calculateItemTotals(draft);

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
            unit: product?.unit ?? '',
            unit_price: product?.price ?? '0',
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
                    <Label htmlFor={`${idPrefix}-quantity`}>Quantity</Label>
                    <Input
                        id={`${idPrefix}-quantity`}
                        type="number"
                        step="1"
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
                    <Label htmlFor={`${idPrefix}-unit-price`}>Unit price</Label>
                    <Input
                        id={`${idPrefix}-unit-price`}
                        type="number"
                        step="1"
                        min="0"
                        value={draft.unit_price}
                        onChange={(e) =>
                            onDraftChange({ unit_price: e.target.value })
                        }
                    />
                    <InputError message={fieldError('unit_price')} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor={`${idPrefix}-unit-cost`}>Unit cost</Label>
                    <Input
                        id={`${idPrefix}-unit-cost`}
                        type="number"
                        step="1"
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
                        Line discount type
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
                        Line discount value
                    </Label>
                    <Input
                        id={`${idPrefix}-discount-value`}
                        type="number"
                        step="1"
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

            <dl className="grid grid-cols-2 gap-4 border-t border-border pt-4 sm:grid-cols-4">
                <div>
                    <dt className="text-sm text-muted-foreground">
                        Total price
                    </dt>
                    <dd className="font-medium">
                        {formatNumber(totals.totalPrice)}
                    </dd>
                </div>
                <div>
                    <dt className="text-sm text-muted-foreground">
                        Total cost
                    </dt>
                    <dd className="font-medium">
                        {formatNumber(totals.totalCost)}
                    </dd>
                </div>
                <div>
                    <dt className="text-sm text-muted-foreground">Margin</dt>
                    <dd className="font-medium">
                        {formatNumber(totals.margin)}
                    </dd>
                </div>
                <div>
                    <dt className="text-sm text-muted-foreground">Margin %</dt>
                    <dd className="font-medium">
                        {totals.marginPercent.toFixed(2)}%
                    </dd>
                </div>
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
    destinations: { value: string; label: string }[];
    onEdit: () => void;
    onRemove: () => void;
    onMove: (destination: string) => void;
};

function LineItemRow({
    namePrefix,
    errorPrefix,
    item,
    errors,
    isEditing,
    destinations,
    onEdit,
    onRemove,
    onMove,
}: LineItemRowProps) {
    const totals = calculateItemTotals(item);
    const fieldNames = [
        'product_id',
        'description',
        'quantity',
        'unit',
        'unit_price',
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
                    name={`${namePrefix}[unit_price]`}
                    value={item.unit_price}
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
            <TableCell>{formatNumber(Number(item.unit_price))}</TableCell>
            <TableCell>{discountLabel(item)}</TableCell>
            <TableCell className="text-right font-medium">
                {formatNumber(totals.totalPrice)}
            </TableCell>
            <TableCell>
                <div className="flex items-center justify-end gap-1">
                    {destinations.length > 0 && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    aria-label="Move to..."
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <ArrowRightLeft />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <DropdownMenuLabel>Move to</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {destinations.map((destination) => (
                                    <DropdownMenuItem
                                        key={destination.value}
                                        onSelect={() =>
                                            onMove(destination.value)
                                        }
                                    >
                                        {destination.label}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
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
                                {productLabel(item.product)}&quot; from the
                                quotation. This cannot be undone.
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
                </div>
            </TableCell>
        </TableRow>
    );
}

export default function QuotationsCreate({
    initialProject,
    currencies,
    taxes,
    paymentTermTemplates,
}: Props) {
    const [activeTab, setActiveTab] = useState<'quotation' | 'bom'>(
        'quotation',
    );
    const [bomImportDialogOpen, setBomImportDialogOpen] = useState(false);
    const [bomImportKey, setBomImportKey] = useState(0);
    const [bomImportFrom, setBomImportFrom] = useState<ImportFromBom | null>(
        null,
    );

    const [projectId, setProjectId] = useState(
        initialProject ? String(initialProject.id) : '',
    );
    const [currencyId, setCurrencyId] = useState(() => {
        const baseCurrency = currencies.find((c) => c.base_currency);

        return baseCurrency ? String(baseCurrency.id) : '';
    });
    const [taxId, setTaxId] = useState('none');
    const [discountType, setDiscountType] = useState('none');
    const [discountValue, setDiscountValue] = useState('');
    const [items, setItems] = useState<LineItem[]>([]);
    const [itemDraft, setItemDraft] = useState<LineItem>(emptyItem());
    const [editingItemIndex, setEditingItemIndex] = useState<number | null>(
        null,
    );
    const [groups, setGroups] = useState<GroupState[]>([]);
    const [paymentTermTemplateId, setPaymentTermTemplateId] = useState('none');
    const [paymentTermsHtml, setPaymentTermsHtml] = useState('');

    function handlePaymentTermTemplateChange(value: string): void {
        setPaymentTermTemplateId(value);

        const template = paymentTermTemplates.find(
            (t) => String(t.id) === value,
        );

        if (template) {
            setPaymentTermsHtml(template.content);
        }
    }

    async function handleBomImport(uuid: string): Promise<void> {
        const response = await fetch(`/boms/${uuid}/import-data`);
        const data = (await response.json()) as ImportFromBom;
        setBomImportFrom(data);
        setBomImportKey((k) => k + 1);
    }

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

    function addGroup(): void {
        setGroups((current) => [...current, emptyGroup()]);
    }

    function removeGroup(groupIndex: number): void {
        setGroups((current) => current.filter((_, i) => i !== groupIndex));
    }

    function moveGroup(groupIndex: number, direction: 'up' | 'down'): void {
        setGroups((current) => swapAdjacent(current, groupIndex, direction));
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

    function addItemAt(location: LocationKey, item: LineItem): void {
        if (location.type === 'ungrouped') {
            setItems((current) => [...current, item]);

            return;
        }

        setGroups((current) =>
            current.map((group, i) =>
                i === location.groupIndex
                    ? { ...group, items: [...group.items, item] }
                    : group,
            ),
        );
    }

    function removeItemAt(location: LocationKey, itemIndex: number): void {
        if (location.type === 'ungrouped') {
            removeItem(itemIndex);

            return;
        }

        removeGroupItem(location.groupIndex, itemIndex);
    }

    function moveItem(
        from: LocationKey,
        itemIndex: number,
        item: LineItem,
        destinationValue: string,
    ): void {
        const to = decodeLocation(destinationValue);

        if (locationsEqual(from, to)) {
            return;
        }

        removeItemAt(from, itemIndex);
        addItemAt(to, item);
    }

    const destinations = listDestinations(groups);

    const ungroupedSubtotal = calculateItemsSubtotal(items);
    const groupTotals = groups.map((group) =>
        calculateGroupTotals(group, taxes),
    );
    const groupsSubtotal = groupTotals.reduce(
        (sum, group) => sum + group.total,
        0,
    );
    const subtotal = ungroupedSubtotal + groupsSubtotal;
    const quotationDiscountAmount = calculateDiscount(
        subtotal,
        discountType,
        discountValue,
    );
    const discountedSubtotal = subtotal - quotationDiscountAmount;
    const selectedTax = taxes.find((t) => String(t.id) === taxId);
    const taxAmount = selectedTax
        ? selectedTax.type === 'percentage'
            ? (discountedSubtotal * Number(selectedTax.rate)) / 100
            : Number(selectedTax.rate)
        : 0;
    const total = discountedSubtotal + taxAmount;
    const currencySymbol =
        currencies.find((c) => String(c.id) === currencyId)?.symbol ?? '';
    const taxOptions = [
        { id: 'none', label: 'No tax' },
        ...taxes.map((tax) => ({
            id: String(tax.id),
            label: `(${tax.type === 'percentage' ? `${tax.rate}%` : tax.rate}) ${tax.name}`,
        })),
    ];

    return (
        <>
            <Head title="New Quotation" />

            <div className="mx-auto w-full max-w-5xl space-y-6 p-4">
                <Heading
                    title="New Quotation"
                    description="Create a quotation for a project"
                />

                <Form noValidate {...store.form()} className="space-y-6">
                    {({ processing, errors }) => (
                        <>
                            <Tabs
                                value={activeTab}
                                onValueChange={(v) =>
                                    setActiveTab(v as 'quotation' | 'bom')
                                }
                            >
                                <TabsList>
                                    <TabsTrigger value="quotation">
                                        Quotation
                                    </TabsTrigger>
                                    <TabsTrigger value="bom">
                                        BOM (optional)
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent
                                    value="quotation"
                                    forceMount
                                    className={
                                        activeTab !== 'quotation'
                                            ? 'hidden'
                                            : 'space-y-6 pt-4'
                                    }
                                >
                                    <div className="space-y-6">
                                        <h2 className="text-base font-semibold">
                                            Details
                                        </h2>
                                        <div className="grid gap-2 sm:grid-cols-2">
                                            <div className="grid gap-2">
                                                <Label htmlFor="project_id">
                                                    Project
                                                </Label>
                                                <input
                                                    type="hidden"
                                                    name="project_id"
                                                    value={projectId}
                                                />
                                                <AsyncCombobox<ProjectOption>
                                                    id="project_id"
                                                    value={projectId}
                                                    onValueChange={setProjectId}
                                                    searchUrl={
                                                        searchProjects().url
                                                    }
                                                    getOptionId={(project) =>
                                                        String(project.id)
                                                    }
                                                    getOptionLabel={(project) =>
                                                        `${project.project_code} — ${project.name} (${project.customer.name})`
                                                    }
                                                    initialOption={
                                                        initialProject
                                                    }
                                                    placeholder="Select a project"
                                                />
                                                <InputError
                                                    message={errors.project_id}
                                                />
                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="currency_id">
                                                    Currency
                                                </Label>
                                                <input
                                                    type="hidden"
                                                    name="currency_id"
                                                    value={currencyId}
                                                />
                                                <Select
                                                    value={currencyId}
                                                    onValueChange={
                                                        setCurrencyId
                                                    }
                                                    disabled
                                                >
                                                    <SelectTrigger
                                                        id="currency_id"
                                                        className="w-full min-w-0"
                                                    >
                                                        <SelectValue
                                                            placeholder="Select a currency"
                                                            className="truncate"
                                                        />
                                                    </SelectTrigger>
                                                    <SelectContent className="max-w-(--radix-select-trigger-width)">
                                                        {currencies.map(
                                                            (currency) => (
                                                                <SelectItem
                                                                    key={
                                                                        currency.id
                                                                    }
                                                                    value={String(
                                                                        currency.id,
                                                                    )}
                                                                >
                                                                    <span className="block truncate">
                                                                        {
                                                                            currency.iso_code
                                                                        }{' '}
                                                                        &mdash;{' '}
                                                                        {
                                                                            currency.name
                                                                        }
                                                                    </span>
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                                <InputError
                                                    message={errors.currency_id}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid gap-2 sm:grid-cols-2">
                                            <div className="grid gap-2">
                                                <Label htmlFor="valid_until">
                                                    Valid until
                                                </Label>
                                                <Input
                                                    id="valid_until"
                                                    type="date"
                                                    name="valid_until"
                                                    defaultValue={defaultValidUntil()}
                                                    placeholder="Optional"
                                                />
                                                <InputError
                                                    message={errors.valid_until}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid gap-2 sm:grid-cols-2">
                                            <div className="grid gap-2">
                                                <Label htmlFor="po_number">
                                                    Customer PO number
                                                </Label>
                                                <Input
                                                    id="po_number"
                                                    name="po_number"
                                                    placeholder="Optional"
                                                />
                                                <InputError
                                                    message={errors.po_number}
                                                />
                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="po_date">
                                                    Date of PO
                                                </Label>
                                                <Input
                                                    id="po_date"
                                                    type="date"
                                                    name="po_date"
                                                    placeholder="Optional"
                                                />
                                                <InputError
                                                    message={errors.po_date}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="remarks">
                                                Remarks
                                            </Label>
                                            <Textarea
                                                id="remarks"
                                                name="remarks"
                                                placeholder="Optional"
                                            />
                                            <InputError
                                                message={errors.remarks}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h2 className="text-base font-semibold">
                                            Payment Terms
                                        </h2>

                                        <div className="grid gap-2">
                                            <Label htmlFor="payment_term_template_id">
                                                Template
                                            </Label>
                                            <input
                                                type="hidden"
                                                name="payment_term_template_id"
                                                value={
                                                    paymentTermTemplateId ===
                                                    'none'
                                                        ? ''
                                                        : paymentTermTemplateId
                                                }
                                            />
                                            <Select
                                                value={paymentTermTemplateId}
                                                onValueChange={
                                                    handlePaymentTermTemplateChange
                                                }
                                            >
                                                <SelectTrigger
                                                    id="payment_term_template_id"
                                                    className="w-full"
                                                >
                                                    <SelectValue placeholder="Select a template" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">
                                                        No template
                                                    </SelectItem>
                                                    {paymentTermTemplates.map(
                                                        (template) => (
                                                            <SelectItem
                                                                key={
                                                                    template.id
                                                                }
                                                                value={String(
                                                                    template.id,
                                                                )}
                                                            >
                                                                {template.name}
                                                            </SelectItem>
                                                        ),
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            <InputError
                                                message={
                                                    errors.payment_term_template_id
                                                }
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="payment_terms_html">
                                                Terms &amp; conditions
                                            </Label>
                                            <RichTextEditor
                                                id="payment_terms_html"
                                                name="payment_terms_html"
                                                value={paymentTermsHtml}
                                                onChange={setPaymentTermsHtml}
                                                error={
                                                    errors.payment_terms_html
                                                }
                                            />
                                            <InputError
                                                message={
                                                    errors.payment_terms_html
                                                }
                                            />
                                        </div>
                                    </div>

                                    {groups.map((group, groupIndex) => {
                                        const totals = groupTotals[groupIndex];
                                        const groupNamePrefix = `groups[${groupIndex}]`;
                                        const groupErrorPrefix = `groups.${groupIndex}`;

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
                                                            placeholder="e.g. Labor, Materials"
                                                            value={group.name}
                                                            onChange={(e) =>
                                                                updateGroup(
                                                                    groupIndex,
                                                                    {
                                                                        name: e
                                                                            .target
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
                                                    <div className="mt-6 flex items-center gap-1">
                                                        <ReorderButtons
                                                            label="group"
                                                            canMoveUp={
                                                                groupIndex > 0
                                                            }
                                                            canMoveDown={
                                                                groupIndex <
                                                                groups.length -
                                                                    1
                                                            }
                                                            onMoveUp={() =>
                                                                moveGroup(
                                                                    groupIndex,
                                                                    'up',
                                                                )
                                                            }
                                                            onMoveDown={() =>
                                                                moveGroup(
                                                                    groupIndex,
                                                                    'down',
                                                                )
                                                            }
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() =>
                                                                removeGroup(
                                                                    groupIndex,
                                                                )
                                                            }
                                                        >
                                                            <Trash2 className="text-destructive dark:text-destructive-foreground" />
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div className="grid gap-2 sm:grid-cols-3">
                                                    <div className="grid gap-2">
                                                        <Label
                                                            htmlFor={`group-${groupIndex}-discount-type`}
                                                        >
                                                            Discount type
                                                        </Label>
                                                        <input
                                                            type="hidden"
                                                            name={`${groupNamePrefix}[discount_type]`}
                                                            value={
                                                                group.discount_type ===
                                                                'none'
                                                                    ? ''
                                                                    : group.discount_type
                                                            }
                                                        />
                                                        <Select
                                                            value={
                                                                group.discount_type
                                                            }
                                                            onValueChange={(
                                                                value,
                                                            ) =>
                                                                updateGroup(
                                                                    groupIndex,
                                                                    {
                                                                        discount_type:
                                                                            value,
                                                                    },
                                                                )
                                                            }
                                                        >
                                                            <SelectTrigger
                                                                id={`group-${groupIndex}-discount-type`}
                                                                className="w-full"
                                                            >
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="none">
                                                                    No discount
                                                                </SelectItem>
                                                                <SelectItem value="percentage">
                                                                    Percentage
                                                                </SelectItem>
                                                                <SelectItem value="fixed">
                                                                    Fixed amount
                                                                </SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <InputError
                                                            message={
                                                                errors[
                                                                    `${groupErrorPrefix}.discount_type`
                                                                ]
                                                            }
                                                        />
                                                    </div>

                                                    <div className="grid gap-2">
                                                        <Label
                                                            htmlFor={`group-${groupIndex}-discount-value`}
                                                        >
                                                            Discount value
                                                        </Label>
                                                        <Input
                                                            id={`group-${groupIndex}-discount-value`}
                                                            type="number"
                                                            step="1"
                                                            min="0"
                                                            name={`${groupNamePrefix}[discount_value]`}
                                                            value={
                                                                group.discount_value
                                                            }
                                                            onChange={(e) =>
                                                                updateGroup(
                                                                    groupIndex,
                                                                    {
                                                                        discount_value:
                                                                            e
                                                                                .target
                                                                                .value,
                                                                    },
                                                                )
                                                            }
                                                            disabled={
                                                                group.discount_type ===
                                                                'none'
                                                            }
                                                            placeholder="Optional"
                                                        />
                                                        <InputError
                                                            message={
                                                                errors[
                                                                    `${groupErrorPrefix}.discount_value`
                                                                ]
                                                            }
                                                        />
                                                    </div>

                                                    <div className="grid gap-2">
                                                        <Label
                                                            htmlFor={`group-${groupIndex}-tax`}
                                                        >
                                                            Tax
                                                        </Label>
                                                        <input
                                                            type="hidden"
                                                            name={`${groupNamePrefix}[tax_id]`}
                                                            value={
                                                                group.tax_id ===
                                                                'none'
                                                                    ? ''
                                                                    : group.tax_id
                                                            }
                                                        />
                                                        <Select
                                                            value={group.tax_id}
                                                            onValueChange={(
                                                                value,
                                                            ) =>
                                                                updateGroup(
                                                                    groupIndex,
                                                                    {
                                                                        tax_id: value,
                                                                    },
                                                                )
                                                            }
                                                        >
                                                            <SelectTrigger
                                                                id={`group-${groupIndex}-tax`}
                                                                className="w-full min-w-0"
                                                            >
                                                                <SelectValue className="truncate" />
                                                            </SelectTrigger>
                                                            <SelectContent className="max-w-(--radix-select-trigger-width)">
                                                                <SelectItem value="none">
                                                                    No tax
                                                                </SelectItem>
                                                                {taxes.map(
                                                                    (tax) => (
                                                                        <SelectItem
                                                                            key={
                                                                                tax.id
                                                                            }
                                                                            value={String(
                                                                                tax.id,
                                                                            )}
                                                                        >
                                                                            <span className="block truncate">
                                                                                (
                                                                                {tax.type ===
                                                                                'percentage'
                                                                                    ? `${tax.rate}%`
                                                                                    : tax.rate}

                                                                                ){' '}
                                                                                {
                                                                                    tax.name
                                                                                }
                                                                            </span>
                                                                        </SelectItem>
                                                                    ),
                                                                )}
                                                            </SelectContent>
                                                        </Select>
                                                        <InputError
                                                            message={
                                                                errors[
                                                                    `${groupErrorPrefix}.tax_id`
                                                                ]
                                                            }
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    <Label>Group items</Label>
                                                    <InputError
                                                        message={
                                                            errors[
                                                                `${groupErrorPrefix}.items`
                                                            ]
                                                        }
                                                    />

                                                    <LineItemForm
                                                        idPrefix={`group-${groupIndex}-item`}
                                                        draft={group.draft}
                                                        errors={errors}
                                                        errorPrefix={
                                                            group.editingItemIndex !==
                                                            null
                                                                ? `${groupErrorPrefix}.items.${group.editingItemIndex}`
                                                                : undefined
                                                        }
                                                        isEditing={
                                                            group.editingItemIndex !==
                                                            null
                                                        }
                                                        onDraftChange={(
                                                            changes,
                                                        ) =>
                                                            updateGroupDraft(
                                                                groupIndex,
                                                                changes,
                                                            )
                                                        }
                                                        onSubmit={() =>
                                                            submitGroupItemDraft(
                                                                groupIndex,
                                                            )
                                                        }
                                                        onCancel={() =>
                                                            cancelGroupItemEdit(
                                                                groupIndex,
                                                            )
                                                        }
                                                    />

                                                    {group.items.length > 0 && (
                                                        <div className="overflow-hidden rounded-lg border border-border/50">
                                                            <Table>
                                                                <TableHeader>
                                                                    <TableRow>
                                                                        <TableHead>
                                                                            Product
                                                                        </TableHead>
                                                                        <TableHead className="w-24">
                                                                            Qty
                                                                        </TableHead>
                                                                        <TableHead className="w-28">
                                                                            Unit
                                                                            price
                                                                        </TableHead>
                                                                        <TableHead className="w-24">
                                                                            Discount
                                                                        </TableHead>
                                                                        <TableHead className="w-28 text-right">
                                                                            Total
                                                                            price
                                                                        </TableHead>
                                                                        <TableHead className="w-24" />
                                                                    </TableRow>
                                                                </TableHeader>
                                                                <TableBody>
                                                                    {group.items.map(
                                                                        (
                                                                            item,
                                                                            itemIndex,
                                                                        ) => (
                                                                            <LineItemRow
                                                                                key={
                                                                                    itemIndex
                                                                                }
                                                                                namePrefix={`${groupNamePrefix}[items][${itemIndex}]`}
                                                                                errorPrefix={`${groupErrorPrefix}.items.${itemIndex}`}
                                                                                item={
                                                                                    item
                                                                                }
                                                                                errors={
                                                                                    errors
                                                                                }
                                                                                isEditing={
                                                                                    group.editingItemIndex ===
                                                                                    itemIndex
                                                                                }
                                                                                destinations={destinations.filter(
                                                                                    (
                                                                                        destination,
                                                                                    ) =>
                                                                                        destination.value !==
                                                                                        `group:${groupIndex}`,
                                                                                )}
                                                                                onEdit={() =>
                                                                                    editGroupItem(
                                                                                        groupIndex,
                                                                                        itemIndex,
                                                                                    )
                                                                                }
                                                                                onRemove={() =>
                                                                                    removeGroupItem(
                                                                                        groupIndex,
                                                                                        itemIndex,
                                                                                    )
                                                                                }
                                                                                onMove={(
                                                                                    destination,
                                                                                ) =>
                                                                                    moveItem(
                                                                                        {
                                                                                            type: 'group',
                                                                                            groupIndex,
                                                                                        },
                                                                                        itemIndex,
                                                                                        item,
                                                                                        destination,
                                                                                    )
                                                                                }
                                                                            />
                                                                        ),
                                                                    )}
                                                                </TableBody>
                                                            </Table>
                                                        </div>
                                                    )}
                                                </div>

                                                <dl className="space-y-2 border-t border-border pt-4">
                                                    <div className="flex justify-between">
                                                        <dt className="text-muted-foreground">
                                                            Group subtotal
                                                        </dt>
                                                        <dd className="font-medium">
                                                            {formatNumber(
                                                                totals.subtotal,
                                                            )}
                                                        </dd>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <dt className="text-muted-foreground">
                                                            Group discount
                                                        </dt>
                                                        <dd className="font-medium">
                                                            {formatNumber(
                                                                totals.discountAmount,
                                                            )}
                                                        </dd>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <dt className="text-muted-foreground">
                                                            Group tax
                                                        </dt>
                                                        <dd className="font-medium">
                                                            {formatNumber(
                                                                totals.taxAmount,
                                                            )}
                                                        </dd>
                                                    </div>
                                                    <div className="flex justify-between border-t border-border pt-2 font-semibold">
                                                        <dt>Group total</dt>
                                                        <dd>
                                                            {formatNumber(
                                                                totals.total,
                                                            )}
                                                        </dd>
                                                    </div>
                                                </dl>
                                            </div>
                                        );
                                    })}

                                    <Button type="button" onClick={addGroup}>
                                        <Plus />
                                        Add group
                                    </Button>

                                    <div className="space-y-4">
                                        <h2 className="text-base font-semibold">
                                            Ungrouped items
                                        </h2>
                                        <InputError message={errors.items} />

                                        <LineItemForm
                                            idPrefix="ungrouped-item"
                                            draft={itemDraft}
                                            errors={errors}
                                            errorPrefix={
                                                editingItemIndex !== null
                                                    ? `items.${editingItemIndex}`
                                                    : undefined
                                            }
                                            isEditing={
                                                editingItemIndex !== null
                                            }
                                            onDraftChange={updateItemDraft}
                                            onSubmit={submitItemDraft}
                                            onCancel={cancelItemEdit}
                                        />

                                        {items.length === 0 && (
                                            <p className="text-sm text-muted-foreground">
                                                No ungrouped items. Add one
                                                above, or put items inside a
                                                group.
                                            </p>
                                        )}

                                        {items.length > 0 && (
                                            <div className="overflow-hidden rounded-lg border border-border/50">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>
                                                                Product
                                                            </TableHead>
                                                            <TableHead className="w-24">
                                                                Qty
                                                            </TableHead>
                                                            <TableHead className="w-28">
                                                                Unit price
                                                            </TableHead>
                                                            <TableHead className="w-24">
                                                                Discount
                                                            </TableHead>
                                                            <TableHead className="w-28 text-right">
                                                                Total price
                                                            </TableHead>
                                                            <TableHead className="w-24" />
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {items.map(
                                                            (item, index) => (
                                                                <LineItemRow
                                                                    key={index}
                                                                    namePrefix={`items[${index}]`}
                                                                    errorPrefix={`items.${index}`}
                                                                    item={item}
                                                                    errors={
                                                                        errors
                                                                    }
                                                                    isEditing={
                                                                        editingItemIndex ===
                                                                        index
                                                                    }
                                                                    destinations={destinations.filter(
                                                                        (
                                                                            destination,
                                                                        ) =>
                                                                            destination.value !==
                                                                            'ungrouped',
                                                                    )}
                                                                    onEdit={() =>
                                                                        editItem(
                                                                            index,
                                                                        )
                                                                    }
                                                                    onRemove={() =>
                                                                        removeItem(
                                                                            index,
                                                                        )
                                                                    }
                                                                    onMove={(
                                                                        destination,
                                                                    ) =>
                                                                        moveItem(
                                                                            {
                                                                                type: 'ungrouped',
                                                                            },
                                                                            index,
                                                                            item,
                                                                            destination,
                                                                        )
                                                                    }
                                                                />
                                                            ),
                                                        )}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        )}

                                        {items.length > 0 && (
                                            <dl className="space-y-2 border-t border-border pt-4">
                                                <div className="flex justify-between">
                                                    <dt className="text-muted-foreground">
                                                        Subtotal
                                                    </dt>
                                                    <dd className="font-medium">
                                                        {formatNumber(
                                                            ungroupedSubtotal,
                                                        )}
                                                    </dd>
                                                </div>
                                            </dl>
                                        )}
                                    </div>

                                    <div className="space-y-6">
                                        <h2 className="text-base font-semibold">
                                            Tax &amp; Discount
                                        </h2>
                                        <div className="grid gap-2 sm:grid-cols-3">
                                            <div className="grid gap-2">
                                                <Label htmlFor="tax_id">
                                                    Overall tax
                                                </Label>
                                                <input
                                                    type="hidden"
                                                    name="tax_id"
                                                    value={
                                                        taxId === 'none'
                                                            ? ''
                                                            : taxId
                                                    }
                                                />
                                                <Combobox
                                                    id="tax_id"
                                                    value={taxId}
                                                    onValueChange={setTaxId}
                                                    options={taxOptions}
                                                    getOptionId={(option) =>
                                                        option.id
                                                    }
                                                    getOptionLabel={(option) =>
                                                        option.label
                                                    }
                                                />
                                                <InputError
                                                    message={errors.tax_id}
                                                />
                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="discount_type">
                                                    Overall discount type
                                                </Label>
                                                <input
                                                    type="hidden"
                                                    name="discount_type"
                                                    value={
                                                        discountType === 'none'
                                                            ? ''
                                                            : discountType
                                                    }
                                                />
                                                <Select
                                                    value={discountType}
                                                    onValueChange={
                                                        setDiscountType
                                                    }
                                                >
                                                    <SelectTrigger
                                                        id="discount_type"
                                                        className="w-full"
                                                    >
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="none">
                                                            No discount
                                                        </SelectItem>
                                                        <SelectItem value="percentage">
                                                            Percentage
                                                        </SelectItem>
                                                        <SelectItem value="fixed">
                                                            Fixed amount
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <InputError
                                                    message={
                                                        errors.discount_type
                                                    }
                                                />
                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="discount_value">
                                                    Overall discount value
                                                </Label>
                                                <Input
                                                    id="discount_value"
                                                    type="number"
                                                    step="1"
                                                    min="0"
                                                    name="discount_value"
                                                    value={discountValue}
                                                    onChange={(e) =>
                                                        setDiscountValue(
                                                            e.target.value,
                                                        )
                                                    }
                                                    disabled={
                                                        discountType === 'none'
                                                    }
                                                    placeholder="Optional"
                                                />
                                                <InputError
                                                    message={
                                                        errors.discount_value
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h2 className="mb-4 text-base font-semibold">
                                            Summary
                                        </h2>
                                        <dl className="space-y-2">
                                            <div className="flex justify-between">
                                                <dt className="text-muted-foreground">
                                                    Subtotal (groups +
                                                    ungrouped)
                                                </dt>
                                                <dd className="font-medium">
                                                    {currencySymbol}{' '}
                                                    {formatNumber(subtotal)}
                                                </dd>
                                            </div>
                                            <div className="flex justify-between">
                                                <dt className="text-muted-foreground">
                                                    Overall discount
                                                </dt>
                                                <dd className="font-medium">
                                                    {currencySymbol}{' '}
                                                    {formatNumber(
                                                        quotationDiscountAmount,
                                                    )}
                                                </dd>
                                            </div>
                                            <div className="flex justify-between">
                                                <dt className="text-muted-foreground">
                                                    Overall tax
                                                </dt>
                                                <dd className="font-medium">
                                                    {currencySymbol}{' '}
                                                    {formatNumber(taxAmount)}
                                                </dd>
                                            </div>
                                            <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
                                                <dt>Total</dt>
                                                <dd>
                                                    {currencySymbol}{' '}
                                                    {formatNumber(total)}
                                                </dd>
                                            </div>
                                        </dl>
                                    </div>
                                </TabsContent>

                                <TabsContent
                                    value="bom"
                                    forceMount
                                    className={
                                        activeTab !== 'bom'
                                            ? 'hidden'
                                            : 'space-y-6 pt-4'
                                    }
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <h2 className="text-base font-semibold">
                                                Bill of Materials
                                            </h2>
                                            <p className="text-sm text-muted-foreground">
                                                Optional. Add material costs to
                                                track project expenses alongside
                                                this quotation.
                                            </p>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                setBomImportDialogOpen(true)
                                            }
                                        >
                                            <Import />
                                            Import from existing BOM
                                        </Button>
                                    </div>

                                    <ImportBomStructureDialog
                                        open={bomImportDialogOpen}
                                        onOpenChange={setBomImportDialogOpen}
                                        onSelect={handleBomImport}
                                    />

                                    <BomFormSection
                                        key={bomImportKey}
                                        namePrefix="bom"
                                        errorPrefix="bom"
                                        errors={errors}
                                        importFrom={bomImportFrom}
                                    />
                                </TabsContent>
                            </Tabs>

                            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                <Button type="button" variant="outline" asChild>
                                    <Link href={index()}>Cancel</Link>
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing && <Spinner />}
                                    Create quotation
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}

QuotationsCreate.layout = {
    breadcrumbs: [
        { title: 'Quotations', href: index() },
        { title: 'New', href: create() },
    ],
};
