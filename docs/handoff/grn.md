# Goods Receipt Note (GRN) — receiving, per-item progress derivation

Part of the `docs/handoff/` detail set — see `HANDOFF.md` at the repo root for the index.

A document raised against a specific, **approved** Purchase Order, recording what physically
arrived. Own sidebar entry (Purchase group) with full index/create/edit/show pages, plus
cross-linked from `purchase-orders/show.tsx` via a "Goods Receipt Notes" card + "Create GRN"
shortcut (gated on `purchaseOrder.status === 'approved'`). See `docs/handoff/purchase-orders.md`
for the parent module.

**Multiple GRNs per PO** — a PO can receive in several shipments; "received so far" per PO
line is always summed live across a PO's *confirmed* GRNs
(`GoodsReceiptNoteItem::whereHas('goodsReceiptNote', status=confirmed)`), never a synced
field, matching the BOM→PO remaining-quantity pattern established earlier
(`docs/handoff/history.md` item 19).

**Schema**: `goods_receipt_notes` (`grn_code` scheme `LAB-GRN{yy}{seq}-{VendorCode}`,
`purchase_order_id` immutable, `status` `draft`/`confirmed` only — a deliberately minimal
two-state workflow, no issuer/checker/approver chain like PO since a GRN isn't a
multi-signature physical form, `received_by_id`/`received_at` set on confirm) +
`goods_receipt_note_items` (`product_id`/`quantity_ordered`/`unit` snapshotted from the
source PO item at creation time, `purchase_order_item_id` nullable `nullOnDelete` since
`PurchaseOrderController::update()` wipes and recreates PO items on every edit,
`quantity_accepted`/`quantity_rejected` — explicitly a **split**, not a single "quantity
received" — with an optional `rejection_reason`, since goods can arrive damaged; this was an
explicit interview answer, don't collapse it back to one field).

**Confirming a GRN recomputes and writes `PurchaseOrder.progress`** directly
(`GoodsReceiptNoteController::updatePurchaseOrderProgress()`), bypassing
`PurchaseOrderProgressUpdateRequest`/`allowedNextProgress()` entirely (see
`docs/handoff/progress-tracking.md`) — that gate exists to protect *manual* button-driven
transitions from skipping/reversing steps; a system-derived recomputation-from-scratch is
allowed to jump straight to the correct stage. The comparison is **per PO line item, not an
aggregate total**: summing `quantity_accepted` across all items and comparing to the summed
order total would let one over-received line mask another line that never arrived (e.g. line
A ordered 5, over-received to 10; line B ordered 5, never shipped — an aggregate 10/10 would
wrongly read "fully received"). Every item must individually be ≥ its ordered quantity for
`fully_received`; any item with `> 0` accepted but not all complete is `partially_received`;
nothing accepted leaves progress untouched. Guarded both at GRN creation and at confirm time
by `purchaseOrder.status === 'approved'` (the PO could have been edited back to `draft` in
between, since PO edit-while-approved already resets it).

**New shared endpoints this module needed** (later reused by DO and Invoice too):
`PurchaseOrderController::search()` (`?q=` against `purchase_order_code`, filtered to
`status = 'approved'`) and `PurchaseOrderController::items()` (that PO's items + received/
remaining per line). The create/edit form is driven by these rather than free product
search, since a GRN line is inherently "what happened against this PO's existing lines," not
an arbitrary new line — a **different form shape** from every other line-item form in the app
(Quotation/BOM/PO all let you freely add/remove arbitrary rows): the item table is fixed to
the PO's own items, only a per-row "Accepted"/"Rejected"/"Rejection reason" set of inputs is
editable, and only rows where `accepted + rejected > 0` get submitted (a filtered array
computed at render time; hidden inputs generated only for those rows, the visible table still
maps over every PO item so partially-filled-out state isn't lost while typing). This same
fixed-row-table shape was then reused for DO (`docs/handoff/delivery-orders.md`) and Invoice
(`docs/handoff/invoices.md`).

**Known trade-off, not solved**: editing a PO after a GRN (draft or confirmed) already exists
against it immediately nulls every existing GRN item's `purchase_order_item_id` (PO items are
hard-deleted and recreated on update, unlike BOM/Quotation items which are soft-deleted).
The GRN itself stays fully correct (everything it displays is snapshotted), but "received so
far" math for a *new* GRN against that same PO won't see those older receipts against the new
item rows. Same class of trade-off already accepted for BOM↔PO linkage via `bom_item_id`.
