import { Form, Head, Link, setLayoutProps } from '@inertiajs/react';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
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
import { Textarea } from '@/components/ui/textarea';
import { useInitials } from '@/hooks/use-initials';
import { edit, index, photo, show, update } from '@/routes/workforces';

type JobTitleOption = {
    id: number;
    name: string;
};

type Workforce = {
    id: number;
    uuid: string;
    full_name: string;
    email: string;
    phone: string | null;
    address: string | null;
    gender: string;
    photo: string | null;
    status: string;
    job_title_id: number;
};

type Props = {
    workforce: Workforce;
    jobTitles: JobTitleOption[];
};

export default function WorkforcesEdit({ workforce, jobTitles }: Props) {
    const getInitials = useInitials();
    const [jobTitleId, setJobTitleId] = useState(
        String(workforce.job_title_id),
    );
    const [gender, setGender] = useState(workforce.gender);
    const [status, setStatus] = useState(workforce.status);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);

    useEffect(() => {
        return () => {
            if (photoPreview) {
                URL.revokeObjectURL(photoPreview);
            }
        };
    }, [photoPreview]);

    function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];

        setPhotoPreview((previous) => {
            if (previous) {
                URL.revokeObjectURL(previous);
            }

            return file ? URL.createObjectURL(file) : null;
        });
    }

    setLayoutProps({
        breadcrumbs: [
            { title: 'Workforces', href: index() },
            { title: workforce.full_name, href: show(workforce) },
            { title: 'Edit', href: edit(workforce) },
        ],
    });

    return (
        <>
            <Head title={`Edit ${workforce.full_name}`} />

            <div className="mx-auto w-full max-w-5xl space-y-6 p-4">
                <Heading
                    title="Edit Workforce"
                    description="Update this employee's details"
                />

                <Form
                    {...update.form(workforce)}
                    encType="multipart/form-data"
                    className="space-y-6"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="full_name">Full name</Label>
                                <Input
                                    id="full_name"
                                    name="full_name"
                                    required
                                    autoFocus
                                    defaultValue={workforce.full_name}
                                    placeholder="e.g. Jane Doe"
                                />
                                <InputError message={errors.full_name} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    defaultValue={workforce.email}
                                    placeholder="e.g. jane.doe@example.com"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="phone">Phone</Label>
                                    <Input
                                        id="phone"
                                        name="phone"
                                        defaultValue={workforce.phone ?? ''}
                                        placeholder="Optional"
                                    />
                                    <InputError message={errors.phone} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="job_title_id">
                                        Job title
                                    </Label>
                                    <input
                                        type="hidden"
                                        name="job_title_id"
                                        value={jobTitleId}
                                    />
                                    <Select
                                        value={jobTitleId}
                                        onValueChange={setJobTitleId}
                                    >
                                        <SelectTrigger
                                            id="job_title_id"
                                            className="w-full"
                                        >
                                            <SelectValue placeholder="Select a job title" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {jobTitles.map((jobTitle) => (
                                                <SelectItem
                                                    key={jobTitle.id}
                                                    value={String(jobTitle.id)}
                                                >
                                                    {jobTitle.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.job_title_id} />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="address">Address</Label>
                                <Textarea
                                    id="address"
                                    name="address"
                                    defaultValue={workforce.address ?? ''}
                                    placeholder="Optional"
                                />
                                <InputError message={errors.address} />
                            </div>

                            <div className="grid gap-2 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="gender">Gender</Label>
                                    <input
                                        type="hidden"
                                        name="gender"
                                        value={gender}
                                    />
                                    <Select
                                        value={gender}
                                        onValueChange={setGender}
                                    >
                                        <SelectTrigger
                                            id="gender"
                                            className="w-full"
                                        >
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="male">
                                                Male
                                            </SelectItem>
                                            <SelectItem value="female">
                                                Female
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.gender} />
                                </div>

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
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="photo">Photo</Label>
                                <div className="flex items-center gap-4">
                                    <Avatar className="size-14">
                                        {(photoPreview || workforce.photo) && (
                                            <AvatarImage
                                                src={
                                                    photoPreview ??
                                                    photo(workforce).url
                                                }
                                                alt={workforce.full_name}
                                            />
                                        )}
                                        <AvatarFallback>
                                            {getInitials(workforce.full_name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <Input
                                        id="photo"
                                        type="file"
                                        name="photo"
                                        accept="image/*"
                                        className="flex-1"
                                        onChange={handlePhotoChange}
                                    />
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Leave empty to keep the current photo.
                                </p>
                                <InputError message={errors.photo} />
                            </div>

                            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                    asChild
                                >
                                    <Link href={show(workforce)}>
                                        <X /> Cancel
                                    </Link>
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing && <Spinner />}
                                    Save changes
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}
