<?php

namespace App\Services;

use App\Models\DeliveryOrder;
use App\Models\DeliveryOrderItem;
use App\Models\Quotation;
use App\Models\QuotationItem;
use Illuminate\Support\Collection;

class DeliveryOrderQuantityValidator
{
    /**
     * Return confirmed delivery quantities keyed by quotation-line lineage across a quotation
     * thread. A delivery order may be excluded when validating an existing order.
     *
     * @return Collection<string, float>
     */
    public function deliveredQuantities(Quotation $quotation, ?DeliveryOrder $except = null): Collection
    {
        $threadIds = $this->threadIds($quotation);
        $lineagesByItemId = QuotationItem::query()
            ->whereIn('quotation_id', $threadIds)
            ->pluck('lineage_uuid', 'id');

        if ($lineagesByItemId->isEmpty()) {
            return collect();
        }

        $confirmedOrderIds = DeliveryOrder::query()
            ->whereIn('quotation_id', $threadIds)
            ->where('status', 'confirmed')
            ->when($except, fn ($query) => $query->where('id', '!=', $except->getKey()))
            ->pluck('id');

        if ($confirmedOrderIds->isEmpty()) {
            return collect();
        }

        $deliveredByItem = DeliveryOrderItem::query()
            ->whereIn('delivery_order_id', $confirmedOrderIds)
            ->whereIn('quotation_item_id', $lineagesByItemId->keys())
            ->selectRaw('quotation_item_id, sum(quantity_delivered) as delivered')
            ->groupBy('quotation_item_id')
            ->pluck('delivered', 'quotation_item_id');

        /** @var array<string, float> $quantities */
        $quantities = [];

        foreach ($deliveredByItem as $itemId => $delivered) {
            $lineageUuid = $lineagesByItemId->get($itemId);

            if ($lineageUuid !== null) {
                $quantities[$lineageUuid] = ($quantities[$lineageUuid] ?? 0)
                    + (float) $delivered;
            }
        }

        return new Collection($quantities);
    }

    /**
     * Return validation errors for submitted delivery quantities.
     *
     * @param  array<int, array<string, mixed>>  $items
     * @return array<string, string>
     */
    public function errorsFor(
        Quotation $quotation,
        array $items,
        ?DeliveryOrder $except = null,
    ): array {
        $itemIds = collect($items)
            ->pluck('quotation_item_id')
            ->filter()
            ->map(fn (mixed $id): int => (int) $id);
        $quotationItems = QuotationItem::query()
            ->whereBelongsTo($quotation)
            ->whereIn('id', $itemIds)
            ->get(['id', 'lineage_uuid', 'quantity', 'unit'])
            ->keyBy('id');

        if ($quotationItems->isEmpty()) {
            return [];
        }

        $delivered = $this->deliveredQuantities($quotation, $except);
        $requestedByLineage = [];
        $errors = [];

        foreach ($items as $index => $item) {
            $quotationItem = $quotationItems->get((int) ($item['quotation_item_id'] ?? 0));

            if (! $quotationItem) {
                continue;
            }

            $lineageUuid = $quotationItem->lineage_uuid ?? "item:{$quotationItem->id}";
            $requestedByLineage[$lineageUuid] = ($requestedByLineage[$lineageUuid] ?? 0)
                + (float) ($item['quantity_delivered'] ?? 0);

            $totalDelivered = (float) $delivered->get($lineageUuid, 0)
                + $requestedByLineage[$lineageUuid];

            if ($totalDelivered > (float) $quotationItem->quantity + 0.00001) {
                $errors["items.{$index}.quantity_delivered"] = __('The delivered quantity for this line exceeds the remaining quantity across all quotation versions.');
            }
        }

        return $errors;
    }

    /**
     * @return Collection<int, int>
     */
    private function threadIds(Quotation $quotation): Collection
    {
        $rootId = $quotation->root_quotation_id ?? $quotation->id;

        return Quotation::query()
            ->where(function ($query) use ($rootId): void {
                $query->whereKey($rootId)->orWhere('root_quotation_id', $rootId);
            })
            ->pluck('id');
    }
}
