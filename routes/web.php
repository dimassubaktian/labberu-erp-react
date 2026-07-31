<?php

use App\Http\Controllers\CompanySettingController;
use App\Http\Controllers\CurrencyController;
use App\Http\Controllers\JobTitleController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\TaxController;
use App\Http\Controllers\WorkforceController;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/login')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');

    Route::get('job-titles', [JobTitleController::class, 'index'])->name('job-titles.index');
    Route::get('job-titles/create', [JobTitleController::class, 'create'])->name('job-titles.create');
    Route::post('job-titles', [JobTitleController::class, 'store'])->name('job-titles.store');
    Route::get('job-titles/{jobTitle}', [JobTitleController::class, 'show'])->name('job-titles.show');
    Route::get('job-titles/{jobTitle}/edit', [JobTitleController::class, 'edit'])->name('job-titles.edit');
    Route::put('job-titles/{jobTitle}', [JobTitleController::class, 'update'])->name('job-titles.update');
    Route::delete('job-titles/{jobTitle}', [JobTitleController::class, 'destroy'])->name('job-titles.destroy');

    Route::get('workforces', [WorkforceController::class, 'index'])->name('workforces.index');
    Route::get('workforces/create', [WorkforceController::class, 'create'])->name('workforces.create');
    Route::post('workforces', [WorkforceController::class, 'store'])->name('workforces.store');
    Route::get('workforces/{workforce}', [WorkforceController::class, 'show'])->name('workforces.show');
    Route::get('workforces/{workforce}/edit', [WorkforceController::class, 'edit'])->name('workforces.edit');
    Route::put('workforces/{workforce}', [WorkforceController::class, 'update'])->name('workforces.update');
    Route::delete('workforces/{workforce}', [WorkforceController::class, 'destroy'])->name('workforces.destroy');
    Route::get('workforces/{workforce}/photo', [WorkforceController::class, 'photo'])->name('workforces.photo');

    Route::get('currencies', [CurrencyController::class, 'index'])->name('currencies.index');
    Route::get('currencies/create', [CurrencyController::class, 'create'])->name('currencies.create');
    Route::post('currencies', [CurrencyController::class, 'store'])->name('currencies.store');
    Route::get('currencies/{currency}', [CurrencyController::class, 'show'])->name('currencies.show');
    Route::get('currencies/{currency}/edit', [CurrencyController::class, 'edit'])->name('currencies.edit');
    Route::put('currencies/{currency}', [CurrencyController::class, 'update'])->name('currencies.update');
    Route::delete('currencies/{currency}', [CurrencyController::class, 'destroy'])->name('currencies.destroy');

    Route::get('taxes', [TaxController::class, 'index'])->name('taxes.index');
    Route::get('taxes/create', [TaxController::class, 'create'])->name('taxes.create');
    Route::post('taxes', [TaxController::class, 'store'])->name('taxes.store');
    Route::get('taxes/{tax}', [TaxController::class, 'show'])->name('taxes.show');
    Route::get('taxes/{tax}/edit', [TaxController::class, 'edit'])->name('taxes.edit');
    Route::put('taxes/{tax}', [TaxController::class, 'update'])->name('taxes.update');
    Route::delete('taxes/{tax}', [TaxController::class, 'destroy'])->name('taxes.destroy');

    Route::get('company-settings', [CompanySettingController::class, 'edit'])->name('company-settings.edit');
    Route::put('company-settings', [CompanySettingController::class, 'update'])->name('company-settings.update');

    Route::get('products', [ProductController::class, 'index'])->name('products.index');
    Route::get('products/create', [ProductController::class, 'create'])->name('products.create');
    Route::post('products', [ProductController::class, 'store'])->name('products.store');
    Route::get('products/{product}', [ProductController::class, 'show'])->name('products.show');
    Route::get('products/{product}/edit', [ProductController::class, 'edit'])->name('products.edit');
    Route::put('products/{product}', [ProductController::class, 'update'])->name('products.update');
    Route::delete('products/{product}', [ProductController::class, 'destroy'])->name('products.destroy');
});

require __DIR__.'/settings.php';
