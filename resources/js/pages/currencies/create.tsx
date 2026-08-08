import { Form, Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { create, index, store } from '@/routes/currencies';

export default function CurrenciesCreate() {
    const [status, setStatus] = useState('active');
    const [baseCurrency, setBaseCurrency] = useState(false);

    return (
        <>
            <Head title="New Currency" />

            <div className="mx-auto w-full max-w-5xl space-y-6 p-4">
                <Heading
                    title="New Currency"
                    description="Add a new currency for your organization"
                />

                <Form {...store.form()} className="space-y-6">
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="iso_code">ISO code</Label>
                                    <Input
                                        id="iso_code"
                                        name="iso_code"
                                        required
                                        autoFocus
                                        maxLength={3}
                                        className="uppercase"
                                        placeholder="e.g. USD"
                                    />
                                    <InputError message={errors.iso_code} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="symbol">Symbol</Label>
                                    <Input
                                        id="symbol"
                                        name="symbol"
                                        placeholder="Optional, e.g. $"
                                    />
                                    <InputError message={errors.symbol} />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    required
                                    placeholder="e.g. US Dollar"
                                />
                                <InputError message={errors.name} />
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

                            <div className="flex items-center gap-2">
                                <input
                                    type="hidden"
                                    name="base_currency"
                                    value={baseCurrency ? '1' : '0'}
                                />
                                <Checkbox
                                    id="base_currency"
                                    checked={baseCurrency}
                                    onCheckedChange={(checked) =>
                                        setBaseCurrency(checked === true)
                                    }
                                />
                                <Label htmlFor="base_currency">
                                    Set as base currency
                                </Label>
                                <InputError message={errors.base_currency} />
                            </div>

                            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                <Button type="button" variant="outline" asChild>
                                    <Link href={index()}>Cancel</Link>
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing && <Spinner />}
                                    Create currency
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}

CurrenciesCreate.layout = {
    breadcrumbs: [
        { title: 'Currencies', href: index() },
        { title: 'New', href: create() },
    ],
};
