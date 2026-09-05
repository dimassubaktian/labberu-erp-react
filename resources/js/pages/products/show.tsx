import { Form, Head, Link, setLayoutProps } from '@inertiajs/react';
import {
    ArrowLeft,
    Boxes,
    CircleDollarSign,
    Package,
    Pencil,
    Tags,
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
import { formatDateTime, formatNumber } from '@/lib/utils';
import { destroy, edit, index, show } from '@/routes/products';
import { index as stockMovementsIndex } from '@/routes/stock-movements';

type Product = {
    id: number;
    uuid: string;
    product_code: string;
    name: string;
    reference_number: string;
    descriptions: string;
    brand: string;
    unit: string;
    type: string;
    price: string;
    cost: string;
    status: string;
    created_at: string;
    updated_at: string;
};

type Props = {
    product: Product;
    stockOnHand: number;
};

export default function ProductsShow({ product, stockOnHand }: Props) {
    setLayoutProps({
        breadcrumbs: [
            { title: 'Products', href: index() },
            { title: product.name, href: show(product) },
        ],
    });

    return (
        <>
            <Head title={product.name} />

            <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6">
                <section className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
                    <div className="flex flex-col gap-6 bg-linear-to-br from-primary/[0.08] via-card to-card p-5 sm:p-6 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex min-w-0 items-start gap-4">
                            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:size-14">
                                <Package className="size-6 sm:size-7" />
                            </div>
                            <div className="min-w-0 space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Product profile
                                    </p>
                                    <StatusBadge
                                        category="product_type"
                                        value={product.type}
                                    />
                                    <StatusBadge
                                        category="active"
                                        value={product.status}
                                    />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-semibold tracking-tight break-words sm:text-3xl">
                                        {product.name}
                                    </h1>
                                    <p className="mt-1 text-sm break-words text-muted-foreground sm:text-base">
                                        {product.brand || 'Unbranded product'}
                                        {product.reference_number &&
                                            ` · Ref. ${product.reference_number}`}
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
                                    Back to Products
                                </Link>
                            </Button>

                            <Button asChild className="w-full sm:w-auto">
                                <Link href={edit(product)}>
                                    <Pencil />
                                    Edit Product
                                </Link>
                            </Button>
                        </div>
                    </div>

                    <div className="grid divide-y divide-border/60 border-t border-border/60 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                        <div className="space-y-1 p-4 sm:p-5">
                            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                Product code
                            </p>
                            <p className="font-semibold break-all">
                                {product.product_code}
                            </p>
                        </div>
                        <div className="space-y-1 p-4 sm:p-5">
                            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                Selling price
                            </p>
                            <p className="font-semibold">
                                {formatNumber(product.price)}
                            </p>
                        </div>
                        <div className="space-y-1 p-4 sm:p-5">
                            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                {product.type === 'goods'
                                    ? 'Available on hand'
                                    : 'Unit of measure'}
                            </p>
                            <p className="font-semibold">
                                {product.type === 'goods'
                                    ? `${formatNumber(stockOnHand)} ${product.unit}`
                                    : product.unit}
                            </p>
                        </div>
                    </div>
                </section>

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)]">
                    <Card>
                        <CardHeader className="border-b border-border/60 pb-5">
                            <CardTitle>Product details</CardTitle>
                            <CardDescription>
                                Identification, classification, and lifecycle
                                information.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
                                <div className="space-y-1">
                                    <dt className="text-sm text-muted-foreground">
                                        Product code
                                    </dt>
                                    <dd className="font-medium">
                                        {product.product_code}
                                    </dd>
                                </div>
                                <div className="space-y-1">
                                    <dt className="text-sm text-muted-foreground">
                                        Reference number
                                    </dt>
                                    <dd className="font-medium">
                                        {product.reference_number || '—'}
                                    </dd>
                                </div>
                                <div className="space-y-1">
                                    <dt className="text-sm text-muted-foreground">
                                        Brand
                                    </dt>
                                    <dd className="font-medium">
                                        {product.brand || '—'}
                                    </dd>
                                </div>
                                <div className="space-y-1">
                                    <dt className="text-sm text-muted-foreground">
                                        Unit of measure
                                    </dt>
                                    <dd className="font-medium">
                                        {product.unit || '—'}
                                    </dd>
                                </div>
                                <div className="space-y-2">
                                    <dt className="text-sm text-muted-foreground">
                                        Product type
                                    </dt>
                                    <dd>
                                        <StatusBadge
                                            category="product_type"
                                            value={product.type}
                                        />
                                    </dd>
                                </div>
                                <div className="space-y-2">
                                    <dt className="text-sm text-muted-foreground">
                                        Status
                                    </dt>
                                    <dd>
                                        <StatusBadge
                                            category="active"
                                            value={product.status}
                                        />
                                    </dd>
                                </div>
                                <div className="space-y-1">
                                    <dt className="text-sm text-muted-foreground">
                                        Created at
                                    </dt>
                                    <dd className="font-medium">
                                        {formatDateTime(product.created_at)}
                                    </dd>
                                </div>
                                <div className="space-y-1">
                                    <dt className="text-sm text-muted-foreground">
                                        Last updated
                                    </dt>
                                    <dd className="font-medium">
                                        {formatDateTime(product.updated_at)}
                                    </dd>
                                </div>
                            </dl>
                        </CardContent>
                    </Card>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader className="border-b border-border/60 pb-5">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-lg bg-muted p-2 text-muted-foreground">
                                        <CircleDollarSign className="size-5" />
                                    </div>
                                    <div>
                                        <CardTitle>Pricing</CardTitle>
                                        <CardDescription>
                                            Current commercial values.
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="grid gap-5 pt-6 sm:grid-cols-2 lg:grid-cols-1">
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">
                                        Selling price
                                    </p>
                                    <p className="text-xl font-semibold tracking-tight">
                                        {formatNumber(product.price)}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">
                                        Cost
                                    </p>
                                    <p className="text-xl font-semibold tracking-tight">
                                        {formatNumber(product.cost)}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {product.type === 'goods' && (
                            <Card>
                                <CardHeader className="border-b border-border/60 pb-5">
                                    <div className="flex items-center gap-3">
                                        <div className="rounded-lg bg-muted p-2 text-muted-foreground">
                                            <Boxes className="size-5" />
                                        </div>
                                        <div>
                                            <CardTitle>Inventory</CardTitle>
                                            <CardDescription>
                                                Current stock availability.
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-5 pt-6">
                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            On hand
                                        </p>
                                        <p className="mt-1 text-2xl font-semibold tracking-tight">
                                            {formatNumber(stockOnHand)}{' '}
                                            <span className="text-base font-medium text-muted-foreground">
                                                {product.unit}
                                            </span>
                                        </p>
                                    </div>
                                    <Button variant="outline" asChild>
                                        <Link
                                            href={stockMovementsIndex({
                                                query: {
                                                    product: product.uuid,
                                                },
                                            })}
                                        >
                                            View movements
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>

                <Card>
                    <CardHeader className="border-b border-border/60 pb-5">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-muted p-2 text-muted-foreground">
                                <Tags className="size-5" />
                            </div>
                            <div>
                                <CardTitle>Description</CardTitle>
                                <CardDescription>
                                    Notes and specifications for this product.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <p className="max-w-4xl text-sm leading-6 whitespace-pre-line text-muted-foreground">
                            {product.descriptions ||
                                'No product description has been added yet.'}
                        </p>
                    </CardContent>
                </Card>

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
                                Permanently remove this product and its detail
                                record.
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col gap-4 rounded-lg border border-red-100 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-red-200/10 dark:bg-red-700/10">
                        <div className="space-y-0.5 text-red-600 dark:text-red-100">
                            <p className="font-medium">Delete this product</p>
                            <p className="text-sm">
                                Once deleted, this product cannot be restored.
                            </p>
                        </div>

                        <Dialog>
                            <DialogTrigger asChild>
                                <Button
                                    variant="destructive"
                                    className="w-full sm:w-auto"
                                >
                                    <Trash2 />
                                    Delete Product
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogTitle>
                                    Delete &quot;{product.name}&quot;?
                                </DialogTitle>
                                <DialogDescription>
                                    This action cannot be undone. This product
                                    will be permanently deleted.
                                </DialogDescription>

                                <Form
                                    {...destroy.form(product)}
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
                                                    Delete Product
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
