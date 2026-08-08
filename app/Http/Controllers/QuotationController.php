<?php

namespace App\Http\Controllers;

use App\Http\Requests\QuotationProgressUpdateRequest;
use App\Http\Requests\QuotationRevisionRequest;
use App\Http\Requests\QuotationStatusUpdateRequest;
use App\Http\Requests\QuotationStoreRequest;
use App\Http\Requests\QuotationUpdateRequest;
use App\Models\Bom;
use App\Models\BomItem;
use App\Models\BomSubgroup;
use App\Models\CompanySetting;
use App\Models\Currency;
use App\Models\DeliveryOrder;
use App\Models\DeliveryOrderItem;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\PaymentTermTemplate;
use App\Models\Project;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\Quotation;
use App\Models\QuotationItem;
use App\Models\Tax;
use App\Services\BomService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class QuotationController extends Controller
{
    public function __construct(private readonly BomService $bomService) {}

    /**
     * Search quotations for async select pickers, restricted to approved quotations (only
     * approved quotations can have goods delivered or invoiced against them).
     */
    public function search(Request $request): JsonResponse
    {
        $query = (string) $request->query('q', '');

        $quotations = Quotation::query()
            ->where('status', 'approved')
            ->when($query !== '', fn ($builder) => $builder->where('quotation_code', 'like', "%{$query}%"))
            ->with(['project.customer:id,name', 'currency:id,iso_code,name,symbol'])
            ->orderByDesc('created_at')
            ->limit(20)
            ->get(['id', 'uuid', 'quotation_code', 'version_major', 'version_minor', 'project_id', 'currency_id']);

        return response()->json(['data' => $quotations]);
    }

    /**
     * List this quotation's line items (grouped and ungrouped alike, since delivery/invoicing
     * don't care about the pricing-group structure) with quantity ordered, quantity already
     * delivered across its confirmed delivery orders, quantity already invoiced across its
     * invoices, and what remains to deliver/invoice — used by the Delivery Order and Invoice
     * create/edit forms.
     */
    public function items(Quotation $quotation): JsonResponse
    {
        $items = $quotation->items()->with('product:id,product_code,name')->get();

        $delivered = DeliveryOrderItem::query()
            ->whereIn('quotation_item_id', $items->pluck('id'))
            ->whereHas('deliveryOrder', fn ($query) => $query->where('status', 'confirmed'))
            ->selectRaw('quotation_item_id, sum(quantity_delivered) as delivered')
            ->groupBy('quotation_item_id')
            ->pluck('delivered', 'quotation_item_id');

        $invoiced = InvoiceItem::query()
            ->whereIn('quotation_item_id', $items->pluck('id'))
            ->selectRaw('quotation_item_id, sum(quantity_invoiced) as invoiced')
            ->groupBy('quotation_item_id')
            ->pluck('invoiced', 'quotation_item_id');

        $data = $items->map(function (QuotationItem $item) use ($delivered, $invoiced): array {
            $deliveredQuantity = (float) ($delivered[$item->id] ?? 0);
            $invoicedQuantity = (float) ($invoiced[$item->id] ?? 0);

            return [
                'id' => $item->id,
                'product' => $item->product,
                'quantity' => $item->quantity,
                'unit' => $item->unit,
                'unit_price' => $item->unit_price,
                'delivered' => $deliveredQuantity,
                'remaining' => max(0, (float) $item->quantity - $deliveredQuantity),
                'invoiced' => $invoicedQuantity,
                'remaining_to_invoice' => max(0, (float) $item->quantity - $invoicedQuantity),
            ];
        });

        return response()->json(['data' => $data]);
    }

    /**
     * Display a listing of the quotations.
     */
    public function index(Request $request): Response
    {
        $search = $request->string('search')->trim()->toString();
        $status = $request->string('status')->toString();
        $sort = in_array($request->string('sort')->toString(), ['latest', 'oldest', 'higher_amount', 'lower_amount'])
            ? $request->string('sort')->toString()
            : 'latest';

        [$sortColumn, $sortDirection] = match ($sort) {
            'oldest' => ['created_at', 'asc'],
            'higher_amount' => ['total', 'desc'],
            'lower_amount' => ['total', 'asc'],
            default => ['created_at', 'desc'],
        };

        $quotations = Quotation::query()
            ->where('is_current', true)
            ->with(['project.customer', 'currency'])
            ->when($search !== '', function ($query) use ($search): void {
                $query->where(function ($inner) use ($search): void {
                    $inner->where('quotation_code', 'like', "%{$search}%")
                        ->orWhereHas('project', function ($q) use ($search): void {
                            $q->where('name', 'like', "%{$search}%")
                                ->orWhereHas('customer', fn ($c) => $c->where('name', 'like', "%{$search}%"));
                        });
                });
            })
            ->when($status !== '', fn ($query) => $query->where('status', $status))
            ->orderBy($sortColumn, $sortDirection)
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('quotations/index', [
            'quotations' => $quotations,
            'filters' => ['search' => $search, 'status' => $status, 'sort' => $sort],
        ]);
    }

    /**
     * Show the form for creating a new quotation.
     */
    public function create(Request $request): Response
    {
        $initialProject = null;

        if ($request->query('project')) {
            $initialProject = Project::query()
                ->where('uuid', $request->query('project'))
                ->with('customer:id,name')
                ->first(['id', 'uuid', 'name', 'project_code', 'customer_id']);
        }

        $currencies = Currency::query()
            ->where('status', 'active')
            ->orderBy('iso_code')
            ->get(['id', 'iso_code', 'name', 'symbol', 'base_currency']);

        $taxes = Tax::query()->orderBy('name')->get(['id', 'name', 'rate', 'type']);

        $paymentTermTemplates = PaymentTermTemplate::query()->orderBy('name')->get(['id', 'uuid', 'name', 'content']);

        return Inertia::render('quotations/create', [
            'initialProject' => $initialProject,
            'currencies' => $currencies,
            'taxes' => $taxes,
            'paymentTermTemplates' => $paymentTermTemplates,
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
                'payment_term_template_id' => $data['payment_term_template_id'] ?? null,
                'payment_terms_html' => $data['payment_terms_html'] ?? null,
            ]);

            $this->syncGroupsAndItems($quotation, $data);

            $bomData = $data['bom'] ?? null;

            if ($bomData && $this->bomService->hasItems($bomData)) {
                $bom = Bom::create([
                    'quotation_id' => $quotation->id,
                    'remarks' => $bomData['remarks'] ?? null,
                    'overhead_percentage' => $bomData['overhead_percentage'] ?? null,
                    'selling_percentage' => $bomData['selling_percentage'] ?? null,
                ]);

                $this->bomService->syncGroupsAndItems($bom, $bomData);
            }

            return $quotation;
        });

        $quotation->project->recomputeStatus();

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
            'paymentTermTemplate',
            'groups.tax',
            'groups.items.product',
            'items' => fn ($query) => $query->whereNull('quotation_group_id')->with('product'),
            'bom',
        ]);

        $rootId = $quotation->root_quotation_id ?? $quotation->id;

        $threadIds = Quotation::query()
            ->where('id', $rootId)
            ->orWhere('root_quotation_id', $rootId)
            ->pluck('id');

        $history = Quotation::query()
            ->whereIn('id', $threadIds)
            ->orderBy('version_major')
            ->orderBy('version_minor')
            ->get(['id', 'uuid', 'version_major', 'version_minor', 'status', 'is_current', 'created_at']);

        $purchaseOrders = PurchaseOrder::query()
            ->whereIn('quotation_id', $threadIds)
            ->with(['vendor:id,name', 'currency', 'quotation:id,version_major,version_minor'])
            ->orderByDesc('created_at')
            ->get();

        $deliveryOrders = DeliveryOrder::query()
            ->whereIn('quotation_id', $threadIds)
            ->with('quotation:id,version_major,version_minor')
            ->orderByDesc('created_at')
            ->get();

        $invoices = Invoice::query()
            ->whereIn('quotation_id', $threadIds)
            ->with('quotation:id,version_major,version_minor')
            ->orderByDesc('created_at')
            ->get();

        return Inertia::render('quotations/show', [
            'quotation' => $quotation,
            'history' => $history,
            'purchaseOrders' => $purchaseOrders,
            'deliveryOrders' => $deliveryOrders,
            'invoices' => $invoices,
        ]);
    }

    /**
     * Stream or download the quotation as a PDF.
     *
     * Accepts an optional `group_ids[]` and `include_ungrouped` selection to print only part of
     * the quotation. When a subset is selected, the overall discount/tax and grand total are not
     * recomputed against the smaller base (that would misrepresent the quotation's real terms) —
     * instead the PDF shows a plain sum of the selected sections, clearly labeled as such.
     */
    public function print(Request $request, Quotation $quotation): HttpResponse
    {
        $quotation->load([
            'project.customer',
            'currency',
            'tax',
            'approver',
            'paymentTermTemplate',
            'groups.tax',
            'groups.items.product',
            'items' => fn ($query) => $query->whereNull('quotation_group_id')->with('product'),
        ]);

        $allGroupIds = $quotation->groups->pluck('id')->all();
        $selectedGroupIds = $request->has('group_ids')
            ? array_map('intval', (array) $request->query('group_ids'))
            : $allGroupIds;
        $includeUngrouped = $request->boolean('include_ungrouped', true);

        $isPartialPrint = $request->has('group_ids') && (
            count(array_diff($allGroupIds, $selectedGroupIds)) > 0
            || ($quotation->items->isNotEmpty() && ! $includeUngrouped)
        );

        $quotation->setRelation('groups', $quotation->groups->whereIn('id', $selectedGroupIds)->values());

        if (! $includeUngrouped) {
            $quotation->setRelation('items', $quotation->items->take(0));
        }

        $partialTotal = $quotation->groups->sum('total') + $quotation->items->sum('total_price');

        $company = CompanySetting::current();

        $pdf = Pdf::loadView('pdf.quotation', compact('quotation', 'company', 'isPartialPrint', 'partialTotal'))
            ->setPaper('a4', 'portrait');

        // dompdf's CSS `counter(pages)` never resolves to the total page count, so the
        // "X / Y" page number is drawn directly on the canvas instead, which does. This
        // requires an explicit render() first: page_text() only reaches pages that
        // already exist and only knows the page count at the moment it is called.
        $pdf->render();

        $dompdf = $pdf->getDomPDF();
        $fontMetrics = $dompdf->getFontMetrics();
        $font = $fontMetrics->getFont('DejaVu Sans', 'normal');
        $fontSize = 7.5;
        $textWidth = $fontMetrics->getTextWidth('99 / 99', $font, $fontSize);
        $dompdf->getCanvas()->page_text(563.28 - $textWidth, 816, '{PAGE_NUM} / {PAGE_COUNT}', $font, $fontSize, [0.53, 0.53, 0.53]);

        $filename = "quotation-{$quotation->quotation_code}.pdf";

        return $request->boolean('download')
            ? $pdf->download($filename)
            : $pdf->stream($filename);
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

        $paymentTermTemplates = PaymentTermTemplate::query()->orderBy('name')->get(['id', 'uuid', 'name', 'content']);

        return Inertia::render('quotations/edit', [
            'quotation' => $quotation,
            'currencies' => $currencies,
            'taxes' => $taxes,
            'paymentTermTemplates' => $paymentTermTemplates,
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
                'payment_term_template_id' => $data['payment_term_template_id'] ?? null,
                'payment_terms_html' => $data['payment_terms_html'] ?? null,
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
     * List this quotation's BOM line items flattened across groups/subgroups, with each item's
     * quantity already committed to other (non-cancelled/voided) purchase orders and what
     * remains to source — used by the "Import from BOM" picker on the Purchase Order form.
     */
    public function bomItems(Quotation $quotation): JsonResponse
    {
        $bom = $quotation->bom()
            ->with([
                'groups.items.product:id,product_code,name,reference_number,type',
                'groups.subgroups.items.product:id,product_code,name,reference_number,type',
                'subgroups.items.product:id,product_code,name,reference_number,type',
                'items' => fn ($query) => $query->whereNull('bom_group_id')->whereNull('bom_subgroup_id')->with('product:id,product_code,name,reference_number,type'),
            ])
            ->first();

        if (! $bom) {
            return response()->json(['data' => []]);
        }

        $rows = [];

        foreach ($bom->groups as $group) {
            foreach ($group->items as $item) {
                $rows[] = ['item' => $item, 'group_name' => $group->name, 'subgroup_name' => null];
            }

            foreach ($group->subgroups as $subgroup) {
                foreach ($subgroup->items as $item) {
                    $rows[] = ['item' => $item, 'group_name' => $group->name, 'subgroup_name' => $subgroup->name];
                }
            }
        }

        foreach ($bom->subgroups as $subgroup) {
            foreach ($subgroup->items as $item) {
                $rows[] = ['item' => $item, 'group_name' => null, 'subgroup_name' => $subgroup->name];
            }
        }

        foreach ($bom->items as $item) {
            $rows[] = ['item' => $item, 'group_name' => null, 'subgroup_name' => null];
        }

        $imported = PurchaseOrderItem::query()
            ->whereIn('bom_item_id', array_map(fn (array $row) => $row['item']->id, $rows))
            ->whereHas('purchaseOrder', fn ($query) => $query->whereNotIn('status', ['cancelled', 'voided']))
            ->selectRaw('bom_item_id, sum(quantity) as imported')
            ->groupBy('bom_item_id')
            ->pluck('imported', 'bom_item_id');

        $data = array_map(function (array $row) use ($imported): array {
            $item = $row['item'];
            $importedQuantity = (float) ($imported[$item->id] ?? 0);

            return [
                'id' => $item->id,
                'group_name' => $row['group_name'],
                'subgroup_name' => $row['subgroup_name'],
                'product' => $item->product,
                'description' => $item->description,
                'brand' => $item->brand,
                'quantity' => $item->quantity,
                'unit' => $item->unit,
                'unit_cost' => $item->unit_cost,
                'imported' => $importedQuantity,
                'remaining' => max(0, (float) $item->quantity - $importedQuantity),
            ];
        }, $rows);

        return response()->json(['data' => $data]);
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

        $quotation->project->recomputeSalesStatus();

        if ($status === 'approved') {
            $quotation->project->recomputeActualValues($quotation);
        } elseif ($status === 'voided') {
            $quotation->project->recomputeActualValues(null);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Quotation status updated.')]);

        return to_route('quotations.show', $quotation);
    }

    /**
     * Advance the specified quotation to its next post-approval progress stage.
     */
    public function updateProgress(QuotationProgressUpdateRequest $request, Quotation $quotation): RedirectResponse
    {
        $quotation->update(['progress' => $request->validated('progress')]);

        $quotation->project->recomputeSalesStatus();
        $quotation->project->recomputeStatus();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Quotation progress updated.')]);

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
                'payment_term_template_id' => $quotation->payment_term_template_id,
                'payment_terms_html' => $quotation->payment_terms_html,
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
