# Delivery Order (DO) — sales-side mirror of GRN

Part of the `docs/handoff/` detail set — see `HANDOFF.md` at the repo root for the index.

Directly mirrors GRN's shape (`docs/handoff/grn.md`), on the Quotation side: raised against a
specific **approved** Quotation (many DOs per quotation, for split shipments), `draft`/
`confirmed` two-state workflow, `delivered_by_id`/`delivered_at` on confirm (Workforce, not
User — matches GRN's `received_by`, not Quotation's own User-based `approved_by`, since this
is a delivery-note signature block, not a digital approval). `delivery_order_items`: single
`quantity_delivered` field, **no accepted/rejected split** — that was explicitly GRN-only
(goods arriving damaged is a receiving concern; nothing analogous was asked for delivery), so
don't copy GRN's shape wholesale onto DO just because it looks symmetric.

**`Quotation::PROGRESS_TRANSITIONS` extended** (`docs/handoff/progress-tracking.md`) with
`partially_delivered`/`fully_delivered` after `converted` (previously terminal) — confirming a
DO derives and writes `Quotation.progress` the same per-item-not-aggregate way GRN does for PO,
via `DeliveryOrderController::updateQuotationProgress()`, also bypassing the manual gate. These
two new stages are also reachable as **manual buttons** in `quotations/show.tsx`'s
`progressActions()`, same as how PO kept `partially_received`/`fully_received` manually
clickable even after GRN could derive them.

**`QuotationController::search()`/`::items()`** (new, mirroring the PO ones GRN needed) power
the DO create/edit form — same fixed-row-table shape, driven by the quotation's own items
(grouped and ungrouped alike; delivery doesn't care about the pricing-group structure, so the
endpoint doesn't filter on `quotation_group_id`). See `docs/handoff/quotations.md` for the
parent module.

**Cross-linked** from `quotations/show.tsx` via a "Delivery Orders" card + "Create DO"
shortcut (gated on `quotation.status === 'approved'`), own sidebar entry (Sales & CRM group).
