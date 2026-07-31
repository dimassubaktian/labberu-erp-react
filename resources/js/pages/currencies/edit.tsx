import { Form, Head, Link, setLayoutProps } from '@inertiajs/react';
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
import { edit, index, show, update } from '@/routes/currencies';

type Currency = {
    id: number;
    uuid: string;
    iso_code: string;
    name: string;
    symbol: string | null;
    status: string;
};

type Props = {
    currency: Currency;
};

export default function CurrenciesEdit({ currency }: Props) {
    const [status, setStatus] = useState(currency.status);

    setLayoutProps({
        breadcrumbs: [
            { title: 'Currencies', href: index() },
            { title: currency.name, href: show(currency) },
            { title: 'Edit', href: edit(currency) },
        ],
    });

    return (
        <>
            <Head title={`Edit ${currency.name}`} />

            <div className="mx-auto w-full max-w-2xl space-y-6 p-4">
                <Heading
                    title="Edit Currency"
                    description="Update this currency's details"
                />

                <Form {...update.form(currency)} className="space-y-6">
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
                                        defaultValue={currency.iso_code}
                                        placeholder="e.g. USD"
                                    />
                                    <InputError message={errors.iso_code} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="symbol">Symbol</Label>
                                    <Input
                                        id="symbol"
                                        name="symbol"
                                        defaultValue={currency.symbol ?? ''}
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
                                    defaultValue={currency.name}
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

                            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                <Button type="button" variant="outline" asChild>
                                    <Link href={show(currency)}>Cancel</Link>
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
