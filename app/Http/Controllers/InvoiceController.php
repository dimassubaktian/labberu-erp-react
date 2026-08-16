<?php

namespace App\Http\Controllers;

use App\Http\Requests\InvoiceIssueRequest;
use App\Http\Requests\InvoicePaymentTermsUpdateRequest;
use App\Http\Requests\InvoiceStoreRequest;
use App\Http\Requests\InvoiceUpdateRequest;
use App\Models\CompanySetting;
use App\Models\Invoice;
use App\Models\PaymentTermTemplate;
use App\Models\Quotation;
use App\Models\QuotationItem;
use App\Models\Tax;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class InvoiceController extends Controller
{
    /**
     * Display a listing of the invoices.
     */
    public function index(Request $request): Response
    {
        $search = (string) $request->query('search', '');
        $status = (string) $request->query('status', '');
        $paymentStatus = (string) $request->query('payment_status', '');
        $sort = (string) $request->query('sort', '');

        $invoices = Invoice::query()
            ->with('quotation.project.customer')
            ->when($search !== '', function ($builder) use ($search): void {
                $builder->where(function ($q) use ($search): void {
                    $q->where('invoice_code', 'like', "%{$search}%")
                        ->orWhereHas('quotation', function ($q2) use ($search): void {
                            $q2->where('quotation_code', 'like', "%{$search}%");
                        })
                        ->orWhereHas('quotation.project.customer', function ($q2) use ($search): void {
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

        return Inertia::render('invoices/index', [
            'invoices' => $invoices,
            'filters' => ['search' => $search, 'status' => $status, 'payment_status' => $paymentStatus, 'sort' => $sort],
        ]);
    }

    /**
     * Show the form for creating a new invoice.
     */
    public function create(Request $request): Response
    {
        $initialQuotation = null;

        if ($request->query('quotation')) {
            $initialQuotation = Quotation::query()
                ->where('uuid', $request->query('quotation'))
                ->with(['project.customer:id,name', 'currency:id,iso_code,name,symbol'])
                ->first(['id', 'uuid', 'quotation_code', 'version_major', 'version_minor', 'project_id', 'currency_id', 'payment_term_template_id', 'payment_terms_html']);
        }

        $taxes = Tax::query()->orderBy('name')->get(['id', 'name', 'rate', 'type']);
        $paymentTermTemplates = PaymentTermTemplate::query()->orderBy('name')->get(['id', 'uuid', 'name', 'content']);

        return Inertia::render('invoices/create', [
            'initialQuotation' => $initialQuotation,
            'taxes' => $taxes,
            'paymentTermTemplates' => $paymentTermTemplates,
        ]);
    }

    /**
     * Store a newly created invoice.
     */
    public function store(InvoiceStoreRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $invoice = DB::transaction(function () use ($data): Invoice {
            $invoice = Invoice::create([
                'quotation_id' => $data['quotation_id'],
                'invoice_date' => $data['invoice_date'],
                'due_date' => $data['due_date'],
                'remarks' => $data['remarks'] ?? null,
                'payment_term_template_id' => $data['payment_term_template_id'] ?? null,
                'payment_terms_html' => $data['payment_terms_html'] ?? null,
                'discount_type' => $data['discount_type'] ?? null,
                'discount_value' => $data['discount_value'] ?? null,
                'tax_id' => $data['tax_id'] ?? null,
                'status' => 'draft',
            ]);

            $this->syncItems($invoice, $data);

            return $invoice;
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Invoice created.')]);

        return to_route('invoices.show', $invoice);
    }

    /**
     * Display the specified invoice.
     */
    public function show(Invoice $invoice): Response
    {
        $invoice->load([
            'quotation.project.customer',
            'quotation.currency',
            'paymentTermTemplate',
            'tax',
            'items.product',
            'payments' => fn ($query) => $query->orderByDesc('payment_date'),
            'payments.recordedBy',
            'payments.cancelledBy',
        ]);

        return Inertia::render('invoices/show', [
            'invoice' => $invoice,
            'paymentTermTemplates' => PaymentTermTemplate::query()->orderBy('name')->get(['id', 'uuid', 'name', 'content']),
        ]);
    }

    /**
     * Show the form for editing the specified invoice.
     */
    public function edit(Invoice $invoice): Response
    {
        abort_if($invoice->status !== 'draft', 403, 'Only draft invoices can be edited.');

        $invoice->load([
            'quotation.project.customer',
            'items.product',
        ]);

        $taxes = Tax::query()->orderBy('name')->get(['id', 'name', 'rate', 'type']);
        $paymentTermTemplates = PaymentTermTemplate::query()->orderBy('name')->get(['id', 'uuid', 'name', 'content']);

        return Inertia::render('invoices/edit', [
            'invoice' => $invoice,
            'taxes' => $taxes,
            'paymentTermTemplates' => $paymentTermTemplates,
        ]);
    }

    /**
     * Update the specified invoice.
     */
    public function update(InvoiceUpdateRequest $request, Invoice $invoice): RedirectResponse
    {
        $data = $request->validated();

        DB::transaction(function () use ($data, $invoice): void {
            $invoice->items()->delete();

            $invoice->update([
                'invoice_date' => $data['invoice_date'],
                'due_date' => $data['due_date'],
                'remarks' => $data['remarks'] ?? null,
                'payment_term_template_id' => $data['payment_term_template_id'] ?? null,
                'payment_terms_html' => $data['payment_terms_html'] ?? null,
                'discount_type' => $data['discount_type'] ?? null,
                'discount_value' => $data['discount_value'] ?? null,
                'tax_id' => $data['tax_id'] ?? null,
            ]);

            $this->syncItems($invoice, $data);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Invoice updated.')]);

        return to_route('invoices.show', $invoice);
    }

    /**
     * Remove the specified invoice.
     */
    public function destroy(Invoice $invoice): RedirectResponse
    {
        abort_if($invoice->status !== 'draft', 403, 'Only draft invoices can be deleted.');

        $invoice->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Invoice deleted.')]);

        return to_route('invoices.index');
    }

    /**
     * Issue the specified invoice, locking it from further edits.
     */
    public function issue(InvoiceIssueRequest $request, Invoice $invoice): RedirectResponse
    {
        $invoice->update([
            'status' => 'issued',
            'issued_at' => now(),
        ]);

        $invoice->quotation->project->recomputeBillingStatus();
        $invoice->quotation->project->recomputeStatus();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Invoice issued.')]);

        return to_route('invoices.show', $invoice);
    }

    /**
     * Update only the specified invoice's payment terms, which stay editable after issuing.
     */
    public function updatePaymentTerms(InvoicePaymentTermsUpdateRequest $request, Invoice $invoice): RedirectResponse
    {
        $data = $request->validated();

        $invoice->update([
            'payment_term_template_id' => $data['payment_term_template_id'] ?? null,
            'payment_terms_html' => $data['payment_terms_html'] ?? null,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Payment terms updated.')]);

        return to_route('invoices.show', $invoice);
    }

    /**
     * Stream the invoice as a printable PDF document.
     */
    public function print(Request $request, Invoice $invoice): HttpResponse
    {
        $invoice->load([
            'quotation.project.customer',
            'quotation.currency',
            'tax',
            'items.product',
        ]);

        $company = CompanySetting::current();

        $pdf = Pdf::loadView('pdf.invoice', [
            'invoice' => $invoice,
            'company' => $company,
            'loggedInUser' => $request->user(),
        ])->setPaper('a4', 'portrait');

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

        $filename = "invoice-{$invoice->invoice_code}.pdf";

        return $request->boolean('download')
            ? $pdf->download($filename)
            : $pdf->stream($filename);
    }

    /**
     * Create the invoice's line items, snapshotting each one's quantity ordered, unit, and
     * unit price from its source quotation line item, then compute and persist the invoice's
     * subtotal/discount/tax/total from the item totals and the header-level discount/tax.
     *
     * @param  array<string, mixed>  $data
     */
    private function syncItems(Invoice $invoice, array $data): void
    {
        $quotationItems = QuotationItem::query()
            ->whereIn('id', array_column($data['items'], 'quotation_item_id'))
            ->get()
            ->keyBy('id');

        $subtotal = 0;

        foreach ($data['items'] as $item) {
            $quotationItem = $quotationItems->get($item['quotation_item_id']);
            $quantityInvoiced = (float) $item['quantity_invoiced'];
            $total = $quantityInvoiced * (float) $quotationItem->unit_price;

            $invoice->items()->create([
                'product_id' => $quotationItem->product_id,
                'quotation_item_id' => $quotationItem->id,
                'quantity_ordered' => $quotationItem->quantity,
                'unit' => $quotationItem->unit,
                'unit_price' => $quotationItem->unit_price,
                'quantity_invoiced' => $quantityInvoiced,
                'total' => $total,
            ]);

            $subtotal += $total;
        }

        $discountAmount = $this->calculateDiscountAmount($subtotal, $data['discount_type'] ?? null, $data['discount_value'] ?? null);
        $discountedSubtotal = $subtotal - $discountAmount;

        $tax = isset($data['tax_id']) ? Tax::query()->firstWhere('id', $data['tax_id']) : null;
        $taxAmount = $this->calculateTaxAmount($discountedSubtotal, $tax);

        $invoice->update([
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
