<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Purchase Order {{ $purchaseOrder->purchase_order_code }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: DejaVu Sans, sans-serif; font-size: 9pt; color: #111; margin: 170px 32px 40px; }
        #header { position: fixed; top: 24px; left: 32px; right: 32px; height: 140px; }
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
            <td width="150" valign="middle" align="center">
                @if ($company->certified_picture)
                    <img src="{{ Storage::disk('public')->path($company->certified_picture) }}" alt="certified" style="max-width:140px; max-height:100px;">
                @endif
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
                        <td width="95" style="font-size:8.5pt;">To</td>
                        <td width="8" style="font-size:8.5pt;">:</td>
                        <td style="font-size:8.5pt; font-weight:bold;">{{ $purchaseOrder->vendor->name }}</td>
                    </tr>
                    <tr>
                        <td style="font-size:8.5pt;">Address</td>
                        <td style="font-size:8.5pt;">:</td>
                        <td style="font-size:8.5pt;">{{ $purchaseOrder->address }}</td>
                    </tr>
                    <tr>
                        <td style="font-size:8.5pt;">Phone/Fax</td>
                        <td style="font-size:8.5pt;">:</td>
                        <td style="font-size:8.5pt;">{{ implode(' / ', array_filter([$purchaseOrder->phone, $purchaseOrder->fax ? 'Fax: ' . $purchaseOrder->fax : null])) }}</td>
                    </tr>
                    <tr>
                        <td style="font-size:8.5pt;">Attn</td>
                        <td style="font-size:8.5pt;">:</td>
                        <td style="font-size:8.5pt;">{{ $purchaseOrder->attention }}</td>
                    </tr>
                    <tr>
                        <td style="font-size:8.5pt;">Quotation No</td>
                        <td style="font-size:8.5pt;">:</td>
                        <td style="font-size:8.5pt;">{{ $purchaseOrder->quotation_no }}</td>
                    </tr>
                    <tr>
                        <td style="font-size:8.5pt;">Date of Quote</td>
                        <td style="font-size:8.5pt;">:</td>
                        <td style="font-size:8.5pt;">{{ $purchaseOrder->quotation_date?->format('d.m.Y') }}</td>
                    </tr>
                    <tr>
                        <td style="font-size:8.5pt;">Project</td>
                        <td style="font-size:8.5pt;">:</td>
                        <td style="font-size:8.5pt;">{{ $purchaseOrder->project_name }}</td>
                    </tr>
                </table>
            </td>
            <td valign="top" width="50%" style="text-align:right;">
                <div style="font-size:14pt; font-weight:bold; margin-bottom:6px;">purchase order</div>
                <table cellpadding="2" cellspacing="0" style="margin-left:auto;">
                    <tr>
                        <td style="font-size:8pt;">PO No</td>
                        <td style="font-size:8pt; padding:0 6px;">:</td>
                        <td style="font-size:8pt; font-weight:bold;">{{ $purchaseOrder->purchase_order_code }}</td>
                    </tr>
                    <tr>
                        <td style="font-size:8pt;">Date</td>
                        <td style="font-size:8pt; padding:0 6px;">:</td>
                        <td style="font-size:8pt; font-weight:bold;">{{ $purchaseOrder->date->format('d.m.Y') }}</td>
                    </tr>
                    <tr>
                        <td style="font-size:8pt;">Currency</td>
                        <td style="font-size:8pt; padding:0 6px;">:</td>
                        <td style="font-size:8pt; font-weight:bold;">{{ $purchaseOrder->currency->iso_code }}</td>
                    </tr>
                    <tr>
                        <td style="font-size:8pt;">TAX ID / NPWP</td>
                        <td style="font-size:8pt; padding:0 6px;">:</td>
                        <td style="font-size:8pt; font-weight:bold;">{{ $company->tax_id }}</td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</div>

{{-- SHIPPING --}}
<table width="100%" cellpadding="4" cellspacing="0" style="border-collapse:collapse; margin-bottom:14px;">
    <thead>
        <tr style="background:#1a1a1a; color:#fff; font-size:8pt; font-weight:bold; line-height:1.1;">
            <th style="border:1px solid #555; text-align:left; padding:2px 3px;">Shipping Method</th>
            <th style="border:1px solid #555; text-align:left; padding:2px 3px;">Shipping Terms</th>
            <th style="border:1px solid #555; text-align:left; padding:2px 3px;">Delivery Date</th>
        </tr>
    </thead>
    <tbody>
        <tr style="font-size:8.5pt; line-height:1.1;">
            <td style="border:1px solid #ccc; padding:2px 3px;">{{ $purchaseOrder->shipping_method }}</td>
            <td style="border:1px solid #ccc; padding:2px 3px;">{{ $purchaseOrder->shipping_terms }}</td>
            <td style="border:1px solid #ccc; padding:2px 3px;">{{ $purchaseOrder->delivery_date?->format('d.m.Y') }}</td>
        </tr>
    </tbody>
</table>

{{-- ITEMS --}}
@php $currencyCode = $purchaseOrder->currency->iso_code; @endphp
<table width="100%" cellpadding="4" cellspacing="0" style="border-collapse:collapse; margin-bottom:6px;">
    <thead>
        <tr style="background:#1a1a1a; color:#fff; font-size:8pt; font-weight:bold; line-height:1.1;">
            <th width="24"  style="border:1px solid #555; text-align:center; padding:2px 3px;">No</th>
            <th width="80"  style="border:1px solid #555; text-align:left;   padding:2px 3px;">Reference Number</th>
            <th            style="border:1px solid #555; text-align:left;   padding:2px 3px;">Description</th>
            <th width="40"  style="border:1px solid #555; text-align:right;  padding:2px 3px;">QTY</th>
            <th width="34"  style="border:1px solid #555; text-align:center; padding:2px 3px;">UOM</th>
            <th width="70"  style="border:1px solid #555; text-align:right;  padding:2px 3px;">Price</th>
            <th width="78"  style="border:1px solid #555; text-align:right;  padding:2px 3px;">Amount</th>
        </tr>
    </thead>
    <tbody>
        @foreach ($purchaseOrder->items as $i => $item)
            <tr style="font-size:8.5pt; line-height:1.1;">
                <td style="border:1px solid #ccc; text-align:center; padding:2px 3px;">{{ $i + 1 }}</td>
                <td style="border:1px solid #ccc; padding:2px 3px;">{{ $item->reference_number }}</td>
                <td style="border:1px solid #ccc; padding:2px 3px;">
                    {{ $item->product->name }}
                    @if ($item->description)
                        <div style="font-size:7.5pt; color:#666;">{{ $item->description }}</div>
                    @endif
                </td>
                <td style="border:1px solid #ccc; text-align:right; padding:2px 3px;">{{ number_format((float) $item->quantity, 2) }}</td>
                <td style="border:1px solid #ccc; text-align:center; padding:2px 3px;">{{ $item->unit }}</td>
                <td style="border:1px solid #ccc; text-align:right; padding:2px 3px;">{{ number_format((float) $item->unit_price, 0) }}</td>
                <td style="border:1px solid #ccc; text-align:right; padding:2px 3px;">{{ number_format((float) $item->total, 0) }}</td>
            </tr>
        @endforeach
    </tbody>
</table>

{{-- SUMMARY --}}
<table width="100%" cellpadding="4" cellspacing="0" style="border-collapse:collapse; margin-bottom:14px;">
    <tr style="background:#f5f5f5; font-size:8.5pt; line-height:1.1;">
        <td colspan="5" style="border:1px solid #ccc; text-align:right; padding:2px 6px;">Sub Total</td>
        <td width="70" style="border:1px solid #ccc; text-align:right; padding:2px 6px;">{{ $currencyCode }}</td>
        <td width="78" style="border:1px solid #ccc; text-align:right; padding:2px 6px;">{{ number_format((float) $purchaseOrder->subtotal, 0) }}</td>
    </tr>
    @foreach ($purchaseOrder->discounts as $discount)
        <tr style="background:#f5f5f5; font-size:8.5pt; line-height:1.1;">
            <td colspan="5" style="border:1px solid #ccc; text-align:right; padding:2px 6px;">
                {{ $discount->label }}
                ({{ $discount->discount_type === 'percentage' ? $discount->discount_value . '%' : number_format((float) $discount->discount_value, 0) }})
            </td>
            <td style="border:1px solid #ccc; text-align:right; padding:2px 6px;">{{ $currencyCode }}</td>
            <td style="border:1px solid #ccc; text-align:right; padding:2px 6px;">- {{ number_format((float) $discount->discount_amount, 0) }}</td>
        </tr>
        <tr style="font-size:8.5pt; font-style:italic; line-height:1.1;">
            <td colspan="5" style="border:1px solid #ccc; text-align:right; padding:2px 6px;">Sub Total after {{ $discount->label }}</td>
            <td style="border:1px solid #ccc; text-align:right; padding:2px 6px;">{{ $currencyCode }}</td>
            <td style="border:1px solid #ccc; text-align:right; padding:2px 6px;">{{ number_format((float) $discount->base_amount - (float) $discount->discount_amount, 0) }}</td>
        </tr>
    @endforeach
    <tr style="background:#f5f5f5; font-size:8.5pt; line-height:1.1;">
        <td colspan="5" style="border:1px solid #ccc; text-align:right; padding:2px 6px;">Tax</td>
        <td style="border:1px solid #ccc; text-align:right; padding:2px 6px;">{{ $currencyCode }}</td>
        <td style="border:1px solid #ccc; text-align:right; padding:2px 6px;">{{ number_format((float) $purchaseOrder->tax_amount, 0) }}</td>
    </tr>
    <tr style="background:#1a1a1a; color:#fff; font-size:9.5pt; font-weight:bold; line-height:1.1;">
        <td colspan="5" style="border:1px solid #555; text-align:right; padding:3px 6px;">Grand Total</td>
        <td style="border:1px solid #555; text-align:right; padding:3px 6px;">{{ $currencyCode }}</td>
        <td style="border:1px solid #555; text-align:right; padding:3px 6px;">{{ number_format((float) $purchaseOrder->grand_total, 0) }}</td>
    </tr>
</table>

{{-- NOTES --}}
<div style="font-size:8pt; color:#333; line-height:1.7; margin-bottom:20px;">
    <style>
        .notes-content p { margin: 0 0 6px; }
        .notes-content ol { margin: 0; padding-left: 16px; }
        .notes-content li { margin-bottom: 6px; }
        .notes-content li:last-child { margin-bottom: 0; }
    </style>
    <div class="notes-content">{!! $notesHtml !!}</div>
</div>

{{-- SIGNATURES --}}
@php
    $signatures = [
        ['label' => 'Issued By', 'name' => $purchaseOrder->issuedBy?->full_name, 'date' => $purchaseOrder->issued_at],
        ['label' => 'Checked By', 'name' => $purchaseOrder->checkedByFirst?->full_name, 'date' => $purchaseOrder->checked_by_1_at],
        ['label' => 'Checked By', 'name' => $purchaseOrder->checkedBySecond?->full_name, 'date' => $purchaseOrder->checked_by_2_at],
        ['label' => 'Approved By', 'name' => $purchaseOrder->approvedBy?->full_name, 'date' => $purchaseOrder->approved_at],
    ];
@endphp
<table width="100%" cellpadding="0" cellspacing="0">
    <tr>
        @foreach ($signatures as $signature)
            <td width="25%" valign="top" style="text-align:center;">
                <div style="font-size:8.5pt; font-weight:bold; margin-bottom:50px;">{{ $signature['label'] }}</div>
                <table cellpadding="0" cellspacing="0" style="margin:0 auto; min-width:110px;">
                    <tr>
                        <td style="border-top:1px solid #333; padding-top:4px; text-align:center;">
                            <div style="font-size:8pt; font-weight:bold;">{{ $signature['name'] ?: ' ' }}</div>
                            <div style="font-size:7.5pt; color:#555; margin-top:6px;">Date</div>
                            <div style="font-size:7.5pt; color:#555;">{{ $signature['date']?->format('d.m.Y') }}</div>
                        </td>
                    </tr>
                </table>
            </td>
        @endforeach
    </tr>
</table>

</body>
</html>
