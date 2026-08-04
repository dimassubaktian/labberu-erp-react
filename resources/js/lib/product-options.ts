export type ProductOption = {
    id: number;
    name: string;
    product_code: string;
    reference_number: string;
    descriptions: string;
    brand: string;
    unit: string;
    price: string;
    cost: string;
    type: string;
};

export function productLabel(
    product: ProductOption | null | undefined,
): string {
    if (!product) {
        return '—';
    }

    const typeLabel =
        product.type.charAt(0).toUpperCase() + product.type.slice(1);
    const base = `[${typeLabel}] ${product.name}`;

    return product.reference_number
        ? `${base} (${product.reference_number})`
        : base;
}
