import { Form, Head, Link, useHttp } from '@inertiajs/react';
import { ReceiptText, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AsyncCombobox } from '@/components/async-combobox';
import Heading from '@/components/heading';
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
import { formatNumber } from '@/lib/utils';
import { create, index, store } from '@/routes/purchase-invoices';
import { search as searchPurchaseOrders } from '@/routes/purchase-orders';
import { index as purchaseOrderInvoiceItems } from '@/routes/purchase-orders/invoice-items';

type PurchaseOrderOption = {
    id: number;
    uuid: string;
    purchase_order_code: string;
    vendor: { id: number; name: string };
    currency: {
        id: number;
        iso_code: string;
        name: string;
        symbol: string | null;
    };
};

type PurchaseOrderItemOption = {
    id: number;
    product: { id: number; product_code: string; name: string };
    quantity: string;
    unit: string;
    unit_price: string;
    invoiced: number;
    remaining_to_invoice: number;
};

type ItemState = {
    quantity_invoiced: string;
};

type TaxOption = {
    id: number;
    name: string;
    rate: string;
    type: string;
};

type Props = {
    initialPurchaseOrder: PurchaseOrderOption | null;
    taxes: TaxOption[];
};

function todayDate(): string {
    return new Date().toISOString().slice(0, 10);
}

function defaultDueDate(): string {
    const date = new Date();
    date.setDate(date.getDate() + 30);

    return date.toISOString().slice(0, 10);
}

function emptyItemState(): ItemState {
    return { quantity_invoiced: '0' };
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

export default function PurchaseInvoicesCreate({
    initialPurchaseOrder,
    taxes,
}: Props) {
    const { submit } = useHttp();

    const [purchaseOrderId, setPurchaseOrderId] = useState(
        initialPurchaseOrder ? String(initialPurchaseOrder.id) : '',
    );
    const [purchaseOrderUuid, setPurchaseOrderUuid] = useState(
        initialPurchaseOrder?.uuid ?? '',
    );
    const [currencySymbol, setCurrencySymbol] = useState(
        initialPurchaseOrder?.currency.symbol ??
            initialPurchaseOrder?.currency.iso_code ??
            '',
    );
    const [items, setItems] = useState<PurchaseOrderItemOption[]>([]);
    const [itemStates, setItemStates] = useState<Record<number, ItemState>>({});
    const [loadingItems, setLoadingItems] = useState(!!initialPurchaseOrder);
    const [taxId, setTaxId] = useState('none');
    const [discountType, setDiscountType] = useState('none');
    const [discountValue, setDiscountValue] = useState('');

    async function fetchItems(uuid: string): Promise<void> {
        setLoadingItems(true);

        try {
            const response = (await submit(
                purchaseOrderInvoiceItems(uuid),
            )) as {
                data: PurchaseOrderItemOption[];
            };
            setItems(response.data);
            setItemStates(
                Object.fromEntries(
                    response.data.map((item) => [item.id, emptyItemState()]),
                ),
            );
        } catch {
            setItems([]);
            setItemStates({});
        } finally {
            setLoadingItems(false);
        }
    }

    useEffect(() => {
        if (!initialPurchaseOrder) {
            return;
        }

        let cancelled = false;

        submit(purchaseOrderInvoiceItems(initialPurchaseOrder.uuid))
            .then((response) => {
                if (cancelled) {
                    return;
                }

                const data = (response as { data: PurchaseOrderItemOption[] })
                    .data;
                setItems(data);
                setItemStates(
                    Object.fromEntries(
                        data.map((item) => [item.id, emptyItemState()]),
                    ),
                );
            })
            .catch(() => {
                if (!cancelled) {
                    setItems([]);
                    setItemStates({});
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setLoadingItems(false);
                }
            });

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function handlePurchaseOrderChange(
        id: string,
        option?: PurchaseOrderOption,
    ): Promise<void> {
        setPurchaseOrderId(id);
        setPurchaseOrderUuid(option?.uuid ?? '');
        setCurrencySymbol(
            option ? (option.currency.symbol ?? option.currency.iso_code) : '',
        );
        setItems([]);
        setItemStates({});

        if (option) {
            await fetchItems(option.uuid);
        }
    }

    function updateItemState(id: number, changes: Partial<ItemState>): void {
        setItemStates((current) => ({
            ...current,
            [id]: { ...(current[id] ?? emptyItemState()), ...changes },
        }));
    }

    function fillAllRemaining(): void {
        setItemStates((current) =>
            Object.fromEntries(
                items.map((item) => [
                    item.id,
                    {
                        ...(current[item.id] ?? emptyItemState()),
                        quantity_invoiced: String(item.remaining_to_invoice),
                    },
                ]),
            ),
        );
    }

    const submittableItems = items.filter((item) => {
        const state = itemStates[item.id];

        return !!state && (Number(state.quantity_invoiced) || 0) > 0;
    });

    const submittableIndexByItemId = new Map(
        submittableItems.map((item, index) => [item.id, index]),
    );

    const subtotal = items.reduce((sum, item) => {
        const state = itemStates[item.id] ?? emptyItemState();

        return (
            sum +
            (Number(state.quantity_invoiced) || 0) * Number(item.unit_price)
        );
    }, 0);
    const discountAmount = calculateDiscount(
        subtotal,
        discountType,
        discountValue,
    );
    const discountedSubtotal = subtotal - discountAmount;
    const selectedTax = taxes.find((tax) => String(tax.id) === taxId);
    const taxAmount = selectedTax
        ? selectedTax.type === 'percentage'
            ? (discountedSubtotal * Number(selectedTax.rate)) / 100
            : Number(selectedTax.rate)
        : 0;
    const total = discountedSubtotal + taxAmount;

    return (
        <>
            <Head title="New Purchase Invoice" />

            <div className="mx-auto w-full max-w-5xl space-y-6 p-4">
                <Heading
                    title="New Purchase Invoice"
                    description="Bill a vendor against an approved purchase order"
                />

                <Form noValidate {...store.form()} className="space-y-6">
                    {({ processing, errors }) => (
                        <>
                            <div className="space-y-6">
                                <h2 className="text-base font-semibold">
                                    Details
                                </h2>
                                <div className="grid gap-2">
                                    <Label htmlFor="purchase_order_id">
                                        Purchase order
                                    </Label>
                                    <input
                                        type="hidden"
                                        name="purchase_order_id"
                                        value={purchaseOrderId}
                                    />
                                    <AsyncCombobox<PurchaseOrderOption>
                                        id="purchase_order_id"
                                        value={purchaseOrderId}
                                        onValueChange={
                                            handlePurchaseOrderChange
                                        }
                                        searchUrl={searchPurchaseOrders().url}
                                        getOptionId={(purchaseOrder) =>
                                            String(purchaseOrder.id)
                                        }
                                        getOptionLabel={(purchaseOrder) =>
                                            `${purchaseOrder.purchase_order_code} — ${purchaseOrder.vendor.name}`
                                        }
                                        initialOption={initialPurchaseOrder}
                                        placeholder="Select an approved purchase order"
                                    />
                                    <InputError
                                        message={errors.purchase_order_id}
                                    />
                                </div>

                                <div className="grid gap-2 sm:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="invoice_date">
                                            Invoice date
                                        </Label>
                                        <Input
                                            id="invoice_date"
                                            type="date"
                                            name="invoice_date"
                                            defaultValue={todayDate()}
                                        />
                                        <InputError
                                            message={errors.invoice_date}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="due_date">
                                            Due date
                                        </Label>
                                        <Input
                                            id="due_date"
                                            type="date"
                                            name="due_date"
                                            defaultValue={defaultDueDate()}
                                        />
                                        <InputError message={errors.due_date} />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="remarks">Remarks</Label>
                                    <Textarea
                                        id="remarks"
                                        name="remarks"
                                        placeholder="Optional"
                                        rows={3}
                                    />
                                    <InputError message={errors.remarks} />
                                </div>
                            </div>

                            <div>
                                <div className="mb-4 flex items-center justify-between">
                                    <h2 className="text-base font-semibold">
                                        Items
                                    </h2>
                                    {!loadingItems && items.length > 0 && (
                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={fillAllRemaining}
                                        >
                                            <ReceiptText />
                                            Invoice all remaining
                                        </Button>
                                    )}
                                </div>
                                <InputError message={errors.items} />

                                {!purchaseOrderUuid && (
                                    <p className="text-sm text-muted-foreground">
                                        Select a purchase order to list its line
                                        items.
                                    </p>
                                )}

                                {purchaseOrderUuid && loadingItems && (
                                    <div className="flex items-center justify-center py-10">
                                        <Spinner />
                                    </div>
                                )}

                                {purchaseOrderUuid &&
                                    !loadingItems &&
                                    items.length > 0 && (
                                        <div className="overflow-hidden rounded-xl border border-border/50">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>
                                                            Product
                                                        </TableHead>
                                                        <TableHead>
                                                            Unit price
                                                        </TableHead>
                                                        <TableHead>
                                                            Ordered
                                                        </TableHead>
                                                        <TableHead>
                                                            Invoiced so far
                                                        </TableHead>
                                                        <TableHead>
                                                            Remaining
                                                        </TableHead>
                                                        <TableHead>
                                                            Invoice qty
                                                        </TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {items.map((item) => {
                                                        const state =
                                                            itemStates[
                                                                item.id
                                                            ] ??
                                                            emptyItemState();
                                                        const submittableIndex =
                                                            submittableIndexByItemId.get(
                                                                item.id,
                                                            );
                                                        const errorPrefix =
                                                            submittableIndex !==
                                                            undefined
                                                                ? `items.${submittableIndex}`
                                                                : null;

                                                        return (
                                                            <TableRow
                                                                key={item.id}
                                                            >
                                                                <TableCell className="font-medium">
                                                                    {
                                                                        item
                                                                            .product
                                                                            .product_code
                                                                    }{' '}
                                                                    &mdash;{' '}
                                                                    {
                                                                        item
                                                                            .product
                                                                            .name
                                                                    }
                                                                </TableCell>
                                                                <TableCell>
                                                                    {formatNumber(
                                                                        item.unit_price,
                                                                    )}
                                                                </TableCell>
                                                                <TableCell>
                                                                    {formatNumber(
                                                                        item.quantity,
                                                                    )}{' '}
                                                                    {item.unit}
                                                                </TableCell>
                                                                <TableCell>
                                                                    {formatNumber(
                                                                        item.invoiced,
                                                                    )}{' '}
                                                                    {item.unit}
                                                                </TableCell>
                                                                <TableCell>
                                                                    {formatNumber(
                                                                        item.remaining_to_invoice,
                                                                    )}{' '}
                                                                    {item.unit}
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Input
                                                                        type="number"
                                                                        step="1"
                                                                        min="0"
                                                                        className="w-24"
                                                                        value={
                                                                            state.quantity_invoiced
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            updateItemState(
                                                                                item.id,
                                                                                {
                                                                                    quantity_invoiced:
                                                                                        e
                                                                                            .target
                                                                                            .value,
                                                                                },
                                                                            )
                                                                        }
                                                                    />
                                                                    <InputError
                                                                        message={
                                                                            errorPrefix
                                                                                ? errors[
                                                                                      `${errorPrefix}.quantity_invoiced`
                                                                                  ]
                                                                                : undefined
                                                                        }
                                                                    />
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    )}

                                {submittableItems.map((item, idx) => (
                                    <div key={item.id}>
                                        <input
                                            type="hidden"
                                            name={`items[${idx}][purchase_order_item_id]`}
                                            value={item.id}
                                        />
                                        <input
                                            type="hidden"
                                            name={`items[${idx}][quantity_invoiced]`}
                                            value={
                                                itemStates[item.id]
                                                    ?.quantity_invoiced ?? '0'
                                            }
                                        />
                                    </div>
                                ))}
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
                                                setDiscountValue(e.target.value)
                                            }
                                            disabled={discountType === 'none'}
                                            placeholder="Optional"
                                        />
                                        <InputError
                                            message={errors.discount_value}
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
                                            {formatNumber(discountAmount)}
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
                                        <dt>Total</dt>
                                        <dd>
                                            {currencySymbol}{' '}
                                            {formatNumber(total)}
                                        </dd>
                                    </div>
                                </dl>
                            </div>

                            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                    asChild
                                >
                                    <Link href={index()}>
                                        <X /> Cancel
                                    </Link>
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing && <Spinner />}
                                    Create purchase invoice
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}

PurchaseInvoicesCreate.layout = {
    breadcrumbs: [
        { title: 'Purchase Invoices', href: index() },
        { title: 'New', href: create() },
    ],
};
