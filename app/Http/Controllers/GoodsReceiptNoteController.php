<?php

namespace App\Http\Controllers;

use App\Http\Requests\GoodsReceiptNoteCancelRequest;
use App\Http\Requests\GoodsReceiptNoteConfirmRequest;
use App\Http\Requests\GoodsReceiptNoteStoreRequest;
use App\Http\Requests\GoodsReceiptNoteUpdateRequest;
use App\Models\GoodsReceiptNote;
use App\Models\GoodsReceiptNoteItem;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\StockMovement;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class GoodsReceiptNoteController extends Controller
{
    /**
     * Display a listing of the goods receipt notes.
     */
    public function index(): Response
    {
        $goodsReceiptNotes = GoodsReceiptNote::query()
            ->with('purchaseOrder.vendor')
            ->orderByDesc('created_at')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('goods-receipt-notes/index', [
            'goodsReceiptNotes' => $goodsReceiptNotes,
        ]);
    }

    /**
     * Show the form for creating a new goods receipt note.
     */
    public function create(Request $request): Response
    {
        $initialPurchaseOrder = null;

        if ($request->query('purchase_order')) {
            $initialPurchaseOrder = PurchaseOrder::query()
                ->where('uuid', $request->query('purchase_order'))
                ->with('vendor:id,name')
                ->first(['id', 'uuid', 'purchase_order_code', 'vendor_id']);
        }

        return Inertia::render('goods-receipt-notes/create', [
            'initialPurchaseOrder' => $initialPurchaseOrder,
        ]);
    }

    /**
     * Store a newly created goods receipt note.
     */
    public function store(GoodsReceiptNoteStoreRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $goodsReceiptNote = DB::transaction(function () use ($data): GoodsReceiptNote {
            $goodsReceiptNote = GoodsReceiptNote::create([
                'purchase_order_id' => $data['purchase_order_id'],
                'received_date' => $data['received_date'],
                'remarks' => $data['remarks'] ?? null,
                'status' => 'draft',
            ]);

            $this->syncItems($goodsReceiptNote, $data['items']);

            return $goodsReceiptNote;
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Goods receipt note created.')]);

        return to_route('goods-receipt-notes.show', $goodsReceiptNote);
    }

    /**
     * Display the specified goods receipt note.
     */
    public function show(GoodsReceiptNote $goodsReceiptNote): Response
    {
        $goodsReceiptNote->load([
            'purchaseOrder.vendor',
            'items.product',
            'receivedBy',
        ]);

        return Inertia::render('goods-receipt-notes/show', [
            'goodsReceiptNote' => $goodsReceiptNote,
        ]);
    }

    /**
     * Show the form for editing the specified goods receipt note.
     */
    public function edit(GoodsReceiptNote $goodsReceiptNote): Response
    {
        abort_if($goodsReceiptNote->status !== 'draft', 403, 'Only draft goods receipt notes can be edited.');

        $goodsReceiptNote->load([
            'purchaseOrder.vendor',
            'items.product',
        ]);

        return Inertia::render('goods-receipt-notes/edit', [
            'goodsReceiptNote' => $goodsReceiptNote,
        ]);
    }

    /**
     * Update the specified goods receipt note.
     */
    public function update(GoodsReceiptNoteUpdateRequest $request, GoodsReceiptNote $goodsReceiptNote): RedirectResponse
    {
        $data = $request->validated();

        DB::transaction(function () use ($data, $goodsReceiptNote): void {
            $goodsReceiptNote->items()->delete();

            $goodsReceiptNote->update([
                'received_date' => $data['received_date'],
                'remarks' => $data['remarks'] ?? null,
            ]);

            $this->syncItems($goodsReceiptNote, $data['items']);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Goods receipt note updated.')]);

        return to_route('goods-receipt-notes.show', $goodsReceiptNote);
    }

    /**
     * Remove the specified goods receipt note.
     */
    public function destroy(GoodsReceiptNote $goodsReceiptNote): RedirectResponse
    {
        abort_if($goodsReceiptNote->status !== 'draft', 403, 'Only draft goods receipt notes can be deleted.');

        $goodsReceiptNote->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Goods receipt note deleted.')]);

        return to_route('goods-receipt-notes.index');
    }

    /**
     * Confirm the specified goods receipt note, recording who received the goods and
     * updating the linked purchase order's fulfillment progress.
     */
    public function confirm(GoodsReceiptNoteConfirmRequest $request, GoodsReceiptNote $goodsReceiptNote): RedirectResponse
    {
        abort_if($goodsReceiptNote->purchaseOrder->status !== 'approved', 403, 'The linked purchase order is no longer approved.');

        DB::transaction(function () use ($request, $goodsReceiptNote): void {
            $goodsReceiptNote->update([
                'status' => 'confirmed',
                'received_by_id' => $request->validated('received_by_id'),
                'received_at' => now(),
            ]);

            $this->createStockMovements($goodsReceiptNote);
            $this->updatePurchaseOrderProgress($goodsReceiptNote->purchaseOrder);
            $goodsReceiptNote->purchaseOrder->project->recomputePoStatus();
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Goods receipt note confirmed.')]);

        return to_route('goods-receipt-notes.show', $goodsReceiptNote);
    }

    /**
     * Cancel the specified goods receipt note, reversing its stock movements and
     * recomputing the linked purchase order's fulfillment progress.
     */
    public function cancel(GoodsReceiptNoteCancelRequest $request, GoodsReceiptNote $goodsReceiptNote): RedirectResponse
    {
        $goodsReceiptNote->load(['items', 'purchaseOrder.project', 'purchaseOrder.items']);

        DB::transaction(function () use ($goodsReceiptNote): void {
            StockMovement::query()
                ->whereIn('goods_receipt_note_item_id', $goodsReceiptNote->items->pluck('id'))
                ->delete();

            $goodsReceiptNote->update(['status' => 'cancelled']);

            $this->updatePurchaseOrderProgress($goodsReceiptNote->purchaseOrder);
            $goodsReceiptNote->purchaseOrder->project->recomputePoStatus();
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Goods receipt note cancelled.')]);

        return to_route('goods-receipt-notes.show', $goodsReceiptNote);
    }

    /**
     * Create the goods receipt note's line items, snapshotting each one's quantity ordered
     * and unit from its source purchase order line item at the time of creation.
     *
     * @param  array<int, array<string, mixed>>  $items
     */
    private function syncItems(GoodsReceiptNote $goodsReceiptNote, array $items): void
    {
        $purchaseOrderItems = PurchaseOrderItem::query()
            ->whereIn('id', collect($items)->pluck('purchase_order_item_id'))
            ->get()
            ->keyBy('id');

        foreach ($items as $item) {
            $purchaseOrderItem = $purchaseOrderItems->get($item['purchase_order_item_id']);

            $goodsReceiptNote->items()->create([
                'product_id' => $purchaseOrderItem->product_id,
                'purchase_order_item_id' => $purchaseOrderItem->id,
                'quantity_ordered' => $purchaseOrderItem->quantity,
                'unit' => $purchaseOrderItem->unit,
                'quantity_accepted' => $item['quantity_accepted'],
                'quantity_rejected' => $item['quantity_rejected'] ?? 0,
                'rejection_reason' => $item['rejection_reason'] ?? null,
            ]);
        }
    }

    /**
     * Create an "in" stock movement for each accepted, physical-goods line item on this
     * goods receipt note. Rejected quantity never entered stock, so it's excluded; service
     * products have no physical stock to track.
     */
    private function createStockMovements(GoodsReceiptNote $goodsReceiptNote): void
    {
        $goodsReceiptNote->load('items.product');

        foreach ($goodsReceiptNote->items as $item) {
            if ($item->product->type !== 'goods' || (float) $item->quantity_accepted <= 0) {
                continue;
            }

            StockMovement::create([
                'product_id' => $item->product_id,
                'type' => 'in',
                'quantity' => $item->quantity_accepted,
                'movement_date' => $goodsReceiptNote->received_date,
                'goods_receipt_note_item_id' => $item->id,
            ]);
        }
    }

    /**
     * Recompute and persist the purchase order's post-approval progress from the accepted
     * quantities across all of its confirmed goods receipt notes, comparing per line item
     * rather than as an aggregate total (an aggregate sum can be masked by one over-received
     * line hiding another line that never arrived).
     */
    private function updatePurchaseOrderProgress(PurchaseOrder $purchaseOrder): void
    {
        $items = $purchaseOrder->items;

        $accepted = GoodsReceiptNoteItem::query()
            ->whereIn('purchase_order_item_id', $items->pluck('id'))
            ->whereHas('goodsReceiptNote', fn ($query) => $query->where('status', 'confirmed'))
            ->selectRaw('purchase_order_item_id, sum(quantity_accepted) as accepted')
            ->groupBy('purchase_order_item_id')
            ->pluck('accepted', 'purchase_order_item_id');

        $anyReceived = false;
        $allFullyReceived = true;

        foreach ($items as $item) {
            $acceptedQuantity = (float) ($accepted[$item->id] ?? 0);

            if ($acceptedQuantity > 0) {
                $anyReceived = true;
            }

            if ($acceptedQuantity < (float) $item->quantity) {
                $allFullyReceived = false;
            }
        }

        if (! $anyReceived) {
            if (in_array($purchaseOrder->progress, ['partially_received', 'fully_received', 'closed'])) {
                $purchaseOrder->update(['progress' => 'sent']);
            }

            return;
        }

        $purchaseOrder->update(['progress' => $allFullyReceived ? 'closed' : 'partially_received']);
    }
}
