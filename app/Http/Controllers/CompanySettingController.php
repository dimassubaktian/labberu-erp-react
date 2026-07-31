<?php

namespace App\Http\Controllers;

use App\Http\Requests\CompanySettingUpdateRequest;
use App\Models\CompanySetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class CompanySettingController extends Controller
{
    /**
     * Show the company settings form.
     */
    public function edit(): Response
    {
        $companySetting = CompanySetting::current();

        return Inertia::render('company-settings/edit', [
            'companySetting' => $companySetting,
        ]);
    }

    /**
     * Update the company settings.
     */
    public function update(CompanySettingUpdateRequest $request): RedirectResponse
    {
        $companySetting = CompanySetting::current();

        $data = $request->validated();

        if ($request->hasFile('logo')) {
            if ($companySetting->logo) {
                Storage::disk('public')->delete($companySetting->logo);
            }

            $data['logo'] = $request->file('logo')->store('company-logos', 'public');
        }

        $companySetting->fill($data)->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Company settings updated.')]);

        return to_route('company-settings.edit');
    }
}
