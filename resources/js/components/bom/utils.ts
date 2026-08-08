import { formatNumber } from '@/lib/utils';
import type {
    BomItemProp,
    BomLocationKey,
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

    return applyDiscount(
        quantity * unitCost,
        item.discount_type,
        item.discount_value,
    );
}

export function calculateItemsSubtotal(items: LineItem[]): number {
    return items.reduce((sum, item) => sum + calculateItemTotalCost(item), 0);
}

export function encodeBomLocation(location: BomLocationKey): string {
    switch (location.type) {
        case 'ungrouped':
            return 'ungrouped';
        case 'subgroup':
            return `subgroup:${location.subgroupIndex}`;
        case 'group':
            return `group:${location.groupIndex}`;
        case 'group-subgroup':
            return `group-subgroup:${location.groupIndex}:${location.subgroupIndex}`;
    }
}

export function decodeBomLocation(value: string): BomLocationKey {
    const [type, a, b] = value.split(':');

    switch (type) {
        case 'subgroup':
            return { type: 'subgroup', subgroupIndex: Number(a) };
        case 'group':
            return { type: 'group', groupIndex: Number(a) };
        case 'group-subgroup':
            return {
                type: 'group-subgroup',
                groupIndex: Number(a),
                subgroupIndex: Number(b),
            };
        default:
            return { type: 'ungrouped' };
    }
}

export function bomLocationsEqual(
    a: BomLocationKey,
    b: BomLocationKey,
): boolean {
    return encodeBomLocation(a) === encodeBomLocation(b);
}

export function listBomDestinations(
    groups: GroupState[],
    subgroups: SubgroupState[],
): { value: string; label: string }[] {
    const destinations: { value: string; label: string }[] = [
        { value: 'ungrouped', label: 'Ungrouped materials' },
    ];

    groups.forEach((group, groupIndex) => {
        const groupName = group.name || `Group ${groupIndex + 1}`;
        destinations.push({ value: `group:${groupIndex}`, label: groupName });

        group.subgroups.forEach((subgroup, subgroupIndex) => {
            const phaseName = subgroup.name || `Phase ${subgroupIndex + 1}`;
            destinations.push({
                value: `group-subgroup:${groupIndex}:${subgroupIndex}`,
                label: `${groupName} → ${phaseName}`,
            });
        });
    });

    subgroups.forEach((subgroup, subgroupIndex) => {
        const phaseName = subgroup.name || `Phase ${subgroupIndex + 1}`;
        destinations.push({
            value: `subgroup:${subgroupIndex}`,
            label: phaseName,
        });
    });

    return destinations;
}
