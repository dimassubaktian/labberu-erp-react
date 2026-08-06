<?php

namespace App\Services;

use App\Models\Bom;
use App\Models\BomSubgroup;

class BomService
{
    /**
     * Create the BOM's ungrouped items, top-level phase subgroups, and hardware groups (each
     * with their own direct items and nested phase subgroups), then compute and persist the
     * BOM's main, overhead, total, and selling costs from the sum of it all.
     *
     * @param  array<string, mixed>  $data
     */
    public function syncGroupsAndItems(Bom $bom, array $data): void
    {
        $ungroupedTotal = $this->createItems($bom, $data['items'] ?? [], null, null);

        $topSubgroupsTotal = 0;

        foreach ($data['subgroups'] ?? [] as $index => $subgroupData) {
            $subgroup = $this->createSubgroup($bom, $subgroupData, null, $index);
            $topSubgroupsTotal += (float) $subgroup->subtotal;
        }

        $groupsTotal = 0;

        foreach ($data['groups'] ?? [] as $index => $groupData) {
            $group = $bom->groups()->create([
                'name' => $groupData['name'],
                'sort_order' => $index,
                'subtotal' => 0,
            ]);

            $directTotal = $this->createItems($bom, $groupData['items'] ?? [], $group->id, null);

            $subgroupsTotal = 0;

            foreach ($groupData['subgroups'] ?? [] as $subIndex => $subgroupData) {
                $subgroup = $this->createSubgroup($bom, $subgroupData, $group->id, $subIndex);
                $subgroupsTotal += (float) $subgroup->subtotal;
            }

            $groupSubtotal = $directTotal + $subgroupsTotal;
            $group->update(['subtotal' => $groupSubtotal]);

            $groupsTotal += $groupSubtotal;
        }

        $mainCost = $ungroupedTotal + $topSubgroupsTotal + $groupsTotal;

        $overheadCost = $bom->overhead_percentage !== null
            ? $mainCost * (float) $bom->overhead_percentage / 100
            : 0;
        $totalCost = $mainCost + $overheadCost;
        $sellingCost = $bom->selling_percentage !== null
            ? $totalCost * (float) $bom->selling_percentage / 100
            : $totalCost;

        $bom->update([
            'main_cost' => $mainCost,
            'overhead_cost' => $overheadCost,
            'total_cost' => $totalCost,
            'selling_cost' => $sellingCost,
        ]);
    }

    /**
     * Return true if the given data array has at least one material item anywhere.
     *
     * @param  array<string, mixed>  $data
     */
    public function hasItems(array $data): bool
    {
        if (filled($data['items'] ?? null)) {
            return true;
        }

        foreach ($data['subgroups'] ?? [] as $subgroup) {
            if (filled($subgroup['items'] ?? null)) {
                return true;
            }
        }

        foreach ($data['groups'] ?? [] as $group) {
            if (filled($group['items'] ?? null)) {
                return true;
            }

            foreach ($group['subgroups'] ?? [] as $subgroup) {
                if (filled($subgroup['items'] ?? null)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * @param  array<int, array<string, mixed>>  $items
     */
    private function createItems(Bom $bom, array $items, ?int $groupId, ?int $subgroupId): float
    {
        $total = 0;

        foreach ($items as $item) {
            $calculated = $this->calculateItem($item);

            $bom->items()->create($calculated + [
                'bom_group_id' => $groupId,
                'bom_subgroup_id' => $subgroupId,
            ]);

            $total += $calculated['total_cost'];
        }

        return $total;
    }

    /**
     * @param  array<string, mixed>  $subgroupData
     */
    private function createSubgroup(Bom $bom, array $subgroupData, ?int $groupId, int $sortOrder): BomSubgroup
    {
        $subgroup = BomSubgroup::create([
            'bom_id' => $bom->id,
            'bom_group_id' => $groupId,
            'name' => $subgroupData['name'],
            'sort_order' => $sortOrder,
            'subtotal' => 0,
        ]);

        $subtotal = $this->createItems($bom, $subgroupData['items'], null, $subgroup->id);

        $subgroup->update(['subtotal' => $subtotal]);

        return $subgroup;
    }

    /**
     * @param  array<string, mixed>  $item
     * @return array<string, mixed>
     */
    private function calculateItem(array $item): array
    {
        $quantity = (float) $item['quantity'];
        $unitCost = (float) $item['unit_cost'];

        $lineTotal = $quantity * $unitCost;
        $totalCost = $this->applyDiscount($lineTotal, $item['discount_type'] ?? null, $item['discount_value'] ?? null);

        return [
            'product_id' => $item['product_id'],
            'description' => $item['description'] ?? null,
            'brand' => $item['brand'],
            'quantity' => $quantity,
            'unit' => $item['unit'],
            'unit_cost' => $unitCost,
            'discount_type' => $item['discount_type'] ?? null,
            'discount_value' => $item['discount_value'] ?? null,
            'total_cost' => $totalCost,
        ];
    }

    private function applyDiscount(float $lineTotal, ?string $discountType, mixed $discountValue): float
    {
        if (! $discountType || $discountValue === null) {
            return $lineTotal;
        }

        $discountValue = (float) $discountValue;

        return $discountType === 'percentage'
            ? $lineTotal * $discountValue / 100
            : max(0, $lineTotal - min($lineTotal, $discountValue));
    }
}
