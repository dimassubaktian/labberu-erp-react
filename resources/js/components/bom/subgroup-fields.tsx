import { Trash2 } from 'lucide-react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatNumber } from '@/lib/utils';
import { BomLineItemsSection } from './line-items-section';
import type { LineItem, SubgroupState } from './types';
import { calculateItemsSubtotal } from './utils';

type Props = {
    namePrefix: string;
    errorPrefix: string;
    subgroup: SubgroupState;
    errors: Partial<Record<string, string>>;
    currentLocation: string;
    destinations: { value: string; label: string }[];
    onNameChange: (name: string) => void;
    onDraftChange: (changes: Partial<LineItem>) => void;
    onSubmitItem: () => void;
    onCancelItemEdit: () => void;
    onEditItem: (itemIndex: number) => void;
    onRemoveItem: (itemIndex: number) => void;
    onMoveItem: (itemIndex: number, destination: string) => void;
    onRemove: () => void;
};

export function BomSubgroupFields({
    namePrefix,
    errorPrefix,
    subgroup,
    errors,
    currentLocation,
    destinations,
    onNameChange,
    onDraftChange,
    onSubmitItem,
    onCancelItemEdit,
    onEditItem,
    onRemoveItem,
    onMoveItem,
    onRemove,
}: Props) {
    const subtotal = calculateItemsSubtotal(subgroup.items);
    const fieldId = namePrefix.replace(/[[\].]/g, '-');

    return (
        <div className="space-y-4 rounded-lg border border-border/50 p-4">
            <div className="flex items-start justify-between gap-2">
                <div className="grid flex-1 gap-2">
                    <Label htmlFor={`${fieldId}-name`}>Phase name</Label>
                    <Input
                        id={`${fieldId}-name`}
                        name={`${namePrefix}[name]`}
                        placeholder="e.g. Q1, Q2"
                        value={subgroup.name}
                        onChange={(e) => onNameChange(e.target.value)}
                    />
                    <InputError message={errors[`${errorPrefix}.name`]} />
                </div>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="mt-6"
                    onClick={onRemove}
                >
                    <Trash2 className="text-destructive dark:text-destructive-foreground" />
                </Button>
            </div>
            <div className="space-y-4">
                <Label>Materials</Label>

                <BomLineItemsSection
                    idPrefix={`${fieldId}-item`}
                    namePrefix={`${namePrefix}[items]`}
                    errorPrefix={`${errorPrefix}.items`}
                    items={subgroup.items}
                    draft={subgroup.draft}
                    editingItemIndex={subgroup.editingItemIndex}
                    errors={errors}
                    emptyMessage="No materials in this phase yet. Add one above."
                    currentLocation={currentLocation}
                    destinations={destinations}
                    onDraftChange={onDraftChange}
                    onSubmitItem={onSubmitItem}
                    onCancelItemEdit={onCancelItemEdit}
                    onEditItem={onEditItem}
                    onRemoveItem={onRemoveItem}
                    onMoveItem={onMoveItem}
                />

                <dl className="flex justify-between border-t border-border pt-4 font-semibold">
                    <dt>Phase subtotal</dt>
                    <dd>{formatNumber(subtotal)}</dd>
                </dl>
            </div>
        </div>
    );
}
