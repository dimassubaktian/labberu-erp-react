<?php

namespace App\Http\Controllers;

use App\Http\Requests\RoleStoreRequest;
use App\Http\Requests\RoleUpdateRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    /**
     * Display a listing of the roles.
     */
    public function index(): Response
    {
        $roles = Role::query()
            ->withCount('permissions')
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('roles/index', [
            'roles' => $roles,
        ]);
    }

    /**
     * Show the form for creating a new role.
     */
    public function create(): Response
    {
        return Inertia::render('roles/create', [
            'permissionsByModule' => $this->permissionsByModule(),
        ]);
    }

    /**
     * Store a newly created role.
     */
    public function store(RoleStoreRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $role = Role::create(['name' => $data['name'], 'guard_name' => 'web']);
        $role->syncPermissions(Permission::query()->whereKey($data['permissions'] ?? [])->get());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Role created.')]);

        return to_route('roles.show', $role);
    }

    /**
     * Display the specified role.
     */
    public function show(Role $role): Response
    {
        $role->load('permissions:id,name');

        $users = User::role($role->name)
            ->orderBy('name')
            ->get(['id', 'uuid', 'name', 'email', 'status']);

        return Inertia::render('roles/show', [
            'role' => $role,
            'users' => $users,
        ]);
    }

    /**
     * Show the form for editing the specified role.
     */
    public function edit(Role $role): Response
    {
        $role->load('permissions:id');

        return Inertia::render('roles/edit', [
            'role' => $role,
            'permissionsByModule' => $this->permissionsByModule(),
            'selectedPermissionIds' => $role->permissions->pluck('id'),
        ]);
    }

    /**
     * Update the specified role.
     */
    public function update(RoleUpdateRequest $request, Role $role): RedirectResponse
    {
        $data = $request->validated();

        $role->update(['name' => $data['name']]);
        $role->syncPermissions(Permission::query()->whereKey($data['permissions'] ?? [])->get());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Role updated.')]);

        return to_route('roles.show', $role);
    }

    /**
     * Remove the specified role.
     */
    public function destroy(Role $role): RedirectResponse
    {
        if (User::role($role->name)->exists()) {
            Inertia::flash('toast', ['type' => 'error', 'message' => __('This role is assigned to users and cannot be deleted.')]);

            return back();
        }

        $role->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Role deleted.')]);

        return to_route('roles.index');
    }

    /**
     * Get every permission grouped by its module (the segment before the first dot).
     *
     * @return Collection<string, Collection<int, Permission>>
     */
    private function permissionsByModule(): Collection
    {
        return Permission::query()
            ->orderBy('name')
            ->get(['id', 'name'])
            ->toBase()
            ->groupBy(fn (Permission $permission) => explode('.', $permission->name)[0]);
    }
}
