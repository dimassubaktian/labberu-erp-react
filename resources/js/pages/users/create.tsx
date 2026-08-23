import { Form, Head, Link } from '@inertiajs/react';
import { X } from 'lucide-react';
import { useState } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { create, index, store } from '@/routes/users';

type WorkforceOption = {
    id: number;
    full_name: string;
    employee_code: string;
};

type RoleOption = {
    id: number;
    name: string;
};

type Props = {
    workforces: WorkforceOption[];
    roles: RoleOption[];
    passwordRules: string;
};

export default function UsersCreate({
    workforces,
    roles,
    passwordRules,
}: Props) {
    const [status, setStatus] = useState('active');
    const [workforceId, setWorkforceId] = useState('none');
    const [roleIds, setRoleIds] = useState<number[]>([]);

    function toggleRole(roleId: number, checked: boolean) {
        setRoleIds((current) =>
            checked
                ? [...current, roleId]
                : current.filter((id) => id !== roleId),
        );
    }

    return (
        <>
            <Head title="New User" />

            <div className="mx-auto w-full max-w-5xl space-y-6 p-4">
                <Heading
                    title="New User"
                    description="Create a new account that can sign in to this application"
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
                                    placeholder="e.g. Jane Doe"
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    placeholder="e.g. jane.doe@example.com"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="password">Password</Label>
                                    <PasswordInput
                                        id="password"
                                        name="password"
                                        autoComplete="new-password"
                                        passwordrules={passwordRules}
                                    />
                                    <InputError message={errors.password} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="password_confirmation">
                                        Confirm password
                                    </Label>
                                    <PasswordInput
                                        id="password_confirmation"
                                        name="password_confirmation"
                                        autoComplete="new-password"
                                        passwordrules={passwordRules}
                                    />
                                    <InputError
                                        message={errors.password_confirmation}
                                    />
                                </div>
                            </div>

                            <div className="grid gap-2 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="status">Status</Label>
                                    <input
                                        type="hidden"
                                        name="status"
                                        value={status}
                                    />
                                    <Select
                                        value={status}
                                        onValueChange={setStatus}
                                    >
                                        <SelectTrigger
                                            id="status"
                                            className="w-full"
                                        >
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="active">
                                                Active
                                            </SelectItem>
                                            <SelectItem value="inactive">
                                                Inactive
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.status} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="workforce_id">
                                        Workforce
                                    </Label>
                                    <input
                                        type="hidden"
                                        name="workforce_id"
                                        value={
                                            workforceId === 'none'
                                                ? ''
                                                : workforceId
                                        }
                                    />
                                    <Select
                                        value={workforceId}
                                        onValueChange={setWorkforceId}
                                    >
                                        <SelectTrigger
                                            id="workforce_id"
                                            className="w-full"
                                        >
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">
                                                No linked employee
                                            </SelectItem>
                                            {workforces.map((workforce) => (
                                                <SelectItem
                                                    key={workforce.id}
                                                    value={String(workforce.id)}
                                                >
                                                    {workforce.full_name} (
                                                    {workforce.employee_code})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.workforce_id} />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label>Roles</Label>
                                {roleIds.map((id) => (
                                    <input
                                        key={id}
                                        type="hidden"
                                        name="roles[]"
                                        value={id}
                                    />
                                ))}
                                <div className="flex flex-wrap gap-4 rounded-lg border p-4">
                                    {roles.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">
                                            No roles have been created yet.
                                        </p>
                                    ) : (
                                        roles.map((role) => (
                                            <div
                                                key={role.id}
                                                className="flex items-center gap-2"
                                            >
                                                <Checkbox
                                                    id={`role-${role.id}`}
                                                    checked={roleIds.includes(
                                                        role.id,
                                                    )}
                                                    onCheckedChange={(
                                                        checked,
                                                    ) =>
                                                        toggleRole(
                                                            role.id,
                                                            checked === true,
                                                        )
                                                    }
                                                />
                                                <Label
                                                    htmlFor={`role-${role.id}`}
                                                    className="font-normal"
                                                >
                                                    {role.name}
                                                </Label>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <InputError message={errors.roles} />
                            </div>

                            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                    asChild
                                >
                                    <Link href={index()}>
                                        <X /> Cancel
                                    </Link>
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing && <Spinner />}
                                    Create user
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}

UsersCreate.layout = {
    breadcrumbs: [
        { title: 'Users', href: index() },
        { title: 'New', href: create() },
    ],
};
