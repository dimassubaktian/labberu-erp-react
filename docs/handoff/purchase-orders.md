# Purchase Orders — cascading discounts, issuer/checker/approver sign-off workflow

Part of the `docs/handoff/` detail set — see `HANDOFF.md` at the repo root for the index.

A document raised against a `Vendor`, referencing a specific `Project`/`Quotation` pair (many
POs can be raised per quotation — no zero-or-one constraint like BOM). Has its own sidebar
entry and index/create/edit/show pages — **no revisioning** (unlike Quotations, see
`docs/handoff/quotations.md`) and no grouping structure (unlike BOM/Quotation items) — line
items are a flat list.

**Header fields**: `purchase_order_code` (auto, see code scheme below), `project_id`,
`quotation_id`, `customer_id` (denormalized off the project at creation, shown read-only,
never independently selectable), `vendor_id`, `address`/`phone`/`fax` (snapshotted from the
selected vendor at pick-time, then freely editable — e.g. a different contact/address for this
specific order), `quotation_no`/`quotation_date` (free text/date — **the vendor's own
quotation reference to us**, unrelated to the linked `quotation_id`, which is *our* internal
quotation to the customer), `project_name` (editable text snapshot, not a live read of
`project.name`), `date`, `delivery_date`, `currency_id`, `tax_id`, `shipping_method`,
`shipping_terms`.

**The project cannot be changed after creation** (explicit correction from the client — POs
initially had every field editable while draft, same as Quotation/BOM items, but Project
specifically needed to be locked). `PurchaseOrderUpdateRequest` enforces this server-side via
`Rule::in([$purchaseOrder->project_id])` on top of the usual `exists` rule — not just a
frontend restriction. `edit.tsx` shows Project as the same static read-only paragraph pattern
Quotation's `edit.tsx` already used for its own (always-immutable) project field. Quotation and
Vendor, by contrast, **remain editable** while draft.

**Project → Quotation cascading picker**: since a PO's quotation must belong to its project,
picking a Project (via the same `AsyncCombobox` pattern as Quotation/Customer/Product — see
`docs/handoff/async-combobox.md`) fetches that project's quotations via a new
`ProjectController::quotations(Project $project): JsonResponse` endpoint (`GET
projects/{project}/quotations`, JSON, all revisions, no `?q=` search — a project's quotation
count is small enough that no debounced search is needed, just a plain dependent `Select`) and
populates a second, initially-disabled `Select`. On `edit.tsx` this same endpoint is called once
on mount (via `useEffect`) using the already-set project's uuid, so the current quotation shows
up in the list without needing to touch the (now read-only) project field first. **Gotcha hit
during this build**: the fetch must use the project's `uuid`, not its numeric `id` — see
`docs/handoff/bugs-fixed.md`.

**Cascading discount levels** (`purchase_order_discounts`, dynamic count — explicitly **not**
capped at 3 despite the client's original spec mentioning "Discount I, II, III"; the schema
supports any number of rows): each row has `sequence` (server-assigned from array order, never
trusted from the client), `label` (free text, e.g. "Discount I"), `discount_type`
(percentage/fixed), `discount_value`, and computed `base_amount`/`discount_amount`. **Cascading
means compound, not independent**: level 2 applies against the balance *left after* level 1,
not against the original subtotal — confirmed explicitly with the client, mirrors how
successive trade discounts actually work (e.g. 10% + 10% ≠ 20% off). Tax is applied **after**
all discount levels, on the final net balance. Math lives in
`PurchaseOrderController::syncItemsAndDiscounts()`, reused by both `store()` and `update()`
(same wipe-and-recreate-on-update pattern as every other module: `items()->delete();
discounts()->delete();` then rebuild).

**Line items** (`purchase_order_items`) are deliberately flat — no groups/subgroups like
Quotation/BOM. Fields: `product_id`, `reference_number` (autofilled from `product.
reference_number`, then freely editable — **bug hit here**, see `docs/handoff/bugs-fixed.md`),
`description` (autofilled from `product.descriptions`), `quantity`, `unit`, `unit_price`
(**autofilled from `product.cost`, not `product.price`** — deliberate, since a PO is a buying
document, not a selling one), `total`. No per-item discount (unlike Quotation items) — all
discounting happens once at the header level via the cascading levels above.

**Code scheme**: `LAB-PO{YY}{seq}-{VendorCode}`, generated in `PurchaseOrder::booted()`'s
`creating()` hook via a new `PurchaseOrderCodeSequence` model — **keyed by year only** (same
as `ProjectCodeSequence`), **not year+month**. The first implementation keyed it by year+month
(resetting monthly) before the client clarified they wanted an annual reset like Projects;
since the migration was still uncommitted at that point, it was edited and re-migrated in
place rather than patched with a second migration.

**Status workflow — issuer → two parallel checkers → approver**, modeled after a real paper
form (issued by one person, checked by two, approved by one), tracked against **`Workforce`
records, not `User` logins** (explicit client requirement — these are named staff roles on a
physical document, not necessarily system accounts): `status` (`draft`/`issued`/`approved`/
`cancelled`/`voided`, via the same `TRANSITIONS` const + `allowedNextStatuses()` pattern as
Quotation), plus `issued_by_id`/`issued_at`, `checked_by_1_id`/`checked_by_1_at`,
`checked_by_2_id`/`checked_by_2_at`, `approved_by_id`/`approved_at`, and `rejection_reason`.
The two checker slots are **parallel, not sequential** — either can be signed off in any order,
tracked as two independent nullable column pairs rather than a single "checked" status; the
Approve action is only available once both are non-null. **Rejecting reverts the PO to
`draft`** (not a terminal `rejected` status like Quotation) and clears all four sign-off
columns plus sets `rejection_reason` — re-issuing clears `rejection_reason` back to `null`.
Each transition is its own FormRequest (`PurchaseOrderIssueRequest`, `PurchaseOrderCheckRequest`
— takes a `slot` param, 1 or 2, and `authorize()`s that the target slot isn't already filled —
`PurchaseOrderApproveRequest`, `PurchaseOrderRejectRequest`, `PurchaseOrderCancelRequest`,
`PurchaseOrderVoidRequest`) and its own controller method/route (`PATCH .../issue`, `/check`,
`/approve`, `/reject`, `/cancel`, `/void`), each with its own confirmation `Dialog` on
`show.tsx` — a `WorkforceSelect` picker (plain `Select`, matching the existing "Workforce is
still a plain full-list select" convention) appears inside the relevant dialogs where a
sign-off name needs to be recorded.

**Editing an `approved` PO** (`PurchaseOrderController::edit()`/`update()`,
`PurchaseOrderUpdateRequest::authorize()`) is allowed in addition to `draft` — a later client
request, not part of the original build. If the PO was `approved` when the edit is submitted,
`update()` resets `status` back to `draft` and nulls every sign-off column (`issued_by_id/at`,
`checked_by_1/2_id/at`, `approved_by_id/at`) **and** `progress`
(see `docs/handoff/progress-tracking.md`) in the same write, so the whole workflow — issue,
both checks, approve — has to be redone. `edit.tsx` shows an amber warning banner when
`purchaseOrder.status === 'approved'` telling the user this will happen before they save.
Delete was deliberately **not** extended the same way — it's still `draft`-only.
