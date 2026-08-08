<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Bill of Materials {{ $quotation->quotation_code }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: DejaVu Sans, sans-serif; font-size: 9pt; color: #111; margin: 130px 32px 40px; }
        #header { position: fixed; top: 24px; left: 32px; right: 32px; height: 100px; }
    </style>
</head>
<body>

<div id="header">
    <table width="100%" cellpadding="0" cellspacing="0" style="border-bottom: 4px double #111; padding-bottom: 10px;">
        <tr>
            <td width="80" valign="middle" align="center">
                @if ($company->logo)
                    <img src="{{ Storage::disk('public')->path($company->logo) }}" alt="logo" style="max-width:70px; max-height:60px;">
                @endif
            </td>
            <td valign="middle" style="padding-left:10px;">
                <div style="font-size:15pt; font-weight:bold;">{{ $company->legal_name }}</div>
                @php
                    $addressParts = array_filter([
                        $company->address,
                        implode(', ', array_filter([$company->city, $company->province, $company->postal_code, $company->country])),
                    ]);
                    $contactParts = array_filter([
                        $company->phone ? 'Phone : ' . $company->phone : null,
                        $company->website,
                        $company->email,
                    ]);
                @endphp
                <div style="font-size:8pt; color:#444; margin-top:2px;">{{ implode(', ', $addressParts) }}</div>
                <div style="font-size:8pt; color:#444; margin-bottom:6px;">{{ implode(', ', $contactParts) }}</div>
            </td>
        </tr>
    </table>
</div>

{{-- INFO BLOCK --}}
<div style="border: 1px solid #111; padding: 8px 10px; margin-bottom: 14px;">
    <div style="text-align:right; font-size:11pt; font-weight:bold; margin-bottom:8px;">Bill of Materials</div>
    <table width="100%" cellpadding="2" cellspacing="0">
        <tr>
            <td width="130" valign="bottom" style="font-size:8.5pt;">Customer</td>
            <td width="8" valign="bottom" style="font-size:8.5pt;">:</td>
            <td valign="bottom" style="font-size:8.5pt; font-weight:bold; border-bottom:1px dotted #999; padding-bottom:2px;">{{ $quotation->project->customer->name }}</td>
        </tr>
        <tr>
            <td valign="bottom" style="font-size:8.5pt;">Project Name</td>
            <td valign="bottom" style="font-size:8.5pt;">:</td>
            <td valign="bottom" style="font-size:8.5pt; border-bottom:1px dotted #999; padding-bottom:2px;">{{ $quotation->project->name }}</td>
        </tr>
        <tr>
            <td valign="bottom" style="font-size:8.5pt;">Revision No &amp; Date</td>
            <td valign="bottom" style="font-size:8.5pt;">:</td>
            <td valign="bottom" style="font-size:8.5pt; border-bottom:1px dotted #999; padding-bottom:2px;">{{ $quotation->version_major }}.{{ $quotation->version_minor }}&nbsp;&nbsp;{{ $quotation->created_at->format('d.m.Y') }}</td>
        </tr>
        <tr>
            <td valign="bottom" style="font-size:8.5pt;">Project No</td>
            <td valign="bottom" style="font-size:8.5pt;">:</td>
            <td valign="bottom" style="font-size:8.5pt; border-bottom:1px dotted #999; padding-bottom:2px;">{{ $quotation->project->project_code }}</td>
        </tr>
    </table>
</div>

@php
    $noWidth = 8;
    $refWidth = 15;
    $brandWidth = 13;
    $qtyWidth = 14;
    $descWidth = 100 - $noWidth - $refWidth - $brandWidth - $qtyWidth;

    $wrap = 'word-wrap:break-word; overflow-wrap:break-word;';

    $tableOpen = '<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; table-layout:fixed; margin-bottom:6px;">'
        . '<thead><tr style="background:#1a1a1a; color:#fff; font-size:8pt; font-weight:bold; line-height:1.1;">'
        . '<th width="' . $noWidth . '%" style="border:1px solid #555; text-align:center; padding:2px 2px; ' . $wrap . '">No</th>'
        . '<th width="' . $refWidth . '%" style="border:1px solid #555; text-align:center; padding:2px 3px; ' . $wrap . '">Reference Number</th>'
        . '<th width="' . $brandWidth . '%" style="border:1px solid #555; text-align:center; padding:2px 3px; ' . $wrap . '">Brand</th>'
        . '<th width="' . $descWidth . '%" style="border:1px solid #555; text-align:center; padding:2px 3px; ' . $wrap . '">Description</th>'
        . '<th width="' . $qtyWidth . '%" style="border:1px solid #555; text-align:center; padding:2px 2px; ' . $wrap . '">QTY</th>'
        . '</tr></thead><tbody>';

    $renderItemRow = function ($item, $no) use ($wrap) {
        $quantity = (float) $item->quantity;
        $decimals = $quantity == floor($quantity) ? 0 : 2;

        return '<tr style="font-size:8.5pt; line-height:1.1;">'
            . '<td style="border:1px solid #ccc; text-align:center; padding:2px 2px; ' . $wrap . '">' . $no . '</td>'
            . '<td style="border:1px solid #ccc; text-align:center; padding:2px 3px; ' . $wrap . '">' . e($item->product->reference_number ?? '-') . '</td>'
            . '<td style="border:1px solid #ccc; text-align:center; padding:2px 3px; ' . $wrap . '">' . e($item->brand) . '</td>'
            . '<td style="border:1px solid #ccc; padding:2px 3px; ' . $wrap . '">' . e($item->product->name ?? '-') . '</td>'
            . '<td style="border:1px solid #ccc; text-align:center; padding:2px 2px; ' . $wrap . '">' . number_format($quantity, $decimals) . ' ' . e($item->unit) . '</td>'
            . '</tr>';
    };

    $renderSectionRow = function ($label) use ($wrap) {
        return '<tr style="background:#f0f0f0; font-size:8.5pt; font-weight:bold; line-height:1.1;">'
            . '<td style="border:1px solid #ccc; padding:2px 3px;"></td>'
            . '<td colspan="4" style="border:1px solid #ccc; padding:2px 6px; ' . $wrap . '">' . e($label) . '</td>'
            . '</tr>';
    };

    $renderItemsTable = function ($items) use ($tableOpen, $renderItemRow) {
        $html = $tableOpen;

        foreach ($items as $i => $item) {
            $html .= $renderItemRow($item, $i + 1);
        }

        $html .= '</tbody></table>';

        return $html;
    };

    $renderGroupTable = function ($group) use ($tableOpen, $renderItemRow, $renderSectionRow) {
        if ($group->items->isEmpty() && $group->subgroups->isEmpty()) {
            return '';
        }

        $html = $tableOpen;
        $no = 1;

        foreach ($group->items as $item) {
            $html .= $renderItemRow($item, $no++);
        }

        foreach ($group->subgroups as $subgroup) {
            $html .= $renderSectionRow($subgroup->name);

            foreach ($subgroup->items as $item) {
                $html .= $renderItemRow($item, $no++);
            }
        }

        $html .= '</tbody></table>';

        return $html;
    };
@endphp

{{-- HARDWARE GROUPS --}}
@foreach ($bom->groups as $group)
    <div style="font-size:9.5pt; font-weight:bold; margin-bottom:4px;">{{ $group->name }}</div>
    {!! $renderGroupTable($group) !!}
@endforeach

{{-- STANDALONE PHASE SUBGROUPS --}}
@foreach ($bom->subgroups as $subgroup)
    <div style="font-size:9.5pt; font-weight:bold; margin-bottom:4px;">{{ $subgroup->name }}</div>
    {!! $renderItemsTable($subgroup->items) !!}
@endforeach

{{-- UNGROUPED ITEMS --}}
@if ($bom->items->isNotEmpty())
    {!! $renderItemsTable($bom->items) !!}
@endif

@if ($bom->remarks)
    <div style="margin-top:12px;">
        <div style="font-size:8.5pt; font-weight:bold; margin-bottom:4px;">Remarks</div>
        <div style="font-size:8pt; color:#333; white-space:pre-line;">{{ $bom->remarks }}</div>
    </div>
@endif

</body>
</html>
