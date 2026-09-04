import { Link } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowUpRight,
    CheckCircle2,
    CircleDollarSign,
    Clock3,
    FileCheck2,
    FilePenLine,
    FileWarning,
    Send,
    Target,
} from 'lucide-react';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { SectionCard } from '@/components/dashboard/section-card';
import { StatusBadge } from '@/components/project-badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn, formatCompact } from '@/lib/utils';
import { show as showProject } from '@/routes/projects';
import { show as showQuotation } from '@/routes/quotations';

type PipelineStage = {
    key: string;
    label: string;
    count: number;
    value: number;
};

type ActionItem = {
    key: string;
    target_type: 'project' | 'quotation';
    uuid: string;
    code: string;
    project_name: string;
    customer_name: string;
    category: string;
    next_action: string;
    severity: 'danger' | 'warning' | 'info';
    age_days: number;
    valid_until: string | null;
    value: number;
};

type RecentWin = {
    uuid: string;
    quotation_code: string;
    project_name: string;
    customer_name: string;
    value: number;
    signed_at: string;
};

type Props = {
    year: number;
    kpis: {
        open_opportunities: number;
        pipeline_value: number;
        signed_value: number;
        needs_attention: number;
    };
    pipeline: PipelineStage[];
    action_summary: {
        no_quotation: number;
        draft: number;
        approval: number;
        ready_to_send: number;
        follow_up: number;
        at_risk: number;
    };
    action_items: ActionItem[];
    recent_wins: RecentWin[];
};

const ACTION_GROUPS = [
    {
        key: 'no_quotation',
        label: 'No quotation',
        hint: 'Projects waiting for a first quote',
        icon: FilePenLine,
    },
    {
        key: 'draft',
        label: 'Drafts',
        hint: 'Quotations still being prepared',
        icon: FileWarning,
    },
    {
        key: 'approval',
        label: 'Approval',
        hint: 'Waiting on an internal decision',
        icon: Clock3,
    },
    {
        key: 'ready_to_send',
        label: 'Ready to send',
        hint: 'Approved but not with the customer',
        icon: Send,
    },
    {
        key: 'follow_up',
        label: 'Follow up',
        hint: 'Sent and waiting on the customer',
        icon: Target,
    },
    {
        key: 'at_risk',
        label: 'At risk',
        hint: 'Expired or expiring within 7 days',
        icon: AlertTriangle,
    },
] as const;

const PIPELINE_COLORS: Record<string, string> = {
    new: 'bg-slate-400',
    quoting: 'bg-sky-500',
    approved: 'bg-indigo-500',
    sent: 'bg-amber-500',
    signed: 'bg-emerald-500',
};

function shortDate(value: string): string {
    return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
    });
}

function actionHref(item: ActionItem) {
    return item.target_type === 'project'
        ? showProject(item.uuid)
        : showQuotation(item.uuid);
}

export function SalesTab({
    year,
    kpis,
    pipeline,
    action_summary,
    action_items,
    recent_wins,
}: Props) {
    const largestStage = Math.max(...pipeline.map((stage) => stage.count), 1);

    return (
        <div className="space-y-4">
            <Card className="overflow-hidden border-primary/20 bg-primary/[0.035] py-0 shadow-none">
                <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Target className="size-4 text-primary" />
                            <p className="text-sm font-semibold text-primary">
                                Sales command center
                            </p>
                        </div>
                        <p className="max-w-2xl text-sm text-muted-foreground">
                            Start with the action queue. It surfaces stalled
                            projects, approval bottlenecks, and customer
                            follow-ups before they turn into missed revenue.
                        </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3 rounded-lg border bg-background px-4 py-3">
                        <div
                            className={cn(
                                'size-2 rounded-full',
                                kpis.needs_attention > 0
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500',
                            )}
                        />
                        <div>
                            <p className="text-xs text-muted-foreground">
                                Current workload
                            </p>
                            <p className="text-sm font-semibold">
                                {kpis.needs_attention > 0
                                    ? `${kpis.needs_attention} items need action`
                                    : 'Pipeline is up to date'}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <KpiCard
                    label={`Open Opportunities (${year})`}
                    value={kpis.open_opportunities}
                    icon={Target}
                />
                <KpiCard
                    label="Open Pipeline Value"
                    value={`Rp ${formatCompact(kpis.pipeline_value)}`}
                    icon={CircleDollarSign}
                />
                <KpiCard
                    label={`Signed Value (${year})`}
                    value={`Rp ${formatCompact(kpis.signed_value)}`}
                    icon={FileCheck2}
                />
                <KpiCard
                    label="Needs Attention"
                    value={kpis.needs_attention}
                    icon={AlertTriangle}
                    highlight={kpis.needs_attention > 0 ? 'warning' : undefined}
                />
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,1fr)]">
                <SectionCard title="What needs your attention">
                    {action_items.length > 0 ? (
                        <div className="divide-y">
                            {action_items.map((item) => (
                                <Link
                                    key={item.key}
                                    href={actionHref(item)}
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
                                                <Clock3 className="size-4" />
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
                                                    {item.code}
                                                </span>
                                            </div>
                                            <p className="truncate text-sm font-semibold">
                                                {item.project_name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {item.customer_name}
                                                <span className="px-1.5">
                                                    ·
                                                </span>
                                                {item.valid_until
                                                    ? `Valid until ${shortDate(item.valid_until)}`
                                                    : `${item.age_days} days in queue`}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between gap-4 pl-12 sm:justify-end sm:pl-0">
                                        <div className="text-left sm:text-right">
                                            <p className="text-sm font-medium">
                                                {item.next_action}
                                            </p>
                                            {item.value > 0 && (
                                                <p className="text-xs text-muted-foreground">
                                                    Rp{' '}
                                                    {formatCompact(item.value)}
                                                </p>
                                            )}
                                        </div>
                                        <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground" />
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
                                Nothing is waiting on sales
                            </p>
                            <p className="max-w-sm text-xs text-muted-foreground">
                                New projects and quotations that need a decision
                                will appear here automatically.
                            </p>
                        </div>
                    )}
                </SectionCard>

                <SectionCard title={`Pipeline snapshot (${year})`}>
                    <div className="space-y-5">
                        {pipeline.map((stage) => (
                            <div key={stage.key} className="space-y-2">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-sm font-medium">
                                            {stage.label}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Rp {formatCompact(stage.value)}
                                        </p>
                                    </div>
                                    <span className="text-sm font-semibold tabular-nums">
                                        {stage.count}
                                    </span>
                                </div>
                                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                                    <div
                                        className={cn(
                                            'h-full rounded-full',
                                            PIPELINE_COLORS[stage.key] ??
                                                'bg-primary',
                                        )}
                                        style={{
                                            width: `${Math.max(
                                                stage.count > 0 ? 8 : 0,
                                                (stage.count / largestStage) *
                                                    100,
                                            )}%`,
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </SectionCard>
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(300px,1fr)]">
                <SectionCard title="Where work is waiting">
                    <div className="grid gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-2 xl:grid-cols-3">
                        {ACTION_GROUPS.map((group) => {
                            const Icon = group.icon;
                            const count = action_summary[group.key];

                            return (
                                <div
                                    key={group.key}
                                    className="flex gap-3 bg-card p-4"
                                >
                                    <Icon
                                        className={cn(
                                            'mt-0.5 size-4 shrink-0',
                                            count > 0
                                                ? 'text-amber-600 dark:text-amber-400'
                                                : 'text-muted-foreground',
                                        )}
                                    />
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-medium">
                                                {group.label}
                                            </p>
                                            <span className="text-sm font-bold tabular-nums">
                                                {count}
                                            </span>
                                        </div>
                                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                                            {group.hint}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </SectionCard>

                <SectionCard title={`Recently signed (${year})`}>
                    {recent_wins.length > 0 ? (
                        <div className="divide-y">
                            {recent_wins.map((win) => (
                                <Link
                                    key={win.uuid}
                                    href={showQuotation(win.uuid)}
                                    prefetch
                                    className="group flex items-center gap-3 py-3 first:pt-1 last:pb-1"
                                >
                                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                        <CheckCircle2 className="size-4" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium">
                                            {win.project_name}
                                        </p>
                                        <p className="truncate text-xs text-muted-foreground">
                                            {win.customer_name} ·{' '}
                                            {shortDate(win.signed_at)}
                                        </p>
                                    </div>
                                    <p className="text-sm font-semibold tabular-nums">
                                        Rp {formatCompact(win.value)}
                                    </p>
                                    <ArrowUpRight className="size-3.5 text-muted-foreground group-hover:text-foreground" />
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <p className="py-8 text-center text-sm text-muted-foreground">
                            No signed quotations for {year} yet.
                        </p>
                    )}
                </SectionCard>
            </div>
        </div>
    );
}
