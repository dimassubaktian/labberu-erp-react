import { Form, Head, Link, setLayoutProps } from '@inertiajs/react';
import {
    ArrowLeft,
    CalendarDays,
    Coins,
    Pencil,
    ShieldCheck,
    Trash2,
    X,
} from 'lucide-react';
import { StatusBadge } from '@/components/project-badge';
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
import { destroy, edit, index, show } from '@/routes/currencies';

type Currency = {
    id: number;
    uuid: string;
    iso_code: string;
    name: string;
    symbol: string | null;
    status: string;
    base_currency: boolean;
    created_at: string;
    updated_at: string;
};

type Props = {
    currency: Currency;
};

export default function CurrenciesShow({ currency }: Props) {
    setLayoutProps({
        breadcrumbs: [
            { title: 'Currencies', href: index() },
            { title: currency.name, href: show(currency) },
        ],
    });

    return (
        <>
            <Head title={currency.name} />

            <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6">
                <section className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
                    <div className="flex flex-col gap-6 bg-linear-to-br from-primary/[0.08] via-card to-card p-5 sm:p-6 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex min-w-0 items-start gap-4">
                            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:size-14">
                                <Coins className="size-6 sm:size-7" />
                            </div>
                            <div className="min-w-0 space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Currency profile
                                    </p>
                                    <StatusBadge
                                        category="active"
                                        value={currency.status}
                                    />
                                    {currency.base_currency && (
                                        <StatusBadge
                                            category="base"
                                            value="base"
                                            label="Base currency"
                                        />
                                    )}
                                </div>
                                <div>
                                    <h1 className="text-2xl font-semibold tracking-tight break-words sm:text-3xl">
                                        {currency.name}
                                    </h1>
                                    <p className="mt-1 text-sm text-muted-foreground sm:text-base">
                                        {currency.iso_code}
                                        {currency.symbol
                                            ? ` · ${currency.symbol}`
                                            : ''}
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
                                    Back to Currencies
                                </Link>
                            </Button>

                            <Button asChild className="w-full sm:w-auto">
                                <Link href={edit(currency)}>
                                    <Pencil />
                                    Edit Currency
                                </Link>
                            </Button>
                        </div>
                    </div>

                    <div className="grid divide-y divide-border/60 border-t border-border/60 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                        <div className="space-y-1 p-4 sm:p-5">
                            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                ISO code
                            </p>
                            <p className="font-semibold">{currency.iso_code}</p>
                        </div>
                        <div className="space-y-1 p-4 sm:p-5">
                            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                Currency symbol
                            </p>
                            <p className="font-semibold">
                                {currency.symbol ?? 'Not specified'}
                            </p>
                        </div>
                        <div className="space-y-1 p-4 sm:p-5">
                            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                Role
                            </p>
                            <p className="font-semibold">
                                {currency.base_currency
                                    ? 'Base currency'
                                    : 'Foreign currency'}
                            </p>
                        </div>
                    </div>
                </section>

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
                    <Card>
                        <CardHeader className="border-b border-border/60 pb-5">
                            <CardTitle>Currency details</CardTitle>
                            <CardDescription>
                                Identification and availability settings for
                                this currency.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
                                <div className="space-y-1">
                                    <dt className="text-sm text-muted-foreground">
                                        Currency name
                                    </dt>
                                    <dd className="font-medium">
                                        {currency.name}
                                    </dd>
                                </div>
                                <div className="space-y-1">
                                    <dt className="text-sm text-muted-foreground">
                                        ISO code
                                    </dt>
                                    <dd className="font-medium">
                                        {currency.iso_code}
                                    </dd>
                                </div>
                                <div className="space-y-1">
                                    <dt className="text-sm text-muted-foreground">
                                        Symbol
                                    </dt>
                                    <dd className="font-medium">
                                        {currency.symbol ?? 'Not specified'}
                                    </dd>
                                </div>
                                <div className="space-y-2">
                                    <dt className="text-sm text-muted-foreground">
                                        Availability
                                    </dt>
                                    <dd>
                                        <StatusBadge
                                            category="active"
                                            value={currency.status}
                                        />
                                    </dd>
                                </div>
                            </dl>
                        </CardContent>
                    </Card>

                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
                        <Card>
                            <CardHeader className="border-b border-border/60 pb-5">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-lg bg-muted p-2 text-muted-foreground">
                                        <ShieldCheck className="size-5" />
                                    </div>
                                    <div>
                                        <CardTitle>Currency role</CardTitle>
                                        <CardDescription>
                                            How this currency is used in your
                                            organization.
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3 pt-6">
                                <p className="font-medium">
                                    {currency.base_currency
                                        ? 'This is the base currency.'
                                        : 'This is an additional currency.'}
                                </p>
                                <p className="text-sm leading-relaxed text-muted-foreground">
                                    {currency.base_currency
                                        ? 'Amounts and reporting use this currency as their primary reference.'
                                        : 'Use this currency when recording transactions and related documents.'}
                                </p>
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
                                            When this currency record was
                                            created and last updated.
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
                                        {formatDateTime(currency.created_at)}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">
                                        Last updated
                                    </p>
                                    <p className="font-medium">
                                        {formatDateTime(currency.updated_at)}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
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
                                Permanently remove this currency record.
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col gap-4 rounded-lg border border-red-100 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-red-200/10 dark:bg-red-700/10">
                        <div className="space-y-0.5 text-red-600 dark:text-red-100">
                            <p className="font-medium">Delete this currency</p>
                            <p className="text-sm">
                                Once deleted, this currency cannot be restored.
                            </p>
                        </div>

                        <Dialog>
                            <DialogTrigger asChild>
                                <Button
                                    variant="destructive"
                                    className="w-full sm:w-auto"
                                >
                                    <Trash2 />
                                    Delete Currency
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogTitle>
                                    Delete &quot;{currency.name}&quot;?
                                </DialogTitle>
                                <DialogDescription>
                                    This action cannot be undone. This currency
                                    will be permanently deleted.
                                </DialogDescription>

                                <Form
                                    {...destroy.form(currency)}
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
                                                    Delete Currency
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
