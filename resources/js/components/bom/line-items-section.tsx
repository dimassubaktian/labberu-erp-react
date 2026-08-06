import InputError from '@/components/input-error';
import {
    Table,
    TableBody,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import type { LineItem } from './types';
import { BomLineItemForm } from './line-item-form';
import { BomLineItemRow } from './line-item-row';

type Props = {
    idPrefix: string;
    namePrefix: string;
    errorPrefix: string;
    items: LineItem[];
    draft: LineItem;
    editingItemIndex: number | null;
    errors: Partial<Record<string, string>>;
    emptyMessage: string;
    onDraftChange: (changes: Partial<LineItem>) => void;
    onSubmitItem: () => void;
    onCancelItemEdit: () => void;
    onEditItem: (itemIndex: number) => void;
    onRemoveItem: (itemIndex: number) => void;
};

export function BomLineItemsSection({
    idPrefix,
    namePrefix,
    errorPrefix,
    items,
    draft,
    editingItemIndex,
    errors,
    emptyMessage,
    onDraftChange,
    onSubmitItem,
    onCancelItemEdit,
    onEditItem,
    onRemoveItem,
}: Props) {
    return (
        <div className="space-y-4">
            <InputError message={errors[errorPrefix]} />

            <BomLineItemForm
                idPrefix={idPrefix}
                draft={draft}
                errors={errors}
                errorPrefix={
                    editingItemIndex !== null
                        ? `${errorPrefix}.${editingItemIndex}`
                        : undefined
                }
                isEditing={editingItemIndex !== null}
                onDraftChange={onDraftChange}
                onSubmit={onSubmitItem}
                onCancel={onCancelItemEdit}
            />

            {items.length === 0 && (
                <p className="text-sm text-muted-foreground">{emptyMessage}</p>
            )}

            {items.length > 0 && (
                <div className="overflow-hidden rounded-lg border border-border/50">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Product</TableHead>
                                <TableHead className="w-24">Qty</TableHead>
                                <TableHead className="w-28">Unit cost</TableHead>
                                <TableHead className="w-24">Discount</TableHead>
                                <TableHead className="w-28 text-right">Total cost</TableHead>
                                <TableHead className="w-16" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((item, itemIndex) => (
                                <BomLineItemRow
                                    key={itemIndex}
                                    namePrefix={`${namePrefix}[${itemIndex}]`}
                                    errorPrefix={`${errorPrefix}.${itemIndex}`}
                                    item={item}
                                    errors={errors}
                                    isEditing={editingItemIndex === itemIndex}
                                    onEdit={() => onEditItem(itemIndex)}
                                    onRemove={() => onRemoveItem(itemIndex)}
                                />
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
}
