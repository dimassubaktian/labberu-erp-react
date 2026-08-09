import { Form, Head, Link, router, setLayoutProps } from '@inertiajs/react';
import { Import, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { BomLineItemsSection } from '@/components/bom/line-items-section';
import { BomSubgroupFields } from '@/components/bom/subgroup-fields';
import type {
    BomGroupProp,
    BomLocationKey,
    GroupState,
    ImportFromBom,
    LineItem,
    SubgroupState,
} from '@/components/bom/types';
import {
    bomLocationsEqual,
    calculateItemsSubtotal,
    decodeBomLocation,
    emptyGroup,
    emptyItem,
    emptySubgroup,
    listBomDestinations,
    toLineItem,
    toSubgroupState,
} from '@/components/bom/utils';
import Heading from '@/components/heading';
import { ImportBomStructureDialog } from '@/components/import-bom-structure-dialog';
import InputError from '@/components/input-error';
import { ReorderButtons } from '@/components/reorder-buttons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { formatNumber, swapAdjacent } from '@/lib/utils';
import { index, show as showQuotation } from '@/routes/quotations';
import { create, store } from '@/routes/quotations/bom';

type QuotationOption = {
    id: number;
    uuid: string;
    quotation_code: string;
};

type Props = {
    quotation: QuotationOption;
    importFrom?: ImportFromBom | null;
};

export default function BomsCreate({ quotation, importFrom }: Props) {
    setLayoutProps({
        breadcrumbs: [
            { title: 'Quotations', href: index() },
            { title: quotation.quotation_code, href: showQuotation(quotation) },
            { title: 'Create Bill of Materials', href: create(quotation) },
        ],
    });

    const [dialogOpen, setDialogOpen] = useState(false);
    const [items, setItems] = useState<LineItem[]>(
        importFrom ? importFrom.items.map(toLineItem) : [],
    );
    const [itemDraft, setItemDraft] = useState<LineItem>(emptyItem());
    const [editingItemIndex, setEditingItemIndex] = useState<number | null>(
        null,
    );
    const [subgroups, setSubgroups] = useState<SubgroupState[]>(
        importFrom ? importFrom.subgroups.map(toSubgroupState) : [],
    );
    const [groups, setGroups] = useState<GroupState[]>(
        importFrom
            ? importFrom.groups.map((group: BomGroupProp) => ({
                  name: group.name,
                  items: group.items.map(toLineItem),
                  draft: emptyItem(),
                  editingItemIndex: null,
                  subgroups: group.subgroups.map(toSubgroupState),
              }))
            : [],
    );
    const [overheadPercentage, setOverheadPercentage] = useState(
        importFrom?.overhead_percentage ?? '',
    );
    const [sellingPercentage, setSellingPercentage] = useState(
        importFrom?.selling_percentage ?? '',
    );
    const [remarks, setRemarks] = useState(importFrom?.remarks ?? '');

    function updateItemDraft(changes: Partial<LineItem>): void {
        setItemDraft((current) => ({ ...current, ...changes }));
    }

    function submitItemDraft(): void {
        if (editingItemIndex !== null) {
            setItems((current) =>
                current.map((item, i) =>
                    i === editingItemIndex ? itemDraft : item,
                ),
            );
        } else {
            setItems((current) => [...current, itemDraft]);
        }

        setItemDraft(emptyItem());
        setEditingItemIndex(null);
    }

    function editItem(index: number): void {
        setItemDraft(items[index]);
        setEditingItemIndex(index);
    }

    function cancelItemEdit(): void {
        setItemDraft(emptyItem());
        setEditingItemIndex(null);
    }

    function removeItem(index: number): void {
        setItems((current) => current.filter((_, i) => i !== index));

        if (editingItemIndex === index) {
            setItemDraft(emptyItem());
            setEditingItemIndex(null);
        } else if (editingItemIndex !== null && editingItemIndex > index) {
            setEditingItemIndex(editingItemIndex - 1);
        }
    }

    function addSubgroup(): void {
        setSubgroups((current) => [...current, emptySubgroup()]);
    }

    function removeSubgroup(subgroupIndex: number): void {
        setSubgroups((current) =>
            current.filter((_, i) => i !== subgroupIndex),
        );
    }

    function moveSubgroup(
        subgroupIndex: number,
        direction: 'up' | 'down',
    ): void {
        setSubgroups((current) =>
            swapAdjacent(current, subgroupIndex, direction),
        );
    }

    function updateSubgroupName(subgroupIndex: number, name: string): void {
        setSubgroups((current) =>
            current.map((subgroup, i) =>
                i === subgroupIndex ? { ...subgroup, name } : subgroup,
            ),
        );
    }

    function updateSubgroupDraft(
        subgroupIndex: number,
        changes: Partial<LineItem>,
    ): void {
        setSubgroups((current) =>
            current.map((subgroup, i) =>
                i === subgroupIndex
                    ? { ...subgroup, draft: { ...subgroup.draft, ...changes } }
                    : subgroup,
            ),
        );
    }

    function submitSubgroupItemDraft(subgroupIndex: number): void {
        setSubgroups((current) =>
            current.map((subgroup, i) => {
                if (i !== subgroupIndex) {
                    return subgroup;
                }

                const items =
                    subgroup.editingItemIndex !== null
                        ? subgroup.items.map((item, j) =>
                              j === subgroup.editingItemIndex
                                  ? subgroup.draft
                                  : item,
                          )
                        : [...subgroup.items, subgroup.draft];

                return {
                    ...subgroup,
                    items,
                    draft: emptyItem(),
                    editingItemIndex: null,
                };
            }),
        );
    }

    function editSubgroupItem(subgroupIndex: number, itemIndex: number): void {
        setSubgroups((current) =>
            current.map((subgroup, i) =>
                i === subgroupIndex
                    ? {
                          ...subgroup,
                          draft: subgroup.items[itemIndex],
                          editingItemIndex: itemIndex,
                      }
                    : subgroup,
            ),
        );
    }

    function cancelSubgroupItemEdit(subgroupIndex: number): void {
        setSubgroups((current) =>
            current.map((subgroup, i) =>
                i === subgroupIndex
                    ? {
                          ...subgroup,
                          draft: emptyItem(),
                          editingItemIndex: null,
                      }
                    : subgroup,
            ),
        );
    }

    function removeSubgroupItem(
        subgroupIndex: number,
        itemIndex: number,
    ): void {
        setSubgroups((current) =>
            current.map((subgroup, i) => {
                if (i !== subgroupIndex) {
                    return subgroup;
                }

                const items = subgroup.items.filter((_, j) => j !== itemIndex);

                if (subgroup.editingItemIndex === null) {
                    return { ...subgroup, items };
                }

                if (subgroup.editingItemIndex === itemIndex) {
                    return {
                        ...subgroup,
                        items,
                        draft: emptyItem(),
                        editingItemIndex: null,
                    };
                }

                const newEditingIndex =
                    subgroup.editingItemIndex > itemIndex
                        ? subgroup.editingItemIndex - 1
                        : subgroup.editingItemIndex;

                return {
                    ...subgroup,
                    items,
                    editingItemIndex: newEditingIndex,
                };
            }),
        );
    }

    function addGroup(): void {
        setGroups((current) => [...current, emptyGroup()]);
    }

    function removeGroup(groupIndex: number): void {
        setGroups((current) => current.filter((_, i) => i !== groupIndex));
    }

    function moveGroup(groupIndex: number, direction: 'up' | 'down'): void {
        setGroups((current) => swapAdjacent(current, groupIndex, direction));
    }

    function updateGroup(
        groupIndex: number,
        changes: Partial<GroupState>,
    ): void {
        setGroups((current) =>
            current.map((group, i) =>
                i === groupIndex ? { ...group, ...changes } : group,
            ),
        );
    }

    function updateGroupDraft(
        groupIndex: number,
        changes: Partial<LineItem>,
    ): void {
        setGroups((current) =>
            current.map((group, i) =>
                i === groupIndex
                    ? { ...group, draft: { ...group.draft, ...changes } }
                    : group,
            ),
        );
    }

    function submitGroupItemDraft(groupIndex: number): void {
        setGroups((current) =>
            current.map((group, i) => {
                if (i !== groupIndex) {
                    return group;
                }

                const items =
                    group.editingItemIndex !== null
                        ? group.items.map((item, j) =>
                              j === group.editingItemIndex ? group.draft : item,
                          )
                        : [...group.items, group.draft];

                return {
                    ...group,
                    items,
                    draft: emptyItem(),
                    editingItemIndex: null,
                };
            }),
        );
    }

    function editGroupItem(groupIndex: number, itemIndex: number): void {
        setGroups((current) =>
            current.map((group, i) =>
                i === groupIndex
                    ? {
                          ...group,
                          draft: group.items[itemIndex],
                          editingItemIndex: itemIndex,
                      }
                    : group,
            ),
        );
    }

    function cancelGroupItemEdit(groupIndex: number): void {
        setGroups((current) =>
            current.map((group, i) =>
                i === groupIndex
                    ? { ...group, draft: emptyItem(), editingItemIndex: null }
                    : group,
            ),
        );
    }

    function removeGroupItem(groupIndex: number, itemIndex: number): void {
        setGroups((current) =>
            current.map((group, i) => {
                if (i !== groupIndex) {
                    return group;
                }

                const items = group.items.filter((_, j) => j !== itemIndex);

                if (group.editingItemIndex === null) {
                    return { ...group, items };
                }

                if (group.editingItemIndex === itemIndex) {
                    return {
                        ...group,
                        items,
                        draft: emptyItem(),
                        editingItemIndex: null,
                    };
                }

                const newEditingIndex =
                    group.editingItemIndex > itemIndex
                        ? group.editingItemIndex - 1
                        : group.editingItemIndex;

                return { ...group, items, editingItemIndex: newEditingIndex };
            }),
        );
    }

    function addGroupSubgroup(groupIndex: number): void {
        setGroups((current) =>
            current.map((group, i) =>
                i === groupIndex
                    ? {
                          ...group,
                          subgroups: [...group.subgroups, emptySubgroup()],
                      }
                    : group,
            ),
        );
    }

    function removeGroupSubgroup(
        groupIndex: number,
        subgroupIndex: number,
    ): void {
        setGroups((current) =>
            current.map((group, i) =>
                i === groupIndex
                    ? {
                          ...group,
                          subgroups: group.subgroups.filter(
                              (_, j) => j !== subgroupIndex,
                          ),
                      }
                    : group,
            ),
        );
    }

    function moveGroupSubgroup(
        groupIndex: number,
        subgroupIndex: number,
        direction: 'up' | 'down',
    ): void {
        setGroups((current) =>
            current.map((group, i) =>
                i === groupIndex
                    ? {
                          ...group,
                          subgroups: swapAdjacent(
                              group.subgroups,
                              subgroupIndex,
                              direction,
                          ),
                      }
                    : group,
            ),
        );
    }

    function updateGroupSubgroupName(
        groupIndex: number,
        subgroupIndex: number,
        name: string,
    ): void {
        setGroups((current) =>
            current.map((group, i) =>
                i === groupIndex
                    ? {
                          ...group,
                          subgroups: group.subgroups.map((subgroup, j) =>
                              j === subgroupIndex
                                  ? { ...subgroup, name }
                                  : subgroup,
                          ),
                      }
                    : group,
            ),
        );
    }

    function updateGroupSubgroupDraft(
        groupIndex: number,
        subgroupIndex: number,
        changes: Partial<LineItem>,
    ): void {
        setGroups((current) =>
            current.map((group, i) =>
                i === groupIndex
                    ? {
                          ...group,
                          subgroups: group.subgroups.map((subgroup, j) =>
                              j === subgroupIndex
                                  ? {
                                        ...subgroup,
                                        draft: {
                                            ...subgroup.draft,
                                            ...changes,
                                        },
                                    }
                                  : subgroup,
                          ),
                      }
                    : group,
            ),
        );
    }

    function submitGroupSubgroupItemDraft(
        groupIndex: number,
        subgroupIndex: number,
    ): void {
        setGroups((current) =>
            current.map((group, i) => {
                if (i !== groupIndex) {
                    return group;
                }

                return {
                    ...group,
                    subgroups: group.subgroups.map((subgroup, j) => {
                        if (j !== subgroupIndex) {
                            return subgroup;
                        }

                        const items =
                            subgroup.editingItemIndex !== null
                                ? subgroup.items.map((item, k) =>
                                      k === subgroup.editingItemIndex
                                          ? subgroup.draft
                                          : item,
                                  )
                                : [...subgroup.items, subgroup.draft];

                        return {
                            ...subgroup,
                            items,
                            draft: emptyItem(),
                            editingItemIndex: null,
                        };
                    }),
                };
            }),
        );
    }

    function editGroupSubgroupItem(
        groupIndex: number,
        subgroupIndex: number,
        itemIndex: number,
    ): void {
        setGroups((current) =>
            current.map((group, i) =>
                i === groupIndex
                    ? {
                          ...group,
                          subgroups: group.subgroups.map((subgroup, j) =>
                              j === subgroupIndex
                                  ? {
                                        ...subgroup,
                                        draft: subgroup.items[itemIndex],
                                        editingItemIndex: itemIndex,
                                    }
                                  : subgroup,
                          ),
                      }
                    : group,
            ),
        );
    }

    function cancelGroupSubgroupItemEdit(
        groupIndex: number,
        subgroupIndex: number,
    ): void {
        setGroups((current) =>
            current.map((group, i) =>
                i === groupIndex
                    ? {
                          ...group,
                          subgroups: group.subgroups.map((subgroup, j) =>
                              j === subgroupIndex
                                  ? {
                                        ...subgroup,
                                        draft: emptyItem(),
                                        editingItemIndex: null,
                                    }
                                  : subgroup,
                          ),
                      }
                    : group,
            ),
        );
    }

    function removeGroupSubgroupItem(
        groupIndex: number,
        subgroupIndex: number,
        itemIndex: number,
    ): void {
        setGroups((current) =>
            current.map((group, i) => {
                if (i !== groupIndex) {
                    return group;
                }

                return {
                    ...group,
                    subgroups: group.subgroups.map((subgroup, j) => {
                        if (j !== subgroupIndex) {
                            return subgroup;
                        }

                        const items = subgroup.items.filter(
                            (_, k) => k !== itemIndex,
                        );

                        if (subgroup.editingItemIndex === null) {
                            return { ...subgroup, items };
                        }

                        if (subgroup.editingItemIndex === itemIndex) {
                            return {
                                ...subgroup,
                                items,
                                draft: emptyItem(),
                                editingItemIndex: null,
                            };
                        }

                        const newEditingIndex =
                            subgroup.editingItemIndex > itemIndex
                                ? subgroup.editingItemIndex - 1
                                : subgroup.editingItemIndex;

                        return {
                            ...subgroup,
                            items,
                            editingItemIndex: newEditingIndex,
                        };
                    }),
                };
            }),
        );
    }

    function addItemAt(location: BomLocationKey, item: LineItem): void {
        switch (location.type) {
            case 'ungrouped':
                setItems((current) => [...current, item]);

                return;
            case 'subgroup':
                setSubgroups((current) =>
                    current.map((subgroup, i) =>
                        i === location.subgroupIndex
                            ? { ...subgroup, items: [...subgroup.items, item] }
                            : subgroup,
                    ),
                );

                return;
            case 'group':
                setGroups((current) =>
                    current.map((group, i) =>
                        i === location.groupIndex
                            ? { ...group, items: [...group.items, item] }
                            : group,
                    ),
                );

                return;
            case 'group-subgroup':
                setGroups((current) =>
                    current.map((group, i) => {
                        if (i !== location.groupIndex) {
                            return group;
                        }

                        return {
                            ...group,
                            subgroups: group.subgroups.map((subgroup, j) =>
                                j === location.subgroupIndex
                                    ? {
                                          ...subgroup,
                                          items: [...subgroup.items, item],
                                      }
                                    : subgroup,
                            ),
                        };
                    }),
                );

                return;
        }
    }

    function removeItemAt(location: BomLocationKey, itemIndex: number): void {
        switch (location.type) {
            case 'ungrouped':
                removeItem(itemIndex);

                return;
            case 'subgroup':
                removeSubgroupItem(location.subgroupIndex, itemIndex);

                return;
            case 'group':
                removeGroupItem(location.groupIndex, itemIndex);

                return;
            case 'group-subgroup':
                removeGroupSubgroupItem(
                    location.groupIndex,
                    location.subgroupIndex,
                    itemIndex,
                );

                return;
        }
    }

    function moveItem(
        from: BomLocationKey,
        itemIndex: number,
        item: LineItem,
        destinationValue: string,
    ): void {
        const to = decodeBomLocation(destinationValue);

        if (bomLocationsEqual(from, to)) {
            return;
        }

        removeItemAt(from, itemIndex);
        addItemAt(to, item);
    }

    const destinations = listBomDestinations(groups, subgroups);

    const ungroupedSubtotal = calculateItemsSubtotal(items);
    const topSubgroupSubtotals = subgroups.map((subgroup) =>
        calculateItemsSubtotal(subgroup.items),
    );
    const topSubgroupsTotal = topSubgroupSubtotals.reduce(
        (sum, subtotal) => sum + subtotal,
        0,
    );
    const groupTotals = groups.map((group) => {
        const directSubtotal = calculateItemsSubtotal(group.items);
        const subgroupSubtotals = group.subgroups.map((subgroup) =>
            calculateItemsSubtotal(subgroup.items),
        );
        const subgroupsTotal = subgroupSubtotals.reduce(
            (sum, subtotal) => sum + subtotal,
            0,
        );

        return { subgroupSubtotals, total: directSubtotal + subgroupsTotal };
    });
    const groupsTotal = groupTotals.reduce(
        (sum, group) => sum + group.total,
        0,
    );
    const mainCost = ungroupedSubtotal + topSubgroupsTotal + groupsTotal;
    const overheadCost =
        overheadPercentage !== ''
            ? (mainCost * Number(overheadPercentage)) / 100
            : 0;
    const totalCost = mainCost + overheadCost;
    const sellingCost =
        sellingPercentage !== ''
            ? (totalCost * Number(sellingPercentage)) / 100
            : totalCost;

    return (
        <>
            <Head
                title={`Create Bill of Materials — ${quotation.quotation_code}`}
            />

            <div className="mx-auto w-full max-w-5xl space-y-6 p-4">
                <div className="flex items-start justify-between gap-4">
                    <Heading
                        title="Create Bill of Materials"
                        description={`For quotation ${quotation.quotation_code}`}
                    />
                    <Button type="button" onClick={() => setDialogOpen(true)}>
                        <Import />
                        Import from existing BOM
                    </Button>
                </div>

                <ImportBomStructureDialog
                    open={dialogOpen}
                    onOpenChange={setDialogOpen}
                    onSelect={(uuid) =>
                        router.visit(
                            `${create(quotation).url}?from=${encodeURIComponent(uuid)}`,
                        )
                    }
                />

                <Form noValidate {...store.form(quotation)} className="space-y-6">
                    {({ processing, errors }) => (
                        <>
                            {groups.map((group, groupIndex) => {
                                const groupNamePrefix = `groups[${groupIndex}]`;
                                const groupErrorPrefix = `groups.${groupIndex}`;
                                const { total: groupSubtotal } =
                                    groupTotals[groupIndex];

                                return (
                                    <div
                                        key={groupIndex}
                                        className="space-y-4 rounded-lg border border-border/50 p-4"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="grid flex-1 gap-2">
                                                <Label
                                                    htmlFor={`group-${groupIndex}-name`}
                                                >
                                                    Group name
                                                </Label>
                                                <Input
                                                    id={`group-${groupIndex}-name`}
                                                    name={`${groupNamePrefix}[name]`}
                                                    placeholder="e.g. Control Panel, Sensor Assembly"
                                                    value={group.name}
                                                    onChange={(e) =>
                                                        updateGroup(
                                                            groupIndex,
                                                            {
                                                                name: e.target
                                                                    .value,
                                                            },
                                                        )
                                                    }
                                                />
                                                <InputError
                                                    message={
                                                        errors[
                                                            `${groupErrorPrefix}.name`
                                                        ]
                                                    }
                                                />
                                            </div>
                                            <div className="mt-6 flex items-center gap-1">
                                                <ReorderButtons
                                                    label="group"
                                                    canMoveUp={groupIndex > 0}
                                                    canMoveDown={
                                                        groupIndex <
                                                        groups.length - 1
                                                    }
                                                    onMoveUp={() =>
                                                        moveGroup(
                                                            groupIndex,
                                                            'up',
                                                        )
                                                    }
                                                    onMoveDown={() =>
                                                        moveGroup(
                                                            groupIndex,
                                                            'down',
                                                        )
                                                    }
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() =>
                                                        removeGroup(groupIndex)
                                                    }
                                                >
                                                    <Trash2 className="text-destructive dark:text-destructive-foreground" />
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="space-y-4">
                                                <Label>
                                                    Ungrouped materials
                                                </Label>
                                                <BomLineItemsSection
                                                    idPrefix={`group-${groupIndex}-item`}
                                                    namePrefix={`${groupNamePrefix}[items]`}
                                                    errorPrefix={`${groupErrorPrefix}.items`}
                                                    items={group.items}
                                                    draft={group.draft}
                                                    editingItemIndex={
                                                        group.editingItemIndex
                                                    }
                                                    errors={errors}
                                                    emptyMessage="No materials directly in this group. Add one above, or put materials inside a phase below."
                                                    currentLocation={`group:${groupIndex}`}
                                                    destinations={destinations}
                                                    onDraftChange={(changes) =>
                                                        updateGroupDraft(
                                                            groupIndex,
                                                            changes,
                                                        )
                                                    }
                                                    onSubmitItem={() =>
                                                        submitGroupItemDraft(
                                                            groupIndex,
                                                        )
                                                    }
                                                    onCancelItemEdit={() =>
                                                        cancelGroupItemEdit(
                                                            groupIndex,
                                                        )
                                                    }
                                                    onEditItem={(itemIndex) =>
                                                        editGroupItem(
                                                            groupIndex,
                                                            itemIndex,
                                                        )
                                                    }
                                                    onRemoveItem={(itemIndex) =>
                                                        removeGroupItem(
                                                            groupIndex,
                                                            itemIndex,
                                                        )
                                                    }
                                                    onMoveItem={(
                                                        itemIndex,
                                                        destination,
                                                    ) =>
                                                        moveItem(
                                                            {
                                                                type: 'group',
                                                                groupIndex,
                                                            },
                                                            itemIndex,
                                                            group.items[
                                                                itemIndex
                                                            ],
                                                            destination,
                                                        )
                                                    }
                                                />
                                            </div>

                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <Label>Phases</Label>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        onClick={() =>
                                                            addGroupSubgroup(
                                                                groupIndex,
                                                            )
                                                        }
                                                    >
                                                        <Plus />
                                                        Add phase
                                                    </Button>
                                                </div>

                                                {group.subgroups.map(
                                                    (
                                                        subgroup,
                                                        subgroupIndex,
                                                    ) => (
                                                        <BomSubgroupFields
                                                            key={subgroupIndex}
                                                            namePrefix={`${groupNamePrefix}[subgroups][${subgroupIndex}]`}
                                                            errorPrefix={`${groupErrorPrefix}.subgroups.${subgroupIndex}`}
                                                            subgroup={subgroup}
                                                            errors={errors}
                                                            currentLocation={`group-subgroup:${groupIndex}:${subgroupIndex}`}
                                                            destinations={
                                                                destinations
                                                            }
                                                            onNameChange={(
                                                                name,
                                                            ) =>
                                                                updateGroupSubgroupName(
                                                                    groupIndex,
                                                                    subgroupIndex,
                                                                    name,
                                                                )
                                                            }
                                                            onDraftChange={(
                                                                changes,
                                                            ) =>
                                                                updateGroupSubgroupDraft(
                                                                    groupIndex,
                                                                    subgroupIndex,
                                                                    changes,
                                                                )
                                                            }
                                                            onSubmitItem={() =>
                                                                submitGroupSubgroupItemDraft(
                                                                    groupIndex,
                                                                    subgroupIndex,
                                                                )
                                                            }
                                                            onCancelItemEdit={() =>
                                                                cancelGroupSubgroupItemEdit(
                                                                    groupIndex,
                                                                    subgroupIndex,
                                                                )
                                                            }
                                                            onEditItem={(
                                                                itemIndex,
                                                            ) =>
                                                                editGroupSubgroupItem(
                                                                    groupIndex,
                                                                    subgroupIndex,
                                                                    itemIndex,
                                                                )
                                                            }
                                                            onRemoveItem={(
                                                                itemIndex,
                                                            ) =>
                                                                removeGroupSubgroupItem(
                                                                    groupIndex,
                                                                    subgroupIndex,
                                                                    itemIndex,
                                                                )
                                                            }
                                                            onMoveItem={(
                                                                itemIndex,
                                                                destination,
                                                            ) =>
                                                                moveItem(
                                                                    {
                                                                        type: 'group-subgroup',
                                                                        groupIndex,
                                                                        subgroupIndex,
                                                                    },
                                                                    itemIndex,
                                                                    subgroup
                                                                        .items[
                                                                        itemIndex
                                                                    ],
                                                                    destination,
                                                                )
                                                            }
                                                            canMoveUp={
                                                                subgroupIndex >
                                                                0
                                                            }
                                                            canMoveDown={
                                                                subgroupIndex <
                                                                group.subgroups
                                                                    .length -
                                                                    1
                                                            }
                                                            onMoveUp={() =>
                                                                moveGroupSubgroup(
                                                                    groupIndex,
                                                                    subgroupIndex,
                                                                    'up',
                                                                )
                                                            }
                                                            onMoveDown={() =>
                                                                moveGroupSubgroup(
                                                                    groupIndex,
                                                                    subgroupIndex,
                                                                    'down',
                                                                )
                                                            }
                                                            onRemove={() =>
                                                                removeGroupSubgroup(
                                                                    groupIndex,
                                                                    subgroupIndex,
                                                                )
                                                            }
                                                        />
                                                    ),
                                                )}
                                            </div>

                                            <dl className="flex justify-between border-t border-border pt-4 font-semibold">
                                                <dt>Group subtotal</dt>
                                                <dd>
                                                    {formatNumber(
                                                        groupSubtotal,
                                                    )}
                                                </dd>
                                            </dl>
                                        </div>
                                    </div>
                                );
                            })}

                            <Button type="button" onClick={addGroup}>
                                <Plus />
                                Add group
                            </Button>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label className="text-base">
                                        Ungrouped Phases
                                    </Label>
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={addSubgroup}
                                    >
                                        <Plus />
                                        Add phase
                                    </Button>
                                </div>

                                {subgroups.map((subgroup, subgroupIndex) => (
                                    <BomSubgroupFields
                                        key={subgroupIndex}
                                        namePrefix={`subgroups[${subgroupIndex}]`}
                                        errorPrefix={`subgroups.${subgroupIndex}`}
                                        subgroup={subgroup}
                                        errors={errors}
                                        currentLocation={`subgroup:${subgroupIndex}`}
                                        destinations={destinations}
                                        onNameChange={(name) =>
                                            updateSubgroupName(
                                                subgroupIndex,
                                                name,
                                            )
                                        }
                                        onDraftChange={(changes) =>
                                            updateSubgroupDraft(
                                                subgroupIndex,
                                                changes,
                                            )
                                        }
                                        onSubmitItem={() =>
                                            submitSubgroupItemDraft(
                                                subgroupIndex,
                                            )
                                        }
                                        onCancelItemEdit={() =>
                                            cancelSubgroupItemEdit(
                                                subgroupIndex,
                                            )
                                        }
                                        onEditItem={(itemIndex) =>
                                            editSubgroupItem(
                                                subgroupIndex,
                                                itemIndex,
                                            )
                                        }
                                        onRemoveItem={(itemIndex) =>
                                            removeSubgroupItem(
                                                subgroupIndex,
                                                itemIndex,
                                            )
                                        }
                                        onMoveItem={(itemIndex, destination) =>
                                            moveItem(
                                                {
                                                    type: 'subgroup',
                                                    subgroupIndex,
                                                },
                                                itemIndex,
                                                subgroup.items[itemIndex],
                                                destination,
                                            )
                                        }
                                        canMoveUp={subgroupIndex > 0}
                                        canMoveDown={
                                            subgroupIndex < subgroups.length - 1
                                        }
                                        onMoveUp={() =>
                                            moveSubgroup(subgroupIndex, 'up')
                                        }
                                        onMoveDown={() =>
                                            moveSubgroup(subgroupIndex, 'down')
                                        }
                                        onRemove={() =>
                                            removeSubgroup(subgroupIndex)
                                        }
                                    />
                                ))}
                            </div>

                            <div className="space-y-4">
                                <h2 className="text-base font-semibold">
                                    Ungrouped Materials
                                </h2>
                                <BomLineItemsSection
                                    idPrefix="ungrouped-item"
                                    namePrefix="items"
                                    errorPrefix="items"
                                    items={items}
                                    draft={itemDraft}
                                    editingItemIndex={editingItemIndex}
                                    errors={errors}
                                    emptyMessage="No ungrouped materials. Add one above, or put materials inside a group or phase."
                                    currentLocation="ungrouped"
                                    destinations={destinations}
                                    onDraftChange={updateItemDraft}
                                    onSubmitItem={submitItemDraft}
                                    onCancelItemEdit={cancelItemEdit}
                                    onEditItem={editItem}
                                    onRemoveItem={removeItem}
                                    onMoveItem={(itemIndex, destination) =>
                                        moveItem(
                                            { type: 'ungrouped' },
                                            itemIndex,
                                            items[itemIndex],
                                            destination,
                                        )
                                    }
                                />
                            </div>

                            <div className="space-y-6">
                                <h2 className="text-base font-semibold">
                                    Cost Summary
                                </h2>
                                <div className="grid gap-2 sm:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="overhead_percentage">
                                            Overhead percentage
                                        </Label>
                                        <Input
                                            id="overhead_percentage"
                                            type="number"
                                            step="1"
                                            min="0"
                                            name="overhead_percentage"
                                            value={overheadPercentage}
                                            onChange={(e) =>
                                                setOverheadPercentage(
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Optional"
                                        />
                                        <InputError
                                            message={errors.overhead_percentage}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="selling_percentage">
                                            Selling percentage
                                        </Label>
                                        <Input
                                            id="selling_percentage"
                                            type="number"
                                            step="1"
                                            min="0"
                                            name="selling_percentage"
                                            value={sellingPercentage}
                                            onChange={(e) =>
                                                setSellingPercentage(
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Optional"
                                        />
                                        <InputError
                                            message={errors.selling_percentage}
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="remarks">Remarks</Label>
                                    <Textarea
                                        id="remarks"
                                        name="remarks"
                                        placeholder="Optional"
                                        value={remarks}
                                        onChange={(e) =>
                                            setRemarks(e.target.value)
                                        }
                                    />
                                    <InputError message={errors.remarks} />
                                </div>

                                <dl className="space-y-2 border-t border-border pt-4">
                                    <div className="flex justify-between">
                                        <dt className="text-muted-foreground">
                                            Main cost
                                        </dt>
                                        <dd className="font-medium">
                                            {formatNumber(mainCost)}
                                        </dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-muted-foreground">
                                            Overhead cost
                                        </dt>
                                        <dd className="font-medium">
                                            {formatNumber(overheadCost)}
                                        </dd>
                                    </div>
                                    <div className="flex justify-between border-t border-border pt-2 font-semibold">
                                        <dt>Total cost</dt>
                                        <dd>{formatNumber(totalCost)}</dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-muted-foreground">
                                            Selling cost
                                        </dt>
                                        <dd className="font-medium">
                                            {formatNumber(sellingCost)}
                                        </dd>
                                    </div>
                                </dl>
                            </div>

                            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                <Button type="button" variant="outline" asChild>
                                    <Link href={showQuotation(quotation)}>
                                        Cancel
                                    </Link>
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing && <Spinner />}
                                    Create Bill of Materials
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}
