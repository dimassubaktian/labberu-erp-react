# Quotations — status workflow, revisioning, line items, groups

Part of the `docs/handoff/` detail set — see `HANDOFF.md` at the repo root for the index.

Belongs to a `Project` (immutable after creation — the code is derived from it), has a
`Currency`, an optional `Tax`, discount type/value, `valid_until` (auto-defaults to 7 days
from today on create), free-text `remarks`, and many `QuotationItem`s (product, qty, unit
price/cost, per-item discount, free-text `description` — totals/margins recalculated
server-side on every store/update, never trusted from the client).

**Line item descriptions**: `quotation_items.description` (nullable text). Selecting a
product auto-fills it from that product's own `descriptions` column (same pattern as
unit/price/cost auto-fill), but it's a plain editable textarea afterward — lets a quote
carry custom wording per line without touching the master product record. Shown as muted
secondary text under the product name on the detail page.

**Item groups** (`quotation_groups` + `quotation_items.quotation_group_id` nullable FK):
lets a quotation organize its line items into free-typed sections (e.g. "Labor",
"Materials") — the group name is a plain text input, not a predefined/managed list. Each
group has its **own** `discount_type`/`discount_value`, optional `tax_id`, and computed
`subtotal`/`discount_amount`/`tax_amount`/`total`, calculated with the exact same
`calculateDiscountAmount`/`calculateTaxAmount` helpers the header already used. Items may
be grouped or left ungrouped (mixed is allowed) — ungrouped items roll straight into the
header total with no group-level subtotal/tax of their own.

**Two-layer total calculation** (confirmed explicitly with the user, don't second-guess
this): the quotation header's *existing* discount/tax fields still apply, but now on top
of `sum(all group totals) + sum(ungrouped item totals)` rather than directly on the raw
item sum. So `quotation.subtotal` changed meaning — it's now the sum of (already
tax/discount-adjusted) group totals plus ungrouped item totals, *before* the header's own
discount/tax is applied to produce `quotation.total`. Controller logic lives in
`QuotationController::syncGroupsAndItems()`/`calculateGroup()` — reused by both `store()`
and `update()` (which does `$quotation->items()->delete(); $quotation->groups()->delete();`
then rebuilds both from scratch, same wipe-and-recreate pattern the original item-only
version used). `storeRevision()` deep-copies groups and their items into the new revision.

**Store/Update request payload shape**: `items[]` for ungrouped items (top-level, same as
before) plus a sibling `groups[]` array, each group carrying its own nested `items[]` —
groups are *not* referenced by items via a foreign key in the payload, they're nested,
which avoids fragile index-matching between separately-submitted arrays. A custom
`withValidator()` rule requires at least one item somewhere (ungrouped or inside any
group) since `items` alone can no longer be `required`.

**Frontend structure** (`create.tsx`/`edit.tsx`): a shared in-file `LineItemForm` +
`LineItemRow` pair (duplicated per-file, matching this project's established create/edit
duplication convention) is reused for both the ungrouped-items list and every group's item
list — avoids tripling the form markup. **This replaced the original one-`LineItemFields`-
per-item stacked-card layout; see `docs/handoff/history.md` item 31 for the current single
add/edit-form + click-to-edit summary-table design** (don't re-add per-item inline editing).
Each group is its own `Card` with a free-text name input, discount type/value selects, a tax
select, its own nested item list, and a per-group subtotal/discount/tax/total `dl`. "Add
line" and "Add group" both use the default (solid) `Button` variant, not outline, per
explicit user request. `LineItemForm`'s box gets `bg-muted/40` so it visually separates from
its parent group/ungrouped `Card` (same `bg-card` color otherwise made them blend together —
an explicit user complaint from the original layout, still holds). The "Ungrouped items"
card is omitted entirely from `show.tsx` when there are no ungrouped items, rather than
rendering an empty-state message.

**Code scheme**: `LAB-Q{YY}{MM}{project's NNN}-{thread# 2-digit}-{CustomerCode}`, generated
in `Quotation::booted()`'s `creating()` hook. All revisions in a thread share the root's
`quotation_code` and `thread_number`.

**Status workflow**: `draft` → `request_for_approval` → `approved`/`rejected`, plus
`cancelled` (from `draft` or `request_for_approval`) and `voided` (from `approved`). Modeled
via `Quotation::TRANSITIONS` (private const array) and `Quotation::allowedNextStatuses(
string $status): array`, mirrored on the frontend in `show.tsx`'s `statusActions()` for
button rendering — backend (`QuotationStatusUpdateRequest` + `Rule::in()`) is authoritative.
Approving sets `approved_by`/`approved_at` to the acting user/now.

**Revisioning**: `root_quotation_id` (self-FK, null on the root), `version_major`/
`version_minor` (user picks "major" — customer-requested — or "minor" — internal — when
creating a revision), `is_current` (**exactly one row per thread must be `true` at all
times** — this invariant was violated by a real production bug, see
`docs/handoff/bugs-fixed.md`), `thread_number`. A revision can only be created from a
quotation that is both **not** `draft` and **is** `is_current` — enforced in
`QuotationRevisionRequest::authorize()` and mirrored in `show.tsx`'s "Create Revision" button
visibility. Revision History is shown as a card-list on the detail page (only rendered when
the thread has more than one version).

**Delete**: draft-only, and blocked if the quotation has any other revisions in its thread
(root or otherwise) — "Danger Zone" card only renders when both conditions hold.

**Line items table**: has a "No" column (1-indexed row number) for quick counting.
