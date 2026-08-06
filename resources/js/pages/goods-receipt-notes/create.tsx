import { Form, Head, Link, useHttp } from '@inertiajs/react';
import { CheckCheck, X } from 'lucide-react';
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
import { create, index, store } from '@/routes/goods-receipt-notes';
import { search as searchPurchaseOrders } from '@/routes/purchase-orders';
import { index as purchaseOrderItems } from '@/routes/purchase-orders/items';

type PurchaseOrderOption = {
    id: number;
    uuid: string;
    purchase_order_code: string;
    vendor: { id: number; name: string };
};

type PurchaseOrderItemOption = {
    id: number;
    product: { id: number; product_code: string; name: string };
    quantity: string;
    unit: string;
    received: number;
    remaining: number;
};

type ItemState = {
    quantity_accepted: string;
    quantity_rejected: string;
    rejection_reason: string;
};

type Props = {
    initialPurchaseOrder: PurchaseOrderOption | null;
};

function todayDate(): string {
    return new Date().toISOString().slice(0, 10);
}

function emptyItemState(): ItemState {
    return {
        quantity_accepted: '0',
        quantity_rejected: '0',
        rejection_reason: '',
    };
}

export default function GoodsReceiptNotesCreate({
    initialPurchaseOrder,
}: Props) {
    const { submit } = useHttp();

    const [purchaseOrderId, setPurchaseOrderId] = useState(
        initialPurchaseOrder ? String(initialPurchaseOrder.id) : '',
    );
    const [purchaseOrderUuid, setPurchaseOrderUuid] = useState(
        initialPurchaseOrder?.uuid ?? '',
    );
    const [poItems, setPoItems] = useState<PurchaseOrderItemOption[]>([]);
    const [itemStates, setItemStates] = useState<Record<number, ItemState>>({});
    const [loadingItems, setLoadingItems] = useState(!!initialPurchaseOrder);

    async function fetchItems(uuid: string): Promise<void> {
        setLoadingItems(true);

        try {
            const response = (await submit(purchaseOrderItems(uuid))) as {
                data: PurchaseOrderItemOption[];
            };
            setPoItems(response.data);
            setItemStates(
                Object.fromEntries(
                    response.data.map((item) => [item.id, emptyItemState()]),
                ),
            );
        } catch {
            setPoItems([]);
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

        submit(purchaseOrderItems(initialPurchaseOrder.uuid))
            .then((response) => {
                if (cancelled) {
                    return;
                }

                const data = (response as { data: PurchaseOrderItemOption[] })
                    .data;
                setPoItems(data);
                setItemStates(
                    Object.fromEntries(
                        data.map((item) => [item.id, emptyItemState()]),
                    ),
                );
            })
            .catch(() => {
                if (!cancelled) {
                    setPoItems([]);
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
        setPoItems([]);
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
                poItems.map((item) => [
                    item.id,
                    {
                        ...(current[item.id] ?? emptyItemState()),
                        quantity_accepted: String(item.remaining),
                        quantity_rejected: '0',
                    },
                ]),
            ),
        );
    }

    function rejectAllRemaining(): void {
        setItemStates((current) =>
            Object.fromEntries(
                poItems.map((item) => [
                    item.id,
                    {
                        ...(current[item.id] ?? emptyItemState()),
                        quantity_accepted: '0',
                        quantity_rejected: String(item.remaining),
                    },
                ]),
            ),
        );
    }

    const submittableItems = poItems.filter((item) => {
        const state = itemStates[item.id];

        return (
            !!state &&
            (Number(state.quantity_accepted) || 0) +
                (Number(state.quantity_rejected) || 0) >
                0
        );
    });

    const submittableIndexByItemId = new Map(
        submittableItems.map((item, index) => [item.id, index]),
    );

    return (
        <>
            <Head title="New Goods Receipt Note" />

            <div className="mx-auto w-full max-w-4xl space-y-6 p-4">
                <Heading
                    title="New Goods Receipt Note"
                    description="Record goods received against an approved purchase order"
                />

                <Form {...store.form()} className="space-y-6">
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
                                        getOptionId={(po) => String(po.id)}
                                        getOptionLabel={(po) =>
                                            `${po.purchase_order_code} — ${po.vendor.name}`
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
                                        <Label htmlFor="received_date">
                                            Received date
                                        </Label>
                                        <Input
                                            id="received_date"
                                            type="date"
                                            name="received_date"
                                            defaultValue={todayDate()}
                                        />
                                        <InputError
                                            message={errors.received_date}
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
                                <div className="mb-4 flex items-center justify-between">
                                    <h2 className="text-base font-semibold">
                                        Items
                                    </h2>
                                    {!loadingItems && poItems.length > 0 && (
                                        <div className="flex gap-2">
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="sm"
                                                onClick={rejectAllRemaining}
                                            >
                                                <X />
                                                Reject all remaining
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="default"
                                                size="sm"
                                                onClick={fillAllRemaining}
                                            >
                                                <CheckCheck />
                                                Accept all remaining
                                            </Button>
                                        </div>
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
                                    poItems.length > 0 && (
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
                                                            Received so far
                                                        </TableHead>
                                                        <TableHead>
                                                            Remaining
                                                        </TableHead>
                                                        <TableHead>
                                                            Accepted
                                                        </TableHead>
                                                        <TableHead>
                                                            Rejected
                                                        </TableHead>
                                                        <TableHead>
                                                            Rejection reason
                                                        </TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {poItems.map((item) => {
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
                                                                        item.received,
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
                                                                            state.quantity_accepted
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            updateItemState(
                                                                                item.id,
                                                                                {
                                                                                    quantity_accepted:
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
                                                                                      `${errorPrefix}.quantity_accepted`
                                                                                  ]
                                                                                : undefined
                                                                        }
                                                                    />
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Input
                                                                        type="number"
                                                                        step="0.01"
                                                                        min="0"
                                                                        className="w-24"
                                                                        value={
                                                                            state.quantity_rejected
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            updateItemState(
                                                                                item.id,
                                                                                {
                                                                                    quantity_rejected:
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
                                                                                      `${errorPrefix}.quantity_rejected`
                                                                                  ]
                                                                                : undefined
                                                                        }
                                                                    />
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Input
                                                                        className="w-40"
                                                                        placeholder="Optional"
                                                                        value={
                                                                            state.rejection_reason
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            updateItemState(
                                                                                item.id,
                                                                                {
                                                                                    rejection_reason:
                                                                                        e
                                                                                            .target
                                                                                            .value,
                                                                                },
                                                                            )
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
                                            name={`items[${idx}][quantity_accepted]`}
                                            value={
                                                itemStates[item.id]
                                                    ?.quantity_accepted ?? '0'
                                            }
                                        />
                                        <input
                                            type="hidden"
                                            name={`items[${idx}][quantity_rejected]`}
                                            value={
                                                itemStates[item.id]
                                                    ?.quantity_rejected ?? '0'
                                            }
                                        />
                                        <input
                                            type="hidden"
                                            name={`items[${idx}][rejection_reason]`}
                                            value={
                                                itemStates[item.id]
                                                    ?.rejection_reason ?? ''
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
                                    Create goods receipt note
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}

GoodsReceiptNotesCreate.layout = {
    breadcrumbs: [
        { title: 'Goods Receipt Notes', href: index() },
        { title: 'New', href: create() },
    ],
};
