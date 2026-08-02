import { Form, Head, Link, useHttp } from '@inertiajs/react';
import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { AsyncCombobox } from '@/components/async-combobox';
import Heading from '@/components/heading';
import { ImportBomItemsDialog } from '@/components/import-bom-items-dialog';
import type { ImportedBomItem } from '@/components/import-bom-items-dialog';
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
import { search as searchProducts } from '@/routes/products';
import { search as searchProjects } from '@/routes/projects';
import { index as projectQuotations } from '@/routes/projects/quotations';
import { create, index, store } from '@/routes/purchase-orders';
import { search as searchVendors } from '@/routes/vendors';

type ProjectOption = {
    id: number;
    uuid: string;
    name: string;
    project_code: string;
    customer: { id: number; name: string };
};

type QuotationOption = {
    id: number;
    uuid: string;
    quotation_code: string;
    version_major: number;
    version_minor: number;
    status: string;
    is_current: boolean;
};

type VendorOption = {
    id: number;
    name: string;
    vendor_code: string;
    address: string | null;
    phone: string | null;
    fax: string | null;
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
    reference_number: string;
    descriptions: string;
    unit: string;
    cost: string;
};

type LineItem = {
    product_id: string;
    bom_item_id: string;
    reference_number: string;
    description: string;
    quantity: string;
    unit: string;
    unit_price: string;
    initialProduct?: ProductOption;
};

type DiscountLevel = {
    label: string;
    discount_type: string;
    discount_value: string;
};

type Props = {
    currencies: CurrencyOption[];
    taxes: TaxOption[];
};

function todayDate(): string {
    return new Date().toISOString().slice(0, 10);
}

function emptyItem(): LineItem {
    return {
        product_id: '',
        bom_item_id: '',
        reference_number: '',
        description: '',
        quantity: '1',
        unit: '',
        unit_price: '0',
    };
}

function emptyDiscount(): DiscountLevel {
    return { label: '', discount_type: 'percentage', discount_value: '' };
}

function calculateItemTotal(item: LineItem): number {
    return (Number(item.quantity) || 0) * (Number(item.unit_price) || 0);
}

function calculateItemsSubtotal(items: LineItem[]): number {
    return items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
}

function calculateDiscountLevels(subtotal: number, discounts: DiscountLevel[]) {
    let runningBalance = subtotal;
    let discountTotal = 0;

    const rows = discounts.map((discount) => {
        const value = Number(discount.discount_value) || 0;
        const amount =
            discount.discount_type === 'percentage'
                ? Math.min(runningBalance, (runningBalance * value) / 100)
                : Math.min(runningBalance, value);

        const baseAmount = runningBalance;
        runningBalance -= amount;
        discountTotal += amount;

        return { baseAmount, amount };
    });

    return { rows, discountTotal, netAfterDiscount: runningBalance };
}

type LineItemFieldsProps = {
    index: number;
    item: LineItem;
    errors: Partial<Record<string, string>>;
    onChange: (changes: Partial<LineItem>) => void;
    onRemove?: () => void;
};

function LineItemFields({
    index,
    item,
    errors,
    onChange,
    onRemove,
}: LineItemFieldsProps) {
    const namePrefix = `items[${index}]`;
    const errorPrefix = `items.${index}`;
    const total = calculateItemTotal(item);

    function handleProductChange(
        productId: string,
        product?: ProductOption,
    ): void {
        onChange({
            product_id: productId,
            bom_item_id: '',
            reference_number: product?.reference_number ?? '',
            description: product?.descriptions ?? '',
            unit: product?.unit ?? '',
            unit_price: product?.cost ?? '0',
        });
    }

    return (
        <div className="space-y-4 rounded-lg border border-sidebar-border/70 bg-muted/40 p-4 dark:border-sidebar-border">
            <div className="flex items-start justify-between gap-2">
                <div className="grid flex-1 gap-2">
                    <Label htmlFor={`item-${index}-product`}>Product</Label>
                    <input
                        type="hidden"
                        name={`${namePrefix}[product_id]`}
                        value={item.product_id}
                    />
                    <input
                        type="hidden"
                        name={`${namePrefix}[bom_item_id]`}
                        value={item.bom_item_id}
                    />
                    <AsyncCombobox<ProductOption>
                        id={`item-${index}-product`}
                        value={item.product_id}
                        onValueChange={handleProductChange}
                        searchUrl={searchProducts().url}
                        getOptionId={(product) => String(product.id)}
                        getOptionLabel={(product) =>
                            `${product.product_code} — ${product.name}`
                        }
                        initialOption={item.initialProduct}
                        placeholder="Select a product"
                    />
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

            <div className="grid gap-2 sm:grid-cols-2">
                <div className="grid gap-2">
                    <Label htmlFor={`item-${index}-reference-number`}>
                        Reference number
                    </Label>
                    <Input
                        id={`item-${index}-reference-number`}
                        name={`${namePrefix}[reference_number]`}
                        value={item.reference_number}
                        onChange={(e) =>
                            onChange({ reference_number: e.target.value })
                        }
                        placeholder="Optional"
                    />
                    <InputError
                        message={errors[`${errorPrefix}.reference_number`]}
                    />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor={`item-${index}-unit`}>Unit</Label>
                    <Input
                        id={`item-${index}-unit`}
                        name={`${namePrefix}[unit]`}
                        value={item.unit}
                        onChange={(e) => onChange({ unit: e.target.value })}
                    />
                    <InputError message={errors[`${errorPrefix}.unit`]} />
                </div>
            </div>

            <div className="grid gap-2">
                <Label htmlFor={`item-${index}-description`}>Description</Label>
                <Textarea
                    id={`item-${index}-description`}
                    name={`${namePrefix}[description]`}
                    value={item.description}
                    onChange={(e) => onChange({ description: e.target.value })}
                    placeholder="Optional"
                    rows={2}
                />
                <InputError message={errors[`${errorPrefix}.description`]} />
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
                <div className="grid gap-2">
                    <Label htmlFor={`item-${index}-quantity`}>Quantity</Label>
                    <Input
                        id={`item-${index}-quantity`}
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
                    <Label htmlFor={`item-${index}-unit-price`}>
                        Unit price
                    </Label>
                    <Input
                        id={`item-${index}-unit-price`}
                        type="number"
                        step="0.01"
                        min="0"
                        name={`${namePrefix}[unit_price]`}
                        value={item.unit_price}
                        onChange={(e) =>
                            onChange({ unit_price: e.target.value })
                        }
                    />
                    <InputError message={errors[`${errorPrefix}.unit_price`]} />
                </div>

                <div className="grid gap-2">
                    <Label>Total</Label>
                    <p className="flex h-9 items-center font-medium">
                        {formatNumber(total)}
                    </p>
                </div>
            </div>
        </div>
    );
}

type DiscountFieldsProps = {
    index: number;
    discount: DiscountLevel;
    baseAmount: number;
    amount: number;
    errors: Partial<Record<string, string>>;
    onChange: (changes: Partial<DiscountLevel>) => void;
    onRemove: () => void;
};

function DiscountFields({
    index,
    discount,
    baseAmount,
    amount,
    errors,
    onChange,
    onRemove,
}: DiscountFieldsProps) {
    const namePrefix = `discounts[${index}]`;
    const errorPrefix = `discounts.${index}`;

    return (
        <div className="space-y-4 rounded-lg border border-sidebar-border/70 bg-muted/40 p-4 dark:border-sidebar-border">
            <div className="flex items-start justify-between gap-2">
                <div className="grid flex-1 gap-2">
                    <Label htmlFor={`discount-${index}-label`}>
                        Discount label
                    </Label>
                    <Input
                        id={`discount-${index}-label`}
                        name={`${namePrefix}[label]`}
                        value={discount.label}
                        onChange={(e) => onChange({ label: e.target.value })}
                        placeholder="e.g. Discount I"
                    />
                    <InputError message={errors[`${errorPrefix}.label`]} />
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
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
                <div className="grid gap-2">
                    <Label htmlFor={`discount-${index}-type`}>Type</Label>
                    <input
                        type="hidden"
                        name={`${namePrefix}[discount_type]`}
                        value={discount.discount_type}
                    />
                    <Select
                        value={discount.discount_type}
                        onValueChange={(value) =>
                            onChange({ discount_type: value })
                        }
                    >
                        <SelectTrigger
                            id={`discount-${index}-type`}
                            className="w-full"
                        >
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
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
                    <Label htmlFor={`discount-${index}-value`}>Value</Label>
                    <Input
                        id={`discount-${index}-value`}
                        type="number"
                        step="0.01"
                        min="0"
                        name={`${namePrefix}[discount_value]`}
                        value={discount.discount_value}
                        onChange={(e) =>
                            onChange({ discount_value: e.target.value })
                        }
                    />
                    <InputError
                        message={errors[`${errorPrefix}.discount_value`]}
                    />
                </div>
            </div>

            <dl className="grid grid-cols-2 gap-4 border-t border-sidebar-border/70 pt-4 dark:border-sidebar-border">
                <div>
                    <dt className="text-sm text-muted-foreground">
                        Applied to
                    </dt>
                    <dd className="font-medium">{formatNumber(baseAmount)}</dd>
                </div>
                <div>
                    <dt className="text-sm text-muted-foreground">
                        Discount amount
                    </dt>
                    <dd className="font-medium">{formatNumber(amount)}</dd>
                </div>
            </dl>
        </div>
    );
}

export default function PurchaseOrdersCreate({ currencies, taxes }: Props) {
    const { submit } = useHttp();

    const [projectId, setProjectId] = useState('');
    const [projectName, setProjectName] = useState('');
    const [customerId, setCustomerId] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [quotationId, setQuotationId] = useState('');
    const [quotationUuid, setQuotationUuid] = useState('');
    const [quotationOptions, setQuotationOptions] = useState<QuotationOption[]>(
        [],
    );
    const [vendorId, setVendorId] = useState('');
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState('');
    const [fax, setFax] = useState('');
    const [currencyId, setCurrencyId] = useState('');
    const [taxId, setTaxId] = useState('none');
    const [items, setItems] = useState<LineItem[]>([emptyItem()]);
    const [discounts, setDiscounts] = useState<DiscountLevel[]>([]);

    async function handleProjectChange(
        id: string,
        option?: ProjectOption,
    ): Promise<void> {
        setProjectId(id);
        setProjectName(option?.name ?? '');
        setCustomerId(option ? String(option.customer.id) : '');
        setCustomerName(option?.customer.name ?? '');
        setQuotationId('');
        setQuotationUuid('');
        setQuotationOptions([]);

        if (!id || !option) {
            return;
        }

        try {
            const response = (await submit(projectQuotations(option.uuid))) as {
                data: QuotationOption[];
            };
            setQuotationOptions(response.data);
        } catch {
            setQuotationOptions([]);
        }
    }

    function handleQuotationChange(value: string): void {
        setQuotationId(value);
        setQuotationUuid(
            quotationOptions.find((q) => String(q.id) === value)?.uuid ?? '',
        );
    }

    function handleVendorChange(id: string, option?: VendorOption): void {
        setVendorId(id);
        setAddress(option?.address ?? '');
        setPhone(option?.phone ?? '');
        setFax(option?.fax ?? '');
    }

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

    function handleImportBomItems(imported: ImportedBomItem[]): void {
        setItems((current) => [...current, ...imported]);
    }

    function updateDiscount(
        index: number,
        changes: Partial<DiscountLevel>,
    ): void {
        setDiscounts((current) =>
            current.map((discount, i) =>
                i === index ? { ...discount, ...changes } : discount,
            ),
        );
    }

    function addDiscount(): void {
        setDiscounts((current) => [...current, emptyDiscount()]);
    }

    function removeDiscount(index: number): void {
        setDiscounts((current) => current.filter((_, i) => i !== index));
    }

    const subtotal = calculateItemsSubtotal(items);
    const {
        rows: discountRows,
        discountTotal,
        netAfterDiscount,
    } = calculateDiscountLevels(subtotal, discounts);
    const selectedTax = taxes.find((tax) => String(tax.id) === taxId);
    const taxAmount = selectedTax
        ? selectedTax.type === 'percentage'
            ? (netAfterDiscount * Number(selectedTax.rate)) / 100
            : Number(selectedTax.rate)
        : 0;
    const grandTotal = netAfterDiscount + taxAmount;
    const currencySymbol =
        currencies.find((c) => String(c.id) === currencyId)?.symbol ?? '';

    return (
        <>
            <Head title="New Purchase Order" />

            <div className="mx-auto w-full max-w-4xl space-y-6 p-4">
                <Heading
                    title="New Purchase Order"
                    description="Raise a purchase order against a vendor"
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
                                            <AsyncCombobox<ProjectOption>
                                                id="project_id"
                                                value={projectId}
                                                onValueChange={
                                                    handleProjectChange
                                                }
                                                searchUrl={searchProjects().url}
                                                getOptionId={(project) =>
                                                    String(project.id)
                                                }
                                                getOptionLabel={(project) =>
                                                    `${project.project_code} — ${project.name} (${project.customer.name})`
                                                }
                                                placeholder="Select a project"
                                            />
                                            <InputError
                                                message={errors.project_id}
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="quotation_id">
                                                Quotation
                                            </Label>
                                            <input
                                                type="hidden"
                                                name="quotation_id"
                                                value={quotationId}
                                            />
                                            <Select
                                                value={quotationId}
                                                onValueChange={
                                                    handleQuotationChange
                                                }
                                                disabled={!projectId}
                                            >
                                                <SelectTrigger
                                                    id="quotation_id"
                                                    className="w-full min-w-0"
                                                >
                                                    <SelectValue
                                                        placeholder="Select a quotation"
                                                        className="truncate"
                                                    />
                                                </SelectTrigger>
                                                <SelectContent className="max-w-(--radix-select-trigger-width)">
                                                    {quotationOptions.map(
                                                        (quotation) => (
                                                            <SelectItem
                                                                key={
                                                                    quotation.id
                                                                }
                                                                value={String(
                                                                    quotation.id,
                                                                )}
                                                            >
                                                                <span className="block truncate">
                                                                    {
                                                                        quotation.quotation_code
                                                                    }{' '}
                                                                    v
                                                                    {
                                                                        quotation.version_major
                                                                    }
                                                                    .
                                                                    {
                                                                        quotation.version_minor
                                                                    }
                                                                    {quotation.is_current
                                                                        ? ' (current)'
                                                                        : ''}
                                                                </span>
                                                            </SelectItem>
                                                        ),
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            <InputError
                                                message={errors.quotation_id}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid gap-2 sm:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label htmlFor="project_name">
                                                Project name
                                            </Label>
                                            <Input
                                                id="project_name"
                                                name="project_name"
                                                value={projectName}
                                                onChange={(e) =>
                                                    setProjectName(
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                            <InputError
                                                message={errors.project_name}
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="customer_name">
                                                Customer
                                            </Label>
                                            <input
                                                type="hidden"
                                                name="customer_id"
                                                value={customerId}
                                            />
                                            <Input
                                                id="customer_name"
                                                value={customerName}
                                                readOnly
                                                disabled
                                            />
                                            <InputError
                                                message={errors.customer_id}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid gap-2 sm:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label htmlFor="vendor_id">
                                                Vendor
                                            </Label>
                                            <input
                                                type="hidden"
                                                name="vendor_id"
                                                value={vendorId}
                                            />
                                            <AsyncCombobox<VendorOption>
                                                id="vendor_id"
                                                value={vendorId}
                                                onValueChange={
                                                    handleVendorChange
                                                }
                                                searchUrl={searchVendors().url}
                                                getOptionId={(vendor) =>
                                                    String(vendor.id)
                                                }
                                                getOptionLabel={(vendor) =>
                                                    `${vendor.vendor_code} — ${vendor.name}`
                                                }
                                                placeholder="Select a vendor"
                                            />
                                            <InputError
                                                message={errors.vendor_id}
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
                                            <Label htmlFor="address">
                                                Vendor address
                                            </Label>
                                            <Input
                                                id="address"
                                                name="address"
                                                value={address}
                                                onChange={(e) =>
                                                    setAddress(e.target.value)
                                                }
                                                placeholder="Optional"
                                            />
                                            <InputError
                                                message={errors.address}
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="attention">
                                                Attention
                                            </Label>
                                            <Input
                                                id="attention"
                                                name="attention"
                                                placeholder="Optional"
                                            />
                                            <InputError
                                                message={errors.attention}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid gap-2 sm:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label htmlFor="phone">Phone</Label>
                                            <Input
                                                id="phone"
                                                name="phone"
                                                value={phone}
                                                onChange={(e) =>
                                                    setPhone(e.target.value)
                                                }
                                                placeholder="Optional"
                                            />
                                            <InputError
                                                message={errors.phone}
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="fax">Fax</Label>
                                            <Input
                                                id="fax"
                                                name="fax"
                                                value={fax}
                                                onChange={(e) =>
                                                    setFax(e.target.value)
                                                }
                                                placeholder="Optional"
                                            />
                                            <InputError message={errors.fax} />
                                        </div>
                                    </div>

                                    <div className="grid gap-2 sm:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label htmlFor="quotation_no">
                                                Vendor quotation no.
                                            </Label>
                                            <Input
                                                id="quotation_no"
                                                name="quotation_no"
                                                placeholder="Optional"
                                            />
                                            <InputError
                                                message={errors.quotation_no}
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="quotation_date">
                                                Vendor quotation date
                                            </Label>
                                            <Input
                                                id="quotation_date"
                                                type="date"
                                                name="quotation_date"
                                                placeholder="Optional"
                                            />
                                            <InputError
                                                message={errors.quotation_date}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid gap-2 sm:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label htmlFor="date">Date</Label>
                                            <Input
                                                id="date"
                                                type="date"
                                                name="date"
                                                defaultValue={todayDate()}
                                            />
                                            <InputError message={errors.date} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="delivery_date">
                                                Delivery date
                                            </Label>
                                            <Input
                                                id="delivery_date"
                                                type="date"
                                                name="delivery_date"
                                                placeholder="Optional"
                                            />
                                            <InputError
                                                message={errors.delivery_date}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid gap-2 sm:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label htmlFor="shipping_method">
                                                Shipping method
                                            </Label>
                                            <Input
                                                id="shipping_method"
                                                name="shipping_method"
                                                placeholder="Optional"
                                            />
                                            <InputError
                                                message={errors.shipping_method}
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="shipping_terms">
                                                Shipping terms
                                            </Label>
                                            <Input
                                                id="shipping_terms"
                                                name="shipping_terms"
                                                placeholder="Optional"
                                            />
                                            <InputError
                                                message={errors.shipping_terms}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between gap-2">
                                    <CardTitle>Line Items</CardTitle>
                                    <div className="flex gap-2">
                                        <ImportBomItemsDialog
                                            quotationId={quotationUuid}
                                            disabled={!quotationUuid}
                                            onImport={handleImportBomItems}
                                        />
                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={addItem}
                                        >
                                            <Plus />
                                            Add line
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <InputError message={errors.items} />

                                    {items.map((item, index) => (
                                        <LineItemFields
                                            key={index}
                                            index={index}
                                            item={item}
                                            errors={errors}
                                            onChange={(changes) =>
                                                updateItem(index, changes)
                                            }
                                            onRemove={
                                                items.length > 1
                                                    ? () => removeItem(index)
                                                    : undefined
                                            }
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
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle>Discounts</CardTitle>
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={addDiscount}
                                    >
                                        <Plus />
                                        Add discount level
                                    </Button>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {discounts.length === 0 && (
                                        <p className="text-sm text-muted-foreground">
                                            No discount levels added. Each level
                                            applies in order, on top of the
                                            balance left by the previous one.
                                        </p>
                                    )}

                                    {discounts.map((discount, index) => (
                                        <DiscountFields
                                            key={index}
                                            index={index}
                                            discount={discount}
                                            baseAmount={
                                                discountRows[index]
                                                    ?.baseAmount ?? 0
                                            }
                                            amount={
                                                discountRows[index]?.amount ?? 0
                                            }
                                            errors={errors}
                                            onChange={(changes) =>
                                                updateDiscount(index, changes)
                                            }
                                            onRemove={() =>
                                                removeDiscount(index)
                                            }
                                        />
                                    ))}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Tax</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid gap-2 sm:w-1/2">
                                        <Label htmlFor="tax_id">
                                            Overall tax
                                        </Label>
                                        <input
                                            type="hidden"
                                            name="tax_id"
                                            value={
                                                taxId === 'none' ? '' : taxId
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
                                                        value={String(tax.id)}
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
                                        <InputError message={errors.tax_id} />
                                    </div>
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
                                                Discount total
                                            </dt>
                                            <dd className="font-medium">
                                                {currencySymbol}{' '}
                                                {formatNumber(discountTotal)}
                                            </dd>
                                        </div>
                                        <div className="flex justify-between">
                                            <dt className="text-muted-foreground">
                                                Net after discount
                                            </dt>
                                            <dd className="font-medium">
                                                {currencySymbol}{' '}
                                                {formatNumber(netAfterDiscount)}
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
                                            <dt>Grand total</dt>
                                            <dd>
                                                {currencySymbol}{' '}
                                                {formatNumber(grandTotal)}
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
                                    Create purchase order
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}

PurchaseOrdersCreate.layout = {
    breadcrumbs: [
        { title: 'Purchase Orders', href: index() },
        { title: 'New', href: create() },
    ],
};
