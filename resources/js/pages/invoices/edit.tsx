import { Form, Head, Link, setLayoutProps, useHttp } from '@inertiajs/react';
import { useEffect, useState } from 'react';
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
import { edit, index, show, update } from '@/routes/invoices';
import { index as quotationItems } from '@/routes/quotations/items';

type QuotationItemOption = {
    id: number;
    product: { id: number; product_code: string; name: string };
    quantity: string;
    unit: string;
    unit_price: string;
    delivered: number;
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

type InvoiceItemProp = {
    id: number;
    quotation_item_id: number | null;
    quantity_invoiced: string;
};

type Invoice = {
    id: number;
    uuid: string;
    invoice_code: string;
    status: string;
    invoice_date: string;
    due_date: string;
    remarks: string | null;
    discount_type: string | null;
    discount_value: string | null;
    tax_id: number | null;
    quotation: {
        id: number;
        uuid: string;
        quotation_code: string;
        version_major: number;
        version_minor: number;
        project: { id: number; customer: { id: number; name: string } };
        currency: { id: number; iso_code: string; symbol: string | null };
    };
    items: InvoiceItemProp[];
};

type Props = {
    invoice: Invoice;
    taxes: TaxOption[];
};

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

export default function InvoicesEdit({ invoice, taxes }: Props) {
    setLayoutProps({
        breadcrumbs: [
            { title: 'Invoices', href: index() },
            { title: invoice.invoice_code, href: show(invoice) },
            { title: 'Edit', href: edit(invoice) },
        ],
    });

    const { submit } = useHttp();

    const currencySymbol =
        invoice.quotation.currency.symbol ??
        invoice.quotation.currency.iso_code;

    const [items, setItems] = useState<QuotationItemOption[]>([]);
    const [itemStates, setItemStates] = useState<Record<number, ItemState>>({});
    const [loadingItems, setLoadingItems] = useState(true);
    const [taxId, setTaxId] = useState(
        invoice.tax_id ? String(invoice.tax_id) : 'none',
    );
    const [discountType, setDiscountType] = useState(
        invoice.discount_type ?? 'none',
    );
    const [discountValue, setDiscountValue] = useState(
        invoice.discount_value ?? '',
    );

    useEffect(() => {
        let cancelled = false;

        async function load(): Promise<void> {
            try {
                const response = (await submit(
                    quotationItems(invoice.quotation.uuid),
                )) as { data: QuotationItemOption[] };

                if (cancelled) {
                    return;
                }

                setItems(response.data);

                const existingByQuotationItemId = new Map(
                    invoice.items
                        .filter((item) => item.quotation_item_id !== null)
                        .map((item) => [
                            item.quotation_item_id as number,
                            item,
                        ]),
                );

                setItemStates(
                    Object.fromEntries(
                        response.data.map((item) => {
                            const existing = existingByQuotationItemId.get(
                                item.id,
                            );

                            return [
                                item.id,
                                existing
                                    ? {
                                          quantity_invoiced:
                                              existing.quantity_invoiced,
                                      }
                                    : emptyItemState(),
                            ];
                        }),
                    ),
                );
            } catch {
                if (!cancelled) {
                    setItems([]);
                    setItemStates({});
                }
            } finally {
                if (!cancelled) {
                    setLoadingItems(false);
                }
            }
        }

        load();

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function updateItemState(id: number, changes: Partial<ItemState>): void {
        setItemStates((current) => ({
            ...current,
            [id]: { ...(current[id] ?? emptyItemState()), ...changes },
        }));
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
            <Head title={`Edit ${invoice.invoice_code}`} />

            <div className="mx-auto w-full max-w-4xl space-y-6 p-4">
                <Heading
                    title={`Edit ${invoice.invoice_code}`}
                    description="Update this invoice"
                />

                <Form {...update.form(invoice)} className="space-y-6">
                    {({ processing, errors }) => (
                        <>
                            <div className="space-y-6">
                                <h2 className="text-base font-semibold">
                                    Details
                                </h2>
                                <div className="grid gap-2">
                                    <Label>Quotation</Label>
                                    <input
                                        type="hidden"
                                        name="quotation_id"
                                        value={invoice.quotation.id}
                                    />
                                    <p className="rounded-md border border-sidebar-border/70 px-3 py-2 text-sm text-muted-foreground dark:border-sidebar-border">
                                        {invoice.quotation.quotation_code} v
                                        {invoice.quotation.version_major}.
                                        {invoice.quotation.version_minor}{' '}
                                        &mdash;{' '}
                                        {
                                            invoice.quotation.project.customer
                                                .name
                                        }
                                    </p>
                                    <InputError message={errors.quotation_id} />
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
                                            defaultValue={invoice.invoice_date.slice(
                                                0,
                                                10,
                                            )}
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
                                            defaultValue={invoice.due_date.slice(
                                                0,
                                                10,
                                            )}
                                        />
                                        <InputError message={errors.due_date} />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="remarks">Remarks</Label>
                                    <Textarea
                                        id="remarks"
                                        name="remarks"
                                        defaultValue={invoice.remarks ?? ''}
                                        placeholder="Optional"
                                        rows={3}
                                    />
                                    <InputError message={errors.remarks} />
                                </div>
                            </div>

                            <div>
                                <h2 className="mb-4 text-base font-semibold">
                                    Items
                                </h2>
                                <InputError message={errors.items} />

                                {loadingItems && (
                                    <div className="flex items-center justify-center py-10">
                                        <Spinner />
                                    </div>
                                )}

                                {!loadingItems && items.length > 0 && (
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
                                                        Delivered
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
                                                        itemStates[item.id] ??
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
                                                        <TableRow key={item.id}>
                                                            <TableCell className="font-medium">
                                                                {
                                                                    item.product
                                                                        .product_code
                                                                }{' '}
                                                                &mdash;{' '}
                                                                {
                                                                    item.product
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
                                                                    item.delivered,
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
                                                                    step="0.01"
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
                                            name={`items[${idx}][quotation_item_id]`}
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
                                            step="0.01"
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
                                    <div className="flex justify-between border-t border-sidebar-border/70 pt-2 text-base font-semibold dark:border-sidebar-border">
                                        <dt>Total</dt>
                                        <dd>
                                            {currencySymbol}{' '}
                                            {formatNumber(total)}
                                        </dd>
                                    </div>
                                </dl>
                            </div>

                            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                <Button type="button" variant="outline" asChild>
                                    <Link href={show(invoice)}>Cancel</Link>
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
