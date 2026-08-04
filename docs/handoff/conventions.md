# Conventions / preferences the user has stated explicitly

Part of the `docs/handoff/` detail set — see `HANDOFF.md` at the repo root for the index.

- "Back to X" buttons on detail pages: always red (`variant="destructive"`).
- "Edit X" buttons use the full noun (e.g. "Edit Quotation"), never just "Edit".
- No modal-based CRUD — dedicated pages only (index/create/edit/detail), except delete
  confirmation and workflow-action confirmations, which do use a `Dialog`.
- Delete confirmation always lives in a "Danger Zone" card at the bottom of the detail page.
- Destructive/negative workflow outcomes (cancel, reject, void, delete) get red
  (`variant="destructive"`) buttons.
- Wants mobile/tablet/desktop responsiveness considered on every page (stacking headers,
  buttons full-width on mobile via `w-full sm:w-auto`, tables scroll horizontally via the
  shared `Table` component rather than squishing).
- Cursor should be `pointer` on all clickable buttons, `not-allowed` on disabled ones —
  fixed globally, not per-component.
- Prefers being asked when there's a genuine architectural fork (e.g. enum values before
  building a module, approval/revision UX shape, delete semantics) — interview-first with
  `AskUserQuestion`-style recommended defaults, not silent guessing.
- After creating a record, redirect to its detail page (not the index) once a detail page
  exists — this was an explicit flow change requested for Quotations and is the preferred
  default going forward.
- Primary/repeatable form actions ("Add line", "Add group") use the default (solid) button
  variant, not outline — outline is reserved for secondary actions like "Cancel".
- Nested item boxes inside a card need their own background (`bg-muted/40`) rather than
  inheriting the parent card's `bg-card` — same-color nesting was flagged as bad contrast.
- Empty optional sections (e.g. "Ungrouped items" with zero items) should be omitted
  entirely from detail pages rather than rendered with an empty-state placeholder message.
- Percentage-based fields aren't always subtractive/additive by default — **check which
  semantics were actually requested per field** rather than assuming. `Quotation`'s own
  discount/tax fields are subtractive/additive (`base - base×pct/100`). `Bom`'s
  `selling_percentage` and its line-item percentage discount are **direct multipliers**
  (`base × pct/100`) — both were explicit corrections from the client's original ask. These
  two conventions coexist deliberately in the same codebase; don't "fix" one to match the
  other. See `docs/handoff/bom.md`.
- Reference/supporting documents (e.g. Project Attachments) should **not** be deep-copied
  across quotation revisions the way pricing content (items/groups/BOM) is — only content
  that represents what was actually priced/planned needs a frozen snapshot per revision. See
  `docs/handoff/project-attachments.md`.
- Not every `Select` needs to become a searchable async combobox — only convert one once a
  table is genuinely high-cardinality (hundreds/thousands of rows). Small bounded reference
  data (Job Titles, Currencies, Taxes, Workforces) stays as a plain `Select` with the full list
  passed via Inertia props; converting those would just be unnecessary network round-trips.
  (Vendor was the one exception — client asked for the combobox treatment ahead of it actually
  becoming high-cardinality, for Purchase Orders; that's a one-off, not a reversal of the rule.)
  See `docs/handoff/async-combobox.md`.
- A field being "editable while draft" doesn't automatically mean *every* field on that
  document is editable — confirm per-field. Purchase Orders were originally built with every
  field (including Project) editable while draft, matching Quotation/BOM's general "all fields
  editable while draft" pattern, but the client then singled out Project as needing to be
  locked after creation, same as Quotation's project field already was. Don't assume a
  blanket rule from one module carries over uniformly to a new one — ask if unsure.
- Workflow steps that mirror a physical paper form's signature block (issuer, checkers,
  approver) should be tracked against `Workforce` records, not `User` logins — these represent
  named staff roles on a document, not necessarily people with system accounts. Purchase
  Order's issue/check/approve actions each take a `workforce_id` via a plain `Select`, distinct
  from Quotation's `approved_by`, which *is* tied to the logged-in `User`. See
  `docs/handoff/purchase-orders.md`.
- "Editable while draft" isn't a fixed ceiling either — Purchase Order later grew "editable
  while `approved`, resets to `draft` on save" on top of that, while Quotation/BOM stayed
  `draft`-only. Don't assume every module's edit-lock behavior stays frozen at its original
  scope; ask before extending or copying it to a new module.
- A document's internal approval `status` and its real-world fulfillment `progress` are
  different axes and shouldn't be conflated into one field — see
  `docs/handoff/progress-tracking.md`. `status` stops changing once terminal (`approved`);
  `progress` is a second, separate, manually-advanced field for what happens after. When asked
  for something like "what state is this document really in," check whether the ask is about
  the approval workflow or about fulfillment before reaching for `status`.
- **`progress` can also be *derived*, not just manually clicked** — once GRN and DO existed,
  confirming them recomputes `PurchaseOrder.progress`/`Quotation.progress` directly, bypassing
  the manual transition gate (`allowedNextProgress()`), since that gate exists to protect
  *manual* button-driven transitions from skipping/reversing steps, not a system-derived
  recomputation-from-scratch. When a derivation like this is added, always recompute **per
  line item, not as an aggregate total** — an aggregate sum can be masked by one
  over-received/over-delivered line hiding another line that never arrived at all. Both GRN→PO
  and DO→Quotation have a regression test specifically for this case; don't "simplify" the
  math back to a single sum. See `docs/handoff/grn.md` and `docs/handoff/delivery-orders.md`.
- A "so far / remaining" quantity feature (BOM→PO import, GRN→PO progress, DO→Quotation
  progress, Invoice→Quotation invoiced-so-far) should be **computed live from existing rows,
  never a synced field** — and when a second module starts needing the same parent-item
  context an earlier module already exposed via an endpoint, **extend that endpoint
  additively** (new response fields) rather than duplicating it. `PurchaseOrderController::
  items()`/`::search()` and `QuotationController::items()`/`::search()` have each been
  extended twice this way (GRN, then Invoice) without breaking the earlier consumer's tests.
- Don't assume a sibling module needs the same field shape just because it looks symmetric.
  GRN's `quantity_accepted`/`quantity_rejected` split was an explicit interview answer for
  *receiving* (goods can arrive damaged); DO deliberately got a single `quantity_delivered`
  field instead, since nothing analogous was asked for delivery. Check per-module rather than
  copying the most recent module's shape by default.
- Not every new axis of state should live on `Quotation.progress`, even once it's already
  hosting two derived stages (delivery). Invoice's `status`/`payment_status` were explicitly
  kept off `Quotation.progress` — confirmed with the client — since payment collection is a
  financial lifecycle, not a fulfillment one, and stacking a third unrelated concern onto the
  same field starts to erode what it means. See `docs/handoff/invoices.md`.
- When a new module clearly tracks money rather than fulfillment quantities (Invoice was the
  first), that's worth flagging as a different *kind* of decision during the interview, not
  just another set of workflow questions — the client picked against the recommended simpler
  default specifically because real bookkeeping needed installment/partial payment history,
  something none of the quantity-tracking modules needed.
- **Page sections don't use `Card` anymore** (see `docs/handoff/history.md` item 41) — small
  screens need the horizontal room `Card`'s padding/border/shadow eats. Default for a new
  top-level section: `<div className="space-y-6"><h2 className="text-base font-semibold">Title</h2>…</div>`
  (or `mb-4` on the `<h2>` if the content has no natural `space-y-*` gap). Only fall back to a
  bordered `div` (`rounded-lg border border-border/50 p-4`, no shadow/`py-6`) when the border is
  actually load-bearing — a "Danger Zone" delete section (`border-destructive/50` instead) or
  multiple sections genuinely laid out side-by-side in a grid where the border is the only
  visual separator between them (e.g. Roles' permission-module grid). Don't reach for `Card` by
  default when adding a new page or section.
