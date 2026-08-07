import { Form, Head, Link, setLayoutProps } from '@inertiajs/react';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
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

            <div className="mx-auto w-full max-w-5xl space-y-6 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <Heading
                        title={product.name}
                        description="Product details"
                    />

                    <div className="flex flex-col gap-2 sm:flex-row">
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

                <div>
                    <h2 className="mb-4 text-base font-semibold">Details</h2>
                    <dl className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Product code
                            </dt>
                            <dd className="font-medium">
                                {product.product_code}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Name
                            </dt>
                            <dd className="font-medium">{product.name}</dd>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Reference number
                            </dt>
                            <dd className="font-medium">
                                {product.reference_number}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Brand
                            </dt>
                            <dd className="font-medium">{product.brand}</dd>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Unit
                            </dt>
                            <dd className="font-medium">{product.unit}</dd>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Price
                            </dt>
                            <dd className="font-medium">
                                {formatNumber(product.price)}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Cost
                            </dt>
                            <dd className="font-medium">
                                {formatNumber(product.cost)}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Type
                            </dt>
                            <dd>
                                <Badge
                                    variant="secondary"
                                    className="mt-1 capitalize"
                                >
                                    {product.type}
                                </Badge>
                            </dd>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Status
                            </dt>
                            <dd>
                                <Badge
                                    variant={
                                        product.status === 'active'
                                            ? 'secondary'
                                            : 'outline'
                                    }
                                    className="mt-1 capitalize"
                                >
                                    {product.status}
                                </Badge>
                            </dd>
                        </div>

                        <div className="sm:col-span-2">
                            <dt className="text-sm text-muted-foreground">
                                Descriptions
                            </dt>
                            <dd className="font-medium whitespace-pre-line">
                                {product.descriptions}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Created at
                            </dt>
                            <dd className="font-medium">
                                {formatDateTime(product.created_at)}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Last updated
                            </dt>
                            <dd className="font-medium">
                                {formatDateTime(product.updated_at)}
                            </dd>
                        </div>
                    </dl>
                </div>

                {product.type === 'goods' && (
                    <div>
                        <h2 className="mb-4 text-base font-semibold">Stock</h2>
                        <dl className="flex items-center justify-between">
                            <div>
                                <dt className="text-sm text-muted-foreground">
                                    On hand
                                </dt>
                                <dd className="font-medium">
                                    {formatNumber(stockOnHand)} {product.unit}
                                </dd>
                            </div>

                            <Button variant="outline" asChild>
                                <Link
                                    href={stockMovementsIndex({
                                        query: { product: product.uuid },
                                    })}
                                >
                                    View Movements
                                </Link>
                            </Button>
                        </dl>
                    </div>
                )}

                <div className="space-y-4 rounded-lg border border-destructive/50 p-4">
                    <h2 className="text-base font-semibold text-destructive dark:text-destructive-foreground">
                        Danger Zone
                    </h2>
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
                                                <Button variant="secondary">
                                                    Cancel
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
                </div>
            </div>
        </>
    );
}
