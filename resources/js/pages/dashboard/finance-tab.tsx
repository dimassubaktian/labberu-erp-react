import { AlertTriangle, CheckCircle, DollarSign, TrendingDown } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, Tooltip, XAxis, YAxis } from 'recharts';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { SectionCard } from '@/components/dashboard/section-card';
import { Badge } from '@/components/ui/badge';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCompact } from '@/lib/utils';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const PAYMENT_STATUS_COLORS: Record<string, string> = {
    paid: '#22c55e',
    partially_paid: '#f59e0b',
    awaiting_payment: '#94a3b8',
};

type MonthRow = { month: number; revenue: number; collected: number };
type OverdueInvoice = {
    invoice_code: string;
    customer_name: string;
    due_date: string;
    total: number;
    days_overdue: number;
};

type Props = {
    kpis: {
        total_invoiced: number;
        total_collected: number;
        outstanding: number;
        overdue_count: number;
    };
    monthly_chart: MonthRow[];
    payment_status: Record<string, number>;
    overdue_invoices: OverdueInvoice[];
};

export function FinanceTab({ kpis, monthly_chart, payment_status, overdue_invoices }: Props) {
    const chartData = monthly_chart.map((row) => ({
        month: MONTH_LABELS[row.month - 1],
        revenue: row.revenue,
        collected: row.collected,
    }));

    const statusData = Object.entries(payment_status).map(([status, count]) => ({
        name: status.replace(/_/g, ' '),
        value: count,
        fill: PAYMENT_STATUS_COLORS[status] ?? '#94a3b8',
    }));

    return (
        <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
                <KpiCard label="Total Invoiced" value={`Rp ${formatCompact(kpis.total_invoiced)}`} icon={DollarSign} />
                <KpiCard label="Collected" value={`Rp ${formatCompact(kpis.total_collected)}`} icon={CheckCircle} />
                <KpiCard label="Outstanding" value={`Rp ${formatCompact(kpis.outstanding)}`} icon={TrendingDown} />
                <KpiCard
                    label="Overdue Invoices"
                    value={kpis.overdue_count}
                    icon={AlertTriangle}
                    highlight={kpis.overdue_count > 0 ? 'danger' : undefined}
                />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <div className="md:col-span-2">
                    <SectionCard title="Monthly Revenue vs. Collections (This Year)">
                        <ChartContainer
                            className="h-64 w-full"
                            config={{
                                revenue: { label: 'Invoiced', color: '#6366f1' },
                                collected: { label: 'Collected', color: '#22c55e' },
                            }}
                        >
                            <BarChart data={chartData} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                                <YAxis tickFormatter={(v) => formatCompact(v)} tick={{ fontSize: 11 }} width={48} />
                                <Tooltip content={<ChartTooltipContent />} />
                                <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[3, 3, 0, 0]} name="Invoiced" />
                                <Bar dataKey="collected" fill="var(--color-collected)" radius={[3, 3, 0, 0]} name="Collected" />
                            </BarChart>
                        </ChartContainer>
                    </SectionCard>
                </div>

                <SectionCard title="Payment Status">
                    <ChartContainer
                        className="h-64 w-full"
                        config={Object.fromEntries(
                            Object.entries(PAYMENT_STATUS_COLORS).map(([k, v]) => [k, { label: k.replace(/_/g, ' '), color: v }]),
                        )}
                    >
                        <PieChart>
                            <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" nameKey="name">
                                {statusData.map((entry, i) => (
                                    <Cell key={i} fill={entry.fill} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value, name) => [value, name]} />
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

            {overdue_invoices.length > 0 && (
                <SectionCard title="Overdue Invoices">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Invoice</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Due Date</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead className="text-right">Days Overdue</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {overdue_invoices.map((inv) => (
                                <TableRow key={inv.invoice_code}>
                                    <TableCell className="font-mono text-xs">{inv.invoice_code}</TableCell>
                                    <TableCell>{inv.customer_name}</TableCell>
                                    <TableCell>{inv.due_date}</TableCell>
                                    <TableCell className="text-right">Rp {formatCompact(inv.total)}</TableCell>
                                    <TableCell className="text-right">
                                        <Badge variant="destructive">{inv.days_overdue}d</Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </SectionCard>
            )}
        </div>
    );
}
