# Bill of Materials (BOM) — cost tiers, groups, phase subgroups

Part of the `docs/handoff/` detail set — see `HANDOFF.md` at the repo root for the index.

Entry point is a "Bill of Materials" card on the quotation's `show.tsx` — "Create BOM" only
shown when `quotation.status === 'draft'` and no BOM exists yet; once created, shows a cost
summary + "View"/"Edit Bill of Materials" links (edit only while draft). No separate sidebar
nav entry — BOM is always reached through its parent quotation. See `docs/handoff/quotations.md`
for the parent module.

**Four-tier cost chain**, computed server-side on every store/update, never trusted from the
client (`BomController::syncGroupsAndItems()`):
- `main_cost` — sum of every `bom_item.total_cost` across ungrouped items, top-level phase
  subgroups, and every hardware group (direct items + that group's own subgroups).
- `overhead_cost` — `main_cost × overhead_percentage / 100` (additive: overhead is added on
  top of main cost to produce `total_cost`).
- `total_cost` — `main_cost + overhead_cost`.
- `selling_cost` — `total_cost × selling_percentage / 100`. **This is a direct multiplier, not
  an additive markup** — a user enters `110` to mean "sell at 110% of Total Cost" (a 10%
  markup), not `10`. This was an explicit correction from the client's original ask; don't
  "fix" it back to `total_cost + total_cost × pct / 100`.

**Line item discount** (`BomController::applyDiscount()`) is *also* a direct multiplier for
percentage type: `total_cost = line_total × discount_value / 100`, so `90` means "keep 90% of
cost" (a 10% discount). This is **different from `Quotation`'s own item discount**, which
stays subtractive (`line_total - line_total × value / 100`) — the two were deliberately given
different semantics per explicit client correction; do not unify them. Fixed-amount discount
on BOM items is a flat subtraction capped at zero, same as everywhere else.

**Grouping — two levels, both optional and combinable**: `BomGroup` represents a piece of
hardware being built (e.g. "Control Panel"), with its own stored `subtotal`. `BomSubgroup`
represents a phase (e.g. "Q1", "Q2" — free text, not a managed list) and can be nested either
under a `BomGroup` (`bom_group_id` set — "this hardware's Q1 materials") or directly under the
`Bom` itself (`bom_group_id` null — "materials for Q1, not tied to specific hardware"). A
`BomItem` can therefore be: fully ungrouped, directly in a group, directly in a top-level
subgroup, or inside a subgroup nested under a group. **Rule**: if `bom_item.bom_subgroup_id`
is set, `bom_group_id` stays null on that item — its group (if any) is inferred via
`subgroup.bom_group_id`, not duplicated onto the item. `BomGroup::items()` and
`Bom::subgroups()`/`BomGroup::subgroups()` rely on this being consistent.

**Store/update payload shape** mirrors Quotation's groups pattern one level deeper: top-level
`items[]` (ungrouped) + top-level `subgroups[]` (phase-only) + `groups[]` where each group has
its own `items[]` (direct) and `subgroups[]` (nested phases). A group is valid if it has
materials *either* directly or inside any of its subgroups (`BomStoreRequest::groupHasItems()`)
— a group with neither is rejected. `syncGroupsAndItems()`/`createItems()`/`createSubgroup()`
build this bottom-up, same wipe-and-recreate pattern `update()` already used for items/groups.

**Revision handling**: BOM — including its groups, subgroups, and items — is deep-copied into
a new quotation revision when one exists on the source quotation
(`QuotationController::storeRevision()` → `copyBomSubgroup()`), same "own copy per revision"
treatment as quotation items/groups. This is deliberately different from Project Attachments
(`docs/handoff/project-attachments.md`), which are *not* copied — BOM represents priced/planned
content that needs an accurate historical snapshot per revision; attachments are reference
material that doesn't.

**Delete**: `BomController::destroy()`, `draft`-quotation-only, same Danger Zone pattern as
everywhere else. Soft-deletes the `Bom` without cascading to its `bom_items`/`groups`/
`subgroups` rows — same "orphaned-but-unreachable" precedent as Quotation's own soft-delete,
since nothing queries those child rows once their parent is excluded by the soft-delete
scope.
