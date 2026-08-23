import { Form, Head, Link } from '@inertiajs/react';
import { X } from 'lucide-react';
import { useState } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { RichTextEditor } from '@/components/rich-text-editor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { create, index, store } from '@/routes/payment-term-templates';

export default function PaymentTermTemplatesCreate() {
    const [content, setContent] = useState('');

    return (
        <>
            <Head title="New Payment Term Template" />

            <div className="mx-auto w-full max-w-5xl space-y-6 p-4">
                <Heading
                    title="New Payment Term Template"
                    description="Add a reusable payment term template for quotations"
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
                                    placeholder="e.g. Standard Equipment Terms"
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="content">Content</Label>
                                <RichTextEditor
                                    id="content"
                                    name="content"
                                    value={content}
                                    onChange={setContent}
                                    error={errors.content}
                                />
                                <InputError message={errors.content} />
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
                                    Create template
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}

PaymentTermTemplatesCreate.layout = {
    breadcrumbs: [
        { title: 'Payment Term Templates', href: index() },
        { title: 'New', href: create() },
    ],
};
