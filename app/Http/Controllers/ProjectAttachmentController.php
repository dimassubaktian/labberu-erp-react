<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProjectAttachmentStoreRequest;
use App\Models\Project;
use App\Models\ProjectAttachment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ProjectAttachmentController extends Controller
{
    /**
     * Store a newly uploaded attachment for the specified project.
     */
    public function store(ProjectAttachmentStoreRequest $request, Project $project): RedirectResponse
    {
        $data = $request->validated();
        $file = $request->file('file');

        $project->attachments()->create([
            'name' => $data['name'],
            'original_name' => $file->getClientOriginalName(),
            'path' => $file->store('project-attachments', 'local'),
            'mime_type' => $file->getMimeType(),
            'size' => $file->getSize(),
            'uploaded_by' => $request->user()->id,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Attachment uploaded.')]);

        return to_route('projects.show', $project);
    }

    /**
     * Stream the specified attachment to authenticated users only.
     */
    public function download(Project $project, ProjectAttachment $attachment): StreamedResponse
    {
        abort_unless($attachment->project_id === $project->id, 404);
        abort_unless(Storage::disk('local')->exists($attachment->path), 404);

        $extension = pathinfo($attachment->original_name, PATHINFO_EXTENSION);
        $downloadName = $extension ? "{$attachment->name}.{$extension}" : $attachment->name;

        return Storage::disk('local')->download($attachment->path, $downloadName);
    }

    /**
     * Remove the specified attachment.
     */
    public function destroy(Project $project, ProjectAttachment $attachment): RedirectResponse
    {
        abort_unless($attachment->project_id === $project->id, 404);

        Storage::disk('local')->delete($attachment->path);
        $attachment->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Attachment deleted.')]);

        return to_route('projects.show', $project);
    }
}
