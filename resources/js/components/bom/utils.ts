import { formatNumber } from '@/lib/utils';
import type {
    BomItemProp,
    BomSubgroupProp,
    GroupState,
    LineItem,
    SubgroupState,
} from './types';

export const units = [
    'Pcs',
    'Unit',
    'Set',
    'Box',
    'Roll',
    'Meter',
    'Kg',
    'Liter',
    'Pack',
    'Other',
];

export function emptyItem(): LineItem {
    return {
        product_id: '',
        product: null,
        description: '',
        brand: '',
        quantity: '1',
        unit: '',
        unit_cost: '0',
        discount_type: 'none',
        discount_value: '',
    };
}

export function emptySubgroup(): SubgroupState {
    return {
        name: '',
        items: [],
        draft: emptyItem(),
        editingItemIndex: null,
    };
}

export function emptyGroup(): GroupState {
    return {
        name: '',
        items: [],
        draft: emptyItem(),
        editingItemIndex: null,
        subgroups: [],
    };
}

export function toLineItem(item: BomItemProp): LineItem {
    return {
        product_id: String(item.product_id),
        product: item.product,
        description: item.description ?? '',
        brand: item.brand,
        quantity: item.quantity,
        unit: item.unit,
        unit_cost: item.unit_cost,
        discount_type: item.discount_type ?? 'none',
        discount_value: item.discount_value ?? '',
    };
}

export function toSubgroupState(subgroup: BomSubgroupProp): SubgroupState {
    return {
        name: subgroup.name,
        items: subgroup.items.map(toLineItem),
        draft: emptyItem(),
        editingItemIndex: null,
    };
}

export function discountLabel(item: LineItem): string {
    if (item.discount_type === 'none' || item.discount_value === '') {
        return '—';
    }

    return item.discount_type === 'percentage'
        ? `${item.discount_value}%`
        : formatNumber(Number(item.discount_value));
}

export function applyDiscount(
    lineTotal: number,
    discountType: string,
    discountValue: string,
): number {
    if (discountType === 'none' || discountValue === '') {
        return lineTotal;
    }

    const value = Number(discountValue);

    return discountType === 'percentage'
        ? (lineTotal * value) / 100
        : Math.max(0, lineTotal - Math.min(lineTotal, value));
}

export function calculateItemTotalCost(item: LineItem): number {
    const quantity = Number(item.quantity) || 0;
    const unitCost = Number(item.unit_cost) || 0;

    return applyDiscount(quantity * unitCost, item.discount_type, item.discount_value);
}

export function calculateItemsSubtotal(items: LineItem[]): number {
    return items.reduce((sum, item) => sum + calculateItemTotalCost(item), 0);
}
