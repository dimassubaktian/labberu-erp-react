import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type Props = {
    label: string;
    value: string | number;
    icon?: LucideIcon;
    className?: string;
    highlight?: 'warning' | 'danger';
};

export function KpiCard({ label, value, icon: Icon, className, highlight }: Props) {
    return (
        <Card className={cn('', className)}>
            <CardContent className="flex items-start justify-between p-6">
                <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p
                        className={cn(
                            'text-2xl font-bold tracking-tight',
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
