import { Form, Head, Link } from '@inertiajs/react';
import { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { search as searchProducts } from '@/routes/products';
import { create, index, store } from '@/routes/stock-adjustments';

const reasons = [
    'Stock Count Correction',
    'Damage',
    'Loss or Theft',
    'Initial Stock Load',
    'Other',
];

type ProductOption = {
    id: number;
    name: string;
    product_code: string;
    reference_number: string;
    unit: string;
};

export default function StockAdjustmentsCreate() {
    const [productId, setProductId] = useState('');
    const [type, setType] = useState('increase');
    const [reason, setReason] = useState(reasons[0]);

    return (
        <>
            <Head title="New Stock Adjustment" />

            <div className="mx-auto w-full max-w-2xl space-y-6 p-4">
                <Heading
                    title="New Stock Adjustment"
                    description="Correct a product's stock on hand for a stock count, damage, loss, or initial load"
                />

                <Form {...store.form()} className="space-y-6">
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="product_id">Product</Label>
                                <input
                                    type="hidden"
                                    name="product_id"
                                    value={productId}
                                />
                                <AsyncCombobox<ProductOption>
                                    id="product_id"
                                    value={productId}
                                    onValueChange={setProductId}
                                    searchUrl={
                                        searchProducts({
                                            query: { type: 'goods' },
                                        }).url
                                    }
                                    getOptionId={(product) =>
                                        String(product.id)
                                    }
                                    getOptionLabel={(product) =>
                                        product.reference_number
                                            ? `${product.product_code} — ${product.name} (${product.reference_number})`
                                            : `${product.product_code} — ${product.name}`
                                    }
                                    placeholder="Select a product"
                                />
                                <InputError message={errors.product_id} />
                            </div>

                            <div className="grid gap-2 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="type">Type</Label>
                                    <input
                                        type="hidden"
                                        name="type"
                                        value={type}
                                    />
                                    <Select
                                        value={type}
                                        onValueChange={setType}
                                    >
                                        <SelectTrigger
                                            id="type"
                                            className="w-full"
                                        >
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="increase">
                                                Increase
                                            </SelectItem>
                                            <SelectItem value="decrease">
                                                Decrease
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.type} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="quantity">Quantity</Label>
                                    <Input
                                        id="quantity"
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        name="quantity"
                                        required
                                        placeholder="e.g. 10"
                                    />
                                    <InputError message={errors.quantity} />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="reason">Reason</Label>
                                <input
                                    type="hidden"
                                    name="reason"
                                    value={reason}
                                />
                                <Select
                                    value={reason}
                                    onValueChange={setReason}
                                >
                                    <SelectTrigger
                                        id="reason"
                                        className="w-full"
                                    >
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {reasons.map((option) => (
                                            <SelectItem
                                                key={option}
                                                value={option}
                                            >
                                                {option}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.reason} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="note">Note</Label>
                                <Textarea
                                    id="note"
                                    name="note"
                                    placeholder="Optional"
                                />
                                <InputError message={errors.note} />
                            </div>

                            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                <Button type="button" variant="outline" asChild>
                                    <Link href={index()}>Cancel</Link>
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing && <Spinner />}
                                    Save adjustment
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}

StockAdjustmentsCreate.layout = {
    breadcrumbs: [
        { title: 'Stock Adjustments', href: index() },
        { title: 'New', href: create() },
    ],
};
