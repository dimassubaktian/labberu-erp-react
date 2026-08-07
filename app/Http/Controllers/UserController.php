<?php

namespace App\Http\Controllers;

use App\Http\Requests\UserStoreRequest;
use App\Http\Requests\UserUpdateRequest;
use App\Models\User;
use App\Models\Workforce;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    /**
     * Display a listing of the users.
     */
    public function index(Request $request): Response
    {
        $search = (string) $request->query('search', '');
        $role = (string) $request->query('role', '');
        $status = (string) $request->query('status', '');

        $users = User::query()
            ->with(['workforce:id,full_name,user_id', 'roles:id,name'])
            ->when($search !== '', function ($builder) use ($search): void {
                $builder->where(function ($q) use ($search): void {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->when($role !== '' && $role !== 'all', fn ($builder) => $builder->whereHas('roles', fn ($q) => $q->where('id', $role)))
            ->when($status !== '' && $status !== 'all', fn ($builder) => $builder->where('status', $status))
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('users/index', [
            'users' => $users,
            'roles' => Role::query()->orderBy('name')->get(['id', 'name']),
            'filters' => ['search' => $search, 'role' => $role, 'status' => $status],
        ]);
    }

    /**
     * Show the form for creating a new user.
     */
    public function create(): Response
    {
        return Inertia::render('users/create', [
            'workforces' => $this->availableWorkforces(),
            'roles' => Role::query()->orderBy('name')->get(['id', 'name']),
            'passwordRules' => Password::defaults()->toPasswordRulesString(),
        ]);
    }

    /**
     * Store a newly created user.
     */
    public function store(UserStoreRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $workforceId = $data['workforce_id'] ?? null;
        $roleIds = $data['roles'] ?? [];
        unset($data['workforce_id'], $data['roles']);

        $user = DB::transaction(function () use ($data, $workforceId, $roleIds) {
            $user = User::create($data);

            if ($workforceId) {
                Workforce::whereKey($workforceId)->update(['user_id' => $user->id]);
            }

            $user->syncRoles(Role::query()->whereKey($roleIds)->get());

            return $user;
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('User created.')]);

        return to_route('users.show', $user);
    }

    /**
     * Display the specified user.
     */
    public function show(User $user): Response
    {
        $user->load(['workforce:id,full_name,user_id', 'roles:id,name']);

        return Inertia::render('users/show', [
            'user' => $user,
        ]);
    }

    /**
     * Show the form for editing the specified user.
     */
    public function edit(User $user): Response
    {
        $user->load('roles:id,name');

        return Inertia::render('users/edit', [
            'user' => $user,
            'workforceId' => $user->workforce?->id,
            'workforces' => $this->availableWorkforces($user),
            'roles' => Role::query()->orderBy('name')->get(['id', 'name']),
            'passwordRules' => Password::defaults()->toPasswordRulesString(),
        ]);
    }

    /**
     * Update the specified user.
     */
    public function update(UserUpdateRequest $request, User $user): RedirectResponse
    {
        $data = $request->validated();
        $workforceId = $data['workforce_id'] ?? null;
        $roleIds = $data['roles'] ?? [];
        unset($data['workforce_id'], $data['roles']);

        if (blank($data['password'] ?? null)) {
            unset($data['password']);
        }

        DB::transaction(function () use ($data, $workforceId, $roleIds, $user): void {
            $oldWorkforce = $user->workforce;

            if ($oldWorkforce && $oldWorkforce->id !== $workforceId) {
                $oldWorkforce->update(['user_id' => null]);
            }

            if ($workforceId) {
                Workforce::whereKey($workforceId)->update(['user_id' => $user->id]);
            }

            $user->update($data);
            $user->syncRoles(Role::query()->whereKey($roleIds)->get());
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('User updated.')]);

        return to_route('users.show', $user);
    }

    /**
     * Remove the specified user.
     */
    public function destroy(User $user): RedirectResponse
    {
        if ($user->id === auth()->id()) {
            Inertia::flash('toast', ['type' => 'error', 'message' => __('You cannot delete your own account.')]);

            return back();
        }

        $user->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('User deleted.')]);

        return to_route('users.index');
    }

    /**
     * Get the workforce members eligible to be linked to a user account — those without one
     * already, plus (on an edit) the workforce currently linked to this user.
     *
     * @return Collection<int, Workforce>
     */
    private function availableWorkforces(?User $user = null): Collection
    {
        return Workforce::query()
            ->where(function ($query) use ($user): void {
                $query->whereNull('user_id');

                if ($user) {
                    $query->orWhere('user_id', $user->id);
                }
            })
            ->orderBy('full_name')
            ->get(['id', 'full_name', 'employee_code']);
    }
}
