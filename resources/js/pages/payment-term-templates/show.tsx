import { Form, Head, Link, setLayoutProps } from '@inertiajs/react';
import {
    ArrowLeft,
    CalendarDays,
    FileText,
    Pencil,
    Trash2,
    X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
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

            <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6">
                <section className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
                    <div className="flex flex-col gap-6 bg-linear-to-br from-primary/[0.08] via-card to-card p-5 sm:p-6 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex min-w-0 items-start gap-4">
                            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:size-14">
                                <FileText className="size-6 sm:size-7" />
                            </div>
                            <div className="min-w-0 space-y-2">
                                <p className="text-sm font-medium text-muted-foreground">
                                    Payment term template
                                </p>
                                <div>
                                    <h1 className="text-2xl font-semibold tracking-tight break-words sm:text-3xl">
                                        {paymentTermTemplate.name}
                                    </h1>
                                    <p className="mt-1 text-sm text-muted-foreground sm:text-base">
                                        Reusable terms for quotations and
                                        customer agreements.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row lg:shrink-0">
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

                    <div className="grid divide-y divide-border/60 border-t border-border/60 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                        <div className="space-y-1 p-4 sm:p-5">
                            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                Template type
                            </p>
                            <p className="font-semibold">Standard terms</p>
                        </div>
                        <div className="space-y-1 p-4 sm:p-5">
                            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                Created at
                            </p>
                            <p className="font-semibold">
                                {formatDateTime(paymentTermTemplate.created_at)}
                            </p>
                        </div>
                        <div className="space-y-1 p-4 sm:p-5">
                            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                Last updated
                            </p>
                            <p className="font-semibold">
                                {formatDateTime(paymentTermTemplate.updated_at)}
                            </p>
                        </div>
                    </div>
                </section>

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)]">
                    <Card>
                        <CardHeader className="border-b border-border/60 pb-5">
                            <CardTitle>Terms and conditions</CardTitle>
                            <CardDescription>
                                The reusable wording applied to payment terms.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div
                                className="rich-text-content rounded-xl border border-border/60 bg-muted/20 p-4 sm:p-5"
                                dangerouslySetInnerHTML={{
                                    __html: paymentTermTemplate.content,
                                }}
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="border-b border-border/60 pb-5">
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-muted p-2 text-muted-foreground">
                                    <CalendarDays className="size-5" />
                                </div>
                                <div>
                                    <CardTitle>Record timeline</CardTitle>
                                    <CardDescription>
                                        Template record activity.
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-5 pt-6">
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">
                                    Created at
                                </p>
                                <p className="font-medium">
                                    {formatDateTime(
                                        paymentTermTemplate.created_at,
                                    )}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">
                                    Last updated
                                </p>
                                <p className="font-medium">
                                    {formatDateTime(
                                        paymentTermTemplate.updated_at,
                                    )}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <section className="space-y-4 rounded-2xl border border-destructive/30 bg-destructive/[0.02] p-4 sm:p-6">
                    <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-destructive/10 p-2 text-destructive">
                            <Trash2 className="size-5" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-destructive">
                                Danger zone
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Permanently remove this template from future
                                use.
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col gap-4 rounded-xl border border-red-100 bg-red-50/70 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-red-200/10 dark:bg-red-700/10">
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
                </section>
            </div>
        </>
    );
}
