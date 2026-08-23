import { Link } from '@inertiajs/react';
import {
    AlertTriangle,
    CheckCircle,
    Clock,
    FolderKanban,
    X,
} from 'lucide-react';
import { Cell, Pie, PieChart, Tooltip } from 'recharts';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { SectionCard } from '@/components/dashboard/section-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChartContainer } from '@/components/ui/chart';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { show } from '@/routes/projects';

const STATUS_COLORS: Record<string, string> = {
    planning: '#6366f1',
    in_progress: '#22c55e',
    completed: '#3b82f6',
    cancelled: '#ef4444',
};

const BILLING_COLORS: Record<string, string> = {
    awaiting_payment: '#94a3b8',
    partially_paid: '#f59e0b',
    paid: '#22c55e',
};

const STATUS_VARIANT_MAP: Record<
    string,
    'default' | 'secondary' | 'destructive' | 'outline'
> = {
    planning: 'secondary',
    in_progress: 'default',
    completed: 'outline',
    cancelled: 'destructive',
};

type Project = {
    uuid: string;
    project_code: string;
    name: string;
    customer_name: string;
    status: string;
    billing_status: string | null;
    end_date: string | null;
    is_overdue: boolean;
    priority: string;
};

type Props = {
    kpis: {
        total: number;
        in_progress: number;
        overdue: number;
        completed: number;
    };
    my_projects: Project[];
    status_counts: Record<string, number>;
    billing_status_counts: Record<string, number>;
    staffStatus: string;
    staffPriority: string;
    onFilterChange: (overrides: {
        staff_status?: string;
        staff_priority?: string;
    }) => void;
};

export function StaffTab({
    kpis,
    my_projects,
    status_counts,
    billing_status_counts,
    staffStatus,
    staffPriority,
    onFilterChange,
}: Props) {
    const hasActiveFilters = staffStatus !== 'all' || staffPriority !== 'all';
    const statusData = Object.entries(status_counts).map(([status, count]) => ({
        name: status.replace(/_/g, ' '),
        value: count,
        fill: STATUS_COLORS[status] ?? '#94a3b8',
    }));

    const billingData = Object.entries(billing_status_counts).map(
        ([status, count]) => ({
            name: status.replace(/_/g, ' '),
            value: count,
            fill: BILLING_COLORS[status] ?? '#94a3b8',
        }),
    );

    return (
        <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
                <KpiCard
                    label="My Projects"
                    value={kpis.total}
                    icon={FolderKanban}
                />
                <KpiCard
                    label="In Progress"
                    value={kpis.in_progress}
                    icon={Clock}
                />
                <KpiCard
                    label="Overdue"
                    value={kpis.overdue}
                    icon={AlertTriangle}
                    highlight={kpis.overdue > 0 ? 'danger' : undefined}
                />
                <KpiCard
                    label="Completed"
                    value={kpis.completed}
                    icon={CheckCircle}
                />
            </div>

            <SectionCard title="My Project List">
                <div className="mb-3 flex flex-wrap gap-2">
                    <Select
                        value={staffStatus}
                        onValueChange={(v) =>
                            onFilterChange({ staff_status: v })
                        }
                    >
                        <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="All statuses" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All statuses</SelectItem>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="planning">Planning</SelectItem>
                            <SelectItem value="in_progress">
                                In progress
                            </SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select
                        value={staffPriority}
                        onValueChange={(v) =>
                            onFilterChange({ staff_priority: v })
                        }
                    >
                        <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="All priorities" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All priorities</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                    </Select>
                    {hasActiveFilters && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                                onFilterChange({
                                    staff_status: 'all',
                                    staff_priority: 'all',
                                })
                            }
                        >
                            <X className="mr-1 h-3 w-3" />
                            Reset
                        </Button>
                    )}
                </div>
                {my_projects.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                        No projects assigned to you.
                    </p>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Project</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Billing</TableHead>
                                <TableHead>Due Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {my_projects.map((project) => (
                                <TableRow key={project.uuid}>
                                    <TableCell>
                                        <Link
                                            href={show(project)}
                                            className="hover:underline"
                                        >
                                            <span className="font-mono text-xs text-muted-foreground">
                                                {project.project_code}
                                            </span>
                                            <br />
                                            <span className="font-medium">
                                                {project.name}
                                            </span>
                                        </Link>
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {project.customer_name}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={
                                                STATUS_VARIANT_MAP[
                                                    project.status
                                                ] ?? 'secondary'
                                            }
                                        >
                                            {project.status.replace(/_/g, ' ')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {project.billing_status ? (
                                            <span className="text-xs text-muted-foreground">
                                                {project.billing_status.replace(
                                                    /_/g,
                                                    ' ',
                                                )}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">
                                                —
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {project.end_date ? (
                                            <span
                                                className={
                                                    project.is_overdue
                                                        ? 'font-medium text-destructive'
                                                        : ''
                                                }
                                            >
                                                {project.is_overdue && (
                                                    <AlertTriangle className="mr-1 inline h-3 w-3" />
                                                )}
                                                {project.end_date}
                                            </span>
                                        ) : (
                                            <span className="text-muted-foreground">
                                                —
                                            </span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </SectionCard>

            {(statusData.length > 0 || billingData.length > 0) && (
                <div className="grid gap-4 md:grid-cols-2">
                    <SectionCard title="My Projects by Status">
                        <ChartContainer
                            className="h-52 w-full"
                            config={Object.fromEntries(
                                Object.entries(STATUS_COLORS).map(([k, v]) => [
                                    k,
                                    { label: k.replace(/_/g, ' '), color: v },
                                ]),
                            )}
                        >
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={78}
                                    dataKey="value"
                                    nameKey="name"
                                >
                                    {statusData.map((entry, i) => (
                                        <Cell key={i} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value, name) => [value, name]}
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

                    <SectionCard title="My Projects by Billing Status">
                        <ChartContainer
                            className="h-52 w-full"
                            config={Object.fromEntries(
                                Object.entries(BILLING_COLORS).map(([k, v]) => [
                                    k,
                                    { label: k.replace(/_/g, ' '), color: v },
                                ]),
                            )}
                        >
                            <PieChart>
                                <Pie
                                    data={billingData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={78}
                                    dataKey="value"
                                    nameKey="name"
                                >
                                    {billingData.map((entry, i) => (
                                        <Cell key={i} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value, name) => [value, name]}
                                />
                            </PieChart>
                        </ChartContainer>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                            {billingData.map((s) => (
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
            )}
        </div>
    );
}
