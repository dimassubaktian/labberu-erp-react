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
import { edit, index, show, update } from '@/routes/taxes';

type Tax = {
    id: number;
    uuid: string;
    name: string;
    code: string;
    rate: string;
    type: string;
};

type Props = {
    tax: Tax;
};

export default function TaxesEdit({ tax }: Props) {
    const [type, setType] = useState(tax.type);

    setLayoutProps({
        breadcrumbs: [
            { title: 'Taxes', href: index() },
            { title: tax.name, href: show(tax) },
            { title: 'Edit', href: edit(tax) },
        ],
    });

    return (
        <>
            <Head title={`Edit ${tax.name}`} />

            <div className="mx-auto w-full max-w-2xl space-y-6 p-4">
                <Heading
                    title="Edit Tax"
                    description="Update this tax's details"
                />

                <Form {...update.form(tax)} className="space-y-6">
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
                                        defaultValue={tax.code}
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
                                        defaultValue={tax.name}
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
                                        step="0.01"
                                        min="0"
                                        required
                                        defaultValue={tax.rate}
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
                                <Button type="button" variant="outline" asChild>
                                    <Link href={show(tax)}>Cancel</Link>
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
