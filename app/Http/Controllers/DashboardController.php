<?php

namespace App\Http\Controllers;

use App\Models\BusinessLine;
use App\Models\Customer;
use App\Models\GoodsReceiptNote;
use App\Models\Invoice;
use App\Models\InvoicePayment;
use App\Models\Project;
use App\Models\PurchaseOrder;
use App\Models\Quotation;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $user = Auth::user();
        $roles = $user->getRoleNames()->values()->toArray();
        $isSuperAdmin = in_array('Super Admin', $roles) || in_array('Admin', $roles);

        $year = (int) $request->query('year', Carbon::now()->year);
        $staffStatus = $request->query('staff_status', 'all');
        $staffPriority = $request->query('staff_priority', 'all');

        $yearExpr = DB::connection()->getDriverName() === 'sqlite'
            ? "strftime('%Y', request_date)"
            : 'YEAR(request_date)';

        $availableYears = Project::query()
            ->whereNull('deleted_at')
            ->whereNotNull('request_date')
            ->selectRaw("$yearExpr as year")
            ->distinct()
            ->orderByDesc('year')
            ->pluck('year')
            ->map(fn ($y) => (int) $y)
            ->toArray();

        if (! in_array(Carbon::now()->year, $availableYears)) {
            array_unshift($availableYears, Carbon::now()->year);
        }

        $props = [
            'filters' => [
                'year' => $year,
                'staff_status' => $staffStatus,
                'staff_priority' => $staffPriority,
            ],
            'available_years' => $availableYears,
        ];

        // These sections run ~20 aggregate queries each and are identical for every viewer of the
        // same year, so a short TTL absorbs repeated dashboard loads. The version segment lets
        // flushCache() invalidate every cached year at once when the underlying data changes.
        if ($isSuperAdmin || in_array('Manager', $roles)) {
            $props['management'] = Cache::remember(self::cacheKey('management', $year), now()->addMinutes(5), fn () => $this->managementData($year));
        }

        if ($isSuperAdmin || in_array('Finance', $roles)) {
            $props['finance'] = Cache::remember(self::cacheKey('finance', $year), now()->addMinutes(5), fn () => $this->financeData($year));
        }

        if ($isSuperAdmin || in_array('Procurement', $roles)) {
            $props['purchasing'] = Cache::remember(self::cacheKey('purchasing', $year), now()->addMinutes(5), fn () => $this->purchasingData($year));
        }

        if ($user->can('projects.view') && $user->can('quotations.view')) {
            $props['sales'] = Cache::remember(self::cacheKey('sales', $year), now()->addMinutes(5), fn () => $this->salesData($year));
        }

        $props['staff'] = $this->staffData($user, $staffStatus, $staffPriority);

        return Inertia::render('dashboard', $props);
    }

    /**
     * Cache key for a dashboard section and year, tagged with the current cache version so a single
     * flushCache() call retires every cached section/year without enumerating them (the file and
     * database cache stores have no tag support).
     */
    private static function cacheKey(string $section, int $year): string
    {
        $version = Cache::get('dashboard.version', 1);

        return "dashboard.{$section}.v{$version}.{$year}";
    }

    /**
     * Invalidate every cached dashboard section for every year. Called when data the dashboards
     * aggregate changes — e.g. invoices or payments — so figures like outstanding revenue don't
     * stay stale for the full cache TTL.
     */
    public static function flushCache(): void
    {
        Cache::forever('dashboard.version', Cache::get('dashboard.version', 1) + 1);
    }

    /**
     * Month-of-year expression for the active driver. SQLite has no MONTH(), and the value is
     * cast back to an integer so both drivers key the monthly buckets the same way.
     *
     * @param  literal-string  $column
     * @return literal-string
     */
    private function monthExpression(string $column): string
    {
        return DB::connection()->getDriverName() === 'sqlite'
            ? "CAST(strftime('%m', {$column}) AS INTEGER)"
            : "MONTH({$column})";
    }

    /**
     * Issued invoices joined to their quotation, which carries the currency and the rate that
     * converts invoice amounts into the base currency. Invoices have no currency of their own.
     *
     * @return Builder<Invoice>
     */
    private function issuedInvoices(): Builder
    {
        return Invoice::query()
            ->join('quotations', 'quotations.id', '=', 'invoices.quotation_id')
            ->whereNull('invoices.deleted_at')
            ->where('invoices.status', 'issued');
    }

    /**
     * Payments joined through to the quotation, so amounts convert the same way as the invoices
     * they settle.
     *
     * @return Builder<InvoicePayment>
     */
    private function invoicePayments(): Builder
    {
        return InvoicePayment::query()
            ->join('invoices', 'invoices.id', '=', 'invoice_payments.invoice_id')
            ->join('quotations', 'quotations.id', '=', 'invoices.quotation_id')
            ->whereNull('invoice_payments.cancelled_at')
            ->whereNull('invoices.deleted_at');
    }

    /**
     * Purchase orders that represent real commitments, carrying their own conversion rate.
     *
     * @return Builder<PurchaseOrder>
     */
    private function committedPurchaseOrders(): Builder
    {
        return PurchaseOrder::query()
            ->whereNull('deleted_at')
            ->whereNotIn('status', ['draft', 'cancelled', 'voided']);
    }

    /**
     * @return array<string, mixed>
     */
    private function managementData(int $year): array
    {
        $projectsByStatus = Project::query()
            ->whereNull('deleted_at')
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        $monthlyRevenue = $this->issuedInvoices()
            ->whereYear('invoices.invoice_date', $year)
            ->select([
                DB::raw($this->monthExpression('invoices.invoice_date').' as month'),
                DB::raw('SUM(invoices.total * quotations.exchange_rate) as total'),
            ])
            ->groupBy('month')
            ->orderBy('month')
            ->get()
            ->keyBy('month')
            ->map(fn ($row) => (float) $row->total)
            ->toArray();

        $monthlySpend = $this->committedPurchaseOrders()
            ->whereYear('date', $year)
            ->select([
                DB::raw($this->monthExpression('date').' as month'),
                DB::raw('SUM(grand_total * exchange_rate) as total'),
            ])
            ->groupBy('month')
            ->orderBy('month')
            ->get()
            ->keyBy('month')
            ->map(fn ($row) => (float) $row->total)
            ->toArray();

        $months = range(1, 12);
        $revenueByMonth = array_map(fn ($m) => ['month' => $m, 'revenue' => $monthlyRevenue[$m] ?? 0, 'spend' => $monthlySpend[$m] ?? 0], $months);

        $totalRevenue = (float) $this->issuedInvoices()->sum(DB::raw('invoices.total * quotations.exchange_rate'));
        $totalSpend = (float) $this->committedPurchaseOrders()->sum(DB::raw('grand_total * exchange_rate'));
        $activeProjects = Project::query()->whereNull('deleted_at')->whereIn('status', ['planning', 'in_progress'])->count();

        // Margin is measured net of tax on both sides: revenue excluding output tax against
        // actual_cost, which is what vendors billed excluding reclaimable input tax. The
        // revenue and spend KPIs above stay tax-inclusive, matching the documents themselves.
        $netRevenue = (float) $this->issuedInvoices()
            ->sum(DB::raw('(invoices.subtotal - invoices.discount_amount) * quotations.exchange_rate'));
        $actualCost = (float) Project::query()->whereNull('deleted_at')->sum('actual_cost');
        $grossMargin = $netRevenue > 0 ? round((($netRevenue - $actualCost) / $netRevenue) * 100, 1) : 0;

        $totalProjects = Project::query()->whereNull('deleted_at')->count();
        $quotationsApproved = Quotation::query()->whereNull('deleted_at')->where('is_current', true)->where('status', 'approved')->count();
        $quotationsSigned = Quotation::query()->whereNull('deleted_at')->where('is_current', true)->whereNotNull('progress')->where('progress', 'signed')->count();
        $invoiced = Invoice::query()->whereNull('deleted_at')->where('status', 'issued')->count();
        $paid = Invoice::query()->whereNull('deleted_at')->where('status', 'issued')->where('payment_status', 'paid')->count();

        $topCustomers = Customer::query()
            ->join('projects', 'projects.customer_id', '=', 'customers.id')
            ->join('quotations', 'quotations.project_id', '=', 'projects.id')
            ->join('invoices', 'invoices.quotation_id', '=', 'quotations.id')
            ->whereNull('projects.deleted_at')
            ->whereNull('quotations.deleted_at')
            ->whereNull('invoices.deleted_at')
            ->where('invoices.status', 'issued')
            ->selectRaw('customers.id, customers.name, SUM(invoices.total * quotations.exchange_rate) as total_revenue')
            ->groupBy('customers.id', 'customers.name')
            ->orderByDesc('total_revenue')
            ->limit(5)
            ->get()
            ->map(fn ($row) => ['name' => $row->name, 'revenue' => (float) $row->total_revenue])
            ->toArray();

        $businessLineStats = BusinessLine::query()
            ->leftJoin('projects', function ($join): void {
                $join->on('projects.business_line_id', '=', 'business_lines.id')
                    ->whereNull('projects.deleted_at');
            })
            ->leftJoin('quotations', function ($join): void {
                $join->on('quotations.project_id', '=', 'projects.id')
                    ->whereNull('quotations.deleted_at')
                    ->where('quotations.is_current', true);
            })
            ->leftJoin('invoices', function ($join): void {
                $join->on('invoices.quotation_id', '=', 'quotations.id')
                    ->whereNull('invoices.deleted_at')
                    ->where('invoices.status', 'issued');
            })
            ->whereNull('business_lines.deleted_at')
            ->selectRaw('business_lines.name, COUNT(DISTINCT projects.id) as project_count, COALESCE(SUM((invoices.subtotal - invoices.discount_amount) * quotations.exchange_rate), 0) as total_revenue, COALESCE(SUM(projects.actual_cost), 0) as total_cost')
            ->groupBy('business_lines.id', 'business_lines.name')
            ->orderBy('business_lines.name')
            ->get()
            ->map(fn ($row) => [
                'name' => $row->name,
                'project_count' => (int) $row->project_count,
                'total_revenue' => (float) $row->total_revenue,
                'total_cost' => (float) $row->total_cost,
                'gross_profit' => (float) $row->total_revenue - (float) $row->total_cost,
                'gross_margin' => (float) $row->total_revenue > 0
                    ? round((($row->total_revenue - $row->total_cost) / $row->total_revenue) * 100, 1)
                    : 0,
            ])
            ->toArray();

        $managementAttention = [
            'quotation_approvals' => Quotation::query()
                ->where('is_current', true)
                ->where('status', 'request_for_approval')
                ->count(),
            'purchase_order_approvals' => PurchaseOrder::query()
                ->where('status', 'issued')
                ->count(),
            'overdue_invoices' => Invoice::query()
                ->where('status', 'issued')
                ->whereNot('payment_status', 'paid')
                ->where('due_date', '<', Carbon::today())
                ->count(),
            'overdue_projects' => Project::query()
                ->whereIn('status', ['new', 'planning', 'in_progress'])
                ->where('end_date', '<', Carbon::today())
                ->count(),
            'loss_making_lines' => collect($businessLineStats)
                ->where('total_revenue', '>', 0)
                ->where('gross_profit', '<', 0)
                ->count(),
        ];

        return [
            'year' => $year,
            'kpis' => [
                'active_projects' => $activeProjects,
                'total_revenue' => $totalRevenue,
                'total_spend' => $totalSpend,
                'gross_margin' => $grossMargin,
            ],
            'monthly_chart' => $revenueByMonth,
            'projects_by_status' => $projectsByStatus,
            'pipeline' => [
                ['stage' => 'Projects', 'count' => $totalProjects],
                ['stage' => 'Quotations', 'count' => Quotation::query()->whereNull('deleted_at')->where('is_current', true)->count()],
                ['stage' => 'Approved', 'count' => $quotationsApproved],
                ['stage' => 'Signed', 'count' => $quotationsSigned],
                ['stage' => 'Invoiced', 'count' => $invoiced],
                ['stage' => 'Paid', 'count' => $paid],
            ],
            'top_customers' => $topCustomers,
            'business_line_stats' => $businessLineStats,
            'attention' => $managementAttention,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function financeData(int $year): array
    {
        $totalInvoiced = (float) $this->issuedInvoices()->sum(DB::raw('invoices.total * quotations.exchange_rate'));
        $totalCollected = (float) $this->invoicePayments()->sum(DB::raw('invoice_payments.amount * quotations.exchange_rate'));
        $outstanding = $totalInvoiced - $totalCollected;

        $overdueCount = Invoice::query()
            ->whereNull('deleted_at')
            ->where('status', 'issued')
            ->whereNotIn('payment_status', ['paid'])
            ->where('due_date', '<', Carbon::today())
            ->count();

        $paymentStatusCounts = Invoice::query()
            ->whereNull('deleted_at')
            ->where('status', 'issued')
            ->selectRaw('payment_status, COUNT(*) as count')
            ->groupBy('payment_status')
            ->pluck('count', 'payment_status')
            ->toArray();

        $monthlyRevenue = $this->issuedInvoices()
            ->whereYear('invoices.invoice_date', $year)
            ->select([
                DB::raw($this->monthExpression('invoices.invoice_date').' as month'),
                DB::raw('SUM(invoices.total * quotations.exchange_rate) as total'),
            ])
            ->groupBy('month')
            ->orderBy('month')
            ->get()
            ->keyBy('month')
            ->map(fn ($row) => (float) $row->total)
            ->toArray();

        $monthlyCollections = $this->invoicePayments()
            ->whereYear('invoice_payments.payment_date', $year)
            ->select([
                DB::raw($this->monthExpression('invoice_payments.payment_date').' as month'),
                DB::raw('SUM(invoice_payments.amount * quotations.exchange_rate) as total'),
            ])
            ->groupBy('month')
            ->orderBy('month')
            ->get()
            ->keyBy('month')
            ->map(fn ($row) => (float) $row->total)
            ->toArray();

        $months = range(1, 12);
        $monthlyChart = array_map(fn ($m) => [
            'month' => $m,
            'revenue' => $monthlyRevenue[$m] ?? 0,
            'collected' => $monthlyCollections[$m] ?? 0,
        ], $months);

        $collectionSummary = Invoice::query()
            ->where('status', 'issued')
            ->whereNot('payment_status', 'paid')
            ->toBase()
            ->selectRaw('COUNT(CASE WHEN due_date < ? THEN 1 END) as overdue', [Carbon::today()->toDateString()])
            ->selectRaw('COUNT(CASE WHEN due_date >= ? AND due_date <= ? THEN 1 END) as due_soon', [Carbon::today()->toDateString(), Carbon::today()->addDays(7)->toDateString()])
            ->selectRaw("COUNT(CASE WHEN payment_status = 'partially_paid' THEN 1 END) as partially_paid")
            ->first();

        $collectionActions = Invoice::query()
            ->with('quotation.project.customer')
            ->withSum([
                'payments as active_payments_sum_amount' => fn ($query) => $query->whereNull('cancelled_at'),
            ], 'amount')
            ->where('status', 'issued')
            ->whereNot('payment_status', 'paid')
            ->where('due_date', '<=', Carbon::today()->addDays(7))
            ->orderBy('due_date')
            ->limit(12)
            ->get()
            ->map(fn ($inv) => [
                'uuid' => $inv->uuid,
                'invoice_code' => $inv->invoice_code,
                'project_name' => $inv->quotation->project->name,
                'customer_name' => $inv->quotation->project->customer->name,
                'due_date' => $inv->due_date->toDateString(),
                'outstanding' => max(0, (float) $inv->total - (float) ($inv->active_payments_sum_amount ?? 0)) * (float) $inv->quotation->exchange_rate,
                'days_from_due' => (int) Carbon::today()->diffInDays($inv->due_date, false),
                'payment_status' => $inv->payment_status,
            ])
            ->toArray();

        return [
            'year' => $year,
            'kpis' => [
                'total_invoiced' => $totalInvoiced,
                'total_collected' => $totalCollected,
                'outstanding' => $outstanding,
                'overdue_count' => $overdueCount,
            ],
            'monthly_chart' => $monthlyChart,
            'payment_status' => $paymentStatusCounts,
            'collection_summary' => [
                'overdue' => (int) ($collectionSummary->overdue ?? 0),
                'due_soon' => (int) ($collectionSummary->due_soon ?? 0),
                'partially_paid' => (int) ($collectionSummary->partially_paid ?? 0),
                'draft_invoices' => Invoice::query()->where('status', 'draft')->count(),
            ],
            'collection_actions' => $collectionActions,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function purchasingData(int $year): array
    {
        $totalPos = PurchaseOrder::query()->whereNull('deleted_at')->count();
        $totalPoValue = (float) $this->committedPurchaseOrders()->sum(DB::raw('grand_total * exchange_rate'));
        $openPos = PurchaseOrder::query()
            ->where(function (Builder $query): void {
                $query->where('status', 'issued')
                    ->orWhere(function (Builder $query): void {
                        $query->where('status', 'approved')->where(function (Builder $query): void {
                            $query->whereNull('progress')->orWhereNot('progress', 'closed');
                        });
                    });
            })
            ->count();
        $awaitingApproval = PurchaseOrder::query()->whereNull('deleted_at')->where('status', 'issued')->count();

        $poByStatus = PurchaseOrder::query()
            ->whereNull('deleted_at')
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        $monthlySpend = $this->committedPurchaseOrders()
            ->whereYear('date', $year)
            ->select([
                DB::raw($this->monthExpression('date').' as month'),
                DB::raw('SUM(grand_total * exchange_rate) as total'),
            ])
            ->groupBy('month')
            ->orderBy('month')
            ->get()
            ->keyBy('month')
            ->map(fn ($row) => (float) $row->total)
            ->toArray();

        $months = range(1, 12);
        $monthlyChart = array_map(fn ($m) => ['month' => $m, 'spend' => $monthlySpend[$m] ?? 0], $months);

        $topVendors = Vendor::query()
            ->join('purchase_orders', 'purchase_orders.vendor_id', '=', 'vendors.id')
            ->whereNull('purchase_orders.deleted_at')
            ->whereNotIn('purchase_orders.status', ['draft', 'cancelled', 'voided'])
            ->selectRaw('vendors.id, vendors.name, SUM(purchase_orders.grand_total * purchase_orders.exchange_rate) as total_spend')
            ->groupBy('vendors.id', 'vendors.name')
            ->orderByDesc('total_spend')
            ->limit(5)
            ->get()
            ->map(fn ($row) => ['name' => $row->name, 'spend' => (float) $row->total_spend])
            ->toArray();

        $grnByStatus = GoodsReceiptNote::query()
            ->whereNull('deleted_at')
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        $purchaseActionSummary = PurchaseOrder::query()
            ->whereNotIn('status', ['cancelled', 'voided'])
            ->toBase()
            ->selectRaw("COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft")
            ->selectRaw("COUNT(CASE WHEN status = 'issued' THEN 1 END) as approval")
            ->selectRaw("COUNT(CASE WHEN status = 'approved' AND progress IS NULL THEN 1 END) as ready_to_send")
            ->selectRaw("COUNT(CASE WHEN progress = 'sent' THEN 1 END) as in_transit")
            ->selectRaw("COUNT(CASE WHEN progress = 'partially_received' THEN 1 END) as partial")
            ->selectRaw("COUNT(CASE WHEN progress IN ('sent', 'partially_received') AND delivery_date IS NOT NULL AND delivery_date < ? THEN 1 END) as overdue", [Carbon::today()->toDateString()])
            ->first();

        $purchaseActions = PurchaseOrder::query()
            ->with(['project:id,name', 'vendor:id,name'])
            ->where(function (Builder $query): void {
                $query->whereIn('status', ['draft', 'issued'])
                    ->orWhere(function (Builder $query): void {
                        $query->where('status', 'approved')
                            ->where(function (Builder $query): void {
                                $query->whereNull('progress')
                                    ->orWhereIn('progress', ['sent', 'partially_received']);
                            });
                    });
            })
            ->oldest('updated_at')
            ->limit(40)
            ->get(['id', 'uuid', 'purchase_order_code', 'project_id', 'vendor_id', 'status', 'progress', 'delivery_date', 'grand_total', 'exchange_rate', 'updated_at'])
            ->map(function (PurchaseOrder $purchaseOrder): array {
                $ageDays = (int) $purchaseOrder->updated_at->diffInDays(now());
                $daysFromDelivery = $purchaseOrder->delivery_date
                    ? (int) Carbon::today()->diffInDays($purchaseOrder->delivery_date, false)
                    : null;

                [$category, $nextAction, $severity, $sortOrder] = match (true) {
                    $daysFromDelivery !== null && $daysFromDelivery < 0 && in_array($purchaseOrder->progress, ['sent', 'partially_received']) => ['Delivery overdue', 'Escalate with the vendor', 'danger', -1],
                    $purchaseOrder->status === 'issued' => ['Awaiting approval', 'Follow up on approval', $ageDays >= 3 ? 'warning' : 'info', 0],
                    $purchaseOrder->status === 'approved' && $purchaseOrder->progress === null => ['Ready to send', 'Send the PO to the vendor', $ageDays >= 2 ? 'warning' : 'info', 1],
                    $purchaseOrder->progress === 'partially_received' => ['Partial delivery', 'Confirm the remaining delivery', 'warning', 2],
                    $purchaseOrder->progress === 'sent' => ['In transit', 'Track the vendor delivery', $daysFromDelivery !== null && $daysFromDelivery <= 3 ? 'warning' : 'info', 3],
                    default => ['Draft PO', 'Finish and issue the purchase order', $ageDays >= 7 ? 'warning' : 'info', 4],
                };

                return [
                    'uuid' => $purchaseOrder->uuid,
                    'purchase_order_code' => $purchaseOrder->purchase_order_code,
                    'project_name' => $purchaseOrder->project->name,
                    'vendor_name' => $purchaseOrder->vendor->name,
                    'category' => $category,
                    'next_action' => $nextAction,
                    'severity' => $severity,
                    'age_days' => $ageDays,
                    'delivery_date' => $purchaseOrder->delivery_date?->toDateString(),
                    'value' => (float) $purchaseOrder->grand_total * (float) $purchaseOrder->exchange_rate,
                    'sort_order' => $sortOrder,
                ];
            })
            ->sortBy([
                ['sort_order', 'asc'],
                ['age_days', 'desc'],
            ])
            ->take(12)
            ->map(fn (array $item) => collect($item)->except('sort_order')->all())
            ->values()
            ->all();

        return [
            'year' => $year,
            'kpis' => [
                'total_pos' => $totalPos,
                'total_value' => $totalPoValue,
                'open_pos' => $openPos,
                'awaiting_approval' => $awaitingApproval,
            ],
            'monthly_chart' => $monthlyChart,
            'po_by_status' => $poByStatus,
            'top_vendors' => $topVendors,
            'grn_by_status' => $grnByStatus,
            'action_summary' => [
                'draft' => (int) ($purchaseActionSummary->draft ?? 0),
                'approval' => (int) ($purchaseActionSummary->approval ?? 0),
                'ready_to_send' => (int) ($purchaseActionSummary->ready_to_send ?? 0),
                'in_transit' => (int) ($purchaseActionSummary->in_transit ?? 0),
                'partial' => (int) ($purchaseActionSummary->partial ?? 0),
                'overdue' => (int) ($purchaseActionSummary->overdue ?? 0),
            ],
            'action_items' => $purchaseActions,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function salesData(int $year): array
    {
        $activeProjectStatuses = ['new', 'planning', 'in_progress'];
        $pipelineProjectStatuses = [...$activeProjectStatuses, 'completed'];
        $terminalQuotationStatuses = ['rejected', 'cancelled', 'voided'];

        $pipelineRows = Project::query()
            ->whereIn('status', $pipelineProjectStatuses)
            ->whereYear('request_date', $year)
            ->toBase()
            ->selectRaw("COALESCE(sales_status, 'new') as stage")
            ->selectRaw('COUNT(*) as count')
            ->selectRaw('COALESCE(SUM(COALESCE(actual_contract_value, estimate_contract_value, 0)), 0) as value')
            ->groupBy('sales_status')
            ->get()
            ->mapWithKeys(fn (object $row) => [
                (string) $row->stage => [
                    'count' => (int) $row->count,
                    'value' => (float) $row->value,
                ],
            ]);

        $stageDefinitions = [
            ['key' => 'new', 'label' => 'New opportunities'],
            ['key' => 'quoting', 'label' => 'Quotation in progress'],
            ['key' => 'approved', 'label' => 'Ready to send'],
            ['key' => 'sent', 'label' => 'Awaiting customer'],
            ['key' => 'signed', 'label' => 'Signed'],
        ];

        $pipeline = collect($stageDefinitions)
            ->map(function (array $stage) use ($pipelineRows): array {
                $row = $pipelineRows->get($stage['key'], ['count' => 0, 'value' => 0]);

                return [
                    ...$stage,
                    'count' => $row['count'],
                    'value' => $row['value'],
                ];
            })
            ->all();

        $openStages = collect($pipeline)->whereIn('key', ['new', 'quoting', 'approved', 'sent']);
        $signedStage = collect($pipeline)->firstWhere('key', 'signed');

        $unquotedQuery = Project::query()
            ->whereIn('status', $activeProjectStatuses)
            ->whereNotIn('id', Quotation::query()->select('project_id'));

        $quotationSummary = Quotation::query()
            ->where('is_current', true)
            ->whereNotIn('status', $terminalQuotationStatuses)
            ->whereIn('project_id', Project::query()->select('id')->whereIn('status', $activeProjectStatuses))
            ->toBase()
            ->selectRaw("COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft")
            ->selectRaw("COUNT(CASE WHEN status = 'request_for_approval' THEN 1 END) as approval")
            ->selectRaw("COUNT(CASE WHEN status = 'approved' AND progress IS NULL THEN 1 END) as ready_to_send")
            ->selectRaw("COUNT(CASE WHEN status = 'approved' AND progress = 'sent' THEN 1 END) as follow_up")
            ->selectRaw("COUNT(CASE WHEN (progress IS NULL OR progress != 'signed') AND valid_until IS NOT NULL AND valid_until <= ? THEN 1 END) as at_risk", [Carbon::today()->addDays(7)->toDateString()])
            ->first();

        $actionSummary = [
            'no_quotation' => $unquotedQuery->clone()->count(),
            'draft' => (int) ($quotationSummary->draft ?? 0),
            'approval' => (int) ($quotationSummary->approval ?? 0),
            'ready_to_send' => (int) ($quotationSummary->ready_to_send ?? 0),
            'follow_up' => (int) ($quotationSummary->follow_up ?? 0),
            'at_risk' => (int) ($quotationSummary->at_risk ?? 0),
        ];

        $unquotedActions = $unquotedQuery
            ->with('customer:id,name')
            ->oldest('request_date')
            ->limit(12)
            ->get(['id', 'uuid', 'project_code', 'name', 'customer_id', 'request_date', 'estimate_contract_value'])
            ->map(function (Project $project): array {
                $ageDays = (int) $project->request_date->diffInDays(Carbon::today());

                return [
                    'key' => "project-{$project->uuid}",
                    'target_type' => 'project',
                    'uuid' => $project->uuid,
                    'code' => $project->project_code,
                    'project_name' => $project->name,
                    'customer_name' => $project->customer->name,
                    'category' => 'No quotation',
                    'next_action' => 'Create the first quotation',
                    'severity' => $ageDays >= 7 ? 'danger' : 'warning',
                    'age_days' => $ageDays,
                    'valid_until' => null,
                    'value' => (float) ($project->estimate_contract_value ?? 0),
                    'sort_order' => $ageDays >= 7 ? 1 : 5,
                ];
            });

        $quotationActions = Quotation::query()
            ->with('project.customer:id,name')
            ->where('is_current', true)
            ->whereNotIn('status', $terminalQuotationStatuses)
            ->where(function (Builder $query): void {
                $query->whereIn('status', ['draft', 'request_for_approval'])
                    ->orWhere(function (Builder $query): void {
                        $query->where('status', 'approved')
                            ->where(function (Builder $query): void {
                                $query->whereNull('progress')->orWhere('progress', 'sent');
                            });
                    });
            })
            ->whereIn('project_id', Project::query()->select('id')->whereIn('status', $activeProjectStatuses))
            ->oldest('updated_at')
            ->limit(40)
            ->get(['id', 'uuid', 'quotation_code', 'project_id', 'status', 'progress', 'valid_until', 'total', 'exchange_rate', 'updated_at'])
            ->map(function (Quotation $quotation): array {
                $ageDays = (int) $quotation->updated_at->diffInDays(now());
                $daysUntilExpiry = $quotation->valid_until
                    ? (int) Carbon::today()->diffInDays($quotation->valid_until, false)
                    : null;

                [$category, $nextAction, $severity, $sortOrder] = match (true) {
                    $daysUntilExpiry !== null && $daysUntilExpiry < 0 => ['Expired quotation', 'Revise or close this quotation', 'danger', -1],
                    $daysUntilExpiry !== null && $daysUntilExpiry <= 7 => ['Quotation expiring soon', 'Follow up before it expires', 'warning', 0],
                    $quotation->status === 'request_for_approval' => ['Awaiting approval', 'Follow up on internal approval', $ageDays >= 3 ? 'warning' : 'info', 2],
                    $quotation->status === 'approved' && $quotation->progress === null => ['Approved, not sent', 'Send the quotation to the customer', $ageDays >= 2 ? 'warning' : 'info', 3],
                    $quotation->progress === 'sent' => ['Awaiting customer', 'Follow up for a decision', $ageDays >= 7 ? 'warning' : 'info', 4],
                    default => ['Draft quotation', 'Finish and submit for approval', $ageDays >= 7 ? 'warning' : 'info', 5],
                };

                return [
                    'key' => "quotation-{$quotation->uuid}",
                    'target_type' => 'quotation',
                    'uuid' => $quotation->uuid,
                    'code' => $quotation->quotation_code,
                    'project_name' => $quotation->project->name,
                    'customer_name' => $quotation->project->customer->name,
                    'category' => $category,
                    'next_action' => $nextAction,
                    'severity' => $severity,
                    'age_days' => $ageDays,
                    'valid_until' => $quotation->valid_until?->toDateString(),
                    'value' => (float) $quotation->total * (float) $quotation->exchange_rate,
                    'sort_order' => $sortOrder,
                ];
            });

        $actionItems = $unquotedActions
            ->concat($quotationActions)
            ->sortBy([
                ['sort_order', 'asc'],
                ['age_days', 'desc'],
            ])
            ->take(12)
            ->map(fn (array $item) => collect($item)->except('sort_order')->all())
            ->values()
            ->all();

        $recentWins = Quotation::query()
            ->with('project.customer:id,name')
            ->where('is_current', true)
            ->where('status', 'approved')
            ->where('progress', 'signed')
            ->whereYear('updated_at', $year)
            ->latest('updated_at')
            ->limit(5)
            ->get(['id', 'uuid', 'quotation_code', 'project_id', 'total', 'exchange_rate', 'updated_at'])
            ->map(fn (Quotation $quotation) => [
                'uuid' => $quotation->uuid,
                'quotation_code' => $quotation->quotation_code,
                'project_name' => $quotation->project->name,
                'customer_name' => $quotation->project->customer->name,
                'value' => (float) $quotation->total * (float) $quotation->exchange_rate,
                'signed_at' => $quotation->updated_at->toDateString(),
            ])
            ->all();

        return [
            'year' => $year,
            'kpis' => [
                'open_opportunities' => (int) $openStages->sum('count'),
                'pipeline_value' => (float) $openStages->sum('value'),
                'signed_value' => (float) ($signedStage['value'] ?? 0),
                'needs_attention' => $actionSummary['no_quotation']
                    + $actionSummary['draft']
                    + $actionSummary['approval']
                    + $actionSummary['ready_to_send']
                    + $actionSummary['follow_up'],
            ],
            'pipeline' => $pipeline,
            'action_summary' => $actionSummary,
            'action_items' => $actionItems,
            'recent_wins' => $recentWins,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function staffData(User $user, string $staffStatus, string $staffPriority): array
    {
        $workforceId = $user->workforce?->id;

        $myProjectsQuery = Project::query()
            ->with('customer:id,name')
            ->whereNull('deleted_at')
            ->when($workforceId !== null, fn ($q) => $q->where('person_in_charge_id', $workforceId))
            ->when($staffStatus !== 'all', fn ($q) => $q->where('status', $staffStatus))
            ->when($staffPriority !== 'all', fn ($q) => $q->where('priority', $staffPriority));

        $myProjects = $myProjectsQuery->clone()
            ->orderByDesc('request_date')
            ->get(['id', 'uuid', 'project_code', 'name', 'customer_id', 'status', 'sales_status', 'billing_status', 'end_date', 'priority'])
            ->map(fn ($p) => [
                'uuid' => $p->uuid,
                'project_code' => $p->project_code,
                'name' => $p->name,
                'customer_name' => $p->customer?->name ?? '—',
                'status' => $p->status,
                'sales_status' => $p->sales_status,
                'billing_status' => $p->billing_status,
                'end_date' => $p->end_date?->toDateString(),
                'is_overdue' => $p->end_date && $p->end_date->isPast() && $p->status !== 'completed',
                'days_until_due' => $p->end_date ? (int) Carbon::today()->diffInDays($p->end_date, false) : null,
                'priority' => $p->priority,
                'priority_score' => match ($p->priority) {
                    'urgent' => 4,
                    'high' => 3,
                    'medium' => 2,
                    default => 1,
                },
            ])
            ->sortBy([
                ['is_overdue', 'desc'],
                ['priority_score', 'desc'],
                ['days_until_due', 'asc'],
            ])
            ->map(fn (array $project) => collect($project)->except('priority_score')->all())
            ->values()
            ->toArray();

        $statusCounts = Project::query()
            ->whereNull('deleted_at')
            ->when($workforceId !== null, fn ($q) => $q->where('person_in_charge_id', $workforceId))
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        $billingStatusCounts = Project::query()
            ->whereNull('deleted_at')
            ->when($workforceId !== null, fn ($q) => $q->where('person_in_charge_id', $workforceId))
            ->whereNotNull('billing_status')
            ->selectRaw('billing_status, COUNT(*) as count')
            ->groupBy('billing_status')
            ->pluck('count', 'billing_status')
            ->toArray();

        $totalCount = array_sum($statusCounts);
        $inProgressCount = $statusCounts['in_progress'] ?? 0;
        $completedCount = $statusCounts['completed'] ?? 0;
        $overdueCount = (int) Project::query()
            ->whereNull('deleted_at')
            ->when($workforceId !== null, fn ($q) => $q->where('person_in_charge_id', $workforceId))
            ->whereNotIn('status', ['completed', 'cancelled'])
            ->where('end_date', '<', Carbon::today())
            ->count();

        return [
            'kpis' => [
                'total' => $totalCount,
                'in_progress' => $inProgressCount,
                'overdue' => $overdueCount,
                'completed' => $completedCount,
            ],
            'my_projects' => $myProjects,
            'status_counts' => $statusCounts,
            'billing_status_counts' => $billingStatusCounts,
        ];
    }
}
