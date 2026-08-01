<?php

use App\Models\Project;
use App\Models\ProjectAttachment;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

test('an attachment can be uploaded to a project', function () {
    Storage::fake('local');

    $user = User::factory()->create();
    $project = Project::factory()->create();
    $file = UploadedFile::fake()->create('customer-po.pdf', 100, 'application/pdf');

    $response = $this->actingAs($user)
        ->post(route('projects.attachments.store', $project), [
            'name' => 'Customer PO',
            'file' => $file,
        ]);

    $response->assertSessionHasNoErrors();
    $response->assertRedirect(route('projects.show', $project));

    $attachment = $project->attachments()->sole();
    expect($attachment->name)->toBe('Customer PO');
    expect($attachment->original_name)->toBe('customer-po.pdf');
    expect($attachment->mime_type)->toBe('application/pdf');
    expect($attachment->uploaded_by)->toBe($user->id);

    Storage::disk('local')->assertExists($attachment->path);
});

test('attachment name and file are required', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create();

    $this->actingAs($user)
        ->post(route('projects.attachments.store', $project), [])
        ->assertSessionHasErrors(['name', 'file']);
});

test('an attachment can be downloaded with its custom name', function () {
    Storage::fake('local');

    $user = User::factory()->create();
    $project = Project::factory()->create();
    $path = UploadedFile::fake()->create('scan.pdf', 50)->store('project-attachments', 'local');
    $attachment = $project->attachments()->create([
        'name' => 'Signed Contract',
        'original_name' => 'scan.pdf',
        'path' => $path,
        'mime_type' => 'application/pdf',
        'size' => 50 * 1024,
        'uploaded_by' => $user->id,
    ]);

    $response = $this->actingAs($user)
        ->get(route('projects.attachments.download', [$project, $attachment]));

    $response->assertOk();
    $response->assertDownload('Signed Contract.pdf');
});

test('an attachment cannot be downloaded through a different project', function () {
    Storage::fake('local');

    $user = User::factory()->create();
    $project = Project::factory()->create();
    $otherProject = Project::factory()->create();
    $path = UploadedFile::fake()->create('scan.pdf', 50)->store('project-attachments', 'local');
    $attachment = $project->attachments()->create([
        'name' => 'Signed Contract',
        'original_name' => 'scan.pdf',
        'path' => $path,
        'mime_type' => 'application/pdf',
        'size' => 50 * 1024,
        'uploaded_by' => $user->id,
    ]);

    $this->actingAs($user)
        ->get(route('projects.attachments.download', [$otherProject, $attachment]))
        ->assertNotFound();
});

test('an attachment can be deleted', function () {
    Storage::fake('local');

    $user = User::factory()->create();
    $project = Project::factory()->create();
    $path = UploadedFile::fake()->create('scan.pdf', 50)->store('project-attachments', 'local');
    $attachment = $project->attachments()->create([
        'name' => 'Signed Contract',
        'original_name' => 'scan.pdf',
        'path' => $path,
        'mime_type' => 'application/pdf',
        'size' => 50 * 1024,
        'uploaded_by' => $user->id,
    ]);

    $response = $this->actingAs($user)
        ->delete(route('projects.attachments.destroy', [$project, $attachment]));

    $response->assertRedirect(route('projects.show', $project));
    expect(ProjectAttachment::find($attachment->id))->toBeNull();
    Storage::disk('local')->assertMissing($path);
});

test('guests cannot upload, download, or delete attachments', function () {
    Storage::fake('local');

    $project = Project::factory()->create();
    $path = UploadedFile::fake()->create('scan.pdf', 50)->store('project-attachments', 'local');
    $attachment = $project->attachments()->create([
        'name' => 'Signed Contract',
        'original_name' => 'scan.pdf',
        'path' => $path,
        'mime_type' => 'application/pdf',
        'size' => 50 * 1024,
        'uploaded_by' => User::factory()->create()->id,
    ]);

    $this->post(route('projects.attachments.store', $project), [])
        ->assertRedirect(route('login'));

    $this->get(route('projects.attachments.download', [$project, $attachment]))
        ->assertRedirect(route('login'));

    $this->delete(route('projects.attachments.destroy', [$project, $attachment]))
        ->assertRedirect(route('login'));
});
