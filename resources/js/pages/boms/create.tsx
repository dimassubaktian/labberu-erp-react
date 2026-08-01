import { Form, Head, Link, setLayoutProps } from '@inertiajs/react';
import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Textarea } from '@/components/ui/textarea';
import { formatNumber } from '@/lib/utils';
import { index, show as showQuotation } from '@/routes/quotations';
import { create, store } from '@/routes/quotations/bom';

type QuotationOption = {
    id: number;
    uuid: string;
    quotation_code: string;
};

type ProductOption = {
    id: number;
    name: string;
    product_code: string;
    descriptions: string;
    brand: string;
    unit: string;
    cost: string;
};

type LineItem = {
    product_id: string;
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
};

type GroupState = {
    name: string;
    items: LineItem[];
    subgroups: SubgroupState[];
};

type Props = {
    quotation: QuotationOption;
    products: ProductOption[];
};

function emptyItem(): LineItem {
    return {
        product_id: '',
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
        items: [emptyItem()],
    };
}

function emptyGroup(): GroupState {
    return {
        name: '',
        items: [emptyItem()],
        subgroups: [],
    };
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

type LineItemFieldsProps = {
    namePrefix: string;
    errorPrefix: string;
    item: LineItem;
    products: ProductOption[];
    errors: Partial<Record<string, string>>;
    onChange: (changes: Partial<LineItem>) => void;
    onRemove?: () => void;
};

function LineItemFields({
    namePrefix,
    errorPrefix,
    item,
    products,
    errors,
    onChange,
    onRemove,
}: LineItemFieldsProps) {
    const totalCost = calculateItemTotalCost(item);
    const fieldId = namePrefix.replace(/[[\].]/g, '-');

    function handleProductChange(productId: string): void {
        const product = products.find((p) => String(p.id) === productId);

        onChange({
            product_id: productId,
            description: product?.descriptions ?? '',
            brand: product?.brand ?? '',
            unit: product?.unit ?? '',
            unit_cost: product?.cost ?? '0',
        });
    }

    return (
        <div className="space-y-4 rounded-lg border border-sidebar-border/70 bg-muted/40 p-4 dark:border-sidebar-border">
            <div className="flex items-start justify-between gap-2">
                <div className="grid flex-1 gap-2">
                    <Label htmlFor={`${fieldId}-product`}>Product</Label>
                    <input
                        type="hidden"
                        name={`${namePrefix}[product_id]`}
                        value={item.product_id}
                    />
                    <Select
                        value={item.product_id}
                        onValueChange={handleProductChange}
                    >
                        <SelectTrigger
                            id={`${fieldId}-product`}
                            className="w-full min-w-0"
                        >
                            <SelectValue
                                placeholder="Select a product"
                                className="truncate"
                            />
                        </SelectTrigger>
                        <SelectContent className="max-w-(--radix-select-trigger-width)">
                            {products.map((product) => (
                                <SelectItem
                                    key={product.id}
                                    value={String(product.id)}
                                >
                                    <span className="block truncate">
                                        {product.product_code} &mdash;{' '}
                                        {product.name}
                                    </span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <InputError message={errors[`${errorPrefix}.product_id`]} />
                </div>

                {onRemove && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="mt-6"
                        onClick={onRemove}
                    >
                        <Trash2 className="text-destructive" />
                    </Button>
                )}
            </div>

            <div className="grid gap-2">
                <Label htmlFor={`${fieldId}-description`}>Description</Label>
                <Textarea
                    id={`${fieldId}-description`}
                    name={`${namePrefix}[description]`}
                    value={item.description}
                    onChange={(e) => onChange({ description: e.target.value })}
                    placeholder="Optional"
                    rows={2}
                />
                <InputError message={errors[`${errorPrefix}.description`]} />
            </div>

            <div className="grid gap-2 sm:grid-cols-4">
                <div className="grid gap-2">
                    <Label htmlFor={`${fieldId}-brand`}>Brand</Label>
                    <Input
                        id={`${fieldId}-brand`}
                        name={`${namePrefix}[brand]`}
                        value={item.brand}
                        onChange={(e) => onChange({ brand: e.target.value })}
                    />
                    <InputError message={errors[`${errorPrefix}.brand`]} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor={`${fieldId}-quantity`}>Quantity</Label>
                    <Input
                        id={`${fieldId}-quantity`}
                        type="number"
                        step="0.01"
                        min="0.01"
                        name={`${namePrefix}[quantity]`}
                        value={item.quantity}
                        onChange={(e) => onChange({ quantity: e.target.value })}
                    />
                    <InputError message={errors[`${errorPrefix}.quantity`]} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor={`${fieldId}-unit`}>Unit</Label>
                    <Input
                        id={`${fieldId}-unit`}
                        name={`${namePrefix}[unit]`}
                        value={item.unit}
                        onChange={(e) => onChange({ unit: e.target.value })}
                    />
                    <InputError message={errors[`${errorPrefix}.unit`]} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor={`${fieldId}-unit-cost`}>Unit cost</Label>
                    <Input
                        id={`${fieldId}-unit-cost`}
                        type="number"
                        step="0.01"
                        min="0"
                        name={`${namePrefix}[unit_cost]`}
                        value={item.unit_cost}
                        onChange={(e) =>
                            onChange({ unit_cost: e.target.value })
                        }
                    />
                    <InputError message={errors[`${errorPrefix}.unit_cost`]} />
                </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
                <div className="grid gap-2">
                    <Label htmlFor={`${fieldId}-discount-type`}>
                        Discount type
                    </Label>
                    <input
                        type="hidden"
                        name={`${namePrefix}[discount_type]`}
                        value={
                            item.discount_type === 'none'
                                ? ''
                                : item.discount_type
                        }
                    />
                    <Select
                        value={item.discount_type}
                        onValueChange={(value) =>
                            onChange({ discount_type: value })
                        }
                    >
                        <SelectTrigger
                            id={`${fieldId}-discount-type`}
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
                    <InputError
                        message={errors[`${errorPrefix}.discount_type`]}
                    />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor={`${fieldId}-discount-value`}>
                        Discount value
                    </Label>
                    <Input
                        id={`${fieldId}-discount-value`}
                        type="number"
                        step="0.01"
                        min="0"
                        name={`${namePrefix}[discount_value]`}
                        value={item.discount_value}
                        onChange={(e) =>
                            onChange({ discount_value: e.target.value })
                        }
                        disabled={item.discount_type === 'none'}
                        placeholder="Optional"
                    />
                    <InputError
                        message={errors[`${errorPrefix}.discount_value`]}
                    />
                </div>
            </div>

            <dl className="flex justify-between border-t border-sidebar-border/70 pt-4 dark:border-sidebar-border">
                <dt className="text-sm text-muted-foreground">Total cost</dt>
                <dd className="font-medium">{formatNumber(totalCost)}</dd>
            </dl>
        </div>
    );
}

type SubgroupFieldsProps = {
    namePrefix: string;
    errorPrefix: string;
    subgroup: SubgroupState;
    products: ProductOption[];
    errors: Partial<Record<string, string>>;
    onNameChange: (name: string) => void;
    onAddItem: () => void;
    onRemoveItem: (itemIndex: number) => void;
    onUpdateItem: (itemIndex: number, changes: Partial<LineItem>) => void;
    onRemove: () => void;
};

function SubgroupFields({
    namePrefix,
    errorPrefix,
    subgroup,
    products,
    errors,
    onNameChange,
    onAddItem,
    onRemoveItem,
    onUpdateItem,
    onRemove,
}: SubgroupFieldsProps) {
    const subtotal = calculateItemsSubtotal(subgroup.items);
    const fieldId = namePrefix.replace(/[[\].]/g, '-');

    return (
        <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-2">
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
                    <Trash2 className="text-destructive" />
                </Button>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                    <Label>Materials</Label>
                    <Button type="button" size="sm" onClick={onAddItem}>
                        <Plus />
                        Add line
                    </Button>
                </div>
                <InputError message={errors[`${errorPrefix}.items`]} />

                {subgroup.items.map((item, itemIndex) => (
                    <LineItemFields
                        key={itemIndex}
                        namePrefix={`${namePrefix}[items][${itemIndex}]`}
                        errorPrefix={`${errorPrefix}.items.${itemIndex}`}
                        item={item}
                        products={products}
                        errors={errors}
                        onChange={(changes) => onUpdateItem(itemIndex, changes)}
                        onRemove={
                            subgroup.items.length > 1
                                ? () => onRemoveItem(itemIndex)
                                : undefined
                        }
                    />
                ))}

                <Button type="button" size="sm" onClick={onAddItem}>
                    <Plus />
                    Add line
                </Button>

                <dl className="flex justify-between border-t border-sidebar-border/70 pt-4 font-semibold dark:border-sidebar-border">
                    <dt>Phase subtotal</dt>
                    <dd>{formatNumber(subtotal)}</dd>
                </dl>
            </CardContent>
        </Card>
    );
}

export default function BomsCreate({ quotation, products }: Props) {
    setLayoutProps({
        breadcrumbs: [
            { title: 'Quotations', href: index() },
            { title: quotation.quotation_code, href: showQuotation(quotation) },
            { title: 'Create Bill of Materials', href: create(quotation) },
        ],
    });

    const [items, setItems] = useState<LineItem[]>([emptyItem()]);
    const [subgroups, setSubgroups] = useState<SubgroupState[]>([]);
    const [groups, setGroups] = useState<GroupState[]>([]);
    const [overheadPercentage, setOverheadPercentage] = useState('');
    const [sellingPercentage, setSellingPercentage] = useState('');

    function updateItem(index: number, changes: Partial<LineItem>): void {
        setItems((current) =>
            current.map((item, i) =>
                i === index ? { ...item, ...changes } : item,
            ),
        );
    }

    function addItem(): void {
        setItems((current) => [...current, emptyItem()]);
    }

    function removeItem(index: number): void {
        setItems((current) => current.filter((_, i) => i !== index));
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

    function addSubgroupItem(subgroupIndex: number): void {
        setSubgroups((current) =>
            current.map((subgroup, i) =>
                i === subgroupIndex
                    ? { ...subgroup, items: [...subgroup.items, emptyItem()] }
                    : subgroup,
            ),
        );
    }

    function removeSubgroupItem(
        subgroupIndex: number,
        itemIndex: number,
    ): void {
        setSubgroups((current) =>
            current.map((subgroup, i) =>
                i === subgroupIndex
                    ? {
                          ...subgroup,
                          items: subgroup.items.filter(
                              (_, j) => j !== itemIndex,
                          ),
                      }
                    : subgroup,
            ),
        );
    }

    function updateSubgroupItem(
        subgroupIndex: number,
        itemIndex: number,
        changes: Partial<LineItem>,
    ): void {
        setSubgroups((current) =>
            current.map((subgroup, i) =>
                i === subgroupIndex
                    ? {
                          ...subgroup,
                          items: subgroup.items.map((item, j) =>
                              j === itemIndex ? { ...item, ...changes } : item,
                          ),
                      }
                    : subgroup,
            ),
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

    function addGroupItem(groupIndex: number): void {
        setGroups((current) =>
            current.map((group, i) =>
                i === groupIndex
                    ? { ...group, items: [...group.items, emptyItem()] }
                    : group,
            ),
        );
    }

    function removeGroupItem(groupIndex: number, itemIndex: number): void {
        setGroups((current) =>
            current.map((group, i) =>
                i === groupIndex
                    ? {
                          ...group,
                          items: group.items.filter((_, j) => j !== itemIndex),
                      }
                    : group,
            ),
        );
    }

    function updateGroupItem(
        groupIndex: number,
        itemIndex: number,
        changes: Partial<LineItem>,
    ): void {
        setGroups((current) =>
            current.map((group, i) =>
                i === groupIndex
                    ? {
                          ...group,
                          items: group.items.map((item, j) =>
                              j === itemIndex ? { ...item, ...changes } : item,
                          ),
                      }
                    : group,
            ),
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

    function addGroupSubgroupItem(
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
                                        items: [...subgroup.items, emptyItem()],
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
            current.map((group, i) =>
                i === groupIndex
                    ? {
                          ...group,
                          subgroups: group.subgroups.map((subgroup, j) =>
                              j === subgroupIndex
                                  ? {
                                        ...subgroup,
                                        items: subgroup.items.filter(
                                            (_, k) => k !== itemIndex,
                                        ),
                                    }
                                  : subgroup,
                          ),
                      }
                    : group,
            ),
        );
    }

    function updateGroupSubgroupItem(
        groupIndex: number,
        subgroupIndex: number,
        itemIndex: number,
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
                                        items: subgroup.items.map((item, k) =>
                                            k === itemIndex
                                                ? { ...item, ...changes }
                                                : item,
                                        ),
                                    }
                                  : subgroup,
                          ),
                      }
                    : group,
            ),
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
                title={`Create Bill of Materials — ${quotation.quotation_code}`}
            />

            <div className="mx-auto w-full max-w-4xl space-y-6 p-4">
                <Heading
                    title="Create Bill of Materials"
                    description={`For quotation ${quotation.quotation_code}`}
                />

                <Form {...store.form(quotation)} className="space-y-6">
                    {({ processing, errors }) => (
                        <>
                            {groups.map((group, groupIndex) => {
                                const groupNamePrefix = `groups[${groupIndex}]`;
                                const groupErrorPrefix = `groups.${groupIndex}`;
                                const { total: groupSubtotal } =
                                    groupTotals[groupIndex];

                                return (
                                    <Card key={groupIndex}>
                                        <CardHeader className="flex flex-row items-start justify-between gap-2">
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
                                                <Trash2 className="text-destructive" />
                                            </Button>
                                        </CardHeader>
                                        <CardContent className="space-y-6">
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <Label>
                                                        Ungrouped materials
                                                    </Label>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        onClick={() =>
                                                            addGroupItem(
                                                                groupIndex,
                                                            )
                                                        }
                                                    >
                                                        <Plus />
                                                        Add line
                                                    </Button>
                                                </div>
                                                <InputError
                                                    message={
                                                        errors[
                                                            `${groupErrorPrefix}.items`
                                                        ]
                                                    }
                                                />

                                                {group.items.length === 0 && (
                                                    <p className="text-sm text-muted-foreground">
                                                        No materials directly in
                                                        this group. Add one
                                                        above, or put materials
                                                        inside a phase below.
                                                    </p>
                                                )}

                                                {group.items.map(
                                                    (item, itemIndex) => (
                                                        <LineItemFields
                                                            key={itemIndex}
                                                            namePrefix={`${groupNamePrefix}[items][${itemIndex}]`}
                                                            errorPrefix={`${groupErrorPrefix}.items.${itemIndex}`}
                                                            item={item}
                                                            products={products}
                                                            errors={errors}
                                                            onChange={(
                                                                changes,
                                                            ) =>
                                                                updateGroupItem(
                                                                    groupIndex,
                                                                    itemIndex,
                                                                    changes,
                                                                )
                                                            }
                                                            onRemove={() =>
                                                                removeGroupItem(
                                                                    groupIndex,
                                                                    itemIndex,
                                                                )
                                                            }
                                                        />
                                                    ),
                                                )}

                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    onClick={() =>
                                                        addGroupItem(groupIndex)
                                                    }
                                                >
                                                    <Plus />
                                                    Add line
                                                </Button>
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
                                                            products={products}
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
                                                            onAddItem={() =>
                                                                addGroupSubgroupItem(
                                                                    groupIndex,
                                                                    subgroupIndex,
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
                                                            onUpdateItem={(
                                                                itemIndex,
                                                                changes,
                                                            ) =>
                                                                updateGroupSubgroupItem(
                                                                    groupIndex,
                                                                    subgroupIndex,
                                                                    itemIndex,
                                                                    changes,
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
                                        </CardContent>
                                    </Card>
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
                                        products={products}
                                        errors={errors}
                                        onNameChange={(name) =>
                                            updateSubgroupName(
                                                subgroupIndex,
                                                name,
                                            )
                                        }
                                        onAddItem={() =>
                                            addSubgroupItem(subgroupIndex)
                                        }
                                        onRemoveItem={(itemIndex) =>
                                            removeSubgroupItem(
                                                subgroupIndex,
                                                itemIndex,
                                            )
                                        }
                                        onUpdateItem={(itemIndex, changes) =>
                                            updateSubgroupItem(
                                                subgroupIndex,
                                                itemIndex,
                                                changes,
                                            )
                                        }
                                        onRemove={() =>
                                            removeSubgroup(subgroupIndex)
                                        }
                                    />
                                ))}
                            </div>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle>Ungrouped Materials</CardTitle>
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={addItem}
                                    >
                                        <Plus />
                                        Add line
                                    </Button>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <InputError message={errors.items} />

                                    {items.length === 0 && (
                                        <p className="text-sm text-muted-foreground">
                                            No ungrouped materials. Add one
                                            above, or put materials inside a
                                            group or phase.
                                        </p>
                                    )}

                                    {items.map((item, index) => (
                                        <LineItemFields
                                            key={index}
                                            namePrefix={`items[${index}]`}
                                            errorPrefix={`items.${index}`}
                                            item={item}
                                            products={products}
                                            errors={errors}
                                            onChange={(changes) =>
                                                updateItem(index, changes)
                                            }
                                            onRemove={() => removeItem(index)}
                                        />
                                    ))}

                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={addItem}
                                    >
                                        <Plus />
                                        Add line
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Cost Summary</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
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
                                                message={
                                                    errors.overhead_percentage
                                                }
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
                                                message={
                                                    errors.selling_percentage
                                                }
                                            />
                                        </div>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="remarks">Remarks</Label>
                                        <Textarea
                                            id="remarks"
                                            name="remarks"
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
                                </CardContent>
                            </Card>

                            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                <Button type="button" variant="outline" asChild>
                                    <Link href={showQuotation(quotation)}>
                                        Cancel
                                    </Link>
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing && <Spinner />}
                                    Create Bill of Materials
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}
