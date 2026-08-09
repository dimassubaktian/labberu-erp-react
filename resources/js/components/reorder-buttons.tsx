import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Props = {
    label: string;
    canMoveUp: boolean;
    canMoveDown: boolean;
    onMoveUp: () => void;
    onMoveDown: () => void;
};

export function ReorderButtons({
    label,
    canMoveUp,
    canMoveDown,
    onMoveUp,
    onMoveDown,
}: Props) {
    return (
        <div className="flex flex-col">
            <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-5 w-6"
                disabled={!canMoveUp}
                aria-label={`Move ${label} up`}
                onClick={onMoveUp}
            >
                <ChevronUp className="size-3.5" />
            </Button>
            <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-5 w-6"
                disabled={!canMoveDown}
                aria-label={`Move ${label} down`}
                onClick={onMoveDown}
            >
                <ChevronDown className="size-3.5" />
            </Button>
        </div>
    );
}
