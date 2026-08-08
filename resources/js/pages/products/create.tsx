import { Form, Head, Link } from '@inertiajs/react';
import { useState } from 'react';
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
import { create, index, store } from '@/routes/products';

const brands = [
    'Schneider Electric',
    'ABB',
    'Siemens',
    'Legrand',
    'Mitsubishi Electric',
    'Omron',
    'Fuji Electric',
    'LS Electric',
    'Hager',
    'Chint',
    'Other',
];

const units = [
    'Pcs',
    'Unit',
    'Set',
    'Box',
    'Roll',
    'Meter',
    'Kg',
    'Liter',
    'Pack',
    'Other',
];

export default function ProductsCreate() {
    const [brand, setBrand] = useState(brands[0]);
    const [unit, setUnit] = useState(units[0]);
    const [type, setType] = useState('goods');
    const [status, setStatus] = useState('active');

    return (
        <>
            <Head title="New Product" />

            <div className="mx-auto w-full max-w-5xl space-y-6 p-4">
                <Heading
                    title="New Product"
                    description="Add a new product for your organization"
                />

                <Form {...store.form()} className="space-y-6">
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    required
                                    autoFocus
                                    placeholder="e.g. MCB 1 Phase 10A"
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="reference_number">
                                    Reference number
                                </Label>
                                <Input
                                    id="reference_number"
                                    name="reference_number"
                                    required
                                    placeholder="e.g. REF-00012345"
                                />
                                <InputError message={errors.reference_number} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="descriptions">
                                    Descriptions
                                </Label>
                                <Textarea
                                    id="descriptions"
                                    name="descriptions"
                                    required
                                    placeholder="Describe this product"
                                />
                                <InputError message={errors.descriptions} />
                            </div>

                            <div className="grid gap-2 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="brand">Brand</Label>
                                    <input
                                        type="hidden"
                                        name="brand"
                                        value={brand}
                                    />
                                    <Select
                                        value={brand}
                                        onValueChange={setBrand}
                                    >
                                        <SelectTrigger
                                            id="brand"
                                            className="w-full"
                                        >
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {brands.map((option) => (
                                                <SelectItem
                                                    key={option}
                                                    value={option}
                                                >
                                                    {option}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.brand} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="unit">Unit</Label>
                                    <input
                                        type="hidden"
                                        name="unit"
                                        value={unit}
                                    />
                                    <Select
                                        value={unit}
                                        onValueChange={setUnit}
                                    >
                                        <SelectTrigger
                                            id="unit"
                                            className="w-full"
                                        >
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {units.map((option) => (
                                                <SelectItem
                                                    key={option}
                                                    value={option}
                                                >
                                                    {option}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.unit} />
                                </div>
                            </div>

                            <div className="grid gap-2 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="price">Price</Label>
                                    <Input
                                        id="price"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        name="price"
                                        placeholder="Optional"
                                    />
                                    <InputError message={errors.price} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="cost">Cost</Label>
                                    <Input
                                        id="cost"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        name="cost"
                                        placeholder="Optional"
                                    />
                                    <InputError message={errors.cost} />
                                </div>
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
                                            <SelectItem value="goods">
                                                Goods
                                            </SelectItem>
                                            <SelectItem value="service">
                                                Service
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.type} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="status">Status</Label>
                                    <input
                                        type="hidden"
                                        name="status"
                                        value={status}
                                    />
                                    <Select
                                        value={status}
                                        onValueChange={setStatus}
                                    >
                                        <SelectTrigger
                                            id="status"
                                            className="w-full"
                                        >
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="active">
                                                Active
                                            </SelectItem>
                                            <SelectItem value="inactive">
                                                Inactive
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.status} />
                                </div>
                            </div>

                            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                <Button type="button" variant="outline" asChild>
                                    <Link href={index()}>Cancel</Link>
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing && <Spinner />}
                                    Create product
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}

ProductsCreate.layout = {
    breadcrumbs: [
        { title: 'Products', href: index() },
        { title: 'New', href: create() },
    ],
};
