import { Download, Eye, Printer } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { print as printRoute } from '@/routes/quotations';

type PrintQuotationDialogProps = {
    quotation: { uuid: string };
    groups: { id: number; name: string }[];
    hasUngroupedItems: boolean;
};

export function PrintQuotationDialog({
    quotation,
    groups,
    hasUngroupedItems,
}: PrintQuotationDialogProps) {
    const [open, setOpen] = useState(false);
    const [selectedGroups, setSelectedGroups] = useState<Record<number, boolean>>({});
    const [includeUngrouped, setIncludeUngrouped] = useState(true);

    function handleOpenChange(nextOpen: boolean): void {
        setOpen(nextOpen);

        if (nextOpen) {
            setSelectedGroups(Object.fromEntries(groups.map((g) => [g.id, true])));
            setIncludeUngrouped(true);
        }
    }

    function toggleGroup(id: number): void {
        setSelectedGroups((current) => ({ ...current, [id]: !current[id] }));
    }

    const selectedGroupIds = groups
        .filter((g) => selectedGroups[g.id])
        .map((g) => g.id);
    const includeUngroupedItems = hasUngroupedItems && includeUngrouped;
    const isPartial =
        selectedGroupIds.length < groups.length ||
        (hasUngroupedItems && !includeUngrouped);
    const nothingSelected = selectedGroupIds.length === 0 && !includeUngroupedItems;

    function openPdf(download: boolean): void {
        const url = printRoute.url(quotation, {
            query: {
                group_ids: selectedGroupIds,
                include_ungrouped: includeUngrouped,
                ...(download ? { download: true } : {}),
            },
        });
        window.open(url, '_blank', 'noopener,noreferrer');
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                    <Printer />
                    Print
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Print quotation</DialogTitle>
                    <DialogDescription>
                        Choose which sections to include in the PDF.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-2">
                    {groups.map((group) => (
                        <div key={group.id} className="flex items-center gap-2">
                            <Checkbox
                                id={`print-group-${group.id}`}
                                checked={!!selectedGroups[group.id]}
                                onCheckedChange={() => toggleGroup(group.id)}
                            />
                            <Label htmlFor={`print-group-${group.id}`}>
                                {group.name}
                            </Label>
                        </div>
                    ))}

                    {hasUngroupedItems && (
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="print-ungrouped-items"
                                checked={includeUngrouped}
                                onCheckedChange={(checked) =>
                                    setIncludeUngrouped(checked === true)
                                }
                            />
                            <Label htmlFor="print-ungrouped-items">
                                Ungrouped items
                            </Label>
                        </div>
                    )}
                </div>

                {isPartial && (
                    <p className="text-sm text-muted-foreground">
                        Only the checked sections will be printed. The
                        overall discount and tax won&apos;t be recalculated
                        for this partial selection — the PDF will show a
                        plain sum of the selected sections instead of the
                        quotation&apos;s official grand total.
                    </p>
                )}

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        disabled={nothingSelected}
                        onClick={() => openPdf(false)}
                    >
                        <Eye />
                        Preview PDF
                    </Button>
                    <Button
                        type="button"
                        disabled={nothingSelected}
                        onClick={() => openPdf(true)}
                    >
                        <Download />
                        Download PDF
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
