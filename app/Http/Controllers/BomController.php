<?php

namespace App\Http\Controllers;

use App\Http\Requests\BomStoreRequest;
use App\Http\Requests\BomUpdateRequest;
use App\Models\Bom;
use App\Models\BomSubgroup;
use App\Models\Quotation;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class BomController extends Controller
{
    /**
     * Show the form for creating the quotation's BOM.
     */
    public function create(Quotation $quotation): Response
    {
        abort_if($quotation->status !== 'draft', 403, 'Only draft quotations can have a BOM created.');
        abort_if($quotation->bom()->exists(), 409, 'This quotation already has a BOM.');

        return Inertia::render('boms/create', [
            'quotation' => $quotation,
        ]);
    }

    /**
     * Store the quotation's BOM.
     */
    public function store(BomStoreRequest $request, Quotation $quotation): RedirectResponse
    {
        $data = $request->validated();

        DB::transaction(function () use ($data, $quotation): void {
            $bom = Bom::create([
                'quotation_id' => $quotation->id,
                'remarks' => $data['remarks'] ?? null,
                'overhead_percentage' => $data['overhead_percentage'] ?? null,
                'selling_percentage' => $data['selling_percentage'] ?? null,
            ]);

            $this->syncGroupsAndItems($bom, $data);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Bill of materials created.')]);

        return to_route('quotations.bom.show', $quotation);
    }

    /**
     * Display the quotation's BOM.
     */
    public function show(Quotation $quotation): Response
    {
        $quotation->load('currency');
        $bom = $quotation->bom()
            ->with([
                'groups.items.product',
                'groups.subgroups.items.product',
                'subgroups.items.product',
                'items' => fn ($query) => $query->whereNull('bom_group_id')->whereNull('bom_subgroup_id')->with('product'),
            ])
            ->firstOrFail();

        return Inertia::render('boms/show', [
            'quotation' => $quotation,
            'bom' => $bom,
        ]);
    }

    /**
     * Show the form for editing the quotation's BOM.
     */
    public function edit(Quotation $quotation): Response
    {
        abort_if($quotation->status !== 'draft', 403, 'Only draft quotations can have their BOM edited.');

        $bom = $quotation->bom()
            ->with([
                'groups.items.product',
                'groups.subgroups.items.product',
                'subgroups.items.product',
                'items' => fn ($query) => $query->whereNull('bom_group_id')->whereNull('bom_subgroup_id')->with('product'),
            ])
            ->firstOrFail();

        return Inertia::render('boms/edit', [
            'quotation' => $quotation,
            'bom' => $bom,
        ]);
    }

    /**
     * Update the quotation's BOM.
     */
    public function update(BomUpdateRequest $request, Quotation $quotation): RedirectResponse
    {
        $data = $request->validated();
        $bom = $quotation->bom()->firstOrFail();

        DB::transaction(function () use ($data, $bom): void {
            $bom->items()->delete();
            $bom->subgroups()->delete();
            $bom->groups()->delete();

            $bom->update([
                'remarks' => $data['remarks'] ?? null,
                'overhead_percentage' => $data['overhead_percentage'] ?? null,
                'selling_percentage' => $data['selling_percentage'] ?? null,
            ]);

            $this->syncGroupsAndItems($bom, $data);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Bill of materials updated.')]);

        return to_route('quotations.bom.show', $quotation);
    }

    /**
     * Create the BOM's ungrouped items, top-level phase subgroups, and hardware groups (each
     * with their own direct items and nested phase subgroups), then compute and persist the
     * BOM's main, overhead, total, and selling costs from the sum of it all.
     *
     * @param  array<string, mixed>  $data
     */
    private function syncGroupsAndItems(Bom $bom, array $data): void
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
     * Create a list of BOM line items under the given group and/or subgroup, and return
     * their combined total cost.
     *
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
     * Create a phase subgroup (optionally nested under a hardware group) along with its
     * items, and persist its subtotal from the sum of those items' total cost.
     *
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
     * Calculate a single BOM line item's total cost.
     *
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

    /**
     * Apply a percentage or fixed discount to a line total. A percentage discount is a
     * direct multiplier against the line total (e.g. 90 keeps 90% of cost, a 10% discount).
     * A fixed discount is a flat amount subtracted from the line total, capped at zero.
     */
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
