import { Download, Eye, Printer } from 'lucide-react';
import { useState } from 'react';
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

type PrintDocumentDialogProps = {
    title: string;
    description: string;
    previewUrl: string;
    downloadUrl: string;
};

export function PrintDocumentDialog({
    title,
    description,
    previewUrl,
    downloadUrl,
}: PrintDocumentDialogProps) {
    const [open, setOpen] = useState(false);

    function openPdf(url: string): void {
        window.open(url, '_blank', 'noopener,noreferrer');
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="accent" className="w-full sm:w-auto">
                    <Printer />
                    Print
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => openPdf(previewUrl)}
                    >
                        <Eye />
                        Preview PDF
                    </Button>
                    <Button type="button" onClick={() => openPdf(downloadUrl)}>
                        <Download />
                        Download PDF
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
