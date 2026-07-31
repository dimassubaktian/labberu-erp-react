import { Form, Head, Link } from '@inertiajs/react';
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
import { create, index, store } from '@/routes/quotations';

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
};

type TaxOption = {
    id: number;
    name: string;
    rate: string;
    type: string;
};

type ProductOption = {
    id: number;
    name: string;
    product_code: string;
    unit: string;
    price: string;
    cost: string;
};

type LineItem = {
    product_id: string;
    quantity: string;
    unit: string;
    unit_price: string;
    unit_cost: string;
    discount_type: string;
    discount_value: string;
};

type Props = {
    projects: ProjectOption[];
    currencies: CurrencyOption[];
    taxes: TaxOption[];
    products: ProductOption[];
};

function defaultValidUntil(): string {
    const date = new Date();
    date.setDate(date.getDate() + 7);

    return date.toISOString().slice(0, 10);
}

function emptyItem(): LineItem {
    return {
        product_id: '',
        quantity: '1',
        unit: '',
        unit_price: '0',
        unit_cost: '0',
        discount_type: 'none',
        discount_value: '',
    };
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

export default function QuotationsCreate({
    projects,
    currencies,
    taxes,
    products,
}: Props) {
    const [projectId, setProjectId] = useState('');
    const [currencyId, setCurrencyId] = useState('');
    const [taxId, setTaxId] = useState('none');
    const [discountType, setDiscountType] = useState('none');
    const [discountValue, setDiscountValue] = useState('');
    const [items, setItems] = useState<LineItem[]>([emptyItem()]);

    function updateItem(index: number, changes: Partial<LineItem>): void {
        setItems((current) =>
            current.map((item, i) =>
                i === index ? { ...item, ...changes } : item,
            ),
        );
    }

    function handleProductChange(index: number, productId: string): void {
        const product = products.find((p) => String(p.id) === productId);

        updateItem(index, {
            product_id: productId,
            unit: product?.unit ?? '',
            unit_price: product?.price ?? '0',
            unit_cost: product?.cost ?? '0',
        });
    }

    function addItem(): void {
        setItems((current) => [...current, emptyItem()]);
    }

    function removeItem(index: number): void {
        setItems((current) => current.filter((_, i) => i !== index));
    }

    const subtotal = items.reduce(
        (sum, item) => sum + calculateItemTotals(item).totalPrice,
        0,
    );
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

    return (
        <>
            <Head title="New Quotation" />

            <div className="mx-auto w-full max-w-4xl space-y-6 p-4">
                <Heading
                    title="New Quotation"
                    description="Create a quotation for a project"
                />

                <Form {...store.form()} className="space-y-6">
                    {({ processing, errors }) => (
                        <>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Details</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
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
                                            <Select
                                                value={projectId}
                                                onValueChange={setProjectId}
                                            >
                                                <SelectTrigger
                                                    id="project_id"
                                                    className="w-full min-w-0"
                                                >
                                                    <SelectValue
                                                        placeholder="Select a project"
                                                        className="truncate"
                                                    />
                                                </SelectTrigger>
                                                <SelectContent className="max-w-(--radix-select-trigger-width)">
                                                    {projects.map((project) => (
                                                        <SelectItem
                                                            key={project.id}
                                                            value={String(
                                                                project.id,
                                                            )}
                                                        >
                                                            <span className="block truncate">
                                                                {
                                                                    project.project_code
                                                                }{' '}
                                                                &mdash;{' '}
                                                                {project.name} (
                                                                {
                                                                    project
                                                                        .customer
                                                                        .name
                                                                }
                                                                )
                                                            </span>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
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
                                                onValueChange={setCurrencyId}
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

                                        <div className="grid gap-2">
                                            <Label htmlFor="tax_id">Tax</Label>
                                            <input
                                                type="hidden"
                                                name="tax_id"
                                                value={
                                                    taxId === 'none'
                                                        ? ''
                                                        : taxId
                                                }
                                            />
                                            <Select
                                                value={taxId}
                                                onValueChange={setTaxId}
                                            >
                                                <SelectTrigger
                                                    id="tax_id"
                                                    className="w-full min-w-0"
                                                >
                                                    <SelectValue className="truncate" />
                                                </SelectTrigger>
                                                <SelectContent className="max-w-(--radix-select-trigger-width)">
                                                    <SelectItem value="none">
                                                        No tax
                                                    </SelectItem>
                                                    {taxes.map((tax) => (
                                                        <SelectItem
                                                            key={tax.id}
                                                            value={String(
                                                                tax.id,
                                                            )}
                                                        >
                                                            <span className="block truncate">
                                                                {tax.name} (
                                                                {tax.type ===
                                                                'percentage'
                                                                    ? `${tax.rate}%`
                                                                    : tax.rate}
                                                                )
                                                            </span>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <InputError
                                                message={errors.tax_id}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid gap-2 sm:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label htmlFor="discount_type">
                                                Discount type
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
                                                onValueChange={setDiscountType}
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
                                                message={errors.discount_type}
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="discount_value">
                                                Discount value
                                            </Label>
                                            <Input
                                                id="discount_value"
                                                type="number"
                                                step="0.01"
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
                                                message={errors.discount_value}
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
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle>Line items</CardTitle>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addItem}
                                    >
                                        <Plus />
                                        Add line
                                    </Button>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <InputError message={errors.items} />

                                    {items.map((item, index) => {
                                        const totals =
                                            calculateItemTotals(item);

                                        return (
                                            <div
                                                key={index}
                                                className="space-y-4 rounded-lg border border-sidebar-border/70 p-4 dark:border-sidebar-border"
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="grid flex-1 gap-2">
                                                        <Label
                                                            htmlFor={`item-${index}-product`}
                                                        >
                                                            Product
                                                        </Label>
                                                        <input
                                                            type="hidden"
                                                            name={`items[${index}][product_id]`}
                                                            value={
                                                                item.product_id
                                                            }
                                                        />
                                                        <Select
                                                            value={
                                                                item.product_id
                                                            }
                                                            onValueChange={(
                                                                value,
                                                            ) =>
                                                                handleProductChange(
                                                                    index,
                                                                    value,
                                                                )
                                                            }
                                                        >
                                                            <SelectTrigger
                                                                id={`item-${index}-product`}
                                                                className="w-full min-w-0"
                                                            >
                                                                <SelectValue
                                                                    placeholder="Select a product"
                                                                    className="truncate"
                                                                />
                                                            </SelectTrigger>
                                                            <SelectContent className="max-w-(--radix-select-trigger-width)">
                                                                {products.map(
                                                                    (
                                                                        product,
                                                                    ) => (
                                                                        <SelectItem
                                                                            key={
                                                                                product.id
                                                                            }
                                                                            value={String(
                                                                                product.id,
                                                                            )}
                                                                        >
                                                                            <span className="block truncate">
                                                                                {
                                                                                    product.product_code
                                                                                }{' '}
                                                                                &mdash;{' '}
                                                                                {
                                                                                    product.name
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
                                                                    `items.${index}.product_id`
                                                                ]
                                                            }
                                                        />
                                                    </div>

                                                    {items.length > 1 && (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="mt-6"
                                                            onClick={() =>
                                                                removeItem(
                                                                    index,
                                                                )
                                                            }
                                                        >
                                                            <Trash2 className="text-destructive" />
                                                        </Button>
                                                    )}
                                                </div>

                                                <div className="grid gap-2 sm:grid-cols-4">
                                                    <div className="grid gap-2">
                                                        <Label
                                                            htmlFor={`item-${index}-quantity`}
                                                        >
                                                            Quantity
                                                        </Label>
                                                        <Input
                                                            id={`item-${index}-quantity`}
                                                            type="number"
                                                            step="0.01"
                                                            min="0.01"
                                                            name={`items[${index}][quantity]`}
                                                            value={
                                                                item.quantity
                                                            }
                                                            onChange={(e) =>
                                                                updateItem(
                                                                    index,
                                                                    {
                                                                        quantity:
                                                                            e
                                                                                .target
                                                                                .value,
                                                                    },
                                                                )
                                                            }
                                                        />
                                                        <InputError
                                                            message={
                                                                errors[
                                                                    `items.${index}.quantity`
                                                                ]
                                                            }
                                                        />
                                                    </div>

                                                    <div className="grid gap-2">
                                                        <Label
                                                            htmlFor={`item-${index}-unit`}
                                                        >
                                                            Unit
                                                        </Label>
                                                        <Input
                                                            id={`item-${index}-unit`}
                                                            name={`items[${index}][unit]`}
                                                            value={item.unit}
                                                            onChange={(e) =>
                                                                updateItem(
                                                                    index,
                                                                    {
                                                                        unit: e
                                                                            .target
                                                                            .value,
                                                                    },
                                                                )
                                                            }
                                                        />
                                                        <InputError
                                                            message={
                                                                errors[
                                                                    `items.${index}.unit`
                                                                ]
                                                            }
                                                        />
                                                    </div>

                                                    <div className="grid gap-2">
                                                        <Label
                                                            htmlFor={`item-${index}-unit-price`}
                                                        >
                                                            Unit price
                                                        </Label>
                                                        <Input
                                                            id={`item-${index}-unit-price`}
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            name={`items[${index}][unit_price]`}
                                                            value={
                                                                item.unit_price
                                                            }
                                                            onChange={(e) =>
                                                                updateItem(
                                                                    index,
                                                                    {
                                                                        unit_price:
                                                                            e
                                                                                .target
                                                                                .value,
                                                                    },
                                                                )
                                                            }
                                                        />
                                                        <InputError
                                                            message={
                                                                errors[
                                                                    `items.${index}.unit_price`
                                                                ]
                                                            }
                                                        />
                                                    </div>

                                                    <div className="grid gap-2">
                                                        <Label
                                                            htmlFor={`item-${index}-unit-cost`}
                                                        >
                                                            Unit cost
                                                        </Label>
                                                        <Input
                                                            id={`item-${index}-unit-cost`}
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            name={`items[${index}][unit_cost]`}
                                                            value={
                                                                item.unit_cost
                                                            }
                                                            onChange={(e) =>
                                                                updateItem(
                                                                    index,
                                                                    {
                                                                        unit_cost:
                                                                            e
                                                                                .target
                                                                                .value,
                                                                    },
                                                                )
                                                            }
                                                        />
                                                        <InputError
                                                            message={
                                                                errors[
                                                                    `items.${index}.unit_cost`
                                                                ]
                                                            }
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid gap-2 sm:grid-cols-2">
                                                    <div className="grid gap-2">
                                                        <Label
                                                            htmlFor={`item-${index}-discount-type`}
                                                        >
                                                            Line discount type
                                                        </Label>
                                                        <input
                                                            type="hidden"
                                                            name={`items[${index}][discount_type]`}
                                                            value={
                                                                item.discount_type ===
                                                                'none'
                                                                    ? ''
                                                                    : item.discount_type
                                                            }
                                                        />
                                                        <Select
                                                            value={
                                                                item.discount_type
                                                            }
                                                            onValueChange={(
                                                                value,
                                                            ) =>
                                                                updateItem(
                                                                    index,
                                                                    {
                                                                        discount_type:
                                                                            value,
                                                                    },
                                                                )
                                                            }
                                                        >
                                                            <SelectTrigger
                                                                id={`item-${index}-discount-type`}
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
                                                                    `items.${index}.discount_type`
                                                                ]
                                                            }
                                                        />
                                                    </div>

                                                    <div className="grid gap-2">
                                                        <Label
                                                            htmlFor={`item-${index}-discount-value`}
                                                        >
                                                            Line discount value
                                                        </Label>
                                                        <Input
                                                            id={`item-${index}-discount-value`}
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            name={`items[${index}][discount_value]`}
                                                            value={
                                                                item.discount_value
                                                            }
                                                            onChange={(e) =>
                                                                updateItem(
                                                                    index,
                                                                    {
                                                                        discount_value:
                                                                            e
                                                                                .target
                                                                                .value,
                                                                    },
                                                                )
                                                            }
                                                            disabled={
                                                                item.discount_type ===
                                                                'none'
                                                            }
                                                            placeholder="Optional"
                                                        />
                                                        <InputError
                                                            message={
                                                                errors[
                                                                    `items.${index}.discount_value`
                                                                ]
                                                            }
                                                        />
                                                    </div>
                                                </div>

                                                <dl className="grid grid-cols-2 gap-4 border-t border-sidebar-border/70 pt-4 sm:grid-cols-4 dark:border-sidebar-border">
                                                    <div>
                                                        <dt className="text-sm text-muted-foreground">
                                                            Total price
                                                        </dt>
                                                        <dd className="font-medium">
                                                            {formatNumber(
                                                                totals.totalPrice,
                                                            )}
                                                        </dd>
                                                    </div>
                                                    <div>
                                                        <dt className="text-sm text-muted-foreground">
                                                            Total cost
                                                        </dt>
                                                        <dd className="font-medium">
                                                            {formatNumber(
                                                                totals.totalCost,
                                                            )}
                                                        </dd>
                                                    </div>
                                                    <div>
                                                        <dt className="text-sm text-muted-foreground">
                                                            Margin
                                                        </dt>
                                                        <dd className="font-medium">
                                                            {formatNumber(
                                                                totals.margin,
                                                            )}
                                                        </dd>
                                                    </div>
                                                    <div>
                                                        <dt className="text-sm text-muted-foreground">
                                                            Margin %
                                                        </dt>
                                                        <dd className="font-medium">
                                                            {totals.marginPercent.toFixed(
                                                                2,
                                                            )}
                                                            %
                                                        </dd>
                                                    </div>
                                                </dl>
                                            </div>
                                        );
                                    })}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Summary</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <dl className="space-y-2">
                                        <div className="flex justify-between">
                                            <dt className="text-muted-foreground">
                                                Subtotal
                                            </dt>
                                            <dd className="font-medium">
                                                {currencySymbol}{' '}
                                                {formatNumber(subtotal)}
                                            </dd>
                                        </div>
                                        <div className="flex justify-between">
                                            <dt className="text-muted-foreground">
                                                Discount
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
                                                Tax
                                            </dt>
                                            <dd className="font-medium">
                                                {currencySymbol}{' '}
                                                {formatNumber(taxAmount)}
                                            </dd>
                                        </div>
                                        <div className="flex justify-between border-t border-sidebar-border/70 pt-2 text-base font-semibold dark:border-sidebar-border">
                                            <dt>Total</dt>
                                            <dd>
                                                {currencySymbol}{' '}
                                                {formatNumber(total)}
                                            </dd>
                                        </div>
                                    </dl>
                                </CardContent>
                            </Card>

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
