import { Form, Head, Link, setLayoutProps } from '@inertiajs/react';
import { ArrowLeft, Pencil, Trash2, X } from 'lucide-react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import { formatDateTime } from '@/lib/utils';
import { destroy, edit, index, show } from '@/routes/payment-term-templates';

type PaymentTermTemplate = {
    id: number;
    uuid: string;
    name: string;
    content: string;
    created_at: string;
    updated_at: string;
};

type Props = {
    paymentTermTemplate: PaymentTermTemplate;
};

export default function PaymentTermTemplatesShow({
    paymentTermTemplate,
}: Props) {
    setLayoutProps({
        breadcrumbs: [
            { title: 'Payment Term Templates', href: index() },
            {
                title: paymentTermTemplate.name,
                href: show(paymentTermTemplate),
            },
        ],
    });

    return (
        <>
            <Head title={paymentTermTemplate.name} />

            <div className="mx-auto w-full max-w-5xl space-y-6 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <Heading
                        title={paymentTermTemplate.name}
                        description="Payment term template details"
                    />

                    <div className="flex flex-col gap-2 sm:flex-row">
                        <Button
                            variant="destructive"
                            asChild
                            className="w-full sm:w-auto"
                        >
                            <Link href={index()}>
                                <ArrowLeft />
                                Back to Templates
                            </Link>
                        </Button>

                        <Button asChild className="w-full sm:w-auto">
                            <Link href={edit(paymentTermTemplate)}>
                                <Pencil />
                                Edit Template
                            </Link>
                        </Button>
                    </div>
                </div>

                <div>
                    <h2 className="mb-4 text-base font-semibold">Details</h2>
                    <dl className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Created at
                            </dt>
                            <dd className="font-medium">
                                {formatDateTime(paymentTermTemplate.created_at)}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Last updated
                            </dt>
                            <dd className="font-medium">
                                {formatDateTime(paymentTermTemplate.updated_at)}
                            </dd>
                        </div>
                    </dl>
                </div>

                <div>
                    <h2 className="mb-4 text-base font-semibold">Content</h2>
                    <div
                        className="rich-text-content rounded-lg border border-border/50 p-4"
                        dangerouslySetInnerHTML={{
                            __html: paymentTermTemplate.content,
                        }}
                    />
                </div>

                <div className="space-y-4 rounded-lg border border-destructive/50 p-4">
                    <h2 className="text-base font-semibold text-destructive dark:text-destructive-foreground">
                        Danger Zone
                    </h2>
                    <div className="flex flex-col gap-4 rounded-lg border border-red-100 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-red-200/10 dark:bg-red-700/10">
                        <div className="space-y-0.5 text-red-600 dark:text-red-100">
                            <p className="font-medium">Delete this template</p>
                            <p className="text-sm">
                                Once deleted, this template cannot be restored.
                                Quotations that already snapshotted its content
                                are unaffected.
                            </p>
                        </div>

                        <Dialog>
                            <DialogTrigger asChild>
                                <Button
                                    variant="destructive"
                                    className="w-full sm:w-auto"
                                >
                                    <Trash2 />
                                    Delete Template
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogTitle>
                                    Delete &quot;{paymentTermTemplate.name}
                                    &quot;?
                                </DialogTitle>
                                <DialogDescription>
                                    This action cannot be undone. This template
                                    will be permanently deleted.
                                </DialogDescription>

                                <Form
                                    {...destroy.form(paymentTermTemplate)}
                                    options={{ preserveScroll: true }}
                                >
                                    {({ processing }) => (
                                        <DialogFooter className="gap-2">
                                            <DialogClose asChild>
                                                <Button
                                                    variant="ghost"
                                                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                >
                                                    <X /> Cancel
                                                </Button>
                                            </DialogClose>

                                            <Button
                                                variant="destructive"
                                                disabled={processing}
                                                asChild
                                            >
                                                <button type="submit">
                                                    {processing && <Spinner />}
                                                    Delete Template
                                                </button>
                                            </Button>
                                        </DialogFooter>
                                    )}
                                </Form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </div>
        </>
    );
}
