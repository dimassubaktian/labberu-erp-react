<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('quotation_items', function (Blueprint $table): void {
            $table->uuid('lineage_uuid')->nullable()->after('quotation_id')->index();
        });

        $this->backfillLineages();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('quotation_items', function (Blueprint $table): void {
            $table->dropIndex(['lineage_uuid']);
            $table->dropColumn('lineage_uuid');
        });
    }

    /**
     * Assign a stable lineage to existing quotation lines, matching revision copies to the
     * preceding version where their product, unit, group, and occurrence identify the same line.
     */
    private function backfillLineages(): void
    {
        $quotations = DB::table('quotations')
            ->select('id', 'project_id', 'root_quotation_id', 'version_major', 'version_minor')
            ->orderBy('project_id')
            ->orderBy('version_major')
            ->orderBy('version_minor')
            ->orderBy('id')
            ->get()
            ->groupBy(fn (object $quotation): int => $quotation->root_quotation_id ?? $quotation->id);

        foreach ($quotations as $thread) {
            $previousLineages = [];

            foreach ($thread as $quotation) {
                $items = DB::table('quotation_items')
                    ->leftJoin('quotation_groups', 'quotation_groups.id', '=', 'quotation_items.quotation_group_id')
                    ->where('quotation_items.quotation_id', $quotation->id)
                    ->orderBy('quotation_items.id')
                    ->get([
                        'quotation_items.id',
                        'quotation_items.product_id',
                        'quotation_items.unit',
                        'quotation_groups.name as group_name',
                    ]);

                $occurrences = [];
                $globalOccurrences = [];
                $currentLineages = [];

                foreach ($items as $item) {
                    $groupName = $item->group_name ?? '';
                    $groupKey = "{$groupName}|{$item->product_id}|{$item->unit}";
                    $globalKey = "{$item->product_id}|{$item->unit}";
                    $occurrence = $occurrences[$groupKey] ?? 0;
                    $globalOccurrence = $globalOccurrences[$globalKey] ?? 0;
                    $occurrences[$groupKey] = $occurrence + 1;
                    $globalOccurrences[$globalKey] = $globalOccurrence + 1;

                    $lineageUuid = $previousLineages["{$groupKey}|{$occurrence}"]
                        ?? $previousLineages["{$globalKey}|{$globalOccurrence}"]
                        ?? (string) Str::uuid();

                    DB::table('quotation_items')
                        ->where('id', $item->id)
                        ->update(['lineage_uuid' => $lineageUuid]);

                    $currentLineages["{$groupKey}|{$occurrence}"] = $lineageUuid;
                    $currentLineages["{$globalKey}|{$globalOccurrence}"] = $lineageUuid;
                }

                $previousLineages = $currentLineages;
            }
        }
    }
};
