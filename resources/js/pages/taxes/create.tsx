import { Form, Head, Link } from '@inertiajs/react';
import { X } from 'lucide-react';
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
import { create, index, store } from '@/routes/taxes';

export default function TaxesCreate() {
    const [type, setType] = useState('percentage');

    return (
        <>
            <Head title="New Tax" />

            <div className="mx-auto w-full max-w-2xl space-y-6 p-4">
                <Heading
                    title="New Tax"
                    description="Add a new tax for your organization"
                />

                <Form noValidate {...store.form()} className="space-y-6">
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="code">Code</Label>
                                    <Input
                                        id="code"
                                        name="code"
                                        required
                                        autoFocus
                                        className="uppercase"
                                        placeholder="e.g. VAT"
                                    />
                                    <InputError message={errors.code} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="name">Name</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        required
                                        placeholder="e.g. Value Added Tax"
                                    />
                                    <InputError message={errors.name} />
                                </div>
                            </div>

                            <div className="grid gap-2 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="rate">Rate</Label>
                                    <Input
                                        id="rate"
                                        name="rate"
                                        type="number"
                                        step="1"
                                        min="0"
                                        required
                                        placeholder="e.g. 11"
                                    />
                                    <InputError message={errors.rate} />
                                </div>

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
                                            <SelectItem value="percentage">
                                                Percentage
                                            </SelectItem>
                                            <SelectItem value="fixed">
                                                Fixed
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.type} />
                                </div>
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
                                    Create tax
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}

TaxesCreate.layout = {
    breadcrumbs: [
        { title: 'Taxes', href: index() },
        { title: 'New', href: create() },
    ],
};
