<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Goods Receipt Note {{ $goodsReceiptNote->grn_code }}</title>
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
@php
    $vendor = $goodsReceiptNote->purchaseOrder->vendor;
    $vendorPhoneFax = array_filter([
        $vendor->phone,
        $vendor->fax ? 'Fax: ' . $vendor->fax : null,
    ]);
@endphp
<div style="border: 1px solid #111; padding: 8px 10px; margin-bottom: 14px;">
    <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
            <td valign="top" width="50%">
                <table cellpadding="2" cellspacing="0">
                    <tr>
                        <td width="90" style="font-size:8.5pt;">From</td>
                        <td width="8" style="font-size:8.5pt;">:</td>
                        <td style="font-size:8.5pt; font-weight:bold;">{{ $vendor->name }}</td>
                    </tr>
                    <tr>
                        <td valign="top" style="font-size:8.5pt;">Address</td>
                        <td valign="top" style="font-size:8.5pt;">:</td>
                        <td valign="top" style="font-size:8.5pt;">{{ $vendor->address }}</td>
                    </tr>
                    <tr>
                        <td style="font-size:8.5pt;">Phone/Fax</td>
                        <td style="font-size:8.5pt;">:</td>
                        <td style="font-size:8.5pt;">{{ implode(' / ', $vendorPhoneFax) }}</td>
                    </tr>
                    <tr>
                        <td style="font-size:8.5pt;">Attn</td>
                        <td style="font-size:8.5pt;">:</td>
                        <td style="font-size:8.5pt;">{{ $vendor->attention }}</td>
                    </tr>
                    <tr>
                        <td style="font-size:8.5pt;">PO No</td>
                        <td style="font-size:8.5pt;">:</td>
                        <td style="font-size:8.5pt;">{{ $goodsReceiptNote->purchaseOrder->purchase_order_code }}</td>
                    </tr>
                </table>
            </td>
            <td valign="top" width="50%" style="text-align:right;">
                <div style="font-size:14pt; font-weight:bold; margin-bottom:6px;">GOODS RECEIPT NOTE</div>
                <table cellpadding="2" cellspacing="0" style="margin-left:auto;">
                    <tr>
                        <td style="font-size:8pt;">GRN No</td>
                        <td style="font-size:8pt; padding:0 6px;">:</td>
                        <td style="font-size:8pt; font-weight:bold;">{{ $goodsReceiptNote->grn_code }}</td>
                    </tr>
                    <tr>
                        <td style="font-size:8pt;">Date</td>
                        <td style="font-size:8pt; padding:0 6px;">:</td>
                        <td style="font-size:8pt; font-weight:bold;">{{ $goodsReceiptNote->received_date->format('d.m.Y') }}</td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</div>

{{-- ITEMS --}}
<table width="100%" cellpadding="4" cellspacing="0" style="border-collapse:collapse; margin-bottom:14px;">
    <thead>
        <tr style="background:#1a1a1a; color:#fff; font-size:8pt; font-weight:bold; line-height:1.1;">
            <th width="24"  style="border:1px solid #555; text-align:center; padding:2px 3px;">No</th>
            <th            style="border:1px solid #555; text-align:left;   padding:2px 3px;">Descriptions</th>
            <th width="55"  style="border:1px solid #555; text-align:right;  padding:2px 3px;">Ordered</th>
            <th width="55"  style="border:1px solid #555; text-align:right;  padding:2px 3px;">Accepted</th>
            <th width="55"  style="border:1px solid #555; text-align:right;  padding:2px 3px;">Rejected</th>
            <th width="45"  style="border:1px solid #555; text-align:center; padding:2px 3px;">UOM</th>
        </tr>
    </thead>
    <tbody>
        @foreach ($goodsReceiptNote->items as $i => $item)
            <tr style="font-size:8.5pt; line-height:1.1;">
                <td style="border:1px solid #ccc; text-align:center; padding:2px 3px;">{{ $i + 1 }}</td>
                <td style="border:1px solid #ccc; padding:2px 3px;">
                    {{ $item->product->name }}
                    @if ($item->rejection_reason)
                        <div style="font-size:7.5pt; color:#666;">Rejected: {{ $item->rejection_reason }}</div>
                    @endif
                </td>
                <td style="border:1px solid #ccc; text-align:right; padding:2px 3px;">{{ number_format((float) $item->quantity_ordered, 2) }}</td>
                <td style="border:1px solid #ccc; text-align:right; padding:2px 3px;">{{ number_format((float) $item->quantity_accepted, 2) }}</td>
                <td style="border:1px solid #ccc; text-align:right; padding:2px 3px;">{{ number_format((float) $item->quantity_rejected, 2) }}</td>
                <td style="border:1px solid #ccc; text-align:center; padding:2px 3px;">{{ $item->unit }}</td>
            </tr>
        @endforeach
    </tbody>
</table>

{{-- FOOTER: signatures --}}
<table width="100%" cellpadding="0" cellspacing="0">
    <tr>
        <td width="50%" valign="top" style="text-align:center;">
            <div style="font-size:8.5pt; margin-bottom:4px;">Delivered By</div>
            <div style="font-size:9.5pt; font-weight:bold; margin-bottom:70px;">&nbsp;</div>
            <table cellpadding="0" cellspacing="0" style="margin:0 auto; min-width:150px;">
                <tr>
                    <td style="border-top:1px solid #333; padding-top:4px; text-align:center;">
                        <div style="font-size:8.5pt; font-weight:bold;">{{ $vendor->attention ?: ' ' }}</div>
                        <div style="font-size:7.5pt; color:#555;">Vendor Attn</div>
                    </td>
                </tr>
            </table>
        </td>
        <td width="50%" valign="top" style="text-align:center;">
            <div style="font-size:8.5pt; margin-bottom:4px;">Received By,</div>
            <div style="font-size:9.5pt; font-weight:bold; margin-bottom:70px;">{{ strtoupper($company->legal_name ?? '') }}</div>
            <table cellpadding="0" cellspacing="0" style="margin:0 auto; min-width:150px;">
                <tr>
                    <td style="border-top:1px solid #333; padding-top:4px; text-align:center;">
                        <div style="font-size:8.5pt; font-weight:bold;">{{ $loggedInUser->name }}</div>
                        <div style="font-size:7.5pt; color:#555;">Logged In User</div>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>

</body>
</html>
