import { Form, Head, Link, setLayoutProps, useHttp } from '@inertiajs/react';
import { useEffect, useState } from 'react';
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
import { edit, index, show, update } from '@/routes/goods-receipt-notes';
import { index as purchaseOrderItems } from '@/routes/purchase-orders/items';

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

type GoodsReceiptNoteItemProp = {
    id: number;
    purchase_order_item_id: number | null;
    quantity_accepted: string;
    quantity_rejected: string;
    rejection_reason: string | null;
};

type GoodsReceiptNote = {
    id: number;
    uuid: string;
    grn_code: string;
    status: string;
    received_date: string;
    remarks: string | null;
    purchase_order: {
        id: number;
        uuid: string;
        purchase_order_code: string;
        vendor: { id: number; name: string };
    };
    items: GoodsReceiptNoteItemProp[];
};

type Props = {
    goodsReceiptNote: GoodsReceiptNote;
};

function emptyItemState(): ItemState {
    return {
        quantity_accepted: '0',
        quantity_rejected: '0',
        rejection_reason: '',
    };
}

export default function GoodsReceiptNotesEdit({ goodsReceiptNote }: Props) {
    setLayoutProps({
        breadcrumbs: [
            { title: 'Goods Receipt Notes', href: index() },
            {
                title: goodsReceiptNote.grn_code,
                href: show(goodsReceiptNote),
            },
            { title: 'Edit', href: edit(goodsReceiptNote) },
        ],
    });

    const { submit } = useHttp();

    const [poItems, setPoItems] = useState<PurchaseOrderItemOption[]>([]);
    const [itemStates, setItemStates] = useState<Record<number, ItemState>>({});
    const [loadingItems, setLoadingItems] = useState(true);

    useEffect(() => {
        let cancelled = false;

        async function load(): Promise<void> {
            try {
                const response = (await submit(
                    purchaseOrderItems(goodsReceiptNote.purchase_order.uuid),
                )) as { data: PurchaseOrderItemOption[] };

                if (cancelled) {
                    return;
                }

                setPoItems(response.data);

                const existingByPoItemId = new Map(
                    goodsReceiptNote.items
                        .filter((item) => item.purchase_order_item_id !== null)
                        .map((item) => [
                            item.purchase_order_item_id as number,
                            item,
                        ]),
                );

                setItemStates(
                    Object.fromEntries(
                        response.data.map((item) => {
                            const existing = existingByPoItemId.get(item.id);

                            return [
                                item.id,
                                existing
                                    ? {
                                          quantity_accepted:
                                              existing.quantity_accepted,
                                          quantity_rejected:
                                              existing.quantity_rejected,
                                          rejection_reason:
                                              existing.rejection_reason ?? '',
                                      }
                                    : emptyItemState(),
                            ];
                        }),
                    ),
                );
            } catch {
                if (!cancelled) {
                    setPoItems([]);
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
            <Head title={`Edit ${goodsReceiptNote.grn_code}`} />

            <div className="mx-auto w-full max-w-4xl space-y-6 p-4">
                <Heading
                    title={`Edit ${goodsReceiptNote.grn_code}`}
                    description="Update this goods receipt note"
                />

                <Form {...update.form(goodsReceiptNote)} className="space-y-6">
                    {({ processing, errors }) => (
                        <>
                            <div className="space-y-6">
                                <h2 className="text-base font-semibold">
                                    Details
                                </h2>
                                <div className="grid gap-2">
                                    <Label>Purchase order</Label>
                                    <input
                                        type="hidden"
                                        name="purchase_order_id"
                                        value={
                                            goodsReceiptNote.purchase_order.id
                                        }
                                    />
                                    <p className="rounded-md border border-sidebar-border/70 px-3 py-2 text-sm text-muted-foreground dark:border-sidebar-border">
                                        {
                                            goodsReceiptNote.purchase_order
                                                .purchase_order_code
                                        }{' '}
                                        &mdash;{' '}
                                        {
                                            goodsReceiptNote.purchase_order
                                                .vendor.name
                                        }
                                    </p>
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
                                            defaultValue={goodsReceiptNote.received_date.slice(
                                                0,
                                                10,
                                            )}
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
                                        defaultValue={
                                            goodsReceiptNote.remarks ?? ''
                                        }
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

                                {!loadingItems && poItems.length > 0 && (
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
                                    <Link href={show(goodsReceiptNote)}>
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
