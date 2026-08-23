<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Equipment List</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: DejaVu Sans, sans-serif; font-size: 8pt; color: #111; margin: 110px 24px 30px; }
        #header { position: fixed; top: 18px; left: 24px; right: 24px; height: 85px; }
    </style>
</head>
<body>

<div id="header">
    <table width="100%" cellpadding="0" cellspacing="0" style="border-bottom: 4px double #111; padding-bottom: 8px;">
        <tr>
            <td width="70" valign="middle" align="center">
                @if ($company->logo)
                    <img src="{{ Storage::disk('public')->path($company->logo) }}" alt="logo" style="max-width:60px; max-height:50px;">
                @endif
            </td>
            <td valign="middle" style="padding-left:10px;">
                <div style="font-size:13pt; font-weight:bold;">{{ $company->legal_name }}</div>
                @php
                    $addressParts = array_filter([
                        $company->address,
                        implode(', ', array_filter([$company->city, $company->province, $company->postal_code, $company->country])),
                    ]);
                @endphp
                <div style="font-size:7.5pt; color:#444; margin-top:2px;">{{ implode(', ', $addressParts) }}</div>
            </td>
            <td valign="middle" style="text-align:right;">
                <div style="font-size:13pt; font-weight:bold;">EQUIPMENT LIST</div>
                <div style="font-size:7.5pt; color:#444; margin-top:2px;">Generated {{ $generatedAt->format('d.m.Y H:i') }} by {{ $loggedInUser->name }}</div>
            </td>
        </tr>
    </table>
</div>

{{-- ITEMS --}}
<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; table-layout:fixed;">
    <thead>
        <tr style="background:#1a1a1a; color:#fff; font-size:7.5pt; font-weight:bold; line-height:1.1;">
            <th width="3%"  style="border:1px solid #555; text-align:center; padding:3px 2px;">No</th>
            <th width="9%"  style="border:1px solid #555; text-align:left;   padding:3px 3px;">Code</th>
            <th width="13%" style="border:1px solid #555; text-align:left;   padding:3px 3px;">Name</th>
            <th width="9%"  style="border:1px solid #555; text-align:left;   padding:3px 3px;">Category</th>
            <th width="10%" style="border:1px solid #555; text-align:left;   padding:3px 3px;">Model / Type</th>
            <th width="11%" style="border:1px solid #555; text-align:left;   padding:3px 3px;">Serial Number</th>
            <th width="8%"  style="border:1px solid #555; text-align:left;   padding:3px 3px;">Status</th>
            <th width="13%" style="border:1px solid #555; text-align:left;   padding:3px 3px;">Current Location</th>
            <th width="8%"  style="border:1px solid #555; text-align:center; padding:3px 3px;">Expected Return</th>
            <th width="8%"  style="border:1px solid #555; text-align:center; padding:3px 3px;">Last Calibration</th>
            <th width="8%"  style="border:1px solid #555; text-align:center; padding:3px 3px;">Next Calibration</th>
        </tr>
    </thead>
    <tbody>
        @php $today = \Illuminate\Support\Carbon::today(); @endphp
        @forelse ($equipment as $i => $item)
            @php
                $currentLocation = $item->currentProject?->name
                    ?? $item->currentCustodian?->full_name
                    ?? $item->currentLocation?->name
                    ?? 'In storage';
                $expectedReturn = $item->openAssignment?->expected_return_at;
                $isReturnOverdue = $expectedReturn && $expectedReturn->lt($today);
                $lastCalibration = $item->calibrations->first()?->calibration_date;
                $isCalibrationOverdue = $item->next_calibration_due_date && $item->next_calibration_due_date->lt($today);
            @endphp
            <tr style="font-size:7.5pt; line-height:1.15;">
                <td style="border:1px solid #ccc; text-align:center; padding:2px 2px;">{{ $i + 1 }}</td>
                <td style="border:1px solid #ccc; padding:2px 3px;">{{ $item->equipment_code }}</td>
                <td style="border:1px solid #ccc; padding:2px 3px;">{{ $item->name }}</td>
                <td style="border:1px solid #ccc; padding:2px 3px;">{{ $item->category ?? '-' }}</td>
                <td style="border:1px solid #ccc; padding:2px 3px;">{{ $item->model_type ?? '-' }}</td>
                <td style="border:1px solid #ccc; padding:2px 3px;">{{ $item->serial_number ?? '-' }}</td>
                <td style="border:1px solid #ccc; padding:2px 3px; text-transform:capitalize;">{{ str_replace('_', ' ', $item->status) }}</td>
                <td style="border:1px solid #ccc; padding:2px 3px;">{{ $currentLocation }}</td>
                <td style="border:1px solid #ccc; text-align:center; padding:2px 3px; {{ $isReturnOverdue ? 'color:#b91c1c; font-weight:bold;' : '' }}">{{ $expectedReturn?->format('d.m.Y') ?? '-' }}</td>
                <td style="border:1px solid #ccc; text-align:center; padding:2px 3px;">{{ $lastCalibration?->format('d.m.Y') ?? '-' }}</td>
                <td style="border:1px solid #ccc; text-align:center; padding:2px 3px; {{ $isCalibrationOverdue ? 'color:#b91c1c; font-weight:bold;' : '' }}">{{ $item->next_calibration_due_date?->format('d.m.Y') ?? '-' }}</td>
            </tr>
        @empty
            <tr>
                <td colspan="11" style="border:1px solid #ccc; text-align:center; padding:10px;">No equipment found.</td>
            </tr>
        @endforelse
    </tbody>
</table>

</body>
</html>
