import { Form, Head, Link, setLayoutProps, useHttp } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { edit, index, show, update } from '@/routes/delivery-orders';
import { index as quotationItems } from '@/routes/quotations/items';

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

type DeliveryOrderItemProp = {
    id: number;
    quotation_item_id: number | null;
    quantity_delivered: string;
};

type DeliveryOrder = {
    id: number;
    uuid: string;
    do_code: string;
    status: string;
    delivery_date: string;
    remarks: string | null;
    quotation: {
        id: number;
        uuid: string;
        quotation_code: string;
        version_major: number;
        version_minor: number;
        project: { id: number; customer: { id: number; name: string } };
    };
    items: DeliveryOrderItemProp[];
};

type Props = {
    deliveryOrder: DeliveryOrder;
};

function emptyItemState(): ItemState {
    return { quantity_delivered: '0' };
}

export default function DeliveryOrdersEdit({ deliveryOrder }: Props) {
    setLayoutProps({
        breadcrumbs: [
            { title: 'Delivery Orders', href: index() },
            { title: deliveryOrder.do_code, href: show(deliveryOrder) },
            { title: 'Edit', href: edit(deliveryOrder) },
        ],
    });

    const { submit } = useHttp();

    const [items, setItems] = useState<QuotationItemOption[]>([]);
    const [itemStates, setItemStates] = useState<Record<number, ItemState>>({});
    const [loadingItems, setLoadingItems] = useState(true);

    useEffect(() => {
        let cancelled = false;

        async function load(): Promise<void> {
            try {
                const response = (await submit(
                    quotationItems(deliveryOrder.quotation.uuid),
                )) as { data: QuotationItemOption[] };

                if (cancelled) {
                    return;
                }

                setItems(response.data);

                const existingByQuotationItemId = new Map(
                    deliveryOrder.items
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
                                          quantity_delivered:
                                              existing.quantity_delivered,
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

        return !!state && (Number(state.quantity_delivered) || 0) > 0;
    });

    const submittableIndexByItemId = new Map(
        submittableItems.map((item, index) => [item.id, index]),
    );

    return (
        <>
            <Head title={`Edit ${deliveryOrder.do_code}`} />

            <div className="mx-auto w-full max-w-4xl space-y-6 p-4">
                <Heading
                    title={`Edit ${deliveryOrder.do_code}`}
                    description="Update this delivery order"
                />

                <Form {...update.form(deliveryOrder)} className="space-y-6">
                    {({ processing, errors }) => (
                        <>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Details</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid gap-2">
                                        <Label>Quotation</Label>
                                        <input
                                            type="hidden"
                                            name="quotation_id"
                                            value={deliveryOrder.quotation.id}
                                        />
                                        <p className="rounded-md border border-sidebar-border/70 px-3 py-2 text-sm text-muted-foreground dark:border-sidebar-border">
                                            {
                                                deliveryOrder.quotation
                                                    .quotation_code
                                            }{' '}
                                            v
                                            {
                                                deliveryOrder.quotation
                                                    .version_major
                                            }
                                            .
                                            {
                                                deliveryOrder.quotation
                                                    .version_minor
                                            }{' '}
                                            &mdash;{' '}
                                            {
                                                deliveryOrder.quotation.project
                                                    .customer.name
                                            }
                                        </p>
                                        <InputError
                                            message={errors.quotation_id}
                                        />
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
                                                defaultValue={deliveryOrder.delivery_date.slice(
                                                    0,
                                                    10,
                                                )}
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
                                            defaultValue={
                                                deliveryOrder.remarks ?? ''
                                            }
                                            placeholder="Optional"
                                            rows={3}
                                        />
                                        <InputError message={errors.remarks} />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Items</CardTitle>
                                </CardHeader>
                                <CardContent>
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
                                                        ?.quantity_delivered ??
                                                    '0'
                                                }
                                            />
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>

                            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                <Button type="button" variant="outline" asChild>
                                    <Link href={show(deliveryOrder)}>
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
