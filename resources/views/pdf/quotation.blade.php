<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Quotation {{ $quotation->quotation_code }}</title>
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
    <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
            <td valign="top" width="50%">
                <table cellpadding="2" cellspacing="0">
                    <tr>
                        <td width="80" style="font-size:8.5pt;">To</td>
                        <td width="8" style="font-size:8.5pt;">:</td>
                        <td style="font-size:8.5pt; font-weight:bold;">{{ $quotation->project->customer->name }}</td>
                    </tr>
                    @php
                        $customer = $quotation->project->customer;
                        $customerAddressParts = array_filter([
                            $customer->address,
                            implode(', ', array_filter([$customer->city, $customer->province, $customer->postal_code, $customer->country])),
                        ]);
                        $customerPhoneFax = array_filter([
                            $customer->phone,
                            $customer->fax ? 'Fax: ' . $customer->fax : null,
                        ]);
                    @endphp
                    <tr>
                        <td valign="top" style="font-size:8.5pt;">Address</td>
                        <td valign="top" style="font-size:8.5pt;">:</td>
                        <td valign="top" style="font-size:8.5pt;">{{ implode(', ', $customerAddressParts) }}</td>
                    </tr>
                    <tr>
                        <td style="font-size:8.5pt;">Phone / Fax</td>
                        <td style="font-size:8.5pt;">:</td>
                        <td style="font-size:8.5pt;">{{ implode(' / ', $customerPhoneFax) }}</td>
                    </tr>
                    <tr>
                        <td style="font-size:8.5pt;">Attn</td>
                        <td style="font-size:8.5pt;">:</td>
                        <td style="font-size:8.5pt;">{{ $customer->attention }}</td>
                    </tr>
                    <tr>
                        <td style="font-size:8.5pt;">Date Of Req</td>
                        <td style="font-size:8.5pt;">:</td>
                        <td style="font-size:8.5pt;">{{ $quotation->created_at->format('d.m.Y') }}</td>
                    </tr>
                </table>
            </td>
            <td valign="top" width="50%" style="text-align:right;">
                <div style="font-size:14pt; font-weight:bold; margin-bottom:6px;">QUOTATION</div>
                <table cellpadding="2" cellspacing="0" style="margin-left:auto;">
                    <tr>
                        <td style="font-size:8pt;">Rev. No &amp; Date</td>
                        <td style="font-size:8pt; padding:0 6px;">:</td>
                        <td style="font-size:8pt; font-weight:bold;">{{ $quotation->version_major }}.{{ $quotation->version_minor }}&nbsp;&nbsp;{{ $quotation->created_at->format('d.m.Y') }}</td>
                    </tr>
                    <tr>
                        <td style="font-size:8pt;">Currency</td>
                        <td style="font-size:8pt; padding:0 6px;">:</td>
                        <td style="font-size:8pt; font-weight:bold;">{{ $quotation->currency->iso_code }}</td>
                    </tr>
                    <tr>
                        <td style="font-size:8pt;">Project No</td>
                        <td style="font-size:8pt; padding:0 6px;">:</td>
                        <td style="font-size:8pt; font-weight:bold;">{{ $quotation->project->project_code }}</td>
                    </tr>
                    <tr>
                        <td style="font-size:8pt;">Project Name</td>
                        <td style="font-size:8pt; padding:0 6px;">:</td>
                        <td style="font-size:8pt; font-weight:bold;">{{ $quotation->project->name }}</td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</div>

{{-- ITEMS --}}
@php
    $currencyCode = $quotation->currency->iso_code;
    $hasGroups    = $quotation->groups->isNotEmpty();
    $hasUngrouped = $quotation->items->isNotEmpty();
@endphp

{{-- GROUPED: one table per group --}}
@foreach ($quotation->groups as $gi => $group)
    @php $itemCount = $group->items->count(); @endphp
    <table width="100%" cellpadding="4" cellspacing="0" style="border-collapse:collapse; margin-bottom:6px;">
        <thead>
            <tr style="background:#1a1a1a; color:#fff; font-size:8pt; font-weight:bold; line-height:1.1;">
                <th width="24"  style="border:1px solid #555; text-align:center; padding:2px 3px;">No</th>
                <th            style="border:1px solid #555; text-align:left;   padding:2px 3px;">Description</th>
                <th width="55"  style="border:1px solid #555; text-align:center; padding:2px 3px;">Brand</th>
                <th width="38"  style="border:1px solid #555; text-align:right;  padding:2px 3px;">QTY</th>
                <th width="34"  style="border:1px solid #555; text-align:center; padding:2px 3px;">UOM</th>
                <th width="78"  style="border:1px solid #555; text-align:right;  padding:2px 3px;">Unit Price</th>
                <th width="78"  style="border:1px solid #555; text-align:right;  padding:2px 3px;">Amount</th>
            </tr>
            <tr style="background:#f0f0f0; font-size:8.5pt; font-weight:bold; line-height:1.1;">
                <td style="border:1px solid #ccc; padding:2px 3px;"></td>
                <td colspan="6" style="border:1px solid #ccc; padding:2px 6px;">{{ $group->name }}</td>
            </tr>
        </thead>
        <tbody>
            @foreach ($group->items as $i => $item)
                <tr style="font-size:8.5pt; line-height:1.1;">
                    <td style="border:1px solid #ccc; text-align:center; padding:2px 3px;">{{ $i + 1 }}</td>
                    <td style="border:1px solid #ccc; padding:2px 3px;">{{ $item->product->name ?? $item->description ?? '-' }}</td>
                    <td style="border:1px solid #ccc; padding:2px 3px;">{{ $item->product->brand ?? '-' }}</td>
                    <td style="border:1px solid #ccc; text-align:right; padding:2px 3px;">{{ number_format((float)$item->quantity, 2) }}</td>
                    <td style="border:1px solid #ccc; text-align:center; padding:2px 3px;">{{ $item->unit }}</td>
                    <td style="border:1px solid #ccc; text-align:right; padding:2px 3px;">{{ number_format((float)$item->unit_price, 0) }}</td>
                    <td style="border:1px solid #ccc; text-align:right; padding:2px 3px;">{{ number_format((float)$item->total_price, 0) }}</td>
                </tr>
            @endforeach
            <tr style="background:#f5f5f5; font-size:8.5pt; font-weight:bold; line-height:1.1;">
                <td colspan="5" style="border:1px solid #ccc; text-align:right; padding:2px 6px;">TOTAL</td>
                <td style="border:1px solid #ccc; text-align:right; padding:2px 6px;">{{ $currencyCode }}</td>
                <td style="border:1px solid #ccc; text-align:right; padding:2px 6px;">{{ number_format((float)$group->subtotal, 0) }}</td>
            </tr>
            @if ($group->tax)
                <tr style="background:#f5f5f5; font-size:8.5pt; line-height:1.1;">
                    <td colspan="5" style="border:1px solid #ccc; text-align:right; padding:2px 6px;">{{ $group->tax->name }} {{ $group->tax->rate }}%</td>
                    <td style="border:1px solid #ccc; text-align:right; padding:2px 6px;">{{ $currencyCode }}</td>
                    <td style="border:1px solid #ccc; text-align:right; padding:2px 6px;">{{ number_format((float)$group->tax_amount, 0) }}</td>
                </tr>
            @endif
            @php $groupLabel = 'TOTAL ' . chr(65 + $gi); @endphp
            <tr style="background:#e8e8e8; font-size:8.5pt; font-weight:bold; line-height:1.1;">
                <td colspan="5" style="border:1px solid #ccc; text-align:right; padding:2px 6px;">{{ $groupLabel }}</td>
                <td style="border:1px solid #ccc; text-align:right; padding:2px 6px;">{{ $currencyCode }}</td>
                <td style="border:1px solid #ccc; text-align:right; padding:2px 6px;">{{ number_format((float)$group->total, 0) }}</td>
            </tr>
        </tbody>
    </table>
@endforeach

{{-- UNGROUPED ITEMS --}}
@if ($hasUngrouped)
    <table width="100%" cellpadding="4" cellspacing="0" style="border-collapse:collapse; margin-bottom:6px;">
        <thead>
            <tr style="background:#1a1a1a; color:#fff; font-size:8pt; font-weight:bold; line-height:1.1;">
                <th width="24"  style="border:1px solid #555; text-align:center; padding:2px 3px;">No</th>
                <th            style="border:1px solid #555; text-align:left;   padding:2px 3px;">Description</th>
                <th width="55"  style="border:1px solid #555; text-align:center; padding:2px 3px;">Brand</th>
                <th width="38"  style="border:1px solid #555; text-align:right;  padding:2px 3px;">QTY</th>
                <th width="34"  style="border:1px solid #555; text-align:center; padding:2px 3px;">UOM</th>
                <th width="78"  style="border:1px solid #555; text-align:right;  padding:2px 3px;">Unit Price</th>
                <th width="78"  style="border:1px solid #555; text-align:right;  padding:2px 3px;">Amount</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($quotation->items as $i => $item)
                <tr style="font-size:8.5pt; line-height:1.1;">
                    <td style="border:1px solid #ccc; text-align:center; padding:2px 3px;">{{ $i + 1 }}</td>
                    <td style="border:1px solid #ccc; padding:2px 3px;">{{ $item->product->name ?? $item->description ?? '-' }}</td>
                    <td style="border:1px solid #ccc; padding:2px 3px;">{{ $item->product->brand ?? '-' }}</td>
                    <td style="border:1px solid #ccc; text-align:right; padding:2px 3px;">{{ number_format((float)$item->quantity, 2) }}</td>
                    <td style="border:1px solid #ccc; text-align:center; padding:2px 3px;">{{ $item->unit }}</td>
                    <td style="border:1px solid #ccc; text-align:right; padding:2px 3px;">{{ number_format((float)$item->unit_price, 0) }}</td>
                    <td style="border:1px solid #ccc; text-align:right; padding:2px 3px;">{{ number_format((float)$item->total_price, 0) }}</td>
                </tr>
            @endforeach
            <tr style="background:#f5f5f5; font-size:8.5pt; font-weight:bold; line-height:1.1;">
                <td colspan="5" style="border:1px solid #ccc; text-align:right; padding:2px 6px;">TOTAL</td>
                <td style="border:1px solid #ccc; text-align:right; padding:2px 6px;">{{ $currencyCode }}</td>
                <td style="border:1px solid #ccc; text-align:right; padding:2px 6px;">{{ number_format($isPartialPrint ? (float)$quotation->items->sum('total_price') : (float)$quotation->subtotal, 0) }}</td>
            </tr>
            @if (! $isPartialPrint && (float)$quotation->discount_amount > 0)
                @php
                    $discLabel = 'DISCOUNT';
                    if ($quotation->discount_type === 'percentage') {
                        $discLabel .= ' (' . $quotation->discount_value . '%)';
                    }
                @endphp
                <tr style="background:#f5f5f5; font-size:8.5pt; line-height:1.1;">
                    <td colspan="5" style="border:1px solid #ccc; text-align:right; padding:2px 6px;">{{ $discLabel }}</td>
                    <td style="border:1px solid #ccc; text-align:right; padding:2px 6px;">{{ $currencyCode }}</td>
                    <td style="border:1px solid #ccc; text-align:right; padding:2px 6px;">- {{ number_format((float)$quotation->discount_amount, 0) }}</td>
                </tr>
            @endif
            @if (! $isPartialPrint && $quotation->tax)
                <tr style="background:#f5f5f5; font-size:8.5pt; line-height:1.1;">
                    <td colspan="5" style="border:1px solid #ccc; text-align:right; padding:2px 6px;">{{ $quotation->tax->name }} {{ $quotation->tax->rate }}%</td>
                    <td style="border:1px solid #ccc; text-align:right; padding:2px 6px;">{{ $currencyCode }}</td>
                    <td style="border:1px solid #ccc; text-align:right; padding:2px 6px;">{{ number_format((float)$quotation->tax_amount, 0) }}</td>
                </tr>
            @endif
        </tbody>
    </table>
@endif

{{-- GRAND TOTAL --}}
<table width="100%" cellpadding="4" cellspacing="0" style="border-collapse:collapse; margin-bottom:{{ $isPartialPrint ? '4px' : '12px' }};">
    <tr style="background:#1a1a1a; color:#fff; font-size:9.5pt; font-weight:bold; line-height:1.1;">
        <td style="border:1px solid #555; text-align:right; padding:3px 6px;">{{ $isPartialPrint ? 'TOTAL' : 'GRAND TOTAL' }}</td>
        <td width="78" style="border:1px solid #555; text-align:right; padding:3px 6px;">{{ $currencyCode }}</td>
        <td width="78" style="border:1px solid #555; text-align:right; padding:3px 6px;">{{ number_format($isPartialPrint ? (float)$partialTotal : (float)$quotation->total, 0) }}</td>
    </tr>
</table>
@if ($isPartialPrint)
    <p style="font-size:7.5pt; color:#666; margin-bottom:12px;">
        This document shows a partial selection of the quotation. The overall discount and tax are not applied here — refer to the full quotation for the official grand total.
    </p>
@endif

{{-- FOOTER: payment terms + signature --}}
<table width="100%" cellpadding="0" cellspacing="0">
    <tr>
        <td width="55%" valign="top" style="padding-right:16px;">
            <div style="font-size:8.5pt; font-weight:bold; margin-bottom:6px;">Term Of Payment &amp; Condition :</div>
            @if ($quotation->payment_terms_html)
                <div style="font-size:8pt; color:#333; line-height:1.6;">{!! $quotation->payment_terms_html !!}</div>
            @endif

            @if ($company->certified_picture)
                <div style="text-align:left; border-top:1px solid #ccc; padding-top:6px; margin-top:12px;">
                    <img src="{{ Storage::disk('public')->path($company->certified_picture) }}" alt="certified" style="max-height:60px; max-width:220px;">
                </div>
            @endif
        </td>
        <td width="45%" valign="top" style="text-align:center;">
            <div style="font-size:8.5pt; margin-bottom:4px;">Yours Sincerely,</div>
            <div style="font-size:9.5pt; font-weight:bold; margin-bottom:35px;">{{ strtoupper($company->legal_name ?? '') }}</div>
            <table cellpadding="0" cellspacing="0" style="margin:0 auto; min-width:150px;">
                <tr>
                    <td style="border-top:1px solid #333; padding-top:4px; text-align:center;">
                        <div style="font-size:8.5pt; font-weight:bold;">
                            @if ($quotation->approver)
                                {{ $quotation->approver->name }}
                            @else
                                &nbsp;
                            @endif
                        </div>
                        <div style="font-size:7.5pt; color:#555;">
                            @if ($quotation->approver)
                                Authorized Signatory
                            @else
                                &nbsp;
                            @endif
                        </div>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>

</body>
</html>
