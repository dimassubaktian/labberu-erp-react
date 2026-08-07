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

        $search = (string) $request->query('search', '');
        $type = (string) $request->query('type', '');

        $stockMovements = StockMovement::query()
            ->with([
                'product',
                'goodsReceiptNoteItem.goodsReceiptNote.purchaseOrder.vendor',
                'deliveryOrderItem.deliveryOrder.quotation.project.customer',
                'stockAdjustment',
            ])
            ->when($productId, fn ($query) => $query->where('product_id', $productId))
            ->when($search !== '', function ($builder) use ($search): void {
                $builder->whereHas('product', function ($q) use ($search): void {
                    $q->where('product_code', 'like', "%{$search}%")
                        ->orWhere('name', 'like', "%{$search}%")
                        ->orWhere('reference_number', 'like', "%{$search}%");
                });
            })
            ->when($type !== '' && $type !== 'all', fn ($builder) => $builder->where('type', $type))
            ->orderByDesc('movement_date')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('stock-movements/index', [
            'stockMovements' => $stockMovements,
            'filters' => ['search' => $search, 'type' => $type],
        ]);
    }
}
