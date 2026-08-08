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
import { print as printRoute } from '@/routes/quotations/bom';

type PrintBomDialogProps = {
    quotation: { uuid: string };
    groups: { id: number; name: string }[];
    subgroups: { id: number; name: string }[];
    hasUngroupedItems: boolean;
};

export function PrintBomDialog({
    quotation,
    groups,
    subgroups,
    hasUngroupedItems,
}: PrintBomDialogProps) {
    const [open, setOpen] = useState(false);
    const [selectedGroups, setSelectedGroups] = useState<
        Record<number, boolean>
    >({});
    const [selectedSubgroups, setSelectedSubgroups] = useState<
        Record<number, boolean>
    >({});
    const [includeUngrouped, setIncludeUngrouped] = useState(true);

    function handleOpenChange(nextOpen: boolean): void {
        setOpen(nextOpen);

        if (nextOpen) {
            setSelectedGroups(
                Object.fromEntries(groups.map((g) => [g.id, true])),
            );
            setSelectedSubgroups(
                Object.fromEntries(subgroups.map((s) => [s.id, true])),
            );
            setIncludeUngrouped(true);
        }
    }

    function toggleGroup(id: number): void {
        setSelectedGroups((current) => ({ ...current, [id]: !current[id] }));
    }

    function toggleSubgroup(id: number): void {
        setSelectedSubgroups((current) => ({ ...current, [id]: !current[id] }));
    }

    const selectedGroupIds = groups
        .filter((g) => selectedGroups[g.id])
        .map((g) => g.id);
    const selectedSubgroupIds = subgroups
        .filter((s) => selectedSubgroups[s.id])
        .map((s) => s.id);
    const includeUngroupedItems = hasUngroupedItems && includeUngrouped;
    const isPartial =
        selectedGroupIds.length < groups.length ||
        selectedSubgroupIds.length < subgroups.length ||
        (hasUngroupedItems && !includeUngrouped);
    const nothingSelected =
        selectedGroupIds.length === 0 &&
        selectedSubgroupIds.length === 0 &&
        !includeUngroupedItems;

    function openPdf(download: boolean): void {
        const url = printRoute.url(quotation, {
            query: {
                group_ids: selectedGroupIds,
                subgroup_ids: selectedSubgroupIds,
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
                    <DialogTitle>Print Bill of Materials</DialogTitle>
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

                    {subgroups.map((subgroup) => (
                        <div
                            key={subgroup.id}
                            className="flex items-center gap-2"
                        >
                            <Checkbox
                                id={`print-subgroup-${subgroup.id}`}
                                checked={!!selectedSubgroups[subgroup.id]}
                                onCheckedChange={() =>
                                    toggleSubgroup(subgroup.id)
                                }
                            />
                            <Label htmlFor={`print-subgroup-${subgroup.id}`}>
                                {subgroup.name}
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
                                Ungrouped materials
                            </Label>
                        </div>
                    )}
                </div>

                {isPartial && (
                    <p className="text-sm text-muted-foreground">
                        Only the checked sections will be printed.
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
