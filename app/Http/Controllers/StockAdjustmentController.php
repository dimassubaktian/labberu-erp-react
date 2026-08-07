<?php

namespace App\Http\Controllers;

use App\Http\Requests\StockAdjustmentStoreRequest;
use App\Models\StockAdjustment;
use App\Models\StockMovement;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class StockAdjustmentController extends Controller
{
    /**
     * Display a listing of the stock adjustments.
     */
    public function index(Request $request): Response
    {
        $search = (string) $request->query('search', '');
        $type = (string) $request->query('type', '');
        $sort = (string) $request->query('sort', '');

        $stockAdjustments = StockAdjustment::query()
            ->with(['product', 'adjustedBy'])
            ->when($search !== '', function ($builder) use ($search): void {
                $builder->whereHas('product', function ($q) use ($search): void {
                    $q->where('product_code', 'like', "%{$search}%")
                        ->orWhere('name', 'like', "%{$search}%")
                        ->orWhere('reference_number', 'like', "%{$search}%");
                });
            })
            ->when($type !== '' && $type !== 'all', fn ($builder) => $builder->where('type', $type))
            ->when($sort === 'oldest', fn ($builder) => $builder->orderBy('created_at'))
            ->when($sort !== 'oldest', fn ($builder) => $builder->orderByDesc('created_at'))
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('stock-adjustments/index', [
            'stockAdjustments' => $stockAdjustments,
            'filters' => ['search' => $search, 'type' => $type, 'sort' => $sort],
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
