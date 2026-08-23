import { Form, Head, Link, setLayoutProps } from '@inertiajs/react';
import { X } from 'lucide-react';
import { useState } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { edit, index, show, update } from '@/routes/equipment-locations';

type EquipmentLocation = {
    id: number;
    uuid: string;
    name: string;
    code: string | null;
    description: string | null;
    is_active: boolean;
};

type Props = {
    location: EquipmentLocation;
};

export default function EquipmentLocationsEdit({ location }: Props) {
    const [isActive, setIsActive] = useState(location.is_active);

    setLayoutProps({
        breadcrumbs: [
            { title: 'Equipment Locations', href: index() },
            { title: location.name, href: show(location) },
            { title: 'Edit', href: edit(location) },
        ],
    });

    return (
        <>
            <Head title={`Edit ${location.name}`} />

            <div className="mx-auto w-full max-w-5xl space-y-6 p-4">
                <Heading
                    title="Edit Equipment Location"
                    description="Update this location's details"
                />

                <Form {...update.form(location)} className="space-y-6">
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
                                        defaultValue={location.name}
                                        placeholder="e.g. Warehouse A - Shelf 3"
                                    />
                                    <InputError message={errors.name} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="code">Code</Label>
                                    <Input
                                        id="code"
                                        name="code"
                                        defaultValue={location.code ?? ''}
                                        placeholder="Optional, e.g. WH-A-03"
                                    />
                                    <InputError message={errors.code} />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    name="description"
                                    defaultValue={location.description ?? ''}
                                    placeholder="Optional"
                                />
                                <InputError message={errors.description} />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="hidden"
                                    name="is_active"
                                    value={isActive ? '1' : '0'}
                                />
                                <Checkbox
                                    id="is_active"
                                    checked={isActive}
                                    onCheckedChange={(checked) =>
                                        setIsActive(checked === true)
                                    }
                                />
                                <Label htmlFor="is_active">Active</Label>
                                <InputError message={errors.is_active} />
                            </div>

                            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                    asChild
                                >
                                    <Link href={show(location)}>
                                        <X /> Cancel
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
