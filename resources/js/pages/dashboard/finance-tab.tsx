import { Link } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowUpRight,
    Banknote,
    CheckCircle2,
    CircleDollarSign,
    Clock3,
    FileClock,
    ReceiptText,
    TrendingDown,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { SectionCard } from '@/components/dashboard/section-card';
import { SectionIntro } from '@/components/dashboard/section-intro';
import { StatusBadge } from '@/components/project-badge';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { cn, formatCompact } from '@/lib/utils';
import { show as showInvoice } from '@/routes/invoices';

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

const PAYMENT_STATUS_COLORS: Record<string, string> = {
    paid: 'bg-emerald-500',
    partially_paid: 'bg-amber-500',
    awaiting_payment: 'bg-slate-400',
};

type MonthRow = { month: number; revenue: number; collected: number };
type CollectionAction = {
    uuid: string;
    invoice_code: string;
    project_name: string;
    customer_name: string;
    due_date: string;
    outstanding: number;
    days_from_due: number;
    payment_status: string | null;
};

type Props = {
    year: number;
    kpis: {
        total_invoiced: number;
        total_collected: number;
        outstanding: number;
        overdue_count: number;
    };
    monthly_chart: MonthRow[];
    payment_status: Record<string, number>;
    collection_summary: {
        overdue: number;
        due_soon: number;
        partially_paid: number;
        draft_invoices: number;
    };
    collection_actions: CollectionAction[];
};

export function FinanceTab({
    year,
    kpis,
    monthly_chart,
    payment_status,
    collection_summary,
    collection_actions,
}: Props) {
    const chartData = monthly_chart.map((row) => ({
        month: MONTH_LABELS[row.month - 1],
        revenue: row.revenue,
        collected: row.collected,
    }));
    const collectionRate =
        kpis.total_invoiced > 0
            ? Math.min(100, (kpis.total_collected / kpis.total_invoiced) * 100)
            : 0;
    const paymentTotal = Object.values(payment_status).reduce(
        (total, count) => total + count,
        0,
    );

    return (
        <div className="space-y-4">
            <SectionIntro
                icon={Banknote}
                label="Finance control desk"
                description="Collect overdue balances first, watch invoices approaching their due date, then reconcile partially paid accounts."
                statusLabel="Collection health"
                statusValue={
                    collection_summary.overdue > 0
                        ? `${collection_summary.overdue} invoices overdue`
                        : 'No overdue invoices'
                }
                tone={collection_summary.overdue > 0 ? 'danger' : 'success'}
            />

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <KpiCard
                    label="Total Invoiced"
                    value={`Rp ${formatCompact(kpis.total_invoiced)}`}
                    icon={CircleDollarSign}
                />
                <KpiCard
                    label={`Collected (${collectionRate.toFixed(0)}%)`}
                    value={`Rp ${formatCompact(kpis.total_collected)}`}
                    icon={CheckCircle2}
                />
                <KpiCard
                    label="Outstanding"
                    value={`Rp ${formatCompact(kpis.outstanding)}`}
                    icon={TrendingDown}
                    highlight={kpis.outstanding > 0 ? 'warning' : undefined}
                />
                <KpiCard
                    label="Overdue Invoices"
                    value={kpis.overdue_count}
                    icon={AlertTriangle}
                    highlight={kpis.overdue_count > 0 ? 'danger' : undefined}
                />
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,1fr)]">
                <SectionCard title="Collection priorities">
                    {collection_actions.length > 0 ? (
                        <div className="divide-y">
                            {collection_actions.map((invoice) => {
                                const overdue = invoice.days_from_due < 0;

                                return (
                                    <Link
                                        key={invoice.uuid}
                                        href={showInvoice(invoice.uuid)}
                                        prefetch
                                        className="group grid gap-3 py-4 first:pt-1 last:pb-1 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                                    >
                                        <div className="flex min-w-0 gap-3">
                                            <div
                                                className={cn(
                                                    'mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border',
                                                    overdue
                                                        ? 'border-destructive/25 bg-destructive/10 text-destructive'
                                                        : 'border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400',
                                                )}
                                            >
                                                {overdue ? (
                                                    <AlertTriangle className="size-4" />
                                                ) : (
                                                    <Clock3 className="size-4" />
                                                )}
                                            </div>
                                            <div className="min-w-0 space-y-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <StatusBadge
                                                        category="severity"
                                                        value={
                                                            overdue
                                                                ? 'danger'
                                                                : 'warning'
                                                        }
                                                        label={
                                                            overdue
                                                                ? `${Math.abs(invoice.days_from_due)}d overdue`
                                                                : invoice.days_from_due ===
                                                                    0
                                                                  ? 'Due today'
                                                                  : `Due in ${invoice.days_from_due}d`
                                                        }
                                                    />
                                                    <span className="font-mono text-xs text-muted-foreground">
                                                        {invoice.invoice_code}
                                                    </span>
                                                </div>
                                                <p className="truncate text-sm font-semibold">
                                                    {invoice.project_name}
                                                </p>
                                                <p className="truncate text-xs text-muted-foreground">
                                                    {invoice.customer_name}
                                                    {invoice.payment_status ===
                                                        'partially_paid' &&
                                                        ' · Partially paid'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between gap-4 pl-12 sm:justify-end sm:pl-0">
                                            <div className="text-left sm:text-right">
                                                <p className="text-sm font-semibold tabular-nums">
                                                    Rp{' '}
                                                    {formatCompact(
                                                        invoice.outstanding,
                                                    )}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    outstanding
                                                </p>
                                            </div>
                                            <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground" />
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2 py-12 text-center">
                            <div className="flex size-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="size-5" />
                            </div>
                            <p className="text-sm font-semibold">
                                No collections need immediate action
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Invoices due within seven days will appear here.
                            </p>
                        </div>
                    )}
                </SectionCard>

                <SectionCard title="Collection workflow">
                    <div className="grid gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-2 xl:grid-cols-1">
                        {[
                            {
                                label: 'Overdue',
                                value: collection_summary.overdue,
                                hint: 'Escalate collection',
                                icon: AlertTriangle,
                            },
                            {
                                label: 'Due within 7 days',
                                value: collection_summary.due_soon,
                                hint: 'Send reminders',
                                icon: Clock3,
                            },
                            {
                                label: 'Partially paid',
                                value: collection_summary.partially_paid,
                                hint: 'Reconcile remaining balance',
                                icon: Banknote,
                            },
                            {
                                label: 'Draft invoices',
                                value: collection_summary.draft_invoices,
                                hint: 'Review and issue',
                                icon: FileClock,
                            },
                        ].map((item) => {
                            const Icon = item.icon;

                            return (
                                <div
                                    key={item.label}
                                    className="flex items-center gap-3 bg-card p-4"
                                >
                                    <Icon className="size-4 text-muted-foreground" />
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
                <SectionCard
                    title={`Invoiced vs. collected by month (${year})`}
                >
                    <ChartContainer
                        className="h-64 w-full"
                        config={{
                            revenue: { label: 'Invoiced', color: '#6366f1' },
                            collected: { label: 'Collected', color: '#22c55e' },
                        }}
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
                                dataKey="revenue"
                                fill="var(--color-revenue)"
                                radius={[3, 3, 0, 0]}
                                name="Invoiced"
                            />
                            <Bar
                                dataKey="collected"
                                fill="var(--color-collected)"
                                radius={[3, 3, 0, 0]}
                                name="Collected"
                            />
                        </BarChart>
                    </ChartContainer>
                </SectionCard>

                <SectionCard title="Issued invoice status">
                    <div className="space-y-5 py-2">
                        {Object.entries(payment_status).map(
                            ([status, count]) => {
                                const percentage =
                                    paymentTotal > 0
                                        ? (count / paymentTotal) * 100
                                        : 0;

                                return (
                                    <div key={status} className="space-y-2">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={cn(
                                                        'size-2 rounded-full',
                                                        PAYMENT_STATUS_COLORS[
                                                            status
                                                        ] ?? 'bg-slate-400',
                                                    )}
                                                />
                                                <span className="text-sm capitalize">
                                                    {status.replace(/_/g, ' ')}
                                                </span>
                                            </div>
                                            <span className="text-sm font-semibold tabular-nums">
                                                {count}
                                            </span>
                                        </div>
                                        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                                            <div
                                                className={cn(
                                                    'h-full rounded-full',
                                                    PAYMENT_STATUS_COLORS[
                                                        status
                                                    ] ?? 'bg-slate-400',
                                                )}
                                                style={{
                                                    width: `${percentage}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                );
                            },
                        )}
                        {paymentTotal === 0 && (
                            <div className="flex flex-col items-center gap-2 py-8 text-center">
                                <ReceiptText className="size-5 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">
                                    No issued invoices yet.
                                </p>
                            </div>
                        )}
                    </div>
                </SectionCard>
            </div>
        </div>
    );
}
