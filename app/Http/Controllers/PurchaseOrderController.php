<?php

namespace App\Http\Controllers;

use App\Http\Requests\PurchaseOrderApproveRequest;
use App\Http\Requests\PurchaseOrderCancelRequest;
use App\Http\Requests\PurchaseOrderCheckRequest;
use App\Http\Requests\PurchaseOrderIssueRequest;
use App\Http\Requests\PurchaseOrderProgressUpdateRequest;
use App\Http\Requests\PurchaseOrderRejectRequest;
use App\Http\Requests\PurchaseOrderStoreRequest;
use App\Http\Requests\PurchaseOrderUpdateRequest;
use App\Http\Requests\PurchaseOrderVoidRequest;
use App\Models\Currency;
use App\Models\GoodsReceiptNoteItem;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\Tax;
use App\Models\Workforce;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PurchaseOrderController extends Controller
{
    /**
     * Search purchase orders for async select pickers, restricted to approved orders (only
     * approved purchase orders can have goods received against them).
     */
    public function search(Request $request): JsonResponse
    {
        $query = (string) $request->query('q', '');

        $purchaseOrders = PurchaseOrder::query()
            ->where('status', 'approved')
            ->when($query !== '', fn ($builder) => $builder->where('purchase_order_code', 'like', "%{$query}%"))
            ->with('vendor:id,name')
            ->orderByDesc('created_at')
            ->limit(20)
            ->get(['id', 'uuid', 'purchase_order_code', 'vendor_id']);

        return response()->json(['data' => $purchaseOrders]);
    }

    /**
     * List this purchase order's line items with quantity ordered, quantity already accepted
     * across its confirmed goods receipt notes, and what remains to receive — used by the
     * Goods Receipt Note create/edit form.
     */
    public function items(PurchaseOrder $purchaseOrder): JsonResponse
    {
        $items = $purchaseOrder->items()->with('product:id,product_code,name')->get();

        $received = GoodsReceiptNoteItem::query()
            ->whereIn('purchase_order_item_id', $items->pluck('id'))
            ->whereHas('goodsReceiptNote', fn ($query) => $query->where('status', 'confirmed'))
            ->selectRaw('purchase_order_item_id, sum(quantity_accepted) as received')
            ->groupBy('purchase_order_item_id')
            ->pluck('received', 'purchase_order_item_id');

        $data = $items->map(function (PurchaseOrderItem $item) use ($received): array {
            $receivedQuantity = (float) ($received[$item->id] ?? 0);

            return [
                'id' => $item->id,
                'product' => $item->product,
                'quantity' => $item->quantity,
                'unit' => $item->unit,
                'received' => $receivedQuantity,
                'remaining' => max(0, (float) $item->quantity - $receivedQuantity),
            ];
        });

        return response()->json(['data' => $data]);
    }

    /**
     * Display a listing of the purchase orders.
     */
    public function index(): Response
    {
        $purchaseOrders = PurchaseOrder::query()
            ->with(['project', 'customer', 'vendor', 'currency'])
            ->orderByDesc('created_at')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('purchase-orders/index', [
            'purchaseOrders' => $purchaseOrders,
        ]);
    }

    /**
     * Show the form for creating a new purchase order.
     */
    public function create(): Response
    {
        $currencies = Currency::query()
            ->where('status', 'active')
            ->orderBy('iso_code')
            ->get(['id', 'iso_code', 'name', 'symbol', 'base_currency']);

        $taxes = Tax::query()->orderBy('name')->get(['id', 'name', 'rate', 'type']);

        return Inertia::render('purchase-orders/create', [
            'currencies' => $currencies,
            'taxes' => $taxes,
        ]);
    }

    /**
     * Store a newly created purchase order.
     */
    public function store(PurchaseOrderStoreRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $purchaseOrder = DB::transaction(function () use ($data): PurchaseOrder {
            $purchaseOrder = PurchaseOrder::create([
                'project_id' => $data['project_id'],
                'quotation_id' => $data['quotation_id'],
                'customer_id' => $data['customer_id'],
                'vendor_id' => $data['vendor_id'],
                'address' => $data['address'] ?? null,
                'attention' => $data['attention'] ?? null,
                'phone' => $data['phone'] ?? null,
                'fax' => $data['fax'] ?? null,
                'quotation_no' => $data['quotation_no'] ?? null,
                'quotation_date' => $data['quotation_date'] ?? null,
                'project_name' => $data['project_name'],
                'date' => $data['date'],
                'currency_id' => $data['currency_id'],
                'tax_id' => $data['tax_id'] ?? null,
                'shipping_method' => $data['shipping_method'] ?? null,
                'shipping_terms' => $data['shipping_terms'] ?? null,
                'delivery_date' => $data['delivery_date'] ?? null,
                'status' => 'draft',
            ]);

            $this->syncItemsAndDiscounts($purchaseOrder, $data);

            return $purchaseOrder;
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Purchase order created.')]);

        return to_route('purchase-orders.show', $purchaseOrder);
    }

    /**
     * Display the specified purchase order.
     */
    public function show(PurchaseOrder $purchaseOrder): Response
    {
        $purchaseOrder->load([
            'project',
            'quotation',
            'customer',
            'vendor',
            'currency',
            'tax',
            'items.product',
            'discounts',
            'goodsReceiptNotes' => fn ($query) => $query->orderByDesc('created_at'),
            'issuedBy',
            'checkedByFirst',
            'checkedBySecond',
            'approvedBy',
        ]);

        $workforces = Workforce::query()
            ->where('status', 'active')
            ->orderBy('full_name')
            ->get(['id', 'full_name']);

        return Inertia::render('purchase-orders/show', [
            'purchaseOrder' => $purchaseOrder,
            'workforces' => $workforces,
        ]);
    }

    /**
     * Show the form for editing the specified purchase order.
     */
    public function edit(PurchaseOrder $purchaseOrder): Response
    {
        abort_if(
            ! in_array($purchaseOrder->status, ['draft', 'approved'], true),
            403,
            'Only draft or approved purchase orders can be edited.'
        );

        $purchaseOrder->load([
            'project.customer:id,name',
            'customer',
            'vendor',
            'items.product',
            'discounts',
        ]);

        $currencies = Currency::query()
            ->where('status', 'active')
            ->orderBy('iso_code')
            ->get(['id', 'iso_code', 'name', 'symbol']);

        $taxes = Tax::query()->orderBy('name')->get(['id', 'name', 'rate', 'type']);

        return Inertia::render('purchase-orders/edit', [
            'purchaseOrder' => $purchaseOrder,
            'currencies' => $currencies,
            'taxes' => $taxes,
        ]);
    }

    /**
     * Update the specified purchase order.
     */
    public function update(PurchaseOrderUpdateRequest $request, PurchaseOrder $purchaseOrder): RedirectResponse
    {
        $data = $request->validated();
        $wasApproved = $purchaseOrder->status === 'approved';

        DB::transaction(function () use ($data, $purchaseOrder, $wasApproved): void {
            $purchaseOrder->items()->delete();
            $purchaseOrder->discounts()->delete();

            $purchaseOrder->update([
                'project_id' => $data['project_id'],
                'quotation_id' => $data['quotation_id'],
                'customer_id' => $data['customer_id'],
                'vendor_id' => $data['vendor_id'],
                'address' => $data['address'] ?? null,
                'attention' => $data['attention'] ?? null,
                'phone' => $data['phone'] ?? null,
                'fax' => $data['fax'] ?? null,
                'quotation_no' => $data['quotation_no'] ?? null,
                'quotation_date' => $data['quotation_date'] ?? null,
                'project_name' => $data['project_name'],
                'date' => $data['date'],
                'currency_id' => $data['currency_id'],
                'tax_id' => $data['tax_id'] ?? null,
                'shipping_method' => $data['shipping_method'] ?? null,
                'shipping_terms' => $data['shipping_terms'] ?? null,
                'delivery_date' => $data['delivery_date'] ?? null,
                ...($wasApproved ? [
                    'status' => 'draft',
                    'progress' => null,
                    'issued_by_id' => null,
                    'issued_at' => null,
                    'checked_by_1_id' => null,
                    'checked_by_1_at' => null,
                    'checked_by_2_id' => null,
                    'checked_by_2_at' => null,
                    'approved_by_id' => null,
                    'approved_at' => null,
                ] : []),
            ]);

            $this->syncItemsAndDiscounts($purchaseOrder, $data);
        });

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => $wasApproved
                ? __('Purchase order updated and reset to draft — the approval workflow must be redone.')
                : __('Purchase order updated.'),
        ]);

        return to_route('purchase-orders.show', $purchaseOrder);
    }

    /**
     * Remove the specified purchase order.
     */
    public function destroy(PurchaseOrder $purchaseOrder): RedirectResponse
    {
        abort_if($purchaseOrder->status !== 'draft', 403, 'Only draft purchase orders can be deleted.');

        $purchaseOrder->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Purchase order deleted.')]);

        return to_route('purchase-orders.index');
    }

    /**
     * Issue the specified purchase order, moving it from draft to issued.
     */
    public function issue(PurchaseOrderIssueRequest $request, PurchaseOrder $purchaseOrder): RedirectResponse
    {
        $purchaseOrder->update([
            'status' => 'issued',
            'issued_by_id' => $request->validated('issued_by_id'),
            'issued_at' => now(),
            'rejection_reason' => null,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Purchase order issued.')]);

        return to_route('purchase-orders.show', $purchaseOrder);
    }

    /**
     * Record a checker's sign-off on the specified purchase order.
     */
    public function check(PurchaseOrderCheckRequest $request, PurchaseOrder $purchaseOrder): RedirectResponse
    {
        $slot = (int) $request->validated('slot');

        $purchaseOrder->update([
            "checked_by_{$slot}_id" => $request->validated('checked_by_id'),
            "checked_by_{$slot}_at" => now(),
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Purchase order checked.')]);

        return to_route('purchase-orders.show', $purchaseOrder);
    }

    /**
     * Approve the specified purchase order once both checkers have signed off.
     */
    public function approve(PurchaseOrderApproveRequest $request, PurchaseOrder $purchaseOrder): RedirectResponse
    {
        $purchaseOrder->update([
            'status' => 'approved',
            'approved_by_id' => $request->validated('approved_by_id'),
            'approved_at' => now(),
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Purchase order approved.')]);

        return to_route('purchase-orders.show', $purchaseOrder);
    }

    /**
     * Reject the specified purchase order, reverting it to draft and clearing its sign-offs.
     */
    public function reject(PurchaseOrderRejectRequest $request, PurchaseOrder $purchaseOrder): RedirectResponse
    {
        $purchaseOrder->update([
            'status' => 'draft',
            'issued_by_id' => null,
            'issued_at' => null,
            'checked_by_1_id' => null,
            'checked_by_1_at' => null,
            'checked_by_2_id' => null,
            'checked_by_2_at' => null,
            'rejection_reason' => $request->validated('rejection_reason'),
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Purchase order rejected.')]);

        return to_route('purchase-orders.show', $purchaseOrder);
    }

    /**
     * Advance the specified purchase order to its next post-approval progress stage.
     */
    public function updateProgress(PurchaseOrderProgressUpdateRequest $request, PurchaseOrder $purchaseOrder): RedirectResponse
    {
        $purchaseOrder->update(['progress' => $request->validated('progress')]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Purchase order progress updated.')]);

        return to_route('purchase-orders.show', $purchaseOrder);
    }

    /**
     * Cancel the specified purchase order.
     */
    public function cancel(PurchaseOrderCancelRequest $request, PurchaseOrder $purchaseOrder): RedirectResponse
    {
        $purchaseOrder->update(['status' => 'cancelled']);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Purchase order cancelled.')]);

        return to_route('purchase-orders.show', $purchaseOrder);
    }

    /**
     * Void the specified purchase order.
     */
    public function void(PurchaseOrderVoidRequest $request, PurchaseOrder $purchaseOrder): RedirectResponse
    {
        $purchaseOrder->update(['status' => 'voided']);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Purchase order voided.')]);

        return to_route('purchase-orders.show', $purchaseOrder);
    }

    /**
     * Create the purchase order's line items and cascading discount levels, then compute and
     * persist its subtotal/discount/tax/grand total from the item totals and each discount
     * level applied in sequence against the running balance.
     *
     * @param  array<string, mixed>  $data
     */
    private function syncItemsAndDiscounts(PurchaseOrder $purchaseOrder, array $data): void
    {
        $subtotal = 0;

        foreach ($data['items'] as $item) {
            $calculated = $this->calculateItem($item);

            $purchaseOrder->items()->create($calculated);

            $subtotal += $calculated['total'];
        }

        $runningBalance = $subtotal;
        $discountTotal = 0;

        foreach ($data['discounts'] ?? [] as $index => $discount) {
            $discountAmount = $this->calculateDiscountAmount($runningBalance, $discount['discount_type'], $discount['discount_value']);

            $purchaseOrder->discounts()->create([
                'sequence' => $index + 1,
                'label' => $discount['label'],
                'discount_type' => $discount['discount_type'],
                'discount_value' => $discount['discount_value'],
                'base_amount' => $runningBalance,
                'discount_amount' => $discountAmount,
            ]);

            $runningBalance -= $discountAmount;
            $discountTotal += $discountAmount;
        }

        $tax = isset($data['tax_id']) ? Tax::query()->firstWhere('id', $data['tax_id']) : null;
        $taxAmount = $this->calculateTaxAmount($runningBalance, $tax);

        $purchaseOrder->update([
            'subtotal' => $subtotal,
            'discount_total' => $discountTotal,
            'net_after_discount' => $runningBalance,
            'tax_amount' => $taxAmount,
            'grand_total' => $runningBalance + $taxAmount,
        ]);
    }

    /**
     * Calculate a single line item's quantity × unit price total.
     *
     * @param  array<string, mixed>  $item
     * @return array<string, mixed>
     */
    private function calculateItem(array $item): array
    {
        $quantity = (float) $item['quantity'];
        $unitPrice = (float) $item['unit_price'];

        return [
            'product_id' => $item['product_id'],
            'bom_item_id' => $item['bom_item_id'] ?? null,
            'reference_number' => $item['reference_number'] ?? null,
            'description' => $item['description'] ?? null,
            'quantity' => $quantity,
            'unit' => $item['unit'],
            'unit_price' => $unitPrice,
            'total' => $quantity * $unitPrice,
        ];
    }

    /**
     * Calculate a percentage or fixed discount amount against a base value.
     */
    private function calculateDiscountAmount(float $base, string $discountType, mixed $discountValue): float
    {
        $discountValue = (float) $discountValue;

        return $discountType === 'percentage'
            ? min($base, $base * $discountValue / 100)
            : min($base, $discountValue);
    }

    /**
     * Calculate the tax amount for a discounted balance.
     */
    private function calculateTaxAmount(float $netAfterDiscount, ?Tax $tax): float
    {
        if (! $tax) {
            return 0;
        }

        return $tax->type === 'percentage'
            ? $netAfterDiscount * (float) $tax->rate / 100
            : (float) $tax->rate;
    }
}
