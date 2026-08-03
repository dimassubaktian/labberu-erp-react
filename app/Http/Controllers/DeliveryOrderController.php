<?php

namespace App\Http\Controllers;

use App\Http\Requests\DeliveryOrderConfirmRequest;
use App\Http\Requests\DeliveryOrderStoreRequest;
use App\Http\Requests\DeliveryOrderUpdateRequest;
use App\Models\DeliveryOrder;
use App\Models\DeliveryOrderItem;
use App\Models\Quotation;
use App\Models\QuotationItem;
use App\Models\StockMovement;
use App\Models\Workforce;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DeliveryOrderController extends Controller
{
    /**
     * Display a listing of the delivery orders.
     */
    public function index(): Response
    {
        $deliveryOrders = DeliveryOrder::query()
            ->with('quotation.project.customer')
            ->orderByDesc('created_at')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('delivery-orders/index', [
            'deliveryOrders' => $deliveryOrders,
        ]);
    }

    /**
     * Show the form for creating a new delivery order.
     */
    public function create(Request $request): Response
    {
        $initialQuotation = null;

        if ($request->query('quotation')) {
            $initialQuotation = Quotation::query()
                ->where('uuid', $request->query('quotation'))
                ->with('project.customer:id,name')
                ->first(['id', 'uuid', 'quotation_code', 'version_major', 'version_minor', 'project_id']);
        }

        return Inertia::render('delivery-orders/create', [
            'initialQuotation' => $initialQuotation,
        ]);
    }

    /**
     * Store a newly created delivery order.
     */
    public function store(DeliveryOrderStoreRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $deliveryOrder = DB::transaction(function () use ($data): DeliveryOrder {
            $deliveryOrder = DeliveryOrder::create([
                'quotation_id' => $data['quotation_id'],
                'delivery_date' => $data['delivery_date'],
                'remarks' => $data['remarks'] ?? null,
                'status' => 'draft',
            ]);

            $this->syncItems($deliveryOrder, $data['items']);

            return $deliveryOrder;
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Delivery order created.')]);

        return to_route('delivery-orders.show', $deliveryOrder);
    }

    /**
     * Display the specified delivery order.
     */
    public function show(DeliveryOrder $deliveryOrder): Response
    {
        $deliveryOrder->load([
            'quotation.project.customer',
            'items.product',
            'deliveredBy',
        ]);

        $workforces = Workforce::query()
            ->where('status', 'active')
            ->orderBy('full_name')
            ->get(['id', 'full_name']);

        return Inertia::render('delivery-orders/show', [
            'deliveryOrder' => $deliveryOrder,
            'workforces' => $workforces,
        ]);
    }

    /**
     * Show the form for editing the specified delivery order.
     */
    public function edit(DeliveryOrder $deliveryOrder): Response
    {
        abort_if($deliveryOrder->status !== 'draft', 403, 'Only draft delivery orders can be edited.');

        $deliveryOrder->load([
            'quotation.project.customer',
            'items.product',
        ]);

        return Inertia::render('delivery-orders/edit', [
            'deliveryOrder' => $deliveryOrder,
        ]);
    }

    /**
     * Update the specified delivery order.
     */
    public function update(DeliveryOrderUpdateRequest $request, DeliveryOrder $deliveryOrder): RedirectResponse
    {
        $data = $request->validated();

        DB::transaction(function () use ($data, $deliveryOrder): void {
            $deliveryOrder->items()->delete();

            $deliveryOrder->update([
                'delivery_date' => $data['delivery_date'],
                'remarks' => $data['remarks'] ?? null,
            ]);

            $this->syncItems($deliveryOrder, $data['items']);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Delivery order updated.')]);

        return to_route('delivery-orders.show', $deliveryOrder);
    }

    /**
     * Remove the specified delivery order.
     */
    public function destroy(DeliveryOrder $deliveryOrder): RedirectResponse
    {
        abort_if($deliveryOrder->status !== 'draft', 403, 'Only draft delivery orders can be deleted.');

        $deliveryOrder->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Delivery order deleted.')]);

        return to_route('delivery-orders.index');
    }

    /**
     * Confirm the specified delivery order, recording who delivered the goods and updating
     * the linked quotation's fulfillment progress.
     */
    public function confirm(DeliveryOrderConfirmRequest $request, DeliveryOrder $deliveryOrder): RedirectResponse
    {
        abort_if($deliveryOrder->quotation->status !== 'approved', 403, 'The linked quotation is no longer approved.');

        DB::transaction(function () use ($request, $deliveryOrder): void {
            $deliveryOrder->update([
                'status' => 'confirmed',
                'delivered_by_id' => $request->validated('delivered_by_id'),
                'delivered_at' => now(),
            ]);

            $this->createStockMovements($deliveryOrder);
            $this->updateQuotationProgress($deliveryOrder->quotation);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Delivery order confirmed.')]);

        return to_route('delivery-orders.show', $deliveryOrder);
    }

    /**
     * Create the delivery order's line items, snapshotting each one's quantity ordered and
     * unit from its source quotation line item at the time of creation.
     *
     * @param  array<int, array<string, mixed>>  $items
     */
    private function syncItems(DeliveryOrder $deliveryOrder, array $items): void
    {
        $quotationItems = QuotationItem::query()
            ->whereIn('id', collect($items)->pluck('quotation_item_id'))
            ->get()
            ->keyBy('id');

        foreach ($items as $item) {
            $quotationItem = $quotationItems->get($item['quotation_item_id']);

            $deliveryOrder->items()->create([
                'product_id' => $quotationItem->product_id,
                'quotation_item_id' => $quotationItem->id,
                'quantity_ordered' => $quotationItem->quantity,
                'unit' => $quotationItem->unit,
                'quantity_delivered' => $item['quantity_delivered'],
            ]);
        }
    }

    /**
     * Create an "out" stock movement for each delivered, physical-goods line item on this
     * delivery order. Service products have no physical stock to track.
     */
    private function createStockMovements(DeliveryOrder $deliveryOrder): void
    {
        $deliveryOrder->load('items.product');

        foreach ($deliveryOrder->items as $item) {
            if ($item->product->type !== 'goods' || (float) $item->quantity_delivered <= 0) {
                continue;
            }

            StockMovement::create([
                'product_id' => $item->product_id,
                'type' => 'out',
                'quantity' => $item->quantity_delivered,
                'movement_date' => $deliveryOrder->delivery_date,
                'delivery_order_item_id' => $item->id,
            ]);
        }
    }

    /**
     * Recompute and persist the quotation's post-approval progress from the delivered
     * quantities across all of its confirmed delivery orders, comparing per line item rather
     * than as an aggregate total (an aggregate sum can be masked by one over-delivered line
     * hiding another line that never shipped).
     */
    private function updateQuotationProgress(Quotation $quotation): void
    {
        $items = $quotation->items;

        $delivered = DeliveryOrderItem::query()
            ->whereIn('quotation_item_id', $items->pluck('id'))
            ->whereHas('deliveryOrder', fn ($query) => $query->where('status', 'confirmed'))
            ->selectRaw('quotation_item_id, sum(quantity_delivered) as delivered')
            ->groupBy('quotation_item_id')
            ->pluck('delivered', 'quotation_item_id');

        $anyDelivered = false;
        $allFullyDelivered = true;

        foreach ($items as $item) {
            $deliveredQuantity = (float) ($delivered[$item->id] ?? 0);

            if ($deliveredQuantity > 0) {
                $anyDelivered = true;
            }

            if ($deliveredQuantity < (float) $item->quantity) {
                $allFullyDelivered = false;
            }
        }

        if (! $anyDelivered) {
            return;
        }

        $quotation->update(['progress' => $allFullyDelivered ? 'fully_delivered' : 'partially_delivered']);
    }
}
