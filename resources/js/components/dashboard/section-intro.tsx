import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type Props = {
    icon: LucideIcon;
    label: string;
    description: string;
    statusLabel: string;
    statusValue: string;
    tone?: 'default' | 'warning' | 'danger' | 'success';
};

export function SectionIntro({
    icon: Icon,
    label,
    description,
    statusLabel,
    statusValue,
    tone = 'default',
}: Props) {
    return (
        <Card className="overflow-hidden border-primary/20 bg-primary/[0.035] py-0 shadow-none">
            <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Icon className="size-4 text-primary" />
                        <p className="text-sm font-semibold text-primary">
                            {label}
                        </p>
                    </div>
                    <p className="max-w-2xl text-sm text-muted-foreground">
                        {description}
                    </p>
                </div>
                <div className="flex shrink-0 items-center gap-3 rounded-lg border bg-background px-4 py-3">
                    <div
                        className={cn(
                            'size-2 rounded-full',
                            tone === 'default' && 'bg-primary',
                            tone === 'warning' && 'bg-amber-500',
                            tone === 'danger' && 'bg-destructive',
                            tone === 'success' && 'bg-emerald-500',
                        )}
                    />
                    <div>
                        <p className="text-xs text-muted-foreground">
                            {statusLabel}
                        </p>
                        <p className="text-sm font-semibold">{statusValue}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
