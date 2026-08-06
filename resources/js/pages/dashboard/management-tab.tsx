import { Activity, DollarSign, TrendingUp, Users } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Pie, PieChart, Tooltip, XAxis, YAxis } from 'recharts';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { SectionCard } from '@/components/dashboard/section-card';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { formatCompact } from '@/lib/utils';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const STATUS_COLORS: Record<string, string> = {
    planning: '#6366f1',
    in_progress: '#22c55e',
    completed: '#3b82f6',
    cancelled: '#ef4444',
};

const FUNNEL_COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe'];

type MonthRow = { month: number; revenue: number; spend: number };
type PipelineRow = { stage: string; count: number };
type CustomerRow = { name: string; revenue: number };

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
};

export function ManagementTab({ year, kpis, monthly_chart, projects_by_status, pipeline, top_customers }: Props) {
    const chartData = monthly_chart.map((row) => ({
        month: MONTH_LABELS[row.month - 1],
        revenue: row.revenue,
        spend: row.spend,
    }));

    const statusData = Object.entries(projects_by_status).map(([status, count]) => ({
        name: status.replace('_', ' '),
        value: count,
        fill: STATUS_COLORS[status] ?? '#94a3b8',
    }));

    const maxFunnelCount = pipeline[0]?.count ?? 1;
    const funnelData = pipeline.map((row, i) => ({
        ...row,
        fill: FUNNEL_COLORS[i] ?? '#94a3b8',
        pct: Math.round((row.count / maxFunnelCount) * 100),
    }));

    return (
        <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
                <KpiCard label="Active Projects" value={kpis.active_projects} icon={Users} />
                <KpiCard label="Total Revenue" value={`Rp ${formatCompact(kpis.total_revenue)}`} icon={DollarSign} />
                <KpiCard label="Total Spend" value={`Rp ${formatCompact(kpis.total_spend)}`} icon={TrendingUp} />
                <KpiCard label="Gross Margin" value={`${kpis.gross_margin}%`} icon={Activity} />
            </div>

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
                            <BarChart data={chartData} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                                <YAxis tickFormatter={(v) => formatCompact(v)} tick={{ fontSize: 11 }} width={48} />
                                <Tooltip content={<ChartTooltipContent />} />
                                <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[3, 3, 0, 0]} name="Revenue" />
                                <Bar dataKey="spend" fill="var(--color-spend)" radius={[3, 3, 0, 0]} name="Spend" />
                            </BarChart>
                        </ChartContainer>
                    </SectionCard>
                </div>

                <SectionCard title="Projects by Status">
                    <ChartContainer
                        className="h-64 w-full"
                        config={Object.fromEntries(
                            Object.entries(STATUS_COLORS).map(([k, v]) => [k, { label: k.replace('_', ' '), color: v }]),
                        )}
                    >
                        <PieChart>
                            <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" nameKey="name">
                                {statusData.map((entry, i) => (
                                    <Cell key={i} fill={entry.fill} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value, name) => [value, String(name).replace('_', ' ')]} />
                        </PieChart>
                    </ChartContainer>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                        {statusData.map((s) => (
                            <span key={s.name} className="flex items-center gap-1">
                                <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: s.fill }} />
                                {s.name} ({s.value})
                            </span>
                        ))}
                    </div>
                </SectionCard>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <SectionCard title="Sales Pipeline">
                    <ChartContainer className="h-56 w-full" config={{ count: { label: 'Count', color: '#6366f1' } }}>
                        <BarChart layout="vertical" data={funnelData} margin={{ top: 4, right: 40, left: 4, bottom: 4 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" tick={{ fontSize: 11 }} />
                            <YAxis type="category" dataKey="stage" tick={{ fontSize: 11 }} width={64} />
                            <Tooltip content={<ChartTooltipContent />} />
                            <Bar dataKey="count" radius={[0, 3, 3, 0]} name="Count">
                                {funnelData.map((entry, i) => (
                                    <Cell key={i} fill={entry.fill} />
                                ))}
                                <LabelList dataKey="count" position="right" style={{ fontSize: 11 }} />
                            </Bar>
                        </BarChart>
                    </ChartContainer>
                </SectionCard>

                <SectionCard title="Top Customers by Revenue">
                    <ChartContainer className="h-56 w-full" config={{ revenue: { label: 'Revenue', color: '#6366f1' } }}>
                        <BarChart layout="vertical" data={top_customers} margin={{ top: 4, right: 40, left: 4, bottom: 4 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" tickFormatter={(v) => formatCompact(v)} tick={{ fontSize: 11 }} />
                            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={96} />
                            <Tooltip formatter={(v) => [`Rp ${formatCompact(Number(v))}`, 'Revenue']} />
                            <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[0, 3, 3, 0]} name="Revenue">
                                <LabelList dataKey="revenue" position="right" formatter={(v: unknown) => formatCompact(Number(v))} style={{ fontSize: 11 }} />
                            </Bar>
                        </BarChart>
                    </ChartContainer>
                </SectionCard>
            </div>
        </div>
    );
}
