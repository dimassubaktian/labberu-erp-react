<?php

namespace App\Http\Controllers;

use App\Http\Requests\BomStoreRequest;
use App\Http\Requests\BomUpdateRequest;
use App\Models\Bom;
use App\Models\CompanySetting;
use App\Models\Quotation;
use App\Services\BomService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class BomController extends Controller
{
    public function __construct(private readonly BomService $bomService) {}

    /**
     * Return a JSON list of BOMs matching the given query string, for the import dialog.
     */
    public function search(Request $request): JsonResponse
    {
        $q = (string) $request->query('q', '');

        $boms = Bom::query()
            ->with(['quotation.project.customer'])
            ->whereHas('quotation', fn ($query) => $query
                ->where('quotation_code', 'like', "%{$q}%")
                ->orWhereHas('project', fn ($p) => $p->where('name', 'like', "%{$q}%"))
            )
            ->latest()
            ->limit(10)
            ->get()
            ->map(fn (Bom $bom) => [
                'uuid' => $bom->uuid,
                'quotation_code' => $bom->quotation->quotation_code,
                'project_name' => $bom->quotation->project->name,
                'customer_name' => $bom->quotation->project->customer->name,
            ]);

        return response()->json($boms);
    }

    /**
     * Return the BOM's full structure as JSON for client-side import on the quotation create form.
     */
    public function importData(Bom $bom): JsonResponse
    {
        $bom->load([
            'groups.items.product',
            'groups.subgroups.items.product',
            'subgroups.items.product',
            'items' => fn ($q) => $q->whereNull('bom_group_id')->whereNull('bom_subgroup_id')->with('product'),
        ]);

        return response()->json([
            'remarks' => $bom->remarks,
            'overhead_percentage' => $bom->overhead_percentage,
            'selling_percentage' => $bom->selling_percentage,
            'items' => $bom->items->map(fn ($item) => [
                'product_id' => $item->product_id,
                'description' => $item->description,
                'brand' => $item->brand,
                'quantity' => $item->quantity,
                'unit' => $item->unit,
                'unit_cost' => $item->unit_cost,
                'discount_type' => $item->discount_type,
                'discount_value' => $item->discount_value,
                'product' => $item->product,
            ]),
            'subgroups' => $bom->subgroups->map(fn ($subgroup) => [
                'name' => $subgroup->name,
                'items' => $subgroup->items->map(fn ($item) => [
                    'product_id' => $item->product_id,
                    'description' => $item->description,
                    'brand' => $item->brand,
                    'quantity' => $item->quantity,
                    'unit' => $item->unit,
                    'unit_cost' => $item->unit_cost,
                    'discount_type' => $item->discount_type,
                    'discount_value' => $item->discount_value,
                    'product' => $item->product,
                ]),
            ]),
            'groups' => $bom->groups->map(fn ($group) => [
                'name' => $group->name,
                'items' => $group->items->map(fn ($item) => [
                    'product_id' => $item->product_id,
                    'description' => $item->description,
                    'brand' => $item->brand,
                    'quantity' => $item->quantity,
                    'unit' => $item->unit,
                    'unit_cost' => $item->unit_cost,
                    'discount_type' => $item->discount_type,
                    'discount_value' => $item->discount_value,
                    'product' => $item->product,
                ]),
                'subgroups' => $group->subgroups->map(fn ($subgroup) => [
                    'name' => $subgroup->name,
                    'items' => $subgroup->items->map(fn ($item) => [
                        'product_id' => $item->product_id,
                        'description' => $item->description,
                        'brand' => $item->brand,
                        'quantity' => $item->quantity,
                        'unit' => $item->unit,
                        'unit_cost' => $item->unit_cost,
                        'discount_type' => $item->discount_type,
                        'discount_value' => $item->discount_value,
                        'product' => $item->product,
                    ]),
                ]),
            ]),
        ]);
    }

    /**
     * Show the form for creating the quotation's BOM.
     */
    public function create(Request $request, Quotation $quotation): Response
    {
        abort_if($quotation->status !== 'draft', 403, 'Only draft quotations can have a BOM created.');
        abort_if($quotation->bom()->exists(), 409, 'This quotation already has a BOM.');

        $importFrom = null;

        if ($request->query('from')) {
            $importFrom = Bom::query()
                ->where('uuid', $request->query('from'))
                ->with([
                    'groups.items.product',
                    'groups.subgroups.items.product',
                    'subgroups.items.product',
                    'items' => fn ($q) => $q->whereNull('bom_group_id')->whereNull('bom_subgroup_id')->with('product'),
                ])
                ->first();
        }

        return Inertia::render('boms/create', [
            'quotation' => $quotation,
            'importFrom' => $importFrom,
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

            $this->bomService->syncGroupsAndItems($bom, $data);
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
     * Print the quotation's BOM as a PDF, optionally limited to a selection of hardware
     * groups, standalone phase subgroups, and ungrouped items. The printed document is a
     * plain materials list (description/brand/quantity/unit) with no cost figures.
     */
    public function print(Request $request, Quotation $quotation): HttpResponse
    {
        $quotation->load('project.customer');

        $bom = $quotation->bom()
            ->with([
                'groups.items.product',
                'groups.subgroups.items.product',
                'subgroups.items.product',
                'items' => fn ($query) => $query->whereNull('bom_group_id')->whereNull('bom_subgroup_id')->with('product'),
            ])
            ->firstOrFail();

        $selectedGroupIds = $request->has('group_ids')
            ? array_map('intval', (array) $request->query('group_ids'))
            : $bom->groups->pluck('id')->all();
        $selectedSubgroupIds = $request->has('subgroup_ids')
            ? array_map('intval', (array) $request->query('subgroup_ids'))
            : $bom->subgroups->pluck('id')->all();
        $includeUngrouped = $request->boolean('include_ungrouped', true);

        $bom->setRelation('groups', $bom->groups->whereIn('id', $selectedGroupIds)->values());
        $bom->setRelation('subgroups', $bom->subgroups->whereIn('id', $selectedSubgroupIds)->values());

        if (! $includeUngrouped) {
            $bom->setRelation('items', $bom->items->take(0));
        }

        $company = CompanySetting::current();

        $pdf = Pdf::loadView('pdf.bom', compact('quotation', 'bom', 'company'))
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

        $filename = "bom-{$quotation->quotation_code}.pdf";

        return $request->boolean('download')
            ? $pdf->download($filename)
            : $pdf->stream($filename);
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

            $this->bomService->syncGroupsAndItems($bom, $data);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Bill of materials updated.')]);

        return to_route('quotations.bom.show', $quotation);
    }

    /**
     * Delete the quotation's BOM.
     */
    public function destroy(Quotation $quotation): RedirectResponse
    {
        abort_if($quotation->status !== 'draft', 403, 'Only draft quotations can have their BOM deleted.');

        $bom = $quotation->bom()->firstOrFail();
        $bom->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Bill of materials deleted.')]);

        return to_route('quotations.show', $quotation);
    }
}
