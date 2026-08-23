import { Form, Head, Link, setLayoutProps } from '@inertiajs/react';
import { useState } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { RichTextEditor } from '@/components/rich-text-editor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { edit, index, show, update } from '@/routes/payment-term-templates';

type PaymentTermTemplate = {
    id: number;
    uuid: string;
    name: string;
    content: string;
};

type Props = {
    paymentTermTemplate: PaymentTermTemplate;
};

export default function PaymentTermTemplatesEdit({
    paymentTermTemplate,
}: Props) {
    const [content, setContent] = useState(paymentTermTemplate.content);

    setLayoutProps({
        breadcrumbs: [
            { title: 'Payment Term Templates', href: index() },
            {
                title: paymentTermTemplate.name,
                href: show(paymentTermTemplate),
            },
            { title: 'Edit', href: edit(paymentTermTemplate) },
        ],
    });

    return (
        <>
            <Head title={`Edit ${paymentTermTemplate.name}`} />

            <div className="mx-auto w-full max-w-5xl space-y-6 p-4">
                <Heading
                    title="Edit Payment Term Template"
                    description="Update this payment term template's details"
                />

                <Form
                    {...update.form(paymentTermTemplate)}
                    className="space-y-6"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    required
                                    autoFocus
                                    defaultValue={paymentTermTemplate.name}
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
                                <Button type="button" variant="outline" asChild>
                                    <Link href={show(paymentTermTemplate)}>
                                        Cancel
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
