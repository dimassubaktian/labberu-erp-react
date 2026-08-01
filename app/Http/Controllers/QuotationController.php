<?php

namespace App\Http\Controllers;

use App\Http\Requests\QuotationRevisionRequest;
use App\Http\Requests\QuotationStatusUpdateRequest;
use App\Http\Requests\QuotationStoreRequest;
use App\Http\Requests\QuotationUpdateRequest;
use App\Models\Bom;
use App\Models\BomItem;
use App\Models\BomSubgroup;
use App\Models\Currency;
use App\Models\Product;
use App\Models\Project;
use App\Models\Quotation;
use App\Models\QuotationItem;
use App\Models\Tax;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class QuotationController extends Controller
{
    /**
     * Display a listing of the quotations.
     */
    public function index(): Response
    {
        $quotations = Quotation::query()
            ->where('is_current', true)
            ->with(['project.customer', 'currency'])
            ->orderByDesc('created_at')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('quotations/index', [
            'quotations' => $quotations,
        ]);
    }

    /**
     * Show the form for creating a new quotation.
     */
    public function create(): Response
    {
        $projects = Project::query()
            ->with('customer:id,name')
            ->orderByDesc('request_date')
            ->get(['id', 'name', 'project_code', 'customer_id']);

        $currencies = Currency::query()
            ->where('status', 'active')
            ->orderBy('iso_code')
            ->get(['id', 'iso_code', 'name', 'symbol']);

        $taxes = Tax::query()->orderBy('name')->get(['id', 'name', 'rate', 'type']);

        $products = Product::query()
            ->where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name', 'product_code', 'descriptions', 'unit', 'price', 'cost']);

        return Inertia::render('quotations/create', [
            'projects' => $projects,
            'currencies' => $currencies,
            'taxes' => $taxes,
            'products' => $products,
        ]);
    }

    /**
     * Store a newly created quotation.
     */
    public function store(QuotationStoreRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $quotation = DB::transaction(function () use ($data): Quotation {
            $quotation = Quotation::create([
                'project_id' => $data['project_id'],
                'status' => 'draft',
                'currency_id' => $data['currency_id'],
                'valid_until' => $data['valid_until'] ?? null,
                'discount_type' => $data['discount_type'] ?? null,
                'discount_value' => $data['discount_value'] ?? null,
                'tax_id' => $data['tax_id'] ?? null,
                'remarks' => $data['remarks'] ?? null,
            ]);

            $this->syncGroupsAndItems($quotation, $data);

            return $quotation;
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Quotation created.')]);

        return to_route('quotations.show', $quotation);
    }

    /**
     * Display the specified quotation.
     */
    public function show(Quotation $quotation): Response
    {
        $quotation->load([
            'project.customer',
            'currency',
            'tax',
            'approver',
            'groups.tax',
            'groups.items.product',
            'items' => fn ($query) => $query->whereNull('quotation_group_id')->with('product'),
            'bom',
        ]);

        $rootId = $quotation->root_quotation_id ?? $quotation->id;

        $history = Quotation::query()
            ->where('id', $rootId)
            ->orWhere('root_quotation_id', $rootId)
            ->orderBy('version_major')
            ->orderBy('version_minor')
            ->get(['id', 'uuid', 'version_major', 'version_minor', 'status', 'is_current', 'created_at']);

        return Inertia::render('quotations/show', [
            'quotation' => $quotation,
            'history' => $history,
        ]);
    }

    /**
     * Show the form for editing the specified quotation.
     */
    public function edit(Quotation $quotation): Response
    {
        abort_if($quotation->status !== 'draft', 403, 'Only draft quotations can be edited.');

        $quotation->load([
            'project.customer',
            'groups.items.product',
            'items' => fn ($query) => $query->whereNull('quotation_group_id')->with('product'),
        ]);

        $currencies = Currency::query()
            ->where('status', 'active')
            ->orderBy('iso_code')
            ->get(['id', 'iso_code', 'name', 'symbol']);

        $taxes = Tax::query()->orderBy('name')->get(['id', 'name', 'rate', 'type']);

        $products = Product::query()
            ->where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name', 'product_code', 'descriptions', 'unit', 'price', 'cost']);

        return Inertia::render('quotations/edit', [
            'quotation' => $quotation,
            'currencies' => $currencies,
            'taxes' => $taxes,
            'products' => $products,
        ]);
    }

    /**
     * Update the specified quotation.
     */
    public function update(QuotationUpdateRequest $request, Quotation $quotation): RedirectResponse
    {
        $data = $request->validated();

        DB::transaction(function () use ($data, $quotation): void {
            $quotation->items()->delete();
            $quotation->groups()->delete();

            $quotation->update([
                'currency_id' => $data['currency_id'],
                'valid_until' => $data['valid_until'] ?? null,
                'discount_type' => $data['discount_type'] ?? null,
                'discount_value' => $data['discount_value'] ?? null,
                'tax_id' => $data['tax_id'] ?? null,
                'remarks' => $data['remarks'] ?? null,
            ]);

            $this->syncGroupsAndItems($quotation, $data);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Quotation updated.')]);

        return to_route('quotations.show', $quotation);
    }

    /**
     * Remove the specified quotation.
     */
    public function destroy(Quotation $quotation): RedirectResponse
    {
        abort_if($quotation->status !== 'draft', 403, 'Only draft quotations can be deleted.');

        $rootId = $quotation->root_quotation_id ?? $quotation->id;

        $hasRevisions = Quotation::query()
            ->where('id', '!=', $quotation->id)
            ->where(function ($query) use ($rootId): void {
                $query->where('id', $rootId)->orWhere('root_quotation_id', $rootId);
            })
            ->exists();

        abort_if($hasRevisions, 422, 'Cannot delete a quotation that has other revisions.');

        $quotation->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Quotation deleted.')]);

        return to_route('quotations.index');
    }

    /**
     * Transition the specified quotation to a new status.
     */
    public function updateStatus(QuotationStatusUpdateRequest $request, Quotation $quotation): RedirectResponse
    {
        $status = $request->validated('status');

        $quotation->update([
            'status' => $status,
            'approved_by' => $status === 'approved' ? $request->user()->id : $quotation->approved_by,
            'approved_at' => $status === 'approved' ? now() : $quotation->approved_at,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Quotation status updated.')]);

        return to_route('quotations.show', $quotation);
    }

    /**
     * Create a new revision of the specified quotation.
     */
    public function storeRevision(QuotationRevisionRequest $request, Quotation $quotation): RedirectResponse
    {
        $isMajor = $request->validated('version_type') === 'major';

        $quotation->load([
            'groups.items',
            'items' => fn ($query) => $query->whereNull('quotation_group_id'),
            'bom.groups.items',
            'bom.groups.subgroups.items',
            'bom.subgroups.items',
            'bom.items' => fn ($query) => $query->whereNull('bom_group_id')->whereNull('bom_subgroup_id'),
        ]);

        $revision = DB::transaction(function () use ($quotation, $isMajor): Quotation {
            $quotation->update(['is_current' => false]);

            $revision = Quotation::create([
                'project_id' => $quotation->project_id,
                'root_quotation_id' => $quotation->root_quotation_id ?? $quotation->id,
                'version_major' => $isMajor ? $quotation->version_major + 1 : $quotation->version_major,
                'version_minor' => $isMajor ? 0 : $quotation->version_minor + 1,
                'is_current' => true,
                'status' => 'draft',
                'currency_id' => $quotation->currency_id,
                'valid_until' => $quotation->valid_until,
                'discount_type' => $quotation->discount_type,
                'discount_value' => $quotation->discount_value,
                'tax_id' => $quotation->tax_id,
                'subtotal' => $quotation->subtotal,
                'discount_amount' => $quotation->discount_amount,
                'tax_amount' => $quotation->tax_amount,
                'total' => $quotation->total,
                'remarks' => $quotation->remarks,
            ]);

            foreach ($quotation->groups as $group) {
                $newGroup = $revision->groups()->create([
                    'name' => $group->name,
                    'sort_order' => $group->sort_order,
                    'discount_type' => $group->discount_type,
                    'discount_value' => $group->discount_value,
                    'tax_id' => $group->tax_id,
                    'subtotal' => $group->subtotal,
                    'discount_amount' => $group->discount_amount,
                    'tax_amount' => $group->tax_amount,
                    'total' => $group->total,
                ]);

                foreach ($group->items as $item) {
                    $revision->items()->create($this->copyItemAttributes($item) + ['quotation_group_id' => $newGroup->id]);
                }
            }

            foreach ($quotation->items as $item) {
                $revision->items()->create($this->copyItemAttributes($item));
            }

            if ($quotation->bom) {
                $newBom = $revision->bom()->create([
                    'remarks' => $quotation->bom->remarks,
                    'main_cost' => $quotation->bom->main_cost,
                    'overhead_percentage' => $quotation->bom->overhead_percentage,
                    'overhead_cost' => $quotation->bom->overhead_cost,
                    'total_cost' => $quotation->bom->total_cost,
                    'selling_percentage' => $quotation->bom->selling_percentage,
                    'selling_cost' => $quotation->bom->selling_cost,
                ]);

                foreach ($quotation->bom->groups as $bomGroup) {
                    $newBomGroup = $newBom->groups()->create([
                        'name' => $bomGroup->name,
                        'sort_order' => $bomGroup->sort_order,
                        'subtotal' => $bomGroup->subtotal,
                    ]);

                    foreach ($bomGroup->items as $bomItem) {
                        $newBom->items()->create($this->copyBomItemAttributes($bomItem) + ['bom_group_id' => $newBomGroup->id]);
                    }

                    foreach ($bomGroup->subgroups as $bomSubgroup) {
                        $this->copyBomSubgroup($newBom, $bomSubgroup, $newBomGroup->id);
                    }
                }

                foreach ($quotation->bom->subgroups as $bomSubgroup) {
                    $this->copyBomSubgroup($newBom, $bomSubgroup, null);
                }

                foreach ($quotation->bom->items as $bomItem) {
                    $newBom->items()->create($this->copyBomItemAttributes($bomItem));
                }
            }

            return $revision;
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Revision created.')]);

        return to_route('quotations.edit', $revision);
    }

    /**
     * Create the quotation's ungrouped items and groups (with their own items), then
     * compute and persist the quotation's header-level subtotal/discount/tax/total from
     * the sum of the ungrouped items and each group's own total.
     *
     * @param  array<string, mixed>  $data
     */
    private function syncGroupsAndItems(Quotation $quotation, array $data): void
    {
        $ungroupedTotal = 0;

        foreach ($data['items'] ?? [] as $item) {
            $calculated = $this->calculateItem($item);

            $quotation->items()->create($calculated);

            $ungroupedTotal += $calculated['total_price'];
        }

        $groupsTotal = 0;

        foreach ($data['groups'] ?? [] as $index => $groupData) {
            $calculatedGroup = $this->calculateGroup($groupData);

            $group = $quotation->groups()->create([
                'name' => $groupData['name'],
                'sort_order' => $index,
                'discount_type' => $groupData['discount_type'] ?? null,
                'discount_value' => $groupData['discount_value'] ?? null,
                'tax_id' => $groupData['tax_id'] ?? null,
                'subtotal' => $calculatedGroup['subtotal'],
                'discount_amount' => $calculatedGroup['discount_amount'],
                'tax_amount' => $calculatedGroup['tax_amount'],
                'total' => $calculatedGroup['total'],
            ]);

            foreach ($calculatedGroup['items'] as $itemData) {
                $quotation->items()->create($itemData + ['quotation_group_id' => $group->id]);
            }

            $groupsTotal += $calculatedGroup['total'];
        }

        $subtotal = $ungroupedTotal + $groupsTotal;

        $discountAmount = $this->calculateDiscountAmount($subtotal, $data['discount_type'] ?? null, $data['discount_value'] ?? null);
        $discountedSubtotal = $subtotal - $discountAmount;

        $tax = isset($data['tax_id']) ? Tax::query()->firstWhere('id', $data['tax_id']) : null;
        $taxAmount = $this->calculateTaxAmount($discountedSubtotal, $tax);

        $quotation->update([
            'subtotal' => $subtotal,
            'discount_amount' => $discountAmount,
            'tax_amount' => $taxAmount,
            'total' => $discountedSubtotal + $taxAmount,
        ]);
    }

    /**
     * Calculate a group's items, subtotal, discount, tax, and total.
     *
     * @param  array<string, mixed>  $group
     * @return array<string, mixed>
     */
    private function calculateGroup(array $group): array
    {
        $subtotal = 0;
        $items = [];

        foreach ($group['items'] as $item) {
            $calculated = $this->calculateItem($item);
            $items[] = $calculated;
            $subtotal += $calculated['total_price'];
        }

        $discountAmount = $this->calculateDiscountAmount($subtotal, $group['discount_type'] ?? null, $group['discount_value'] ?? null);
        $discountedSubtotal = $subtotal - $discountAmount;

        $tax = isset($group['tax_id']) ? Tax::query()->firstWhere('id', $group['tax_id']) : null;
        $taxAmount = $this->calculateTaxAmount($discountedSubtotal, $tax);

        return [
            'items' => $items,
            'subtotal' => $subtotal,
            'discount_amount' => $discountAmount,
            'tax_amount' => $taxAmount,
            'total' => $discountedSubtotal + $taxAmount,
        ];
    }

    /**
     * Copy a line item's persisted attributes for duplication onto a new quotation.
     *
     * @return array<string, mixed>
     */
    private function copyItemAttributes(QuotationItem $item): array
    {
        return [
            'product_id' => $item->product_id,
            'description' => $item->description,
            'quantity' => $item->quantity,
            'unit' => $item->unit,
            'unit_price' => $item->unit_price,
            'unit_cost' => $item->unit_cost,
            'discount_type' => $item->discount_type,
            'discount_value' => $item->discount_value,
            'total_price' => $item->total_price,
            'total_cost' => $item->total_cost,
            'margin' => $item->margin,
            'margin_percent' => $item->margin_percent,
        ];
    }

    /**
     * Copy a BOM line item's persisted attributes for duplication onto a new BOM.
     *
     * @return array<string, mixed>
     */
    private function copyBomItemAttributes(BomItem $item): array
    {
        return [
            'product_id' => $item->product_id,
            'description' => $item->description,
            'brand' => $item->brand,
            'quantity' => $item->quantity,
            'unit' => $item->unit,
            'unit_cost' => $item->unit_cost,
            'discount_type' => $item->discount_type,
            'discount_value' => $item->discount_value,
            'total_cost' => $item->total_cost,
        ];
    }

    /**
     * Copy a BOM phase subgroup and its items onto a new BOM, optionally nested under the
     * given hardware group.
     */
    private function copyBomSubgroup(Bom $newBom, BomSubgroup $subgroup, ?int $newGroupId): void
    {
        $newSubgroup = BomSubgroup::create([
            'bom_id' => $newBom->id,
            'bom_group_id' => $newGroupId,
            'name' => $subgroup->name,
            'sort_order' => $subgroup->sort_order,
            'subtotal' => $subgroup->subtotal,
        ]);

        foreach ($subgroup->items as $item) {
            $newBom->items()->create($this->copyBomItemAttributes($item) + ['bom_subgroup_id' => $newSubgroup->id]);
        }
    }

    /**
     * Calculate a single line item's totals, margin, and margin percentage.
     *
     * @param  array<string, mixed>  $item
     * @return array<string, mixed>
     */
    private function calculateItem(array $item): array
    {
        $quantity = (float) $item['quantity'];
        $unitPrice = (float) $item['unit_price'];
        $unitCost = (float) $item['unit_cost'];

        $lineTotal = $quantity * $unitPrice;
        $totalPrice = $lineTotal - $this->calculateDiscountAmount($lineTotal, $item['discount_type'] ?? null, $item['discount_value'] ?? null);
        $totalCost = $quantity * $unitCost;
        $margin = $totalPrice - $totalCost;
        $marginPercent = $totalPrice > 0 ? round($margin / $totalPrice * 100, 2) : 0;

        return [
            'product_id' => $item['product_id'],
            'description' => $item['description'] ?? null,
            'quantity' => $quantity,
            'unit' => $item['unit'],
            'unit_price' => $unitPrice,
            'unit_cost' => $unitCost,
            'discount_type' => $item['discount_type'] ?? null,
            'discount_value' => $item['discount_value'] ?? null,
            'total_price' => $totalPrice,
            'total_cost' => $totalCost,
            'margin' => $margin,
            'margin_percent' => $marginPercent,
        ];
    }

    /**
     * Calculate a percentage or fixed discount amount against a base value.
     */
    private function calculateDiscountAmount(float $base, ?string $discountType, mixed $discountValue): float
    {
        if (! $discountType || $discountValue === null) {
            return 0;
        }

        $discountValue = (float) $discountValue;

        return $discountType === 'percentage'
            ? min($base, $base * $discountValue / 100)
            : min($base, $discountValue);
    }

    /**
     * Calculate the tax amount for a discounted subtotal.
     */
    private function calculateTaxAmount(float $discountedSubtotal, ?Tax $tax): float
    {
        if (! $tax) {
            return 0;
        }

        return $tax->type === 'percentage'
            ? $discountedSubtotal * (float) $tax->rate / 100
            : (float) $tax->rate;
    }
}
