<?php

namespace App\Http\Controllers;

use App\Http\Requests\StockAdjustmentStoreRequest;
use App\Models\StockAdjustment;
use App\Models\StockMovement;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class StockAdjustmentController extends Controller
{
    /**
     * Display a listing of the stock adjustments.
     */
    public function index(): Response
    {
        $stockAdjustments = StockAdjustment::query()
            ->with(['product', 'adjustedBy'])
            ->orderByDesc('created_at')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('stock-adjustments/index', [
            'stockAdjustments' => $stockAdjustments,
        ]);
    }

    /**
     * Show the form for creating a new stock adjustment.
     */
    public function create(): Response
    {
        return Inertia::render('stock-adjustments/create');
    }

    /**
     * Store a newly created stock adjustment and its resulting stock movement.
     */
    public function store(StockAdjustmentStoreRequest $request): RedirectResponse
    {
        DB::transaction(function () use ($request): void {
            $adjustment = StockAdjustment::create([
                ...$request->validated(),
                'adjusted_by' => $request->user()->id,
            ]);

            StockMovement::create([
                'product_id' => $adjustment->product_id,
                'type' => $adjustment->type === 'increase' ? 'in' : 'out',
                'quantity' => $adjustment->quantity,
                'movement_date' => now()->toDateString(),
                'stock_adjustment_id' => $adjustment->id,
            ]);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Stock adjustment recorded.')]);

        return to_route('stock-adjustments.index');
    }
}
