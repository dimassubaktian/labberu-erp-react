<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class DesignReferenceController extends Controller
{
    /**
     * Show the design reference: the app's UI conventions rendered from the real components.
     */
    public function index(): Response
    {
        return Inertia::render('design-reference');
    }
}
