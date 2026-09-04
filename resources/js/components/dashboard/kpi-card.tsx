import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type Props = {
    label: string;
    value: string | number;
    icon?: LucideIcon;
    className?: string;
    labelClassName?: string;
    valueClassName?: string;
    highlight?: 'warning' | 'danger';
    compact?: boolean;
};

export function KpiCard({
    label,
    value,
    icon: Icon,
    className,
    labelClassName,
    valueClassName,
    highlight,
    compact,
}: Props) {
    return (
        <Card className={cn('py-0', className)}>
            <CardContent
                className={cn(
                    'flex items-start justify-between gap-3',
                    compact ? 'p-4' : 'p-6',
                )}
            >
                <div className="min-w-0 space-y-1">
                    <p
                        className={cn(
                            'text-sm text-muted-foreground',
                            labelClassName,
                        )}
                    >
                        {label}
                    </p>
                    <p
                        className={cn(
                            'font-bold tracking-tight',
                            valueClassName ?? 'text-2xl',
                            highlight === 'danger' && 'text-destructive',
                            highlight === 'warning' && 'text-amber-500',
                        )}
                    >
                        {value}
                    </p>
                </div>
                {Icon && (
                    <div className="rounded-md bg-muted p-2">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
