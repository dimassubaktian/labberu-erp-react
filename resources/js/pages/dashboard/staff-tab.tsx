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
import { SectionIntro } from '@/components/dashboard/section-intro';
import { StatusBadge } from '@/components/project-badge';
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

type Project = {
    uuid: string;
    project_code: string;
    name: string;
    customer_name: string;
    status: string;
    sales_status: string | null;
    billing_status: string | null;
    end_date: string | null;
    is_overdue: boolean;
    days_until_due: number | null;
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

function nextStep(project: Project): string {
    if (project.is_overdue) {
        return 'Recover the delivery schedule';
    }

    if (!project.sales_status) {
        return 'Prepare the quotation';
    }

    if (project.sales_status === 'quoting') {
        return 'Move the quotation forward';
    }

    if (project.sales_status === 'approved') {
        return 'Send the approved quotation';
    }

    if (project.sales_status === 'sent') {
        return 'Follow up with the customer';
    }

    if (project.status === 'in_progress') {
        return 'Keep delivery milestones updated';
    }

    if (project.billing_status === 'awaiting_payment') {
        return 'Coordinate payment follow-up';
    }

    return project.status === 'completed'
        ? 'No action required'
        : 'Confirm the next milestone';
}

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
            <SectionIntro
                icon={FolderKanban}
                label="My delivery desk"
                description="Overdue and urgent projects are placed first. Use the next-step column to decide what to move today."
                statusLabel="Personal workload"
                statusValue={
                    kpis.overdue > 0
                        ? `${kpis.overdue} projects overdue`
                        : `${kpis.in_progress} projects in progress`
                }
                tone={kpis.overdue > 0 ? 'danger' : 'success'}
            />

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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

            <SectionCard title="My prioritized projects">
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
                                <TableHead>Priority</TableHead>
                                <TableHead>Due Date</TableHead>
                                <TableHead>Next Step</TableHead>
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
                                        <StatusBadge
                                            category="status"
                                            value={project.status}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <StatusBadge
                                            category="priority"
                                            value={project.priority}
                                        />
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
                                                {project.is_overdue
                                                    ? `${Math.abs(project.days_until_due ?? 0)}d overdue`
                                                    : project.days_until_due ===
                                                        0
                                                      ? 'Due today'
                                                      : project.days_until_due !==
                                                          null
                                                        ? `Due in ${project.days_until_due}d`
                                                        : project.end_date}
                                            </span>
                                        ) : (
                                            <span className="text-muted-foreground">
                                                —
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-sm font-medium">
                                        <Link
                                            href={show(project)}
                                            prefetch
                                            className="hover:underline"
                                        >
                                            {nextStep(project)}
                                        </Link>
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
