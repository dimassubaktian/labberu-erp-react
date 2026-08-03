# Project Attachments — supporting documents, not tied to quotation revisions

Part of the `docs/handoff/` detail set — see `HANDOFF.md` at the repo root for the index.

Deliberately attached to `Project`, not `Quotation`. Two reasons this shape was chosen over
attaching to a quotation (discussed and decided explicitly, don't re-litigate without cause):
1. A project's supporting documents (customer PO, site survey, drawings) are usually about the
   whole engagement, not one specific quotation negotiation — and a project already aggregates
   every quotation thread via its "Quotations" card, so it's the natural hub.
2. Attaching at the project level sidesteps the revision-scoping question entirely (a `Project`
   has no revisions), unlike BOM/items/groups (`docs/handoff/bom.md`) where "does this get
   copied per revision" had to be decided.

**Not deep-copied anywhere** — unlike BOM, attachments are reference material, not priced
content, so there's no snapshot-per-revision concern to begin with.

**Schema** (`project_attachments`): `uuid` (route-key binding), `project_id`, `name` (**user-
provided label at upload time**, required — this is what's shown in the UI and used as the
download filename), `original_name` (the actual uploaded file's original name, kept only to
derive the download extension — intentionally **not shown** in the attachments list per
explicit user request), `path`/`mime_type`/`size`, `uploaded_by`.

**Storage**: private `local` disk under `project-attachments/`, same pattern as Workforce
photo upload — `ProjectAttachmentController::download()` streams via `Storage::download()`
using `{name}.{extension}` as the served filename, and 404s if the attachment's `project_id`
doesn't match the route's `{project}` (cross-project access guard).

**UI**: "Attachments" card on `projects/show.tsx` — inline upload form (name + file,
`multipart/form-data`, resets on success), list of existing attachments (name, size, uploader,
upload date — no original filename shown), Download + Delete (behind a confirmation dialog,
`variant="destructive"`) per row. No status/draft restriction on upload, unlike BOM — can be
added to a project at any time.
