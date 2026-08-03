# Stock Movements — auto-generated, read-only inventory ledger

Part of the `docs/handoff/` detail set — see `HANDOFF.md` at the repo root for the index.

The first module that touches actual inventory levels rather than just document/quantity
tracking. Deliberately split into two modules from the start (discussed and decided via a
parallel `/subtask` interview run alongside this module's own build): **Movements** records
what actually happened via GRN/DO, **Adjustments** (`docs/handoff/stock-adjustments.md`)
handles everything else. This module has **no manual entry at all** — it exists purely to give
GRN/DO confirmations somewhere to write, and to give `Product` a live on-hand figure.

**Schema** (`stock_movements`): `product_id`, `type` (`in`/`out`), `quantity`,
`movement_date`, plus three nullable, mutually-exclusive-in-practice source FKs —
`goods_receipt_note_item_id`, `delivery_order_item_id`, `stock_adjustment_id` (all
`nullOnDelete`, same fragility precedent as `bom_item_id`/`purchase_order_item_id` elsewhere:
parent items get wiped-and-recreated on edit, so the link can legitimately go null over time).
**No `uuid`/route-key and no `softDeletes()`** — deliberately omitted, since nothing ever
needs route-model-binding by UUID (no show/edit page) or a delete path (it's an immutable
historical fact, not an editable record).

**On-hand quantity is computed live, never stored**: `StockMovement::quantityOnHandFor(Product
$product): float` sums `case when type = 'in' then quantity else -quantity end` via
`selectRaw`, on every read — same "derive, never sync" philosophy as every other running-total
feature in this app (BOM→PO remaining, GRN→PO/DO→Quotation progress, Invoice payment_status).
`ProductController::show()` passes this as a `stockOnHand` prop; `products/show.tsx` renders
it in a "Stock" card, but **only for `type === 'goods'` products** — service products have no
physical stock to track.

**Movement creation** — `GoodsReceiptNoteController::createStockMovements()` and
`DeliveryOrderController::createStockMovements()` (mirror-shaped private methods, called
inside each controller's existing `confirm()` transaction, before the progress-derivation
step, see `docs/handoff/grn.md`/`docs/handoff/delivery-orders.md`): loop the confirmed
document's items, skip any line where `product.type !== 'goods'` or the relevant quantity is
`0`, create one `StockMovement` per remaining line (`quantity_accepted` → `in` for GRN,
`quantity_delivered` → `out` for DO), `movement_date` set from the source document's own date
field (GRN's `received_at`/DO's `delivery_date`, not `now()` — the movement should reflect
when the goods actually moved, not when it was entered).

**`StockMovementController::index()`** — the only route (`GET stock-movements`), paginated,
eager-loads `product` plus the full chain back to each source document
(`goodsReceiptNoteItem.goodsReceiptNote.purchaseOrder.vendor`,
`deliveryOrderItem.deliveryOrder.quotation.project.customer`, and later `stockAdjustment`),
optional `?product=` (a product's `uuid`) query filter — used by the "View Movements" link on
`products/show.tsx`'s Stock card. The Source column links to the GRN or DO that generated the
row.
