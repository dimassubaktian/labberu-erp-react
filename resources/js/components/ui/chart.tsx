import * as React from 'react';
import * as RechartsPrimitive from 'recharts';
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import type { Payload } from 'recharts/types/component/DefaultTooltipContent';
import { cn } from '@/lib/utils';

const THEMES = { light: '', dark: '.dark' } as const;

export type ChartConfig = {
    [k in string]: {
        label?: React.ReactNode;
        icon?: React.ComponentType;
        color?: string;
        theme?: Record<keyof typeof THEMES, string>;
    };
};

type ChartContextProps = {
    config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
    const context = React.useContext(ChartContext);
    if (!context) {
        throw new Error('useChart must be used within a <ChartContainer />');
    }
    return context;
}

function ChartContainer({
    id,
    className,
    children,
    config,
    ...props
}: React.ComponentProps<'div'> & {
    config: ChartConfig;
    children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>['children'];
}) {
    const uniqueId = React.useId();
    const chartId = `chart-${id ?? uniqueId.replace(/:/g, '')}`;

    return (
        <ChartContext.Provider value={{ config }}>
            <div
                data-chart={chartId}
                className={cn(
                    "[&_.recharts-cartesian-axis-tick-value]:fill-muted-foreground dark:[&_.recharts-cartesian-axis-tick-value]:fill-[oklch(0.87_0.06_162.808)] [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-label-list_text]:fill-foreground [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
                    className,
                )}
                {...props}
            >
                <ChartStyle id={chartId} config={config} />
                <RechartsPrimitive.ResponsiveContainer>
                    {children}
                </RechartsPrimitive.ResponsiveContainer>
            </div>
        </ChartContext.Provider>
    );
}

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
    const colorConfig = Object.entries(config).filter(([, cfg]) => cfg.theme ?? cfg.color);
    if (!colorConfig.length) {
        return null;
    }
    return (
        <style
            dangerouslySetInnerHTML={{
                __html: Object.entries(THEMES)
                    .map(
                        ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
    .map(([key, itemConfig]) => {
        const color = itemConfig.theme?.[theme as keyof typeof itemConfig.theme] ?? itemConfig.color;
        return color ? `  --color-${key}: ${color};` : null;
    })
    .join('\n')}
}`,
                    )
                    .join('\n'),
            }}
        />
    );
};

const ChartTooltip = RechartsPrimitive.Tooltip;

function ChartTooltipContent({
    active,
    payload,
    className,
    hideLabel = false,
    label,
    labelFormatter,
    labelClassName,
    formatter,
}: {
    active?: boolean;
    payload?: Payload<ValueType, NameType>[];
    className?: string;
    hideLabel?: boolean;
    label?: string | number;
    labelFormatter?: (label: string | number, payload: Payload<ValueType, NameType>[]) => React.ReactNode;
    labelClassName?: string;
    formatter?: (value: ValueType, name: NameType, item: Payload<ValueType, NameType>, index: number, payload: Payload<ValueType, NameType>[]) => React.ReactNode;
}) {
    const { config } = useChart();

    const tooltipLabel = React.useMemo(() => {
        if (hideLabel || !payload?.length) {
            return null;
        }
        const [item] = payload;
        const key = String(item?.dataKey ?? item?.name ?? 'value');
        const itemConfig = key in config ? config[key] : undefined;
        const value = labelFormatter
            ? labelFormatter(label ?? '', payload)
            : (itemConfig?.label ?? label);

        if (!value) return null;
        return <div className={cn('font-medium', labelClassName)}>{value}</div>;
    }, [label, labelFormatter, payload, hideLabel, labelClassName, config]);

    if (!active || !payload?.length) {
        return null;
    }

    return (
        <div className={cn('grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl', className)}>
            {tooltipLabel}
            <div className="grid gap-1.5">
                {payload.map((item, index) => {
                    const key = String(item.name ?? item.dataKey ?? 'value');
                    const itemConfig = key in config ? config[key] : undefined;
                    const indicatorColor = (item.payload as Record<string, string>)?.fill ?? item.color;

                    return (
                        <div key={item.dataKey as string} className="flex w-full items-center gap-2">
                            {formatter && item?.value !== undefined && item.name ? (
                                formatter(item.value, item.name, item, index, payload)
                            ) : (
                                <>
                                    <div
                                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                                        style={{ backgroundColor: indicatorColor }}
                                    />
                                    <div className="flex flex-1 items-center justify-between leading-none">
                                        <span className="text-muted-foreground">{itemConfig?.label ?? item.name}</span>
                                        {item.value !== undefined && (
                                            <span className="font-mono font-medium tabular-nums text-foreground">
                                                {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
                                            </span>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

const ChartLegend = RechartsPrimitive.Legend;

function ChartLegendContent({
    className,
    payload,
    verticalAlign = 'bottom',
}: {
    className?: string;
    payload?: Payload<ValueType, NameType>[];
    verticalAlign?: 'top' | 'bottom' | 'middle';
}) {
    const { config } = useChart();

    if (!payload?.length) {
        return null;
    }

    return (
        <div className={cn('flex items-center justify-center gap-4', verticalAlign === 'top' ? 'pb-3' : 'pt-3', className)}>
            {payload.map((item) => {
                const key = String(item.dataKey ?? 'value');
                const itemConfig = key in config ? config[key] : undefined;

                return (
                    <div key={String(item.value)} className="flex items-center gap-1.5">
                        <div className="h-2 w-2 shrink-0 rounded-[2px]" style={{ backgroundColor: item.color }} />
                        {itemConfig?.label ?? String(item.value)}
                    </div>
                );
            })}
        </div>
    );
}

export { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, ChartStyle };
