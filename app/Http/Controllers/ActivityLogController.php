<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ActivityLogController extends Controller
{
    /**
     * Display a listing of the activity log. This is a read-only audit trail — entries are
     * only ever created as a side effect of financial/approval actions elsewhere in the app.
     */
    public function index(Request $request): Response
    {
        $search = (string) $request->query('search', '');

        $activityLogs = ActivityLog::query()
            ->with('causer:id,name')
            ->when($search !== '', function ($builder) use ($search): void {
                $builder->where(function ($inner) use ($search): void {
                    $inner->where('action', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%")
                        ->orWhereHas('causer', fn ($q) => $q->where('name', 'like', "%{$search}%"));
                });
            })
            ->orderByDesc('created_at')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('activity-logs/index', [
            'activityLogs' => $activityLogs,
            'filters' => ['search' => $search],
        ]);
    }
}
