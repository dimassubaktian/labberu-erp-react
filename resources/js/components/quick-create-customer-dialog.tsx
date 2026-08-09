import { useHttp } from '@inertiajs/react';
import { UserPlus } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { quickCreate } from '@/routes/customers';

export type QuickCreatedCustomer = {
    id: number;
    name: string;
    customer_code: string;
};

type QuickCreateCustomerDialogProps = {
    onCreated: (customer: QuickCreatedCustomer) => void;
};

export function QuickCreateCustomerDialog({
    onCreated,
}: QuickCreateCustomerDialogProps) {
    const [open, setOpen] = useState(false);
    const { data, setData, post, errors, processing, reset } = useHttp({
        name: '',
        attention: '',
        phone: '',
        address: '',
    });

    function handleOpenChange(nextOpen: boolean): void {
        setOpen(nextOpen);

        if (!nextOpen) {
            reset();
        }
    }

    function handleSubmit(e: FormEvent): void {
        e.preventDefault();

        post(quickCreate().url, {
            onSuccess: (response) => {
                const payload = response as { data: QuickCreatedCustomer };
                onCreated(payload.data);
                setOpen(false);
                reset();
            },
        });
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button type="button" size="sm" title="Add new customer">
                    <UserPlus />
                    <span className="sr-only lg:not-sr-only lg:inline">
                        Add new customer
                    </span>
                </Button>
            </DialogTrigger>
            <DialogContent>
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>New customer</DialogTitle>
                        <DialogDescription>
                            Add a customer without leaving this form. Other
                            details can be filled in later from the customer
                            module.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="quick-customer-name">Name</Label>
                            <Input
                                id="quick-customer-name"
                                required
                                autoFocus
                                value={data.name}
                                onChange={(e) =>
                                    setData('name', e.target.value)
                                }
                                placeholder="e.g. Nusalink Bridge"
                            />
                            <InputError message={errors.name} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="quick-customer-attention">
                                Attention
                            </Label>
                            <Input
                                id="quick-customer-attention"
                                value={data.attention}
                                onChange={(e) =>
                                    setData('attention', e.target.value)
                                }
                                placeholder="Optional, e.g. Jane Doe"
                            />
                            <InputError message={errors.attention} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="quick-customer-phone">Phone</Label>
                            <Input
                                id="quick-customer-phone"
                                value={data.phone}
                                onChange={(e) =>
                                    setData('phone', e.target.value)
                                }
                                placeholder="Optional"
                            />
                            <InputError message={errors.phone} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="quick-customer-address">
                                Address
                            </Label>
                            <Textarea
                                id="quick-customer-address"
                                value={data.address}
                                onChange={(e) =>
                                    setData('address', e.target.value)
                                }
                                placeholder="Optional"
                            />
                            <InputError message={errors.address} />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing && <Spinner />}
                            Create customer
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
