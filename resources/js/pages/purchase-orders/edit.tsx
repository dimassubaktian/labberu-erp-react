import { Form, Head, Link, setLayoutProps, useHttp } from '@inertiajs/react';
import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AsyncCombobox } from '@/components/async-combobox';
import Heading from '@/components/heading';
import { ImportBomItemsDialog } from '@/components/import-bom-items-dialog';
import type { ImportedBomItem } from '@/components/import-bom-items-dialog';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { index as projectQuotations } from '@/routes/projects/quotations';
import { edit, index, show, update } from '@/routes/purchase-orders';
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

type LineItem = {
    product_id: string;
    bom_item_id: string;
    reference_number: string;
    description: string;
    quantity: string;
    unit: string;
    unit_price: string;
    discount_type: string;
    discount_value: string;
    product: ProductOption | null;
};

type DiscountLevel = {
    label: string;
    discount_type: string;
    discount_value: string;
};

type PurchaseOrderItemProp = {
    id: number;
    product_id: number;
    bom_item_id: number | null;
    reference_number: string | null;
    description: string | null;
    quantity: string;
    unit: string;
    unit_price: string;
    discount_type: string | null;
    discount_value: string | null;
    product: ProductOption;
};

type PurchaseOrderDiscountProp = {
    id: number;
    sequence: number;
    label: string;
    discount_type: string;
    discount_value: string;
};

type PurchaseOrder = {
    id: number;
    uuid: string;
    purchase_order_code: string;
    status: string;
    address: string | null;
    attention: string | null;
    phone: string | null;
    fax: string | null;
    quotation_id: number;
    quotation_no: string | null;
    quotation_date: string | null;
    project_name: string;
    date: string;
    delivery_date: string | null;
    currency_id: number;
    tax_id: number | null;
    shipping_method: string | null;
    shipping_terms: string | null;
    project: ProjectOption;
    customer: { id: number; name: string };
    vendor: VendorOption;
    items: PurchaseOrderItemProp[];
    discounts: PurchaseOrderDiscountProp[];
};

type Props = {
    purchaseOrder: PurchaseOrder;
    currencies: CurrencyOption[];
    taxes: TaxOption[];
};

function emptyItem(): LineItem {
    return {
        product_id: '',
        bom_item_id: '',
        reference_number: '',
        description: '',
        quantity: '1',
        unit: '',
        unit_price: '0',
        discount_type: 'none',
        discount_value: '',
        product: null,
    };
}

function emptyDiscount(): DiscountLevel {
    return { label: '', discount_type: 'percentage', discount_value: '' };
}

function toLineItem(item: PurchaseOrderItemProp): LineItem {
    return {
        product_id: String(item.product_id),
        bom_item_id: item.bom_item_id ? String(item.bom_item_id) : '',
        reference_number: item.reference_number ?? '',
        description: item.description ?? '',
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unit_price,
        discount_type: item.discount_type ?? 'none',
        discount_value: item.discount_value ?? '',
        product: item.product,
    };
}

function toDiscountLevel(discount: PurchaseOrderDiscountProp): DiscountLevel {
    return {
        label: discount.label,
        discount_type: discount.discount_type,
        discount_value: discount.discount_value,
    };
}

function calculateItemDiscount(item: LineItem): number {
    const lineTotal = (Number(item.quantity) || 0) * (Number(item.unit_price) || 0);
    if (item.discount_type === 'none' || item.discount_value === '') return 0;
    const value = Number(item.discount_value) || 0;
    return item.discount_type === 'percentage'
        ? Math.min(lineTotal, (lineTotal * value) / 100)
        : Math.min(lineTotal, value);
}

function calculateItemTotal(item: LineItem): number {
    const lineTotal = (Number(item.quantity) || 0) * (Number(item.unit_price) || 0);
    return lineTotal - calculateItemDiscount(item);
}

function discountLabel(item: LineItem): string {
    if (item.discount_type === 'none' || item.discount_value === '') return '—';
    return item.discount_type === 'percentage'
        ? `${item.discount_value}%`
        : formatNumber(Number(item.discount_value));
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

type LineItemFormProps = {
    draft: LineItem;
    editingIndex: number | null;
    onChange: (changes: Partial<LineItem>) => void;
    onCommit: () => void;
    onCancel: () => void;
};

function LineItemForm({
    draft,
    editingIndex,
    onChange,
    onCommit,
    onCancel,
}: LineItemFormProps) {
    const lineTotal = (Number(draft.quantity) || 0) * (Number(draft.unit_price) || 0);
    const total = lineTotal - calculateItemDiscount(draft);

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
            product: product ?? null,
        });
    }

    return (
        <div className="space-y-4 rounded-lg border border-border/50 bg-muted/40 p-4">
            <div className="grid gap-2">
                <Label>Product</Label>
                <AsyncCombobox<ProductOption>
                    value={draft.product_id}
                    onValueChange={handleProductChange}
                    searchUrl={searchProducts().url}
                    getOptionId={(product) => String(product.id)}
                    getOptionLabel={productLabel}
                    initialOption={draft.product ?? undefined}
                    placeholder="Select a product"
                />
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
                <div className="grid gap-2">
                    <Label>Reference number</Label>
                    <Input
                        value={draft.reference_number}
                        onChange={(e) =>
                            onChange({ reference_number: e.target.value })
                        }
                        placeholder="Optional"
                    />
                </div>

                <div className="grid gap-2">
                    <Label>Unit</Label>
                    <Input
                        value={draft.unit}
                        onChange={(e) => onChange({ unit: e.target.value })}
                    />
                </div>
            </div>

            <div className="grid gap-2">
                <Label>Description</Label>
                <Textarea
                    value={draft.description}
                    onChange={(e) => onChange({ description: e.target.value })}
                    placeholder="Optional"
                    rows={2}
                />
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
                <div className="grid gap-2">
                    <Label>Quantity</Label>
                    <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={draft.quantity}
                        onChange={(e) => onChange({ quantity: e.target.value })}
                    />
                </div>

                <div className="grid gap-2">
                    <Label>Unit price</Label>
                    <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={draft.unit_price}
                        onChange={(e) =>
                            onChange({ unit_price: e.target.value })
                        }
                    />
                </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
                <div className="grid gap-2">
                    <Label>Line discount type</Label>
                    <Select
                        value={draft.discount_type}
                        onValueChange={(value) =>
                            onChange({ discount_type: value })
                        }
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">No discount</SelectItem>
                            <SelectItem value="percentage">Percentage</SelectItem>
                            <SelectItem value="fixed">Fixed amount</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid gap-2">
                    <Label>Line discount value</Label>
                    <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={draft.discount_value}
                        onChange={(e) =>
                            onChange({ discount_value: e.target.value })
                        }
                        disabled={draft.discount_type === 'none'}
                        placeholder="Optional"
                    />
                </div>
            </div>

            <div className="grid gap-2">
                <Label>Total</Label>
                <p className="flex h-9 items-center font-medium">
                    {formatNumber(total)}
                </p>
            </div>

            <div className="flex justify-end gap-2">
                {editingIndex !== null && (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                    >
                        Cancel edit
                    </Button>
                )}
                <Button type="button" onClick={onCommit}>
                    {editingIndex !== null ? 'Update line' : 'Add line'}
                </Button>
            </div>
        </div>
    );
}


export default function PurchaseOrdersEdit({
    purchaseOrder,
    currencies,
    taxes,
}: Props) {
    setLayoutProps({
        breadcrumbs: [
            { title: 'Purchase Orders', href: index() },
            {
                title: purchaseOrder.purchase_order_code,
                href: show(purchaseOrder),
            },
            { title: 'Edit', href: edit(purchaseOrder) },
        ],
    });

    const { submit } = useHttp();

    const projectId = String(purchaseOrder.project.id);
    const customerId = String(purchaseOrder.customer.id);
    const customerName = purchaseOrder.customer.name;

    const [projectName, setProjectName] = useState(purchaseOrder.project_name);
    const [quotationId, setQuotationId] = useState(
        String(purchaseOrder.quotation_id),
    );
    const [quotationUuid, setQuotationUuid] = useState('');
    const [quotationOptions, setQuotationOptions] = useState<QuotationOption[]>(
        [],
    );
    const [vendorId, setVendorId] = useState(String(purchaseOrder.vendor.id));
    const [address, setAddress] = useState(purchaseOrder.address ?? '');
    const [phone, setPhone] = useState(purchaseOrder.phone ?? '');
    const [fax, setFax] = useState(purchaseOrder.fax ?? '');
    const [currencyId, setCurrencyId] = useState(
        String(purchaseOrder.currency_id),
    );
    const [taxId, setTaxId] = useState(
        purchaseOrder.tax_id ? String(purchaseOrder.tax_id) : 'none',
    );
    const [items, setItems] = useState<LineItem[]>(
        purchaseOrder.items.map(toLineItem),
    );
    const [draft, setDraft] = useState<LineItem>(emptyItem());
    const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
    const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
    const [discounts, setDiscounts] = useState<DiscountLevel[]>(
        purchaseOrder.discounts.map(toDiscountLevel),
    );

    useEffect(() => {
        let cancelled = false;

        submit(projectQuotations(purchaseOrder.project.uuid))
            .then((response) => {
                if (!cancelled) {
                    const options = (response as { data: QuotationOption[] })
                        .data;
                    setQuotationOptions(options);
                    setQuotationUuid(
                        options.find((q) => String(q.id) === quotationId)
                            ?.uuid ?? '',
                    );
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setQuotationOptions([]);
                }
            });

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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

    function updateDraft(changes: Partial<LineItem>): void {
        setDraft((current) => ({ ...current, ...changes }));
    }

    function handleCommitItem(): void {
        if (editingItemIndex !== null) {
            setItems((current) =>
                current.map((item, i) =>
                    i === editingItemIndex ? draft : item,
                ),
            );
            setEditingItemIndex(null);
        } else {
            setItems((current) => [...current, draft]);
        }
        setDraft(emptyItem());
    }

    function handleEditItem(index: number): void {
        setDraft(items[index]);
        setEditingItemIndex(index);
    }

    function handleCancelEdit(): void {
        setDraft(emptyItem());
        setEditingItemIndex(null);
    }

    function removeItem(index: number): void {
        if (editingItemIndex === index) {
            setDraft(emptyItem());
            setEditingItemIndex(null);
        }
        setItems((current) => current.filter((_, i) => i !== index));
        setSelectedIndices(new Set());
    }

    function toggleSelectAll(): void {
        if (selectedIndices.size === items.length) {
            setSelectedIndices(new Set());
        } else {
            setSelectedIndices(new Set(items.map((_, i) => i)));
        }
    }

    function removeSelectedItems(): void {
        if (editingItemIndex !== null && selectedIndices.has(editingItemIndex)) {
            setDraft(emptyItem());
            setEditingItemIndex(null);
        }
        setItems((current) => current.filter((_, i) => !selectedIndices.has(i)));
        setSelectedIndices(new Set());
    }

    function handleImportBomItems(imported: ImportedBomItem[]): void {
        setItems((current) => [
            ...current,
            ...imported.map((item) => ({
                product_id: item.product_id,
                bom_item_id: item.bom_item_id,
                reference_number: item.reference_number,
                description: item.description,
                quantity: item.quantity,
                unit: item.unit,
                unit_price: item.unit_price,
                discount_type: 'none',
                discount_value: '',
                product: item.initialProduct,
            })),
        ]);
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
            <Head title={`Edit ${purchaseOrder.purchase_order_code}`} />

            <div className="mx-auto w-full max-w-5xl space-y-6 p-4">
                <Heading
                    title={`Edit ${purchaseOrder.purchase_order_code}`}
                    description="Update this purchase order"
                />

                {purchaseOrder.status === 'approved' && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-200/10 dark:bg-amber-700/10 dark:text-amber-100">
                        This purchase order is approved. Saving changes will
                        reset it to draft and clear its issue/check/approve
                        sign-offs — the approval workflow will need to be
                        redone.
                    </div>
                )}

                <Form {...update.form(purchaseOrder)} className="space-y-6">
                    {({ processing, errors }) => (
                        <>
                            <div className="space-y-6">
                                <h2 className="text-base font-semibold">
                                    Details
                                </h2>
                                <div className="grid items-start gap-2 sm:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label>Project</Label>
                                        <input
                                            type="hidden"
                                            name="project_id"
                                            value={projectId}
                                        />
                                        <p className="rounded-md border border-input px-3 py-2 text-sm text-muted-foreground">
                                            {purchaseOrder.project.project_code}{' '}
                                            &mdash; {purchaseOrder.project.name}{' '}
                                            (
                                            {
                                                purchaseOrder.project.customer
                                                    .name
                                            }
                                            )
                                        </p>
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
                                                            key={quotation.id}
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
                                                setProjectName(e.target.value)
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
                                            onValueChange={handleVendorChange}
                                            searchUrl={searchVendors().url}
                                            getOptionId={(vendor) =>
                                                String(vendor.id)
                                            }
                                            getOptionLabel={(vendor) =>
                                                `${vendor.vendor_code} — ${vendor.name}`
                                            }
                                            initialOption={purchaseOrder.vendor}
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
                                                {currencies.map((currency) => (
                                                    <SelectItem
                                                        key={currency.id}
                                                        value={String(
                                                            currency.id,
                                                        )}
                                                    >
                                                        <span className="block truncate">
                                                            {currency.iso_code}{' '}
                                                            &mdash;{' '}
                                                            {currency.name}
                                                        </span>
                                                    </SelectItem>
                                                ))}
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
                                        <InputError message={errors.address} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="attention">
                                            Attention
                                        </Label>
                                        <Input
                                            id="attention"
                                            name="attention"
                                            defaultValue={
                                                purchaseOrder.attention ?? ''
                                            }
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
                                        <InputError message={errors.phone} />
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
                                            defaultValue={
                                                purchaseOrder.quotation_no ?? ''
                                            }
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
                                            defaultValue={
                                                purchaseOrder.quotation_date?.slice(
                                                    0,
                                                    10,
                                                ) ?? ''
                                            }
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
                                            defaultValue={purchaseOrder.date.slice(
                                                0,
                                                10,
                                            )}
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
                                            defaultValue={
                                                purchaseOrder.delivery_date?.slice(
                                                    0,
                                                    10,
                                                ) ?? ''
                                            }
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
                                            defaultValue={
                                                purchaseOrder.shipping_method ??
                                                ''
                                            }
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
                                            defaultValue={
                                                purchaseOrder.shipping_terms ??
                                                ''
                                            }
                                            placeholder="Optional"
                                        />
                                        <InputError
                                            message={errors.shipping_terms}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between gap-2">
                                    <h2 className="text-base font-semibold">
                                        Line Items
                                    </h2>
                                    <ImportBomItemsDialog
                                        quotationId={quotationUuid}
                                        disabled={!quotationUuid}
                                        onImport={handleImportBomItems}
                                    />
                                </div>
                                <InputError message={errors.items} />

                                <LineItemForm
                                    draft={draft}
                                    editingIndex={editingItemIndex}
                                    onChange={updateDraft}
                                    onCommit={handleCommitItem}
                                    onCancel={handleCancelEdit}
                                />

                                {selectedIndices.size > 0 && (
                                    <div className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/40 px-3 py-2">
                                        <span className="text-sm text-muted-foreground">
                                            {selectedIndices.size}{' '}
                                            {selectedIndices.size === 1
                                                ? 'item'
                                                : 'items'}{' '}
                                            selected
                                        </span>
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="sm"
                                                >
                                                    Delete selected
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogTitle>
                                                    Remove{' '}
                                                    {selectedIndices.size}{' '}
                                                    {selectedIndices.size === 1
                                                        ? 'item'
                                                        : 'items'}
                                                    ?
                                                </DialogTitle>
                                                <DialogDescription>
                                                    This will remove the
                                                    selected line items from the
                                                    purchase order.
                                                </DialogDescription>
                                                <DialogFooter>
                                                    <DialogClose asChild>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                        >
                                                            Cancel
                                                        </Button>
                                                    </DialogClose>
                                                    <DialogClose asChild>
                                                        <Button
                                                            type="button"
                                                            variant="destructive"
                                                            onClick={
                                                                removeSelectedItems
                                                            }
                                                        >
                                                            Remove
                                                        </Button>
                                                    </DialogClose>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                )}

                                {items.length > 0 && (
                                    <div className="overflow-hidden rounded-lg border border-border/50">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-10">
                                                        <Checkbox
                                                            checked={
                                                                items.length >
                                                                    0 &&
                                                                selectedIndices.size ===
                                                                    items.length
                                                                    ? true
                                                                    : selectedIndices.size >
                                                                        0
                                                                      ? 'indeterminate'
                                                                      : false
                                                            }
                                                            onCheckedChange={
                                                                toggleSelectAll
                                                            }
                                                            onClick={(e) =>
                                                                e.stopPropagation()
                                                            }
                                                            aria-label="Select all"
                                                        />
                                                    </TableHead>
                                                    <TableHead>
                                                        Product
                                                    </TableHead>
                                                    <TableHead className="w-32">
                                                        Qty
                                                    </TableHead>
                                                    <TableHead className="w-28">
                                                        Unit price
                                                    </TableHead>
                                                    <TableHead className="w-28">
                                                        Discount
                                                    </TableHead>
                                                    <TableHead className="w-28 text-right">
                                                        Total
                                                    </TableHead>
                                                    <TableHead className="w-16" />
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {items.map((item, index) => (
                                                    <TableRow
                                                        key={index}
                                                        className="cursor-pointer"
                                                        data-state={
                                                            editingItemIndex ===
                                                            index
                                                                ? 'selected'
                                                                : undefined
                                                        }
                                                        onClick={() =>
                                                            handleEditItem(
                                                                index,
                                                            )
                                                        }
                                                    >
                                                        <TableCell
                                                            onClick={(e) =>
                                                                e.stopPropagation()
                                                            }
                                                        >
                                                            <Checkbox
                                                                checked={selectedIndices.has(
                                                                    index,
                                                                )}
                                                                onCheckedChange={() => {
                                                                    setSelectedIndices(
                                                                        (
                                                                            prev,
                                                                        ) => {
                                                                            const next =
                                                                                new Set(
                                                                                    prev,
                                                                                );
                                                                            next.has(
                                                                                index,
                                                                            )
                                                                                ? next.delete(
                                                                                      index,
                                                                                  )
                                                                                : next.add(
                                                                                      index,
                                                                                  );
                                                                            return next;
                                                                        },
                                                                    );
                                                                }}
                                                                aria-label={`Select row ${index + 1}`}
                                                            />
                                                        </TableCell>
                                                        <TableCell className="whitespace-normal">
                                                            <input
                                                                type="hidden"
                                                                name={`items[${index}][product_id]`}
                                                                value={
                                                                    item.product_id
                                                                }
                                                            />
                                                            <input
                                                                type="hidden"
                                                                name={`items[${index}][bom_item_id]`}
                                                                value={
                                                                    item.bom_item_id
                                                                }
                                                            />
                                                            <input
                                                                type="hidden"
                                                                name={`items[${index}][reference_number]`}
                                                                value={
                                                                    item.reference_number
                                                                }
                                                            />
                                                            <input
                                                                type="hidden"
                                                                name={`items[${index}][description]`}
                                                                value={
                                                                    item.description
                                                                }
                                                            />
                                                            <input
                                                                type="hidden"
                                                                name={`items[${index}][unit]`}
                                                                value={item.unit}
                                                            />
                                                            <input
                                                                type="hidden"
                                                                name={`items[${index}][unit_price]`}
                                                                value={
                                                                    item.unit_price
                                                                }
                                                            />
                                                            <input
                                                                type="hidden"
                                                                name={`items[${index}][quantity]`}
                                                                value={
                                                                    item.quantity
                                                                }
                                                            />
                                                            <input
                                                                type="hidden"
                                                                name={`items[${index}][discount_type]`}
                                                                value={
                                                                    item.discount_type === 'none' ? '' : item.discount_type
                                                                }
                                                            />
                                                            <input
                                                                type="hidden"
                                                                name={`items[${index}][discount_value]`}
                                                                value={
                                                                    item.discount_value
                                                                }
                                                            />
                                                            <div className="font-medium">
                                                                {productLabel(
                                                                    item.product,
                                                                )}
                                                            </div>
                                                            {item.reference_number && (
                                                                <div className="text-sm text-muted-foreground">
                                                                    {
                                                                        item.reference_number
                                                                    }
                                                                </div>
                                                            )}
                                                            {errors[
                                                                `items.${index}.product_id`
                                                            ] && (
                                                                <p className="text-xs text-destructive dark:text-destructive-foreground">
                                                                    {
                                                                        errors[
                                                                            `items.${index}.product_id`
                                                                        ]
                                                                    }
                                                                </p>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            {item.quantity}
                                                            {item.unit
                                                                ? ' ' + item.unit
                                                                : ''}
                                                        </TableCell>
                                                        <TableCell>
                                                            {formatNumber(
                                                                Number(
                                                                    item.unit_price,
                                                                ),
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-muted-foreground">
                                                            {discountLabel(item)}
                                                        </TableCell>
                                                        <TableCell className="text-right font-medium">
                                                            {formatNumber(
                                                                calculateItemTotal(
                                                                    item,
                                                                ),
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Dialog>
                                                                <DialogTrigger
                                                                    asChild
                                                                >
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={(
                                                                            e,
                                                                        ) =>
                                                                            e.stopPropagation()
                                                                        }
                                                                    >
                                                                        <Trash2 className="text-destructive dark:text-destructive-foreground" />
                                                                    </Button>
                                                                </DialogTrigger>
                                                                <DialogContent
                                                                    onClick={(
                                                                        e,
                                                                    ) =>
                                                                        e.stopPropagation()
                                                                    }
                                                                >
                                                                    <DialogTitle>
                                                                        Remove
                                                                        line
                                                                        item?
                                                                    </DialogTitle>
                                                                    <DialogDescription>
                                                                        This
                                                                        will
                                                                        remove{' '}
                                                                        {productLabel(
                                                                            item.product,
                                                                        )}{' '}
                                                                        from the
                                                                        purchase
                                                                        order.
                                                                    </DialogDescription>
                                                                    <DialogFooter>
                                                                        <DialogClose
                                                                            asChild
                                                                        >
                                                                            <Button
                                                                                type="button"
                                                                                variant="outline"
                                                                            >
                                                                                Cancel
                                                                            </Button>
                                                                        </DialogClose>
                                                                        <DialogClose
                                                                            asChild
                                                                        >
                                                                            <Button
                                                                                type="button"
                                                                                variant="destructive"
                                                                                onClick={() =>
                                                                                    removeItem(
                                                                                        index,
                                                                                    )
                                                                                }
                                                                            >
                                                                                Remove
                                                                            </Button>
                                                                        </DialogClose>
                                                                    </DialogFooter>
                                                                </DialogContent>
                                                            </Dialog>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between gap-2">
                                    <h2 className="text-base font-semibold">
                                        Discounts
                                    </h2>
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={addDiscount}
                                    >
                                        <Plus />
                                        Add discount level
                                    </Button>
                                </div>
                                {discounts.length === 0 && (
                                    <p className="text-sm text-muted-foreground">
                                        No discount levels added. Each level
                                        applies in order, on top of the balance
                                        left by the previous one.
                                    </p>
                                )}

                                {discounts.length > 0 && (
                                    <div className="overflow-hidden rounded-lg border border-border/50">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Label</TableHead>
                                                    <TableHead className="w-36">Type</TableHead>
                                                    <TableHead className="w-32">Value</TableHead>
                                                    <TableHead className="w-32">Applied to</TableHead>
                                                    <TableHead className="w-36">Discount amount</TableHead>
                                                    <TableHead className="w-16" />
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {discounts.map((discount, index) => {
                                                    const namePrefix = `discounts[${index}]`;
                                                    const errorPrefix = `discounts.${index}`;
                                                    const row = discountRows[index];
                                                    return (
                                                        <TableRow key={index}>
                                                            <TableCell>
                                                                <Input
                                                                    name={`${namePrefix}[label]`}
                                                                    value={discount.label}
                                                                    onChange={(e) => updateDiscount(index, { label: e.target.value })}
                                                                    placeholder="e.g. Discount I"
                                                                />
                                                                <InputError message={errors[`${errorPrefix}.label`]} />
                                                            </TableCell>
                                                            <TableCell>
                                                                <input
                                                                    type="hidden"
                                                                    name={`${namePrefix}[discount_type]`}
                                                                    value={discount.discount_type}
                                                                />
                                                                <Select
                                                                    value={discount.discount_type}
                                                                    onValueChange={(value) => updateDiscount(index, { discount_type: value })}
                                                                >
                                                                    <SelectTrigger className="w-full">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="percentage">Percentage</SelectItem>
                                                                        <SelectItem value="fixed">Fixed amount</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                                <InputError message={errors[`${errorPrefix}.discount_type`]} />
                                                            </TableCell>
                                                            <TableCell>
                                                                <Input
                                                                    type="number"
                                                                    step="0.01"
                                                                    min="0"
                                                                    name={`${namePrefix}[discount_value]`}
                                                                    value={discount.discount_value}
                                                                    onChange={(e) => updateDiscount(index, { discount_value: e.target.value })}
                                                                />
                                                                <InputError message={errors[`${errorPrefix}.discount_value`]} />
                                                            </TableCell>
                                                            <TableCell className="text-muted-foreground">
                                                                {formatNumber(row?.baseAmount ?? 0)}
                                                            </TableCell>
                                                            <TableCell className="font-medium">
                                                                {formatNumber(row?.amount ?? 0)}
                                                            </TableCell>
                                                            <TableCell>
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => removeDiscount(index)}
                                                                >
                                                                    <Trash2 className="text-destructive dark:text-destructive-foreground" />
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </div>

                            <div>
                                <h2 className="mb-4 text-base font-semibold">
                                    Tax
                                </h2>
                                <div className="grid gap-2 sm:w-1/2">
                                    <Label htmlFor="tax_id">Overall tax</Label>
                                    <input
                                        type="hidden"
                                        name="tax_id"
                                        value={taxId === 'none' ? '' : taxId}
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
                                                        (
                                                        {tax.type ===
                                                        'percentage'
                                                            ? `${tax.rate}%`
                                                            : tax.rate}
                                                        ) {tax.name}
                                                    </span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.tax_id} />
                                </div>
                            </div>

                            <div>
                                <h2 className="mb-4 text-base font-semibold">
                                    Summary
                                </h2>
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
                                    <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
                                        <dt>Grand total</dt>
                                        <dd>
                                            {currencySymbol}{' '}
                                            {formatNumber(grandTotal)}
                                        </dd>
                                    </div>
                                </dl>
                            </div>

                            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                <Button type="button" variant="outline" asChild>
                                    <Link href={show(purchaseOrder)}>
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
