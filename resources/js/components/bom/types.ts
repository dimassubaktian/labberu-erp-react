import type { ProductOption } from '@/lib/product-options';

export type LineItem = {
    product_id: string;
    product: ProductOption | null;
    description: string;
    brand: string;
    quantity: string;
    unit: string;
    unit_cost: string;
    discount_type: string;
    discount_value: string;
};

export type BomLocationKey =
    | { type: 'ungrouped' }
    | { type: 'subgroup'; subgroupIndex: number }
    | { type: 'group'; groupIndex: number }
    | { type: 'group-subgroup'; groupIndex: number; subgroupIndex: number };

export type SubgroupState = {
    name: string;
    items: LineItem[];
    draft: LineItem;
    editingItemIndex: number | null;
};

export type GroupState = {
    name: string;
    items: LineItem[];
    draft: LineItem;
    editingItemIndex: number | null;
    subgroups: SubgroupState[];
};

export type BomItemProp = {
    product_id: number;
    description: string | null;
    brand: string;
    quantity: string;
    unit: string;
    unit_cost: string;
    discount_type: string | null;
    discount_value: string | null;
    product: ProductOption;
};

export type BomSubgroupProp = {
    name: string;
    items: BomItemProp[];
};

export type BomGroupProp = {
    name: string;
    items: BomItemProp[];
    subgroups: BomSubgroupProp[];
};

export type ImportFromBom = {
    remarks: string | null;
    overhead_percentage: string | null;
    selling_percentage: string | null;
    items: BomItemProp[];
    subgroups: BomSubgroupProp[];
    groups: BomGroupProp[];
};
