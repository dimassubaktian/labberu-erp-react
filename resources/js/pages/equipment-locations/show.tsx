import { Form, Head, Link, setLayoutProps } from '@inertiajs/react';
import {
    ArrowLeft,
    CalendarDays,
    MapPin,
    Pencil,
    Trash2,
    X,
} from 'lucide-react';
import { StatusBadge } from '@/components/project-badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import { formatDateTime } from '@/lib/utils';
import { destroy, edit, index, show } from '@/routes/equipment-locations';

type EquipmentLocation = {
    id: number;
    uuid: string;
    name: string;
    code: string | null;
    description: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
};

type Props = {
    location: EquipmentLocation;
};

export default function EquipmentLocationsShow({ location }: Props) {
    setLayoutProps({
        breadcrumbs: [
            { title: 'Equipment Locations', href: index() },
            { title: location.name, href: show(location) },
        ],
    });

    return (
        <>
            <Head title={location.name} />

            <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6">
                <section className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
                    <div className="flex flex-col gap-6 bg-linear-to-br from-primary/[0.08] via-card to-card p-5 sm:p-6 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex min-w-0 items-start gap-4">
                            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:size-14">
                                <MapPin className="size-6 sm:size-7" />
                            </div>
                            <div className="min-w-0 space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Equipment location
                                    </p>
                                    <StatusBadge
                                        category="active"
                                        value={
                                            location.is_active
                                                ? 'active'
                                                : 'inactive'
                                        }
                                    />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-semibold tracking-tight break-words sm:text-3xl">
                                        {location.name}
                                    </h1>
                                    <p className="mt-1 text-sm text-muted-foreground sm:text-base">
                                        {location.code ||
                                            'No location code assigned'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row lg:shrink-0">
                            <Button
                                variant="destructive"
                                asChild
                                className="w-full sm:w-auto"
                            >
                                <Link href={index()}>
                                    <ArrowLeft />
                                    Back to Locations
                                </Link>
                            </Button>

                            <Button asChild className="w-full sm:w-auto">
                                <Link href={edit(location)}>
                                    <Pencil />
                                    Edit Location
                                </Link>
                            </Button>
                        </div>
                    </div>

                    <div className="grid divide-y divide-border/60 border-t border-border/60 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                        <div className="space-y-1 p-4 sm:p-5">
                            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                Location code
                            </p>
                            <p className="font-semibold">
                                {location.code || '—'}
                            </p>
                        </div>
                        <div className="space-y-1 p-4 sm:p-5">
                            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                Current status
                            </p>
                            <p className="font-semibold">
                                {location.is_active ? 'Active' : 'Inactive'}
                            </p>
                        </div>
                        <div className="space-y-1 p-4 sm:p-5">
                            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                Last updated
                            </p>
                            <p className="font-semibold">
                                {formatDateTime(location.updated_at)}
                            </p>
                        </div>
                    </div>
                </section>

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)]">
                    <Card>
                        <CardHeader className="border-b border-border/60 pb-5">
                            <CardTitle>Location details</CardTitle>
                            <CardDescription>
                                Identification and status for this storage
                                location.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
                                <div className="space-y-1">
                                    <dt className="text-sm text-muted-foreground">
                                        Location name
                                    </dt>
                                    <dd className="font-medium">
                                        {location.name}
                                    </dd>
                                </div>
                                <div className="space-y-1">
                                    <dt className="text-sm text-muted-foreground">
                                        Location code
                                    </dt>
                                    <dd className="font-medium">
                                        {location.code || '—'}
                                    </dd>
                                </div>
                                <div className="space-y-2">
                                    <dt className="text-sm text-muted-foreground">
                                        Status
                                    </dt>
                                    <dd>
                                        <StatusBadge
                                            category="active"
                                            value={
                                                location.is_active
                                                    ? 'active'
                                                    : 'inactive'
                                            }
                                        />
                                    </dd>
                                </div>
                            </dl>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="border-b border-border/60 pb-5">
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-muted p-2 text-muted-foreground">
                                    <CalendarDays className="size-5" />
                                </div>
                                <div>
                                    <CardTitle>Record timeline</CardTitle>
                                    <CardDescription>
                                        Location record activity.
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-5 pt-6">
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">
                                    Created at
                                </p>
                                <p className="font-medium">
                                    {formatDateTime(location.created_at)}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">
                                    Last updated
                                </p>
                                <p className="font-medium">
                                    {formatDateTime(location.updated_at)}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader className="border-b border-border/60 pb-5">
                        <CardTitle>Description</CardTitle>
                        <CardDescription>
                            Notes that help identify or use this location.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <p className="max-w-4xl text-sm leading-6 whitespace-pre-line text-muted-foreground">
                            {location.description ||
                                'No description has been added yet.'}
                        </p>
                    </CardContent>
                </Card>

                <section className="space-y-4 rounded-2xl border border-destructive/30 bg-destructive/[0.02] p-4 sm:p-6">
                    <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-destructive/10 p-2 text-destructive">
                            <Trash2 className="size-5" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-destructive">
                                Danger zone
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Remove this location from the active storage
                                register.
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col gap-4 rounded-lg border border-red-100 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-red-200/10 dark:bg-red-700/10">
                        <div className="space-y-0.5 text-red-600 dark:text-red-100">
                            <p className="font-medium">Delete this location</p>
                            <p className="text-sm">
                                Once deleted, this location can be restored by
                                an administrator, but its history stays hidden
                                until then.
                            </p>
                        </div>

                        <Dialog>
                            <DialogTrigger asChild>
                                <Button
                                    variant="destructive"
                                    className="w-full sm:w-auto"
                                >
                                    <Trash2 />
                                    Delete Location
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogTitle>
                                    Delete &quot;{location.name}&quot;?
                                </DialogTitle>
                                <DialogDescription>
                                    This action cannot be undone from here.
                                </DialogDescription>

                                <Form
                                    {...destroy.form(location)}
                                    options={{ preserveScroll: true }}
                                >
                                    {({ processing }) => (
                                        <DialogFooter className="gap-2">
                                            <DialogClose asChild>
                                                <Button
                                                    variant="ghost"
                                                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                >
                                                    <X /> Cancel
                                                </Button>
                                            </DialogClose>

                                            <Button
                                                variant="destructive"
                                                disabled={processing}
                                                asChild
                                            >
                                                <button type="submit">
                                                    {processing && <Spinner />}
                                                    Delete Location
                                                </button>
                                            </Button>
                                        </DialogFooter>
                                    )}
                                </Form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </section>
            </div>
        </>
    );
}
