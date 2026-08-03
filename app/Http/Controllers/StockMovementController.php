<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\StockMovement;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StockMovementController extends Controller
{
    /**
     * Display a listing of the stock movements. This is a read-only ledger — movements are
     * only ever created as a side effect of confirming a Goods Receipt Note or Delivery
     * Order, never directly.
     */
    public function index(Request $request): Response
    {
        $productUuid = $request->query('product');
        $productId = $productUuid
            ? Product::query()->where('uuid', $productUuid)->value('id')
            : null;

        $stockMovements = StockMovement::query()
            ->with([
                'product',
                'goodsReceiptNoteItem.goodsReceiptNote.purchaseOrder.vendor',
                'deliveryOrderItem.deliveryOrder.quotation.project.customer',
                'stockAdjustment',
            ])
            ->when($productId, fn ($query) => $query->where('product_id', $productId))
            ->orderByDesc('movement_date')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('stock-movements/index', [
            'stockMovements' => $stockMovements,
        ]);
    }
}
