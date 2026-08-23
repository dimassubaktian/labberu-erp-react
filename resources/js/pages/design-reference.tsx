import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    Ban,
    Download,
    Pencil,
    Plus,
    Search,
    Trash2,
    X,
} from 'lucide-react';
import * as React from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { formatDate, formatDateTime, formatNumber } from '@/lib/utils';
import { designReference } from '@/routes';

/**
 * Every example below renders the real component, so this page follows the code rather than
 * describing it. If a token or component changes, what you see here changes with it.
 */

function Section({
    title,
    rule,
    children,
}: {
    title: string;
    rule: string;
    children: React.ReactNode;
}) {
    return (
        <section className="space-y-4">
            <div className="space-y-0.5">
                <h2 className="text-base font-semibold">{title}</h2>
                <p className="text-sm text-muted-foreground">{rule}</p>
            </div>
            {children}
        </section>
    );
}

function Snippet({ children }: { children: string }) {
    return (
        <pre className="overflow-x-auto rounded-lg border border-border/50 bg-muted/40 p-3 text-xs text-muted-foreground">
            <code>{children}</code>
        </pre>
    );
}

const COLOR_TOKENS = [
    { name: 'background', className: 'bg-background', note: 'Page canvas' },
    { name: 'card', className: 'bg-card', note: 'Raised surfaces' },
    { name: 'muted', className: 'bg-muted', note: 'Subtle fills, code blocks' },
    {
        name: 'primary',
        className: 'bg-primary',
        note: 'Default buttons, active tab',
    },
    { name: 'secondary', className: 'bg-secondary', note: 'Status badges' },
    { name: 'accent', className: 'bg-accent', note: 'Hover states' },
    {
        name: 'destructive',
        className: 'bg-destructive',
        note: 'Delete, cancel, void',
    },
    {
        name: 'border',
        className: 'bg-border',
        note: 'Dividers, at /50 for cards',
    },
];

const DOCUMENT_STATUSES = [
    'draft',
    'request_for_approval',
    'issued',
    'approved',
    'confirmed',
    'rejected',
    'cancelled',
    'voided',
];

export default function DesignReference() {
    const [search, setSearch] = React.useState('');
    const [status, setStatus] = React.useState('all');

    return (
        <>
            <Head title="Design Reference" />

            <div className="mx-auto w-full max-w-5xl space-y-10 p-4">
                <Heading
                    title="Design Reference"
                    description="The UI conventions this app is built from. Point at this page when asking for new screens."
                />

                <Section
                    title="Page shell"
                    rule="Every page is centred at max-w-5xl with p-4 and space-y-6. The header row holds the Heading on the left and actions on the right, stacking on mobile."
                >
                    <Snippet>{`<div className="mx-auto w-full max-w-5xl space-y-6 p-4">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <Heading title={record.code} description="Record details" />
        <div className="flex flex-col gap-2 sm:flex-row">{/* actions */}</div>
    </div>
</div>`}</Snippet>

                    <div className="rounded-xl border border-border/50 p-4">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <Heading
                                title="LAB-INV26001"
                                description="Invoice details"
                            />
                            <div className="flex flex-col gap-2 sm:flex-row">
                                <Button
                                    variant="destructive"
                                    className="w-full sm:w-auto"
                                >
                                    <ArrowLeft />
                                    Back to Invoices
                                </Button>
                                <Button className="w-full sm:w-auto">
                                    <Pencil />
                                    Edit Invoice
                                </Button>
                            </div>
                        </div>
                    </div>
                </Section>

                <Section
                    title="Colour tokens"
                    rule="Always use the semantic token, never a raw hex. Both themes are derived from these, so a hard-coded colour breaks dark mode."
                >
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {COLOR_TOKENS.map((token) => (
                            <div
                                key={token.name}
                                className="overflow-hidden rounded-lg border border-border/50"
                            >
                                <div className={`h-12 ${token.className}`} />
                                <div className="space-y-0.5 p-3">
                                    <p className="font-mono text-xs">
                                        {token.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {token.note}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Section>

                <Section
                    title="Typography"
                    rule="Page title comes from Heading. Section headings are text-base font-semibold. Supporting copy is text-sm text-muted-foreground. There is no other heading size in use."
                >
                    <div className="space-y-3 rounded-xl border border-border/50 p-4">
                        <Heading
                            title="Page title"
                            description="Heading component, used once per page"
                        />
                        <h2 className="text-base font-semibold">
                            Section heading
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Muted supporting text, empty states and hints.
                        </p>
                        <p className="font-medium">
                            Body copy for values inside a definition list.
                        </p>
                    </div>
                </Section>

                <Section
                    title="Buttons"
                    rule="default for the primary action, destructive for delete/cancel/void AND for the back link, outline for secondary actions such as print, ghost for filter resets. Icons go before the label with no wrapper. Full width on mobile via w-full sm:w-auto."
                >
                    <div className="flex flex-wrap gap-2 rounded-xl border border-border/50 p-4">
                        <Button>
                            <Plus />
                            Default
                        </Button>
                        <Button variant="destructive">
                            <Trash2 />
                            Destructive
                        </Button>
                        <Button variant="outline">
                            <Download />
                            Outline
                        </Button>
                        <Button variant="secondary">Secondary</Button>
                        <Button variant="ghost">
                            <X />
                            Ghost
                        </Button>
                        <Button variant="link">Link</Button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/50 p-4">
                        <Button size="sm">Small</Button>
                        <Button>Default</Button>
                        <Button size="lg">Large</Button>
                        <Button size="icon" aria-label="Icon button">
                            <Pencil />
                        </Button>
                        <Button disabled>
                            <Spinner />
                            Processing
                        </Button>
                    </div>
                </Section>

                <Section
                    title="Status badges"
                    rule="Document statuses are always secondary + capitalize, with underscores replaced by spaces. Colour is not used to encode status; the label carries the meaning. outline is for classifications such as priority."
                >
                    <Snippet>{`<Badge variant="secondary" className="capitalize">
    {record.status.replaceAll('_', ' ')}
</Badge>`}</Snippet>

                    <div className="flex flex-wrap gap-2 rounded-xl border border-border/50 p-4">
                        {DOCUMENT_STATUSES.map((value) => (
                            <Badge
                                key={value}
                                variant="secondary"
                                className="capitalize"
                            >
                                {value.replaceAll('_', ' ')}
                            </Badge>
                        ))}
                        <Badge variant="outline" className="capitalize">
                            high
                        </Badge>
                        <Badge>Default</Badge>
                        <Badge variant="destructive">Destructive</Badge>
                    </div>
                </Section>

                <Section
                    title="Details list"
                    rule="Read-only record fields use a dl grid of two columns. Labels are text-sm text-muted-foreground, values font-medium. Missing values render an em dash, never an empty cell. Long fields span both columns."
                >
                    <dl className="grid gap-4 rounded-xl border border-border/50 p-4 sm:grid-cols-2">
                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Invoice code
                            </dt>
                            <dd className="font-medium">LAB-INV26001</dd>
                        </div>
                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Total
                            </dt>
                            <dd className="font-medium">
                                Rp {formatNumber('1750000')}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Invoice date
                            </dt>
                            <dd className="font-medium">
                                {formatDate('2026-08-16')}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Paid at
                            </dt>
                            <dd className="font-medium">
                                <span className="text-muted-foreground">
                                    &mdash;
                                </span>
                            </dd>
                        </div>
                        <div className="sm:col-span-2">
                            <dt className="text-sm text-muted-foreground">
                                Last updated
                            </dt>
                            <dd className="font-medium">
                                {formatDateTime('2026-08-16 09:30:00')}
                            </dd>
                        </div>
                    </dl>

                    <Snippet>{`formatNumber('1750000')  // ${formatNumber('1750000')}
formatDate('2026-08-16') // ${formatDate('2026-08-16')}
formatDateTime(value)    // ${formatDateTime('2026-08-16 09:30:00')}`}</Snippet>
                </Section>

                <Section
                    title="Filter bar"
                    rule="Search input with a leading icon at sm:max-w-xs, then selects, then a ghost Reset that only appears once a filter is active. Stacks vertically on mobile."
                >
                    <div className="flex flex-col gap-3 rounded-xl border border-border/50 p-4 sm:flex-row sm:flex-wrap sm:items-center">
                        <div className="relative w-full sm:max-w-xs">
                            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder="Search by code"
                                className="pl-9"
                            />
                        </div>

                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger className="w-full sm:w-52">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    All statuses
                                </SelectItem>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="issued">Issued</SelectItem>
                            </SelectContent>
                        </Select>

                        {(search !== '' || status !== 'all') && (
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    setSearch('');
                                    setStatus('all');
                                }}
                                className="w-full text-destructive hover:text-destructive sm:w-auto dark:text-destructive-foreground dark:hover:text-destructive-foreground"
                            >
                                <X />
                                Reset
                            </Button>
                        )}
                    </div>
                </Section>

                <Section
                    title="Tables"
                    rule="Always wrapped in overflow-hidden rounded-xl border border-border/50. The first cell is font-medium and links to the record; other cells are text-muted-foreground. An empty result renders one row with colSpan and h-24 text-center, never a blank table."
                >
                    <div className="overflow-hidden rounded-xl border border-border/50">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Invoice code</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow>
                                    <TableCell className="font-medium">
                                        <Link href={designReference()}>
                                            LAB-INV26001
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="secondary"
                                            className="capitalize"
                                        >
                                            issued
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        Rp {formatNumber('1750000')}
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell
                                        colSpan={3}
                                        className="h-24 text-center text-muted-foreground"
                                    >
                                        No invoices match your filters.
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                </Section>

                <Section
                    title="Form fields"
                    rule="Each field is a grid gap-2 of Label, control, InputError. Two-column layouts use grid gap-2 sm:grid-cols-2. Errors come from the server via the Form render prop, never from client-side validation."
                >
                    <div className="grid gap-4 rounded-xl border border-border/50 p-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="reference-name">Name</Label>
                            <Input
                                id="reference-name"
                                placeholder="e.g. Customer PO"
                            />
                            <InputError />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="reference-invalid">
                                Field with an error
                            </Label>
                            <Input
                                id="reference-invalid"
                                defaultValue="Not valid"
                                aria-invalid
                            />
                            <InputError message="The name field is required." />
                        </div>

                        <div className="grid gap-2 sm:col-span-2">
                            <Label htmlFor="reference-notes">Remarks</Label>
                            <Textarea
                                id="reference-notes"
                                placeholder="Optional"
                                rows={3}
                            />
                            <InputError />
                        </div>
                    </div>

                    <Snippet>{`<Form {...store.form()} options={{ preserveScroll: true }}>
    {({ processing, errors }) => (
        <>
            <Input name="name" />
            <InputError message={errors.name} />
            <Button type="submit" disabled={processing}>
                {processing && <Spinner />}
                Save
            </Button>
        </>
    )}
</Form>`}</Snippet>
                </Section>

                <Section
                    title="Tabs"
                    rule="Related records on a show page go in tabs rather than stacked sections. Add min-w-0 flex-nowrap justify-start overflow-x-auto so the strip scrolls instead of wrapping on small screens."
                >
                    <Tabs defaultValue="quotations">
                        <TabsList className="min-w-0 flex-nowrap justify-start overflow-x-auto">
                            <TabsTrigger value="quotations">
                                Quotations
                            </TabsTrigger>
                            <TabsTrigger value="delivery-orders">
                                Delivery Orders
                            </TabsTrigger>
                            <TabsTrigger value="invoices">Invoices</TabsTrigger>
                        </TabsList>
                        <TabsContent
                            value="quotations"
                            className="space-y-4 pt-2"
                        >
                            <p className="text-sm text-muted-foreground">
                                Tab panels use space-y-4 and open with an h2
                                matching the trigger label.
                            </p>
                        </TabsContent>
                    </Tabs>
                </Section>

                <Section
                    title="Confirmation dialogs"
                    rule="Anything irreversible is confirmed in a Dialog naming the record. The cancel button is secondary, the confirming button carries the destructive variant and a Spinner while processing."
                >
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="destructive">
                                <Trash2 />
                                Delete Invoice
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogTitle>
                                Delete &quot;LAB-INV26001&quot;?
                            </DialogTitle>
                            <DialogDescription>
                                This action cannot be undone. This invoice will
                                be permanently deleted.
                            </DialogDescription>
                            <DialogFooter className="gap-2">
                                <DialogClose asChild>
                                    <Button
                                        variant="ghost"
                                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                    >
                                        <X /> Cancel
                                    </Button>
                                </DialogClose>
                                <Button variant="destructive">Delete</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </Section>

                <Section
                    title="Danger zone"
                    rule="Destructive record actions sit in their own bordered block at the bottom of a show page, one row per action, each explaining the consequence before the button."
                >
                    <div className="space-y-4 rounded-lg border border-destructive/50 p-4">
                        <h2 className="text-base font-semibold text-destructive dark:text-destructive-foreground">
                            Danger Zone
                        </h2>
                        <div className="flex flex-col gap-4 rounded-lg border border-red-100 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-red-200/10 dark:bg-red-700/10">
                            <div className="space-y-0.5 text-red-600 dark:text-red-100">
                                <p className="font-medium">
                                    Cancel this project
                                </p>
                                <p className="text-sm">
                                    Mark the project as cancelled. The status
                                    will no longer update automatically.
                                </p>
                            </div>
                            <Button
                                variant="destructive"
                                className="w-full sm:w-auto"
                            >
                                <Ban />
                                Cancel Project
                            </Button>
                        </div>
                    </div>
                </Section>

                <Section
                    title="Writing"
                    rule="Buttons name the action and the object (Edit Invoice, not Edit). Empty states say what is missing and why. Toasts are past tense and end with a full stop."
                >
                    <div className="space-y-2 rounded-xl border border-border/50 p-4 text-sm">
                        <p>
                            <span className="text-muted-foreground">
                                Empty state:
                            </span>{' '}
                            No quotations have been created for this project
                            yet.
                        </p>
                        <p>
                            <span className="text-muted-foreground">
                                No filter match:
                            </span>{' '}
                            No invoices match your filters.
                        </p>
                        <p>
                            <span className="text-muted-foreground">
                                Toast:
                            </span>{' '}
                            Invoice issued.
                        </p>
                        <p>
                            <span className="text-muted-foreground">
                                Blocked action:
                            </span>{' '}
                            Cannot edit a purchase order that has a confirmed
                            goods receipt note or an issued purchase invoice.
                        </p>
                    </div>
                </Section>
            </div>
        </>
    );
}

DesignReference.layout = {
    breadcrumbs: [{ title: 'Design Reference', href: designReference() }],
};
