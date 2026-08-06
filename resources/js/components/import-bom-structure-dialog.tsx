import { Import } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';

type BomSearchResult = {
    uuid: string;
    quotation_code: string;
    project_name: string;
    customer_name: string;
};

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect: (uuid: string) => void;
};

export function ImportBomStructureDialog({ open, onOpenChange, onSelect }: Props) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<BomSearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState<string | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!open) {
            return;
        }

        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(async () => {
            setLoading(true);
            try {
                const response = await fetch(
                    `/boms/search?q=${encodeURIComponent(query)}`,
                );
                const data = (await response.json()) as BomSearchResult[];
                setResults(data);
            } catch {
                setResults([]);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [query, open]);

    function handleOpenChange(next: boolean): void {
        if (!next) {
            setQuery('');
            setResults([]);
            setSelected(null);
        }
        onOpenChange(next);
    }

    function handleImport(): void {
        if (!selected) {
            return;
        }
        onSelect(selected);
        handleOpenChange(false);
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Import from existing BOM</DialogTitle>
                    <DialogDescription>
                        Search by project name or quotation code. The selected
                        BOM&apos;s structure, items, and cost settings will
                        pre-fill this form.
                    </DialogDescription>
                </DialogHeader>

                <Input
                    placeholder="Search project or quotation code…"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setSelected(null);
                    }}
                    autoFocus
                />

                <div className="min-h-32">
                    {loading && (
                        <div className="flex items-center justify-center py-8">
                            <Spinner />
                        </div>
                    )}

                    {!loading && results.length === 0 && (
                        <p className="py-8 text-center text-sm text-muted-foreground">
                            {query
                                ? 'No BOMs found.'
                                : 'Type to search BOMs.'}
                        </p>
                    )}

                    {!loading && results.length > 0 && (
                        <ul className="space-y-1">
                            {results.map((bom) => (
                                <li key={bom.uuid}>
                                    <button
                                        type="button"
                                        className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent ${selected === bom.uuid ? 'bg-accent' : ''}`}
                                        onClick={() =>
                                            setSelected(
                                                selected === bom.uuid
                                                    ? null
                                                    : bom.uuid,
                                            )
                                        }
                                    >
                                        <div className="font-medium">
                                            {bom.quotation_code}
                                        </div>
                                        <div className="text-muted-foreground">
                                            {bom.project_name} &mdash;{' '}
                                            {bom.customer_name}
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        disabled={!selected}
                        onClick={handleImport}
                    >
                        <Import />
                        Import
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
