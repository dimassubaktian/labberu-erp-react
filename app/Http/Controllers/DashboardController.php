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
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
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

        if ($isSuperAdmin || in_array('Manager', $roles)) {
            $props['management'] = $this->managementData($year);
        }

        if ($isSuperAdmin || in_array('Finance', $roles)) {
            $props['finance'] = $this->financeData($year);
        }

        if ($isSuperAdmin || in_array('Procurement', $roles)) {
            $props['purchasing'] = $this->purchasingData($year);
        }

        $props['staff'] = $this->staffData($user, $staffStatus, $staffPriority);

        return Inertia::render('dashboard', $props);
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

        $monthlyRevenue = Invoice::query()
            ->whereNull('deleted_at')
            ->where('status', 'issued')
            ->whereYear('invoice_date', $year)
            ->selectRaw('MONTH(invoice_date) as month, SUM(total) as total')
            ->groupBy('month')
            ->orderBy('month')
            ->get()
            ->keyBy('month')
            ->map(fn ($row) => (float) $row->total)
            ->toArray();

        $monthlySpend = PurchaseOrder::query()
            ->whereNull('deleted_at')
            ->whereNotIn('status', ['draft', 'cancelled', 'voided'])
            ->whereYear('date', $year)
            ->selectRaw('MONTH(date) as month, SUM(grand_total) as total')
            ->groupBy('month')
            ->orderBy('month')
            ->get()
            ->keyBy('month')
            ->map(fn ($row) => (float) $row->total)
            ->toArray();

        $months = range(1, 12);
        $revenueByMonth = array_map(fn ($m) => ['month' => $m, 'revenue' => $monthlyRevenue[$m] ?? 0, 'spend' => $monthlySpend[$m] ?? 0], $months);

        $totalRevenue = (float) Invoice::query()->whereNull('deleted_at')->where('status', 'issued')->sum('total');
        $totalSpend = (float) PurchaseOrder::query()->whereNull('deleted_at')->whereNotIn('status', ['draft', 'cancelled', 'voided'])->sum('grand_total');
        $activeProjects = Project::query()->whereNull('deleted_at')->whereIn('status', ['planning', 'in_progress'])->count();
        $grossMargin = $totalRevenue > 0 ? round((($totalRevenue - $totalSpend) / $totalRevenue) * 100, 1) : 0;

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
            ->selectRaw('customers.id, customers.name, SUM(invoices.total) as total_revenue')
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
            ->selectRaw('business_lines.name, COUNT(DISTINCT projects.id) as project_count, COALESCE(SUM(invoices.total), 0) as total_revenue, COALESCE(SUM(projects.actual_cost), 0) as total_cost')
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
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function financeData(int $year): array
    {
        $totalInvoiced = (float) Invoice::query()->whereNull('deleted_at')->where('status', 'issued')->sum('total');
        $totalCollected = (float) InvoicePayment::query()
            ->join('invoices', 'invoices.id', '=', 'invoice_payments.invoice_id')
            ->whereNull('invoices.deleted_at')
            ->sum('invoice_payments.amount');
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

        $monthlyRevenue = Invoice::query()
            ->whereNull('deleted_at')
            ->where('status', 'issued')
            ->whereYear('invoice_date', $year)
            ->selectRaw('MONTH(invoice_date) as month, SUM(total) as total')
            ->groupBy('month')
            ->orderBy('month')
            ->get()
            ->keyBy('month')
            ->map(fn ($row) => (float) $row->total)
            ->toArray();

        $monthlyCollections = InvoicePayment::query()
            ->join('invoices', 'invoices.id', '=', 'invoice_payments.invoice_id')
            ->whereNull('invoices.deleted_at')
            ->whereYear('invoice_payments.payment_date', $year)
            ->selectRaw('MONTH(invoice_payments.payment_date) as month, SUM(invoice_payments.amount) as total')
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

        $overdueInvoices = Invoice::query()
            ->with('quotation.project.customer')
            ->whereNull('deleted_at')
            ->where('status', 'issued')
            ->whereNotIn('payment_status', ['paid'])
            ->where('due_date', '<', Carbon::today())
            ->orderBy('due_date')
            ->limit(10)
            ->get()
            ->map(fn ($inv) => [
                'invoice_code' => $inv->invoice_code,
                'customer_name' => $inv->quotation?->project?->customer?->name ?? '—',
                'due_date' => $inv->due_date->toDateString(),
                'total' => (float) $inv->total,
                'days_overdue' => (int) Carbon::today()->diffInDays($inv->due_date),
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
            'overdue_invoices' => $overdueInvoices,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function purchasingData(int $year): array
    {
        $totalPos = PurchaseOrder::query()->whereNull('deleted_at')->count();
        $totalPoValue = (float) PurchaseOrder::query()->whereNull('deleted_at')->whereNotIn('status', ['draft', 'cancelled', 'voided'])->sum('grand_total');
        $openPos = PurchaseOrder::query()->whereNull('deleted_at')->whereIn('status', ['issued', 'approved'])->count();
        $awaitingApproval = PurchaseOrder::query()->whereNull('deleted_at')->where('status', 'issued')->count();

        $poByStatus = PurchaseOrder::query()
            ->whereNull('deleted_at')
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        $monthlySpend = PurchaseOrder::query()
            ->whereNull('deleted_at')
            ->whereNotIn('status', ['draft', 'cancelled', 'voided'])
            ->whereYear('date', $year)
            ->selectRaw('MONTH(date) as month, SUM(grand_total) as total')
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
            ->selectRaw('vendors.id, vendors.name, SUM(purchase_orders.grand_total) as total_spend')
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
            ->get(['id', 'uuid', 'project_code', 'name', 'customer_id', 'status', 'billing_status', 'end_date', 'priority'])
            ->map(fn ($p) => [
                'uuid' => $p->uuid,
                'project_code' => $p->project_code,
                'name' => $p->name,
                'customer_name' => $p->customer?->name ?? '—',
                'status' => $p->status,
                'billing_status' => $p->billing_status,
                'end_date' => $p->end_date?->toDateString(),
                'is_overdue' => $p->end_date && $p->end_date->isPast() && $p->status !== 'completed',
                'priority' => $p->priority,
            ])
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
