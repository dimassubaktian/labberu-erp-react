import { Form, Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { create, index, store } from '@/routes/roles';

type Permission = {
    id: number;
    name: string;
};

type Props = {
    permissionsByModule: Record<string, Permission[]>;
};

function moduleLabel(module: string): string {
    return module
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function actionLabel(permission: Permission, module: string): string {
    return permission.name
        .slice(module.length + 1)
        .replaceAll('.', ' ')
        .replaceAll('_', ' ');
}

export default function RolesCreate({ permissionsByModule }: Props) {
    const [permissionIds, setPermissionIds] = useState<number[]>([]);

    function togglePermission(permissionId: number, checked: boolean) {
        setPermissionIds((current) =>
            checked
                ? [...current, permissionId]
                : current.filter((id) => id !== permissionId),
        );
    }

    return (
        <>
            <Head title="New Role" />

            <div className="mx-auto w-full max-w-3xl space-y-6 p-4">
                <Heading
                    title="New Role"
                    description="Create a new role and choose which permissions it grants"
                />

                <Form {...store.form()} className="space-y-6">
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    required
                                    autoFocus
                                    placeholder="e.g. Warehouse Staff"
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid gap-2">
                                <Label>Permissions</Label>
                                {permissionIds.map((id) => (
                                    <input
                                        key={id}
                                        type="hidden"
                                        name="permissions[]"
                                        value={id}
                                    />
                                ))}

                                <div className="grid gap-4 sm:grid-cols-2">
                                    {Object.entries(permissionsByModule).map(
                                        ([module, permissions]) => (
                                            <div
                                                key={module}
                                                className="space-y-3 rounded-lg border border-border/50 p-4"
                                            >
                                                <h2 className="text-base font-semibold">
                                                    {moduleLabel(module)}
                                                </h2>
                                                <div className="grid gap-3">
                                                    {permissions.map(
                                                        (permission) => (
                                                            <div
                                                                key={
                                                                    permission.id
                                                                }
                                                                className="flex items-center gap-2"
                                                            >
                                                                <Checkbox
                                                                    id={`permission-${permission.id}`}
                                                                    checked={permissionIds.includes(
                                                                        permission.id,
                                                                    )}
                                                                    onCheckedChange={(
                                                                        checked,
                                                                    ) =>
                                                                        togglePermission(
                                                                            permission.id,
                                                                            checked ===
                                                                                true,
                                                                        )
                                                                    }
                                                                />
                                                                <Label
                                                                    htmlFor={`permission-${permission.id}`}
                                                                    className="font-normal capitalize"
                                                                >
                                                                    {actionLabel(
                                                                        permission,
                                                                        module,
                                                                    )}
                                                                </Label>
                                                            </div>
                                                        ),
                                                    )}
                                                </div>
                                            </div>
                                        ),
                                    )}
                                </div>
                                <InputError message={errors.permissions} />
                            </div>

                            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                <Button type="button" variant="outline" asChild>
                                    <Link href={index()}>Cancel</Link>
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing && <Spinner />}
                                    Create role
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}

RolesCreate.layout = {
    breadcrumbs: [
        { title: 'Roles', href: index() },
        { title: 'New', href: create() },
    ],
};
