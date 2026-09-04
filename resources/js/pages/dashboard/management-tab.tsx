import {
    Activity,
    AlertTriangle,
    ClipboardCheck,
    DollarSign,
    FolderClock,
    Layers,
    Receipt,
    ShoppingCart,
    TrendingUp,
    Users,
} from 'lucide-react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    LabelList,
    Pie,
    PieChart,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { SectionCard } from '@/components/dashboard/section-card';
import { SectionIntro } from '@/components/dashboard/section-intro';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatCompact } from '@/lib/utils';

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
    planning: '#6366f1',
    in_progress: '#22c55e',
    completed: '#3b82f6',
    cancelled: '#ef4444',
};

const FUNNEL_COLORS = [
    '#6366f1',
    '#8b5cf6',
    '#a78bfa',
    '#c4b5fd',
    '#ddd6fe',
    '#ede9fe',
];

type MonthRow = { month: number; revenue: number; spend: number };
type PipelineRow = { stage: string; count: number };
type CustomerRow = { name: string; revenue: number };
type BusinessLineRow = {
    name: string;
    project_count: number;
    total_revenue: number;
    total_cost: number;
    gross_profit: number;
    gross_margin: number;
};

type Props = {
    year: number;
    kpis: {
        active_projects: number;
        total_revenue: number;
        total_spend: number;
        gross_margin: number;
    };
    monthly_chart: MonthRow[];
    projects_by_status: Record<string, number>;
    pipeline: PipelineRow[];
    top_customers: CustomerRow[];
    business_line_stats: BusinessLineRow[];
    attention: {
        quotation_approvals: number;
        purchase_order_approvals: number;
        overdue_invoices: number;
        overdue_projects: number;
        loss_making_lines: number;
    };
};

export function ManagementTab({
    year,
    kpis,
    monthly_chart,
    projects_by_status,
    pipeline,
    top_customers,
    business_line_stats,
    attention,
}: Props) {
    const chartData = monthly_chart.map((row) => ({
        month: MONTH_LABELS[row.month - 1],
        revenue: row.revenue,
        spend: row.spend,
    }));

    const statusData = Object.entries(projects_by_status).map(
        ([status, count]) => ({
            name: status.replace('_', ' '),
            value: count,
            fill: STATUS_COLORS[status] ?? '#94a3b8',
        }),
    );

    const maxFunnelCount = pipeline[0]?.count ?? 1;
    const funnelData = pipeline.map((row, i) => ({
        ...row,
        fill: FUNNEL_COLORS[i] ?? '#94a3b8',
        pct: Math.round((row.count / maxFunnelCount) * 100),
    }));
    const decisionCount = Object.values(attention).reduce(
        (total, count) => total + count,
        0,
    );

    return (
        <div className="space-y-4">
            <SectionIntro
                icon={Activity}
                label="Management overview"
                description="Start with decisions that are blocking teams, then review profitability, project flow, and where revenue is concentrated."
                statusLabel="Decisions and risks"
                statusValue={
                    decisionCount > 0
                        ? `${decisionCount} signals need review`
                        : 'Operations are clear'
                }
                tone={decisionCount > 0 ? 'warning' : 'success'}
            />

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <KpiCard
                    label="Active Projects"
                    value={kpis.active_projects}
                    icon={Users}
                />
                <KpiCard
                    label="Total Revenue"
                    value={`Rp ${formatCompact(kpis.total_revenue)}`}
                    icon={DollarSign}
                />
                <KpiCard
                    label="Total Spend"
                    value={`Rp ${formatCompact(kpis.total_spend)}`}
                    icon={TrendingUp}
                />
                <KpiCard
                    label="Gross Margin (net of tax)"
                    value={`${kpis.gross_margin}%`}
                    icon={Activity}
                />
            </div>

            <SectionCard title="Decision queue">
                <div className="grid gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-2 xl:grid-cols-5">
                    {[
                        {
                            label: 'Quotation approvals',
                            value: attention.quotation_approvals,
                            hint: 'Sales is waiting',
                            icon: ClipboardCheck,
                        },
                        {
                            label: 'PO approvals',
                            value: attention.purchase_order_approvals,
                            hint: 'Purchasing is waiting',
                            icon: ShoppingCart,
                        },
                        {
                            label: 'Overdue invoices',
                            value: attention.overdue_invoices,
                            hint: 'Cash collection risk',
                            icon: Receipt,
                        },
                        {
                            label: 'Overdue projects',
                            value: attention.overdue_projects,
                            hint: 'Delivery risk',
                            icon: FolderClock,
                        },
                        {
                            label: 'Loss-making lines',
                            value: attention.loss_making_lines,
                            hint: 'Margin intervention',
                            icon: AlertTriangle,
                        },
                    ].map((item) => {
                        const Icon = item.icon;

                        return (
                            <div
                                key={item.label}
                                className="flex gap-3 bg-card p-4"
                            >
                                <Icon
                                    className={
                                        item.value > 0
                                            ? 'mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400'
                                            : 'mt-0.5 size-4 shrink-0 text-muted-foreground'
                                    }
                                />
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-medium">
                                            {item.label}
                                        </p>
                                        <span className="font-bold tabular-nums">
                                            {item.value}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {item.hint}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </SectionCard>

            <div className="grid gap-4 md:grid-cols-3">
                <div className="md:col-span-2">
                    <SectionCard title={`Revenue vs. Spend (${year})`}>
                        <ChartContainer
                            className="h-64 w-full"
                            config={{
                                revenue: { label: 'Revenue', color: '#6366f1' },
                                spend: { label: 'Spend', color: '#f59e0b' },
                            }}
                        >
                            <BarChart
                                data={chartData}
                                margin={{
                                    top: 4,
                                    right: 4,
                                    left: 4,
                                    bottom: 4,
                                }}
                            >
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    vertical={false}
                                />
                                <XAxis
                                    dataKey="month"
                                    tick={{ fontSize: 11 }}
                                />
                                <YAxis
                                    tickFormatter={(v) => formatCompact(v)}
                                    tick={{ fontSize: 11 }}
                                    width={48}
                                />
                                <Tooltip content={<ChartTooltipContent />} />
                                <Bar
                                    dataKey="revenue"
                                    fill="var(--color-revenue)"
                                    radius={[3, 3, 0, 0]}
                                    name="Revenue"
                                />
                                <Bar
                                    dataKey="spend"
                                    fill="var(--color-spend)"
                                    radius={[3, 3, 0, 0]}
                                    name="Spend"
                                />
                            </BarChart>
                        </ChartContainer>
                    </SectionCard>
                </div>

                <SectionCard title="Projects by Status">
                    <ChartContainer
                        className="h-64 w-full"
                        config={Object.fromEntries(
                            Object.entries(STATUS_COLORS).map(([k, v]) => [
                                k,
                                { label: k.replace('_', ' '), color: v },
                            ]),
                        )}
                    >
                        <PieChart>
                            <Pie
                                data={statusData}
                                cx="50%"
                                cy="50%"
                                innerRadius={55}
                                outerRadius={85}
                                dataKey="value"
                                nameKey="name"
                            >
                                {statusData.map((entry, i) => (
                                    <Cell key={i} fill={entry.fill} />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value, name) => [
                                    value,
                                    String(name).replace('_', ' '),
                                ]}
                            />
                        </PieChart>
                    </ChartContainer>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                        {statusData.map((s) => (
                            <span
                                key={s.name}
                                className="flex items-center gap-1"
                            >
                                <span
                                    className="inline-block h-2 w-2 rounded-full"
                                    style={{ backgroundColor: s.fill }}
                                />
                                {s.name} ({s.value})
                            </span>
                        ))}
                    </div>
                </SectionCard>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <SectionCard title="Sales Pipeline">
                    <ChartContainer
                        className="h-56 w-full"
                        config={{ count: { label: 'Count', color: '#6366f1' } }}
                    >
                        <BarChart
                            layout="vertical"
                            data={funnelData}
                            margin={{ top: 4, right: 40, left: 4, bottom: 4 }}
                        >
                            <CartesianGrid
                                strokeDasharray="3 3"
                                horizontal={false}
                            />
                            <XAxis type="number" tick={{ fontSize: 11 }} />
                            <YAxis
                                type="category"
                                dataKey="stage"
                                tick={{ fontSize: 11 }}
                                width={64}
                            />
                            <Tooltip content={<ChartTooltipContent />} />
                            <Bar
                                dataKey="count"
                                radius={[0, 3, 3, 0]}
                                name="Count"
                            >
                                {funnelData.map((entry, i) => (
                                    <Cell key={i} fill={entry.fill} />
                                ))}
                                <LabelList
                                    dataKey="count"
                                    position="right"
                                    style={{ fontSize: 11 }}
                                />
                            </Bar>
                        </BarChart>
                    </ChartContainer>
                </SectionCard>

                <SectionCard title="Top Customers by Revenue">
                    <ChartContainer
                        className="h-56 w-full"
                        config={{
                            revenue: { label: 'Revenue', color: '#6366f1' },
                        }}
                    >
                        <BarChart
                            layout="vertical"
                            data={top_customers}
                            margin={{ top: 4, right: 40, left: 4, bottom: 4 }}
                        >
                            <CartesianGrid
                                strokeDasharray="3 3"
                                horizontal={false}
                            />
                            <XAxis
                                type="number"
                                tickFormatter={(v) => formatCompact(v)}
                                tick={{ fontSize: 11 }}
                            />
                            <YAxis
                                type="category"
                                dataKey="name"
                                tick={{ fontSize: 11 }}
                                width={96}
                            />
                            <Tooltip
                                formatter={(v) => [
                                    `Rp ${formatCompact(Number(v))}`,
                                    'Revenue',
                                ]}
                            />
                            <Bar
                                dataKey="revenue"
                                fill="var(--color-revenue)"
                                radius={[0, 3, 3, 0]}
                                name="Revenue"
                            >
                                <LabelList
                                    dataKey="revenue"
                                    position="right"
                                    formatter={(v: unknown) =>
                                        formatCompact(Number(v))
                                    }
                                    style={{ fontSize: 11 }}
                                />
                            </Bar>
                        </BarChart>
                    </ChartContainer>
                </SectionCard>
            </div>

            {business_line_stats.length > 0 && (
                <SectionCard title="Business Line Performance">
                    <ChartContainer
                        className="w-full"
                        style={{
                            height: Math.max(
                                200,
                                business_line_stats.length * 80,
                            ),
                        }}
                        config={{
                            total_revenue: {
                                label: 'Revenue',
                                color: '#6366f1',
                            },
                            total_cost: { label: 'Cost', color: '#f59e0b' },
                            gross_profit: {
                                label: 'Gross Profit',
                                color: '#22c55e',
                            },
                        }}
                    >
                        <BarChart
                            layout="vertical"
                            data={business_line_stats}
                            margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
                        >
                            <CartesianGrid
                                strokeDasharray="3 3"
                                horizontal={false}
                            />
                            <XAxis
                                type="number"
                                tickFormatter={(v) => formatCompact(v)}
                                tick={{ fontSize: 11 }}
                            />
                            <YAxis
                                type="category"
                                dataKey="name"
                                tick={{ fontSize: 11 }}
                                width={96}
                            />
                            <Tooltip
                                content={
                                    <ChartTooltipContent
                                        formatter={(value, name, item) => (
                                            <>
                                                <div
                                                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                                                    style={{
                                                        backgroundColor:
                                                            item.color,
                                                    }}
                                                />
                                                <div className="flex flex-1 items-center justify-between gap-4 leading-none">
                                                    <span className="text-muted-foreground">
                                                        {String(name)}
                                                    </span>
                                                    <span className="font-mono font-medium text-foreground tabular-nums">
                                                        Rp{' '}
                                                        {formatCompact(
                                                            Number(value),
                                                        )}
                                                    </span>
                                                </div>
                                            </>
                                        )}
                                    />
                                }
                            />
                            <Bar
                                dataKey="total_revenue"
                                fill="var(--color-total_revenue)"
                                radius={[0, 3, 3, 0]}
                                name="Revenue"
                            />
                            <Bar
                                dataKey="total_cost"
                                fill="var(--color-total_cost)"
                                radius={[0, 3, 3, 0]}
                                name="Cost"
                            />
                            <Bar
                                dataKey="gross_profit"
                                fill="var(--color-gross_profit)"
                                radius={[0, 3, 3, 0]}
                                name="Gross Profit"
                            />
                        </BarChart>
                    </ChartContainer>

                    <div className="mt-4 overflow-hidden rounded-lg border border-border/50">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Business Line</TableHead>
                                    <TableHead className="text-right">
                                        Projects
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Revenue
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Cost
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Gross Profit
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Gross Margin
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {business_line_stats.map((row) => (
                                    <TableRow key={row.name}>
                                        <TableCell className="flex items-center gap-2 font-medium">
                                            <Layers className="size-4 text-muted-foreground" />
                                            {row.name}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {row.project_count}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            Rp{' '}
                                            {formatCompact(row.total_revenue)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            Rp {formatCompact(row.total_cost)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <span
                                                className={
                                                    row.gross_profit >= 0
                                                        ? 'text-green-600 dark:text-green-400'
                                                        : 'text-red-600 dark:text-red-400'
                                                }
                                            >
                                                Rp{' '}
                                                {formatCompact(
                                                    row.gross_profit,
                                                )}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <span
                                                className={
                                                    row.gross_margin >= 0
                                                        ? 'text-green-600 dark:text-green-400'
                                                        : 'text-red-600 dark:text-red-400'
                                                }
                                            >
                                                {row.gross_margin}%
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </SectionCard>
            )}
        </div>
    );
}
