import { Form, Head, Link, useHttp } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { AsyncCombobox } from '@/components/async-combobox';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { create, index, store } from '@/routes/delivery-orders';
import { search as searchQuotations } from '@/routes/quotations';
import { index as quotationItems } from '@/routes/quotations/items';

type QuotationOption = {
    id: number;
    uuid: string;
    quotation_code: string;
    version_major: number;
    version_minor: number;
    project: { id: number; customer: { id: number; name: string } };
};

type QuotationItemOption = {
    id: number;
    product: { id: number; product_code: string; name: string };
    quantity: string;
    unit: string;
    delivered: number;
    remaining: number;
};

type ItemState = {
    quantity_delivered: string;
};

type Props = {
    initialQuotation: QuotationOption | null;
};

function todayDate(): string {
    return new Date().toISOString().slice(0, 10);
}

function emptyItemState(): ItemState {
    return { quantity_delivered: '0' };
}

export default function DeliveryOrdersCreate({ initialQuotation }: Props) {
    const { submit } = useHttp();

    const [quotationId, setQuotationId] = useState(
        initialQuotation ? String(initialQuotation.id) : '',
    );
    const [quotationUuid, setQuotationUuid] = useState(
        initialQuotation?.uuid ?? '',
    );
    const [items, setItems] = useState<QuotationItemOption[]>([]);
    const [itemStates, setItemStates] = useState<Record<number, ItemState>>({});
    const [loadingItems, setLoadingItems] = useState(!!initialQuotation);

    async function fetchItems(uuid: string): Promise<void> {
        setLoadingItems(true);

        try {
            const response = (await submit(quotationItems(uuid))) as {
                data: QuotationItemOption[];
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
        if (!initialQuotation) {
            return;
        }

        let cancelled = false;

        submit(quotationItems(initialQuotation.uuid))
            .then((response) => {
                if (cancelled) {
                    return;
                }

                const data = (response as { data: QuotationItemOption[] }).data;
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

    async function handleQuotationChange(
        id: string,
        option?: QuotationOption,
    ): Promise<void> {
        setQuotationId(id);
        setQuotationUuid(option?.uuid ?? '');
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

    const submittableItems = items.filter((item) => {
        const state = itemStates[item.id];

        return !!state && (Number(state.quantity_delivered) || 0) > 0;
    });

    const submittableIndexByItemId = new Map(
        submittableItems.map((item, index) => [item.id, index]),
    );

    return (
        <>
            <Head title="New Delivery Order" />

            <div className="mx-auto w-full max-w-4xl space-y-6 p-4">
                <Heading
                    title="New Delivery Order"
                    description="Record goods delivered against an approved quotation"
                />

                <Form {...store.form()} className="space-y-6">
                    {({ processing, errors }) => (
                        <>
                            <div className="space-y-6">
                                <h2 className="text-base font-semibold">
                                    Details
                                </h2>
                                <div className="grid gap-2">
                                    <Label htmlFor="quotation_id">
                                        Quotation
                                    </Label>
                                    <input
                                        type="hidden"
                                        name="quotation_id"
                                        value={quotationId}
                                    />
                                    <AsyncCombobox<QuotationOption>
                                        id="quotation_id"
                                        value={quotationId}
                                        onValueChange={handleQuotationChange}
                                        searchUrl={searchQuotations().url}
                                        getOptionId={(quotation) =>
                                            String(quotation.id)
                                        }
                                        getOptionLabel={(quotation) =>
                                            `${quotation.quotation_code} v${quotation.version_major}.${quotation.version_minor} — ${quotation.project.customer.name}`
                                        }
                                        initialOption={initialQuotation}
                                        placeholder="Select an approved quotation"
                                    />
                                    <InputError message={errors.quotation_id} />
                                </div>

                                <div className="grid gap-2 sm:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="delivery_date">
                                            Delivery date
                                        </Label>
                                        <Input
                                            id="delivery_date"
                                            type="date"
                                            name="delivery_date"
                                            defaultValue={todayDate()}
                                        />
                                        <InputError
                                            message={errors.delivery_date}
                                        />
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
                                <h2 className="mb-4 text-base font-semibold">
                                    Items
                                </h2>
                                <InputError message={errors.items} />

                                {!quotationUuid && (
                                    <p className="text-sm text-muted-foreground">
                                        Select a quotation to list its line
                                        items.
                                    </p>
                                )}

                                {quotationUuid && loadingItems && (
                                    <div className="flex items-center justify-center py-10">
                                        <Spinner />
                                    </div>
                                )}

                                {quotationUuid &&
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
                                                            Ordered
                                                        </TableHead>
                                                        <TableHead>
                                                            Delivered so far
                                                        </TableHead>
                                                        <TableHead>
                                                            Remaining
                                                        </TableHead>
                                                        <TableHead>
                                                            Delivered qty
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
                                                                        item.remaining,
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
                                                                            state.quantity_delivered
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            updateItemState(
                                                                                item.id,
                                                                                {
                                                                                    quantity_delivered:
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
                                                                                      `${errorPrefix}.quantity_delivered`
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
                                            name={`items[${idx}][quantity_delivered]`}
                                            value={
                                                itemStates[item.id]
                                                    ?.quantity_delivered ?? '0'
                                            }
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                <Button type="button" variant="outline" asChild>
                                    <Link href={index()}>Cancel</Link>
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing && <Spinner />}
                                    Create delivery order
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}

DeliveryOrdersCreate.layout = {
    breadcrumbs: [
        { title: 'Delivery Orders', href: index() },
        { title: 'New', href: create() },
    ],
};
