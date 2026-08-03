# Invoice — the first financial module, individual payment tracking

Part of the `docs/handoff/` detail set — see `HANDOFF.md` at the repo root for the index.

Raised against a specific **approved** Quotation (many invoices per quotation — deposit/
progress/final billing schedules). Unlike every prior module, Invoice tracks *money*, not
fulfillment quantities, and was interviewed separately for that reason (`AskUserQuestion`,
four questions): parent document (Quotation, confirmed), cardinality (multiple per quotation,
confirmed), payment tracking shape, and whether it should extend `Quotation.progress` further.
See `docs/handoff/quotations.md` for the parent module and `docs/handoff/progress-tracking.md`
for the progress field this deliberately does NOT extend.

**Payment tracking — individual payments, not a status field**: the one place the client
picked *against* the recommended simpler default. `invoice_payments` (`amount`,
`payment_date`, `method` free text, `remarks`, `recorded_by` — a **User**, `auth()->id()`, not
a Workforce picker, since recording a payment is a digital bookkeeping entry by whoever's
logged in, not a signature on a physical paper form) lets multiple partial payments
accumulate against one invoice. `InvoicePaymentController::store()`/`destroy()` each
recompute `Invoice.payment_status` (`null`/`partially_paid`/`paid`) from
`sum(payments.amount)` vs `invoice.total` — **self-contained**, unlike GRN→PO/DO→Quotation's
cross-model derivation, since the same `Invoice` model owns both its payments and the derived
field. No overpayment cap (same "show context, don't block" choice as every
remaining-quantity feature elsewhere). Deleting a payment can move `payment_status` back down
(e.g. `paid` → `partially_paid`) — intentional, a correction mechanism, not a bug.

**`Quotation.progress` deliberately NOT extended further for invoicing/payment** — confirmed
explicitly. Progress already has a natural fulfillment endpoint at `fully_delivered`; payment
collection is a different axis (financial, not fulfillment) and stacking a third
auto-derived concern onto the same field would conflate two lifecycles that only shared a
home so far because GRN/DO's stages were purpose-built extensions of receiving/delivering.

**Schema/design defaults not covered by the interview** (flagged for visibility rather than
asked, since they follow clear precedent): `invoice_items` are **read-only pricing
snapshots** (`unit_price` copied from the quotation item at creation, never user-edited —
only "Invoice qty" is editable, same shape as every other module's fixed-row form, see
`docs/handoff/grn.md`); **no per-item discount**, only header-level
`discount_type`/`discount_value`/`tax_id` (mirrors PO's simpler header-only pattern, not
Quotation's per-item-plus-header one); **two-state `status` only** (`draft`→`issued`, no
void/cancel — nothing in the ask called for invoice rejection); **no separate `currency_id`**
on Invoice — always displays via `invoice->quotation->currency`, avoiding a duplicated column
that could drift from its parent.

**Money math** (`InvoiceController::syncItems()`) reuses the exact
`calculateDiscountAmount`/`calculateTaxAmount` shape already proven in
`QuotationController`/`PurchaseOrderController` — copied, not shared, matching this
codebase's established per-controller duplication convention.

**`QuotationController::items()`/`::search()` extended again** (third consumer, after DO) —
additively: `unit_price`, `invoiced` (sum of `quantity_invoiced` across **all** invoice items
regardless of status, since unlike GRN/DO there's no draft-vs-confirmed distinction for
invoice items — a draft invoice still reserves its claimed quantity so two drafts can't
double-claim the same units), `remaining_to_invoice`, and (on `search()`) `currency` (needed
to display amounts in the right currency on the create form; DO never needed this). Confirmed
additive — existing DO tests asserting `data.0.delivered`/`data.0.remaining` kept passing
unchanged; this "extend a shared endpoint additively rather than duplicate it" approach is
now the established pattern for any future module that needs quotation-item context.

**Cross-linked** from `quotations/show.tsx` via an "Invoices" card + "Create Invoice"
shortcut, own sidebar entry (Finance group).
