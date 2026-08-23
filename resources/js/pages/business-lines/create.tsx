import { Form, Head, Link } from '@inertiajs/react';
import { X } from 'lucide-react';
import { useRef, useState } from 'react';
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
import { create, index, store } from '@/routes/business-lines';

export default function BusinessLinesCreate() {
    const [status, setStatus] = useState('active');
    const createAnotherRef = useRef(false);
    const resetFieldsRef = useRef<(...fields: string[]) => void>(() => {});

    return (
        <>
            <Head title="New Business Line" />

            <div className="mx-auto w-full max-w-5xl space-y-6 p-4">
                <Heading
                    title="New Business Line"
                    description="Add a new business line to categorise projects"
                />

                <Form
                    {...store.form()}
                    transform={(data) => ({
                        ...data,
                        create_another: createAnotherRef.current,
                    })}
                    onSuccess={() => {
                        if (createAnotherRef.current) {
                            resetFieldsRef.current('name', 'description');
                        }
                    }}
                    className="space-y-6"
                >
                    {({ processing, errors, reset }) => {
                        resetFieldsRef.current = reset;

                        return (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Name</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        required
                                        autoFocus
                                        placeholder="e.g. Lab Testing"
                                    />
                                    <InputError message={errors.name} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="description">
                                        Description
                                    </Label>
                                    <Textarea
                                        id="description"
                                        name="description"
                                        placeholder="Optional"
                                    />
                                    <InputError message={errors.description} />
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
                                    <Button
                                        type="submit"
                                        variant="outline"
                                        disabled={processing}
                                        onClick={() => {
                                            createAnotherRef.current = true;
                                        }}
                                    >
                                        {processing && <Spinner />}
                                        Create & add another
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        onClick={() => {
                                            createAnotherRef.current = false;
                                        }}
                                    >
                                        {processing && <Spinner />}
                                        Create business line
                                    </Button>
                                </div>
                            </>
                        );
                    }}
                </Form>
            </div>
        </>
    );
}

BusinessLinesCreate.layout = {
    breadcrumbs: [
        { title: 'Business Lines', href: index() },
        { title: 'New', href: create() },
    ],
};
