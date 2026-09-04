import { Form, Head, Link, setLayoutProps } from '@inertiajs/react';
import { ArrowLeft, Pencil, Trash2, X } from 'lucide-react';
import Heading from '@/components/heading';
import { StatusBadge } from '@/components/project-badge';
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
import { destroy, edit, index, show } from '@/routes/taxes';

type Tax = {
    id: number;
    uuid: string;
    name: string;
    code: string;
    rate: string;
    type: string;
    created_at: string;
    updated_at: string;
};

type Props = {
    tax: Tax;
};

export default function TaxesShow({ tax }: Props) {
    setLayoutProps({
        breadcrumbs: [
            { title: 'Taxes', href: index() },
            { title: tax.name, href: show(tax) },
        ],
    });

    return (
        <>
            <Head title={tax.name} />

            <div className="mx-auto w-full max-w-5xl space-y-6 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <Heading title={tax.name} description="Tax details" />

                    <div className="flex flex-col gap-2 sm:flex-row">
                        <Button
                            variant="destructive"
                            asChild
                            className="w-full sm:w-auto"
                        >
                            <Link href={index()}>
                                <ArrowLeft />
                                Back to Taxes
                            </Link>
                        </Button>

                        <Button asChild className="w-full sm:w-auto">
                            <Link href={edit(tax)}>
                                <Pencil />
                                Edit Tax
                            </Link>
                        </Button>
                    </div>
                </div>

                <div>
                    <h2 className="mb-4 text-base font-semibold">Details</h2>
                    <dl className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Code
                            </dt>
                            <dd className="font-medium">{tax.code}</dd>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Name
                            </dt>
                            <dd className="font-medium">{tax.name}</dd>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Rate
                            </dt>
                            <dd className="font-medium">
                                {tax.type === 'percentage'
                                    ? `${tax.rate}%`
                                    : tax.rate}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Type
                            </dt>
                            <dd>
                                <StatusBadge
                                    category="tax_type"
                                    value={tax.type}
                                />
                            </dd>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Created at
                            </dt>
                            <dd className="font-medium">
                                {formatDateTime(tax.created_at)}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Last updated
                            </dt>
                            <dd className="font-medium">
                                {formatDateTime(tax.updated_at)}
                            </dd>
                        </div>
                    </dl>
                </div>

                <div className="space-y-4 rounded-lg border border-destructive/50 p-4">
                    <h2 className="text-base font-semibold text-destructive dark:text-destructive-foreground">
                        Danger Zone
                    </h2>
                    <div className="flex flex-col gap-4 rounded-lg border border-red-100 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-red-200/10 dark:bg-red-700/10">
                        <div className="space-y-0.5 text-red-600 dark:text-red-100">
                            <p className="font-medium">Delete this tax</p>
                            <p className="text-sm">
                                Once deleted, this tax cannot be restored.
                            </p>
                        </div>

                        <Dialog>
                            <DialogTrigger asChild>
                                <Button
                                    variant="destructive"
                                    className="w-full sm:w-auto"
                                >
                                    <Trash2 />
                                    Delete Tax
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogTitle>
                                    Delete &quot;{tax.name}&quot;?
                                </DialogTitle>
                                <DialogDescription>
                                    This action cannot be undone. This tax will
                                    be permanently deleted.
                                </DialogDescription>

                                <Form
                                    {...destroy.form(tax)}
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
                                                    Delete Tax
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
