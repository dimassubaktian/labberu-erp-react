<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Invoice {{ $invoice->invoice_code }}</title>
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
    $quotation = $invoice->quotation;
    $project = $quotation->project;
    $customer = $project->customer;
    $currencyCode = $quotation->currency->iso_code;
    $customerPhoneFax = array_filter([
        $customer->phone,
        $customer->fax ? 'Fax: ' . $customer->fax : null,
    ]);
@endphp
<div style="border: 1px solid #111; padding: 8px 10px; margin-bottom: 14px;">
    <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
            <td valign="top" width="50%">
                <table cellpadding="2" cellspacing="0">
                    <tr>
                        <td width="90" style="font-size:8.5pt;">To</td>
                        <td width="8" style="font-size:8.5pt;">:</td>
                        <td style="font-size:8.5pt; font-weight:bold;">{{ $customer->name }}</td>
                    </tr>
                    <tr>
                        <td valign="top" style="font-size:8.5pt;">Address</td>
                        <td valign="top" style="font-size:8.5pt;">:</td>
                        <td valign="top" style="font-size:8.5pt;">{{ $customer->address }}</td>
                    </tr>
                    <tr>
                        <td style="font-size:8.5pt;">Phone/Fax</td>
                        <td style="font-size:8.5pt;">:</td>
                        <td style="font-size:8.5pt;">{{ implode(' / ', $customerPhoneFax) }}</td>
                    </tr>
                    <tr>
                        <td style="font-size:8.5pt;">Attn</td>
                        <td style="font-size:8.5pt;">:</td>
                        <td style="font-size:8.5pt;">{{ $customer->attention }}</td>
                    </tr>
                    <tr>
                        <td style="font-size:8.5pt;">PO No</td>
                        <td style="font-size:8.5pt;">:</td>
                        <td style="font-size:8.5pt;">{{ $quotation->po_number }}</td>
                    </tr>
                    <tr>
                        <td style="font-size:8.5pt;">Date of PO</td>
                        <td style="font-size:8.5pt;">:</td>
                        <td style="font-size:8.5pt;">{{ $quotation->po_date?->format('d.m.Y') }}</td>
                    </tr>
                </table>
            </td>
            <td valign="top" width="50%" style="text-align:right;">
                <div style="font-size:14pt; font-weight:bold; margin-bottom:6px;">INVOICE</div>
                <table cellpadding="2" cellspacing="0" style="margin-left:auto;">
                    <tr>
                        <td style="font-size:8pt;">Invoice No</td>
                        <td style="font-size:8pt; padding:0 6px;">:</td>
                        <td style="font-size:8pt; font-weight:bold;">{{ $invoice->invoice_code }}</td>
                    </tr>
                    <tr>
                        <td style="font-size:8pt;">Date</td>
                        <td style="font-size:8pt; padding:0 6px;">:</td>
                        <td style="font-size:8pt; font-weight:bold;">{{ $invoice->invoice_date->format('d.m.Y') }}</td>
                    </tr>
                    <tr>
                        <td style="font-size:8pt;">Due Date</td>
                        <td style="font-size:8pt; padding:0 6px;">:</td>
                        <td style="font-size:8pt; font-weight:bold;">{{ $invoice->due_date->format('d.m.Y') }}</td>
                    </tr>
                    <tr>
                        <td style="font-size:8pt;">Project No</td>
                        <td style="font-size:8pt; padding:0 6px;">:</td>
                        <td style="font-size:8pt; font-weight:bold;">{{ $project->project_code }}</td>
                    </tr>
                    <tr>
                        <td style="font-size:8pt;">Project Name</td>
                        <td style="font-size:8pt; padding:0 6px;">:</td>
                        <td style="font-size:8pt; font-weight:bold;">{{ $project->name }}</td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</div>

{{-- ITEMS --}}
<table width="100%" cellpadding="4" cellspacing="0" style="border-collapse:collapse; margin-bottom:6px;">
    <thead>
        <tr style="background:#1a1a1a; color:#fff; font-size:8pt; font-weight:bold; line-height:1.1;">
            <th width="24" style="border:1px solid #555; text-align:center; padding:2px 3px;">No</th>
            <th           style="border:1px solid #555; text-align:left;   padding:2px 3px;">Description</th>
            <th width="40" style="border:1px solid #555; text-align:right;  padding:2px 3px;">QTY</th>
            <th width="34" style="border:1px solid #555; text-align:center; padding:2px 3px;">UOM</th>
            <th width="70" style="border:1px solid #555; text-align:right;  padding:2px 3px;">Price</th>
            <th width="78" style="border:1px solid #555; text-align:right;  padding:2px 3px;">Amount</th>
        </tr>
    </thead>
    <tbody>
        @foreach ($invoice->items as $i => $item)
            <tr style="font-size:8.5pt; line-height:1.1;">
                <td style="border:1px solid #ccc; text-align:center; padding:2px 3px;">{{ $i + 1 }}</td>
                <td style="border:1px solid #ccc; padding:2px 3px;">{{ $item->product->name }}</td>
                <td style="border:1px solid #ccc; text-align:right; padding:2px 3px;">{{ number_format((float) $item->quantity_invoiced, 2) }}</td>
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
        <td colspan="4" style="border:1px solid #ccc; text-align:right; padding:2px 6px;">Sub Total</td>
        <td width="70" style="border:1px solid #ccc; text-align:right; padding:2px 6px;">{{ $currencyCode }}</td>
        <td width="78" style="border:1px solid #ccc; text-align:right; padding:2px 6px;">{{ number_format((float) $invoice->subtotal, 0) }}</td>
    </tr>
    @if ($invoice->discount_value !== null)
        <tr style="background:#f5f5f5; font-size:8.5pt; line-height:1.1;">
            <td colspan="4" style="border:1px solid #ccc; text-align:right; padding:2px 6px;">
                Discount
                ({{ $invoice->discount_type === 'percentage' ? $invoice->discount_value . '%' : number_format((float) $invoice->discount_value, 0) }})
            </td>
            <td style="border:1px solid #ccc; text-align:right; padding:2px 6px;">{{ $currencyCode }}</td>
            <td style="border:1px solid #ccc; text-align:right; padding:2px 6px;">- {{ number_format((float) $invoice->discount_amount, 0) }}</td>
        </tr>
    @endif
    <tr style="background:#f5f5f5; font-size:8.5pt; line-height:1.1;">
        <td colspan="4" style="border:1px solid #ccc; text-align:right; padding:2px 6px;">{{ $invoice->tax?->name ?: 'Tax' }}</td>
        <td style="border:1px solid #ccc; text-align:right; padding:2px 6px;">{{ $currencyCode }}</td>
        <td style="border:1px solid #ccc; text-align:right; padding:2px 6px;">{{ number_format((float) $invoice->tax_amount, 0) }}</td>
    </tr>
    <tr style="background:#1a1a1a; color:#fff; font-size:9.5pt; font-weight:bold; line-height:1.1;">
        <td colspan="4" style="border:1px solid #555; text-align:right; padding:3px 6px;">Grand Total</td>
        <td style="border:1px solid #555; text-align:right; padding:3px 6px;">{{ $currencyCode }}</td>
        <td style="border:1px solid #555; text-align:right; padding:3px 6px;">{{ number_format((float) $invoice->total, 0) }}</td>
    </tr>
</table>

@if ($invoice->remarks)
    <div style="font-size:8pt; color:#333; line-height:1.3; margin-bottom:12px;">
        <div style="font-weight:bold; margin-bottom:2px;">Remarks</div>
        {{ $invoice->remarks }}
    </div>
@endif

{{-- FOOTER: payment terms + signature --}}
<table width="100%" cellpadding="0" cellspacing="0">
    <tr>
        <td width="55%" valign="top" style="padding-right:16px;">
            <div style="font-size:8.5pt; font-weight:bold; margin-bottom:6px;">Term Of Payment &amp; Condition :</div>
            @if ($invoice->payment_terms_html)
                <div style="font-size:8pt; color:#333; line-height:1.6;">{!! $invoice->payment_terms_html !!}</div>
            @endif
        </td>
        <td width="45%" valign="top" style="text-align:center;">
            <div style="font-size:8.5pt; margin-bottom:4px;">Yours Sincerely,</div>
            <div style="font-size:9.5pt; font-weight:bold; margin-bottom:35px;">{{ strtoupper($company->legal_name ?? '') }}</div>
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
