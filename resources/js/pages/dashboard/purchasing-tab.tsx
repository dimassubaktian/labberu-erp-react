import { CheckCircle, Clock, Package, ShoppingCart } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Pie, PieChart, Tooltip, XAxis, YAxis } from 'recharts';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { SectionCard } from '@/components/dashboard/section-card';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { formatCompact } from '@/lib/utils';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const PO_STATUS_COLORS: Record<string, string> = {
    draft: '#94a3b8',
    issued: '#f59e0b',
    approved: '#6366f1',
    sent: '#3b82f6',
    partially_received: '#a78bfa',
    fully_received: '#22c55e',
    closed: '#64748b',
    cancelled: '#ef4444',
    voided: '#dc2626',
};

const GRN_STATUS_COLORS: Record<string, string> = {
    draft: '#94a3b8',
    confirmed: '#22c55e',
};

type MonthRow = { month: number; spend: number };
type VendorRow = { name: string; spend: number };

type Props = {
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
};

export function PurchasingTab({ kpis, monthly_chart, po_by_status, top_vendors, grn_by_status }: Props) {
    const chartData = monthly_chart.map((row) => ({
        month: MONTH_LABELS[row.month - 1],
        spend: row.spend,
    }));

    const poStatusData = Object.entries(po_by_status).map(([status, count]) => ({
        name: status.replace(/_/g, ' '),
        value: count,
        fill: PO_STATUS_COLORS[status] ?? '#94a3b8',
    }));

    const grnStatusData = Object.entries(grn_by_status).map(([status, count]) => ({
        name: status,
        value: count,
        fill: GRN_STATUS_COLORS[status] ?? '#94a3b8',
    }));

    return (
        <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
                <KpiCard label="Total POs" value={kpis.total_pos} icon={ShoppingCart} />
                <KpiCard label="Total PO Value" value={`Rp ${formatCompact(kpis.total_value)}`} icon={Package} />
                <KpiCard label="Open POs" value={kpis.open_pos} icon={Clock} highlight={kpis.open_pos > 5 ? 'warning' : undefined} />
                <KpiCard label="Awaiting Approval" value={kpis.awaiting_approval} icon={CheckCircle} highlight={kpis.awaiting_approval > 0 ? 'warning' : undefined} />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <div className="md:col-span-2">
                    <SectionCard title="Monthly PO Spend (This Year)">
                        <ChartContainer className="h-64 w-full" config={{ spend: { label: 'Spend', color: '#6366f1' } }}>
                            <BarChart data={chartData} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                                <YAxis tickFormatter={(v) => formatCompact(v)} tick={{ fontSize: 11 }} width={48} />
                                <Tooltip content={<ChartTooltipContent />} />
                                <Bar dataKey="spend" fill="var(--color-spend)" radius={[3, 3, 0, 0]} name="Spend" />
                            </BarChart>
                        </ChartContainer>
                    </SectionCard>
                </div>

                <SectionCard title="PO Status Breakdown">
                    <ChartContainer
                        className="h-64 w-full"
                        config={Object.fromEntries(
                            Object.entries(PO_STATUS_COLORS).map(([k, v]) => [k, { label: k.replace(/_/g, ' '), color: v }]),
                        )}
                    >
                        <PieChart>
                            <Pie data={poStatusData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" nameKey="name">
                                {poStatusData.map((entry, i) => (
                                    <Cell key={i} fill={entry.fill} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value, name) => [value, name]} />
                        </PieChart>
                    </ChartContainer>
                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                        {poStatusData.map((s) => (
                            <span key={s.name} className="flex items-center gap-1">
                                <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: s.fill }} />
                                {s.name} ({s.value})
                            </span>
                        ))}
                    </div>
                </SectionCard>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <SectionCard title="Top Vendors by Spend">
                    {top_vendors.length > 0 ? (
                        <ChartContainer className="h-56 w-full" config={{ spend: { label: 'Spend', color: '#6366f1' } }}>
                            <BarChart layout="vertical" data={top_vendors} margin={{ top: 4, right: 48, left: 4, bottom: 4 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" tickFormatter={(v) => formatCompact(v)} tick={{ fontSize: 11 }} />
                                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                                <Tooltip formatter={(v) => [`Rp ${formatCompact(Number(v))}`, 'Spend']} />
                                <Bar dataKey="spend" fill="var(--color-spend)" radius={[0, 3, 3, 0]} name="Spend">
                                    <LabelList dataKey="spend" position="right" formatter={(v: unknown) => formatCompact(Number(v))} style={{ fontSize: 11 }} />
                                </Bar>
                            </BarChart>
                        </ChartContainer>
                    ) : (
                        <p className="py-8 text-center text-sm text-muted-foreground">No vendor data available.</p>
                    )}
                </SectionCard>

                <SectionCard title="GRN Status">
                    {grnStatusData.length > 0 ? (
                        <>
                            <ChartContainer
                                className="h-40 w-full"
                                config={Object.fromEntries(
                                    Object.entries(GRN_STATUS_COLORS).map(([k, v]) => [k, { label: k, color: v }]),
                                )}
                            >
                                <BarChart layout="vertical" data={grnStatusData} margin={{ top: 4, right: 48, left: 4, bottom: 4 }}>
                                    <XAxis type="number" tick={{ fontSize: 11 }} />
                                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={72} />
                                    <Tooltip />
                                    <Bar dataKey="value" radius={[0, 3, 3, 0]} name="Count">
                                        {grnStatusData.map((entry, i) => (
                                            <Cell key={i} fill={entry.fill} />
                                        ))}
                                        <LabelList dataKey="value" position="right" style={{ fontSize: 11 }} />
                                    </Bar>
                                </BarChart>
                            </ChartContainer>
                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                                {grnStatusData.map((s) => (
                                    <span key={s.name} className="flex items-center gap-1">
                                        <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: s.fill }} />
                                        {s.name} ({s.value})
                                    </span>
                                ))}
                            </div>
                        </>
                    ) : (
                        <p className="py-8 text-center text-sm text-muted-foreground">No GRN data available.</p>
                    )}
                </SectionCard>
            </div>
        </div>
    );
}
