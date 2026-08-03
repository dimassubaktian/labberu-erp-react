<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProductStoreRequest;
use App\Http\Requests\ProductUpdateRequest;
use App\Models\Product;
use App\Models\StockMovement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    /**
     * Search active products for async select pickers.
     */
    public function search(Request $request): JsonResponse
    {
        $query = (string) $request->query('q', '');
        $type = $request->query('type');

        $products = Product::query()
            ->where('status', 'active')
            ->when($query !== '', function ($builder) use ($query): void {
                $builder->where(function ($inner) use ($query): void {
                    $inner->where('name', 'like', "%{$query}%")
                        ->orWhere('product_code', 'like', "%{$query}%")
                        ->orWhere('reference_number', 'like', "%{$query}%");
                });
            })
            ->when($type !== null, fn ($builder) => $builder->where('type', $type))
            ->orderBy('name')
            ->limit(20)
            ->get(['id', 'name', 'product_code', 'reference_number', 'descriptions', 'brand', 'unit', 'price', 'cost']);

        return response()->json(['data' => $products]);
    }

    /**
     * Display a listing of the products.
     */
    public function index(): Response
    {
        $products = Product::query()
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('products/index', [
            'products' => $products,
        ]);
    }

    /**
     * Show the form for creating a new product.
     */
    public function create(): Response
    {
        return Inertia::render('products/create');
    }

    /**
     * Store a newly created product.
     */
    public function store(ProductStoreRequest $request): RedirectResponse
    {
        Product::create($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Product created.')]);

        return to_route('products.index');
    }

    /**
     * Display the specified product.
     */
    public function show(Product $product): Response
    {
        return Inertia::render('products/show', [
            'product' => $product,
            'stockOnHand' => StockMovement::quantityOnHandFor($product),
        ]);
    }

    /**
     * Show the form for editing the specified product.
     */
    public function edit(Product $product): Response
    {
        return Inertia::render('products/edit', [
            'product' => $product,
        ]);
    }

    /**
     * Update the specified product.
     */
    public function update(ProductUpdateRequest $request, Product $product): RedirectResponse
    {
        $product->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Product updated.')]);

        return to_route('products.show', $product);
    }

    /**
     * Remove the specified product.
     */
    public function destroy(Product $product): RedirectResponse
    {
        $product->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Product deleted.')]);

        return to_route('products.index');
    }
}
