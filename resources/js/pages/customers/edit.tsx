import { Form, Head, Link, setLayoutProps } from '@inertiajs/react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { edit, index, show, update } from '@/routes/customers';

type Customer = {
    id: number;
    uuid: string;
    customer_code: string;
    name: string;
    attention: string | null;
    phone: string | null;
    fax: string | null;
    address: string | null;
    city: string | null;
    province: string | null;
    country: string | null;
    postal_code: string | null;
    remarks: string | null;
};

type Props = {
    customer: Customer;
};

export default function CustomersEdit({ customer }: Props) {
    setLayoutProps({
        breadcrumbs: [
            { title: 'Customers', href: index() },
            { title: customer.name, href: show(customer) },
            { title: 'Edit', href: edit(customer) },
        ],
    });

    return (
        <>
            <Head title={`Edit ${customer.name}`} />

            <div className="mx-auto w-full max-w-2xl space-y-6 p-4">
                <Heading
                    title="Edit Customer"
                    description="Update this customer's details"
                />

                <Form {...update.form(customer)} className="space-y-6">
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Name</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        required
                                        autoFocus
                                        defaultValue={customer.name}
                                        placeholder="e.g. Nusalink Bridge"
                                    />
                                    <InputError message={errors.name} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="attention">Attention</Label>
                                    <Input
                                        id="attention"
                                        name="attention"
                                        defaultValue={customer.attention ?? ''}
                                        placeholder="Optional, e.g. Jane Doe"
                                    />
                                    <InputError message={errors.attention} />
                                </div>
                            </div>

                            <div className="grid gap-2 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="phone">Phone</Label>
                                    <Input
                                        id="phone"
                                        name="phone"
                                        defaultValue={customer.phone ?? ''}
                                        placeholder="Optional"
                                    />
                                    <InputError message={errors.phone} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="fax">Fax</Label>
                                    <Input
                                        id="fax"
                                        name="fax"
                                        defaultValue={customer.fax ?? ''}
                                        placeholder="Optional"
                                    />
                                    <InputError message={errors.fax} />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="address">Address</Label>
                                <Textarea
                                    id="address"
                                    name="address"
                                    defaultValue={customer.address ?? ''}
                                    placeholder="Optional"
                                />
                                <InputError message={errors.address} />
                            </div>

                            <div className="grid gap-2 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="city">City</Label>
                                    <Input
                                        id="city"
                                        name="city"
                                        defaultValue={customer.city ?? ''}
                                        placeholder="Optional"
                                    />
                                    <InputError message={errors.city} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="province">Province</Label>
                                    <Input
                                        id="province"
                                        name="province"
                                        defaultValue={customer.province ?? ''}
                                        placeholder="Optional"
                                    />
                                    <InputError message={errors.province} />
                                </div>
                            </div>

                            <div className="grid gap-2 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="country">Country</Label>
                                    <Input
                                        id="country"
                                        name="country"
                                        defaultValue={customer.country ?? ''}
                                        placeholder="Optional"
                                    />
                                    <InputError message={errors.country} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="postal_code">
                                        Postal code
                                    </Label>
                                    <Input
                                        id="postal_code"
                                        name="postal_code"
                                        defaultValue={
                                            customer.postal_code ?? ''
                                        }
                                        placeholder="Optional"
                                    />
                                    <InputError message={errors.postal_code} />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="remarks">Remarks</Label>
                                <Textarea
                                    id="remarks"
                                    name="remarks"
                                    defaultValue={customer.remarks ?? ''}
                                    placeholder="Optional"
                                />
                                <InputError message={errors.remarks} />
                            </div>

                            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                <Button type="button" variant="outline" asChild>
                                    <Link href={show(customer)}>Cancel</Link>
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
