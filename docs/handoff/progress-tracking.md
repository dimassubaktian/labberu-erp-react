# Progress tracking — Quotation and Purchase Order

Part of the `docs/handoff/` detail set — see `HANDOFF.md` at the repo root for the index.

A `progress` column (nullable string) was added to both `quotations` and `purchase_orders`,
deliberately **separate from `status`**. `status` is the internal approval workflow (who
signed off, is this the source of truth); once a Quotation/PO reaches `approved`, `status`
is effectively terminal (only `voided` follows) and stops changing — but the real-world
document keeps moving (sent to the customer/vendor, accepted, goods received, etc.), and
there was nowhere to record that. This was scoped deliberately narrow: only per-document
progress was built now; a **rollup view across the whole Project** (Quotation approved → PO
issued → goods received → invoiced) was discussed and explicitly deferred, since it would be
a *derived* view over Deliver Order/Goods Receipt/Invoice records that don't exist yet —
storing a manually-synced rollup field invites the same class of bug as the `is_current`
incident (`docs/handoff/bugs-fixed.md`).

**Stages** (`Quotation::PROGRESS_TRANSITIONS`/`PurchaseOrder::PROGRESS_TRANSITIONS`, mirroring
the existing `TRANSITIONS`/`allowedNextStatuses()` pattern via a parallel
`allowedNextProgress(?string $progress): array`):
- Quotation: `sent → accepted → converted` (later extended with
  `partially_delivered`/`fully_delivered`, see `docs/handoff/delivery-orders.md`).
- PO: `sent → partially_received/fully_received → closed` (partially_received can be skipped
  and gone straight to fully_received; see `docs/handoff/grn.md` for how these get derived).

**Gating rule**: progress can only be advanced while `status === 'approved'` — enforced in
`QuotationProgressUpdateRequest`/`PurchaseOrderProgressUpdateRequest` by returning an empty
`Rule::in([])` (i.e. always-invalid) allowed-list whenever status isn't approved, same
"`authorize()` returns `true`, `rules()` does the real gating via `Rule::in($allowed)`" style
Quotation's own `QuotationStatusUpdateRequest` already used — **not** a hard 403 in
`authorize()`. Each model exposes one generic `PATCH .../progress` endpoint
(`{model}.progress.update`) rather than PO's per-action-endpoint style, since progress is a
single linear sequence with no distinct per-step business rules to justify separate
FormRequests.

**Manual only** — advancing progress is always a deliberate user action via its own
confirmation `Dialog` (mirrors the existing status-workflow action buttons); nothing
auto-advances it (e.g. approving a PO does *not* auto-set progress to `sent`) — an explicit
choice to keep the two lifecycles decoupled.

**Reset behavior — deliberately asymmetric**: editing an `approved` PO back to `draft`
(`docs/handoff/purchase-orders.md`) **does** clear `progress` back to `null`, since the
underlying document content changed and the old progress is stale. Voiding or cancelling a
Quotation/PO does **not** clear `progress` — it's treated as historical fact ("it got this far
before being voided/cancelled"), not live state that must reflect the current status. Don't
"fix" this into clearing progress on every terminal transition; it was a deliberate call, not
an oversight.

**Frontend**: a "Progress" `Badge` in each Details card (only rendered once `progress` is
non-null) plus a "Progress" `Card` with one button per next-allowed stage
(`progressActions(progress)` in both `quotations/show.tsx` and `purchase-orders/show.tsx`,
same shape as the existing `statusActions(status)` helper), each behind its own confirmation
`Dialog`.
