<?php

namespace App\Http\Controllers;

use App\Http\Requests\PurchaseInvoiceIssueRequest;
use App\Http\Requests\PurchaseInvoiceStoreRequest;
use App\Http\Requests\PurchaseInvoiceUpdateRequest;
use App\Models\ActivityLog;
use App\Models\PurchaseInvoice;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\Tax;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PurchaseInvoiceController extends Controller
{
    /**
     * Display a listing of the purchase invoices.
     */
    public function index(Request $request): Response
    {
        $search = (string) $request->query('search', '');
        $status = (string) $request->query('status', '');
        $paymentStatus = (string) $request->query('payment_status', '');
        $sort = (string) $request->query('sort', '');

        $purchaseInvoices = PurchaseInvoice::query()
            ->with('purchaseOrder.vendor')
            ->when($search !== '', function ($builder) use ($search): void {
                $builder->where(function ($q) use ($search): void {
                    $q->where('purchase_invoice_code', 'like', "%{$search}%")
                        ->orWhereHas('purchaseOrder', function ($q2) use ($search): void {
                            $q2->where('purchase_order_code', 'like', "%{$search}%");
                        })
                        ->orWhereHas('purchaseOrder.vendor', function ($q2) use ($search): void {
                            $q2->where('name', 'like', "%{$search}%");
                        });
                });
            })
            ->when($status !== '' && $status !== 'all', fn ($builder) => $builder->where('status', $status))
            ->when($paymentStatus !== '' && $paymentStatus !== 'all', fn ($builder) => $builder->where('payment_status', $paymentStatus))
            ->when($sort === 'oldest', fn ($builder) => $builder->orderBy('created_at'))
            ->when($sort === 'due_date_desc', fn ($builder) => $builder->orderByDesc('due_date'))
            ->when($sort === 'due_date_asc', fn ($builder) => $builder->orderBy('due_date'))
            ->when(! in_array($sort, ['oldest', 'due_date_desc', 'due_date_asc']), fn ($builder) => $builder->orderByDesc('created_at'))
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('purchase-invoices/index', [
            'purchaseInvoices' => $purchaseInvoices,
            'filters' => ['search' => $search, 'status' => $status, 'payment_status' => $paymentStatus, 'sort' => $sort],
        ]);
    }

    /**
     * Show the form for creating a new purchase invoice.
     */
    public function create(Request $request): Response
    {
        $initialPurchaseOrder = null;

        if ($request->query('purchase_order')) {
            $initialPurchaseOrder = PurchaseOrder::query()
                ->where('uuid', $request->query('purchase_order'))
                ->with(['vendor:id,name', 'currency:id,iso_code,name,symbol'])
                ->first(['id', 'uuid', 'purchase_order_code', 'vendor_id', 'currency_id']);
        }

        $taxes = Tax::query()->orderBy('name')->get(['id', 'name', 'rate', 'type']);

        return Inertia::render('purchase-invoices/create', [
            'initialPurchaseOrder' => $initialPurchaseOrder,
            'taxes' => $taxes,
        ]);
    }

    /**
     * Store a newly created purchase invoice.
     */
    public function store(PurchaseInvoiceStoreRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $purchaseInvoice = DB::transaction(function () use ($data): PurchaseInvoice {
            $purchaseInvoice = PurchaseInvoice::create([
                'purchase_order_id' => $data['purchase_order_id'],
                'invoice_date' => $data['invoice_date'],
                'due_date' => $data['due_date'],
                'remarks' => $data['remarks'] ?? null,
                'discount_type' => $data['discount_type'] ?? null,
                'discount_value' => $data['discount_value'] ?? null,
                'tax_id' => $data['tax_id'] ?? null,
                'status' => 'draft',
            ]);

            $this->syncItems($purchaseInvoice, $data);

            return $purchaseInvoice;
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Purchase invoice created.')]);

        return to_route('purchase-invoices.show', $purchaseInvoice);
    }

    /**
     * Display the specified purchase invoice.
     */
    public function show(PurchaseInvoice $purchaseInvoice): Response
    {
        $purchaseInvoice->load([
            'purchaseOrder.vendor',
            'purchaseOrder.currency',
            'tax',
            'items.product',
            'payments' => fn ($query) => $query->orderByDesc('payment_date'),
            'payments.recordedBy',
            'payments.cancelledBy',
        ]);

        return Inertia::render('purchase-invoices/show', [
            'purchaseInvoice' => $purchaseInvoice,
        ]);
    }

    /**
     * Show the form for editing the specified purchase invoice.
     */
    public function edit(PurchaseInvoice $purchaseInvoice): Response
    {
        abort_if($purchaseInvoice->status !== 'draft', 403, 'Only draft purchase invoices can be edited.');

        $purchaseInvoice->load([
            'purchaseOrder.vendor',
            'items.product',
        ]);

        $taxes = Tax::query()->orderBy('name')->get(['id', 'name', 'rate', 'type']);

        return Inertia::render('purchase-invoices/edit', [
            'purchaseInvoice' => $purchaseInvoice,
            'taxes' => $taxes,
        ]);
    }

    /**
     * Update the specified purchase invoice.
     */
    public function update(PurchaseInvoiceUpdateRequest $request, PurchaseInvoice $purchaseInvoice): RedirectResponse
    {
        $data = $request->validated();

        DB::transaction(function () use ($data, $purchaseInvoice): void {
            $purchaseInvoice->items()->delete();

            $purchaseInvoice->update([
                'invoice_date' => $data['invoice_date'],
                'due_date' => $data['due_date'],
                'remarks' => $data['remarks'] ?? null,
                'discount_type' => $data['discount_type'] ?? null,
                'discount_value' => $data['discount_value'] ?? null,
                'tax_id' => $data['tax_id'] ?? null,
            ]);

            $this->syncItems($purchaseInvoice, $data);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Purchase invoice updated.')]);

        return to_route('purchase-invoices.show', $purchaseInvoice);
    }

    /**
     * Remove the specified purchase invoice.
     */
    public function destroy(PurchaseInvoice $purchaseInvoice): RedirectResponse
    {
        abort_if($purchaseInvoice->status !== 'draft', 403, 'Only draft purchase invoices can be deleted.');

        $purchaseInvoice->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Purchase invoice deleted.')]);

        return to_route('purchase-invoices.index');
    }

    /**
     * Issue the specified purchase invoice, locking it from further edits.
     */
    public function issue(PurchaseInvoiceIssueRequest $request, PurchaseInvoice $purchaseInvoice): RedirectResponse
    {
        $purchaseInvoice->update([
            'status' => 'issued',
            'issued_at' => now(),
        ]);

        $purchaseInvoice->purchaseOrder->project->recomputeActualCost();

        ActivityLog::record('purchase_invoice.issued', $purchaseInvoice, "Issued purchase invoice {$purchaseInvoice->purchase_invoice_code}.");

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Purchase invoice issued.')]);

        return to_route('purchase-invoices.show', $purchaseInvoice);
    }

    /**
     * Create the purchase invoice's line items, snapshotting each one's quantity ordered, unit,
     * and unit price from its source purchase order line item, then compute and persist the
     * purchase invoice's subtotal/discount/tax/total from the item totals and the header-level
     * discount/tax.
     *
     * @param  array<string, mixed>  $data
     */
    private function syncItems(PurchaseInvoice $purchaseInvoice, array $data): void
    {
        $purchaseOrderItems = PurchaseOrderItem::query()
            ->whereIn('id', array_column($data['items'], 'purchase_order_item_id'))
            ->get()
            ->keyBy('id');

        $subtotal = 0;

        foreach ($data['items'] as $item) {
            $purchaseOrderItem = $purchaseOrderItems->get($item['purchase_order_item_id']);
            $quantityInvoiced = (float) $item['quantity_invoiced'];
            $total = $quantityInvoiced * (float) $purchaseOrderItem->unit_price;

            $purchaseInvoice->items()->create([
                'product_id' => $purchaseOrderItem->product_id,
                'purchase_order_item_id' => $purchaseOrderItem->id,
                'quantity_ordered' => $purchaseOrderItem->quantity,
                'unit' => $purchaseOrderItem->unit,
                'unit_price' => $purchaseOrderItem->unit_price,
                'quantity_invoiced' => $quantityInvoiced,
                'total' => $total,
            ]);

            $subtotal += $total;
        }

        $discountAmount = $this->calculateDiscountAmount($subtotal, $data['discount_type'] ?? null, $data['discount_value'] ?? null);
        $discountedSubtotal = $subtotal - $discountAmount;

        $tax = isset($data['tax_id']) ? Tax::query()->firstWhere('id', $data['tax_id']) : null;
        $taxAmount = $this->calculateTaxAmount($discountedSubtotal, $tax);

        $purchaseInvoice->update([
            'subtotal' => $subtotal,
            'discount_amount' => $discountAmount,
            'tax_amount' => $taxAmount,
            'total' => $discountedSubtotal + $taxAmount,
        ]);
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
