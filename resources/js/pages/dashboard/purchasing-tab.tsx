import { Link } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowUpRight,
    CheckCircle2,
    ClipboardCheck,
    Clock3,
    Package,
    PackageCheck,
    Send,
    ShoppingCart,
    Truck,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { SectionCard } from '@/components/dashboard/section-card';
import { SectionIntro } from '@/components/dashboard/section-intro';
import { StatusBadge } from '@/components/project-badge';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { cn, formatCompact } from '@/lib/utils';
import { show as showPurchaseOrder } from '@/routes/purchase-orders';

const MONTH_LABELS = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
];

const STATUS_COLORS: Record<string, string> = {
    draft: 'bg-slate-400',
    issued: 'bg-amber-500',
    approved: 'bg-indigo-500',
    cancelled: 'bg-destructive',
    voided: 'bg-destructive',
};

type MonthRow = { month: number; spend: number };
type VendorRow = { name: string; spend: number };
type PurchaseAction = {
    uuid: string;
    purchase_order_code: string;
    project_name: string;
    vendor_name: string;
    category: string;
    next_action: string;
    severity: 'danger' | 'warning' | 'info';
    age_days: number;
    delivery_date: string | null;
    value: number;
};

type Props = {
    year: number;
    kpis: {
        total_pos: number;
        total_value: number;
        open_pos: number;
        awaiting_approval: number;
    };
    monthly_chart: MonthRow[];
    po_by_status: Record<string, number>;
    top_vendors: VendorRow[];
    grn_by_status: Record<string, number>;
    action_summary: {
        draft: number;
        approval: number;
        ready_to_send: number;
        in_transit: number;
        partial: number;
        overdue: number;
    };
    action_items: PurchaseAction[];
};

function shortDate(value: string): string {
    return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
    });
}

export function PurchasingTab({
    year,
    kpis,
    monthly_chart,
    po_by_status,
    top_vendors,
    grn_by_status,
    action_summary,
    action_items,
}: Props) {
    const chartData = monthly_chart.map((row) => ({
        month: MONTH_LABELS[row.month - 1],
        spend: row.spend,
    }));
    const totalStatuses = Object.values(po_by_status).reduce(
        (total, count) => total + count,
        0,
    );

    return (
        <div className="space-y-4">
            <SectionIntro
                icon={ShoppingCart}
                label="Purchasing control desk"
                description="Clear approvals and unsent orders first, then track overdue and partial vendor deliveries through completion."
                statusLabel="Supply attention"
                statusValue={
                    action_summary.overdue > 0
                        ? `${action_summary.overdue} deliveries overdue`
                        : `${kpis.awaiting_approval} awaiting approval`
                }
                tone={
                    action_summary.overdue > 0
                        ? 'danger'
                        : kpis.awaiting_approval > 0
                          ? 'warning'
                          : 'success'
                }
            />

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <KpiCard
                    label="Total Purchase Orders"
                    value={kpis.total_pos}
                    icon={ShoppingCart}
                />
                <KpiCard
                    label="Committed Value"
                    value={`Rp ${formatCompact(kpis.total_value)}`}
                    icon={Package}
                />
                <KpiCard
                    label="Open Purchase Orders"
                    value={kpis.open_pos}
                    icon={Clock3}
                    highlight={kpis.open_pos > 0 ? 'warning' : undefined}
                />
                <KpiCard
                    label="Awaiting Approval"
                    value={kpis.awaiting_approval}
                    icon={ClipboardCheck}
                    highlight={
                        kpis.awaiting_approval > 0 ? 'warning' : undefined
                    }
                />
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,1fr)]">
                <SectionCard title="Purchase order priorities">
                    {action_items.length > 0 ? (
                        <div className="divide-y">
                            {action_items.map((item) => (
                                <Link
                                    key={item.uuid}
                                    href={showPurchaseOrder(item.uuid)}
                                    prefetch
                                    className="group grid gap-3 py-4 first:pt-1 last:pb-1 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                                >
                                    <div className="flex min-w-0 gap-3">
                                        <div
                                            className={cn(
                                                'mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border',
                                                item.severity === 'danger' &&
                                                    'border-destructive/25 bg-destructive/10 text-destructive',
                                                item.severity === 'warning' &&
                                                    'border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400',
                                                item.severity === 'info' &&
                                                    'border-sky-500/25 bg-sky-500/10 text-sky-600 dark:text-sky-400',
                                            )}
                                        >
                                            {item.severity === 'danger' ? (
                                                <AlertTriangle className="size-4" />
                                            ) : (
                                                <Truck className="size-4" />
                                            )}
                                        </div>
                                        <div className="min-w-0 space-y-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <StatusBadge
                                                    category="severity"
                                                    value={item.severity}
                                                    label={item.category}
                                                />
                                                <span className="font-mono text-xs text-muted-foreground">
                                                    {item.purchase_order_code}
                                                </span>
                                            </div>
                                            <p className="truncate text-sm font-semibold">
                                                {item.project_name}
                                            </p>
                                            <p className="truncate text-xs text-muted-foreground">
                                                {item.vendor_name} ·{' '}
                                                {item.delivery_date
                                                    ? `Delivery ${shortDate(item.delivery_date)}`
                                                    : `${item.age_days} days in queue`}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between gap-4 pl-12 sm:justify-end sm:pl-0">
                                        <div className="text-left sm:text-right">
                                            <p className="text-sm font-medium">
                                                {item.next_action}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Rp {formatCompact(item.value)}
                                            </p>
                                        </div>
                                        <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2 py-12 text-center">
                            <div className="flex size-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="size-5" />
                            </div>
                            <p className="text-sm font-semibold">
                                Purchasing is caught up
                            </p>
                            <p className="text-xs text-muted-foreground">
                                New drafts, approvals, and deliveries will
                                appear here.
                            </p>
                        </div>
                    )}
                </SectionCard>

                <SectionCard title="Where work is waiting">
                    <div className="grid gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-2 xl:grid-cols-1">
                        {[
                            {
                                label: 'Draft POs',
                                value: action_summary.draft,
                                hint: 'Finish and issue',
                                icon: ShoppingCart,
                            },
                            {
                                label: 'Awaiting approval',
                                value: action_summary.approval,
                                hint: 'Internal decision needed',
                                icon: ClipboardCheck,
                            },
                            {
                                label: 'Ready to send',
                                value: action_summary.ready_to_send,
                                hint: 'Approved, not with vendor',
                                icon: Send,
                            },
                            {
                                label: 'In transit',
                                value: action_summary.in_transit,
                                hint: 'Track delivery',
                                icon: Truck,
                            },
                            {
                                label: 'Partial delivery',
                                value: action_summary.partial,
                                hint: 'Remaining goods expected',
                                icon: PackageCheck,
                            },
                            {
                                label: 'Overdue delivery',
                                value: action_summary.overdue,
                                hint: 'Escalate with vendor',
                                icon: AlertTriangle,
                            },
                        ].map((item) => {
                            const Icon = item.icon;

                            return (
                                <div
                                    key={item.label}
                                    className="flex items-center gap-3 bg-card p-4"
                                >
                                    <Icon
                                        className={cn(
                                            'size-4',
                                            item.value > 0
                                                ? 'text-amber-600 dark:text-amber-400'
                                                : 'text-muted-foreground',
                                        )}
                                    />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium">
                                            {item.label}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {item.hint}
                                        </p>
                                    </div>
                                    <span className="text-lg font-bold tabular-nums">
                                        {item.value}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </SectionCard>
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,1fr)]">
                <SectionCard title={`Committed spend by month (${year})`}>
                    <ChartContainer
                        className="h-64 w-full"
                        config={{ spend: { label: 'Spend', color: '#6366f1' } }}
                    >
                        <BarChart data={chartData}>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                            />
                            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                            <YAxis
                                tickFormatter={(value) => formatCompact(value)}
                                tick={{ fontSize: 11 }}
                                width={48}
                            />
                            <Tooltip content={<ChartTooltipContent />} />
                            <Bar
                                dataKey="spend"
                                fill="var(--color-spend)"
                                radius={[3, 3, 0, 0]}
                                name="Spend"
                            />
                        </BarChart>
                    </ChartContainer>
                </SectionCard>

                <SectionCard title="Top vendors by committed spend">
                    {top_vendors.length > 0 ? (
                        <div className="divide-y">
                            {top_vendors.map((vendor, index) => (
                                <div
                                    key={vendor.name}
                                    className="flex items-center gap-3 py-3 first:pt-1 last:pb-1"
                                >
                                    <span className="flex size-7 items-center justify-center rounded-md bg-muted text-xs font-semibold text-muted-foreground">
                                        {index + 1}
                                    </span>
                                    <p className="min-w-0 flex-1 truncate text-sm font-medium">
                                        {vendor.name}
                                    </p>
                                    <p className="text-sm font-semibold tabular-nums">
                                        Rp {formatCompact(vendor.spend)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="py-8 text-center text-sm text-muted-foreground">
                            No committed vendor spend yet.
                        </p>
                    )}
                </SectionCard>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <SectionCard title="Purchase order status">
                    <div className="space-y-4">
                        {Object.entries(po_by_status).map(([status, count]) => (
                            <div key={status} className="space-y-2">
                                <div className="flex items-center justify-between gap-3 text-sm">
                                    <span className="capitalize">
                                        {status.replace(/_/g, ' ')}
                                    </span>
                                    <span className="font-semibold tabular-nums">
                                        {count}
                                    </span>
                                </div>
                                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                                    <div
                                        className={cn(
                                            'h-full rounded-full',
                                            STATUS_COLORS[status] ??
                                                'bg-slate-400',
                                        )}
                                        style={{
                                            width: `${totalStatuses > 0 ? (count / totalStatuses) * 100 : 0}%`,
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </SectionCard>

                <SectionCard title="Goods receipt notes">
                    <div className="grid gap-3 sm:grid-cols-2">
                        {Object.entries(grn_by_status).map(
                            ([status, count]) => (
                                <div
                                    key={status}
                                    className="rounded-lg border bg-muted/20 p-4"
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-medium capitalize">
                                                {status.replace(/_/g, ' ')}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Goods receipts
                                            </p>
                                        </div>
                                        <span className="text-2xl font-bold tabular-nums">
                                            {count}
                                        </span>
                                    </div>
                                </div>
                            ),
                        )}
                        {Object.keys(grn_by_status).length === 0 && (
                            <p className="col-span-full py-8 text-center text-sm text-muted-foreground">
                                No goods receipt notes yet.
                            </p>
                        )}
                    </div>
                </SectionCard>
            </div>
        </div>
    );
}
