import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Heading2, Heading3, Italic, List, ListOrdered } from 'lucide-react';
import { useEffect } from 'react';
import { Toggle } from '@/components/ui/toggle';
import { cn } from '@/lib/utils';

type RichTextEditorProps = {
    id?: string;
    name?: string;
    value: string;
    onChange: (html: string) => void;
    disabled?: boolean;
    error?: string;
};

export function RichTextEditor({
    id,
    name,
    value,
    onChange,
    disabled,
    error,
}: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [StarterKit],
        content: value,
        editable: !disabled,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                ...(id ? { id } : {}),
                class: 'rich-text-content min-h-32 rounded-b-md px-3 py-2 text-sm focus-visible:outline-none',
            },
        },
    });

    useEffect(() => {
        if (editor && editor.getHTML() !== value) {
            editor.commands.setContent(value, { emitUpdate: false });
        }
    }, [value, editor]);

    return (
        <div
            className={cn(
                'rounded-md border border-input',
                error && 'border-destructive',
            )}
        >
            <div className="flex flex-wrap items-center gap-1 border-b border-input bg-muted/40 p-1">
                <Toggle
                    type="button"
                    size="sm"
                    disabled={disabled}
                    pressed={editor?.isActive('bold') ?? false}
                    onPressedChange={() =>
                        editor?.chain().focus().toggleBold().run()
                    }
                    aria-label="Bold"
                >
                    <Bold />
                </Toggle>
                <Toggle
                    type="button"
                    size="sm"
                    disabled={disabled}
                    pressed={editor?.isActive('italic') ?? false}
                    onPressedChange={() =>
                        editor?.chain().focus().toggleItalic().run()
                    }
                    aria-label="Italic"
                >
                    <Italic />
                </Toggle>
                <Toggle
                    type="button"
                    size="sm"
                    disabled={disabled}
                    pressed={editor?.isActive('heading', { level: 2 }) ?? false}
                    onPressedChange={() =>
                        editor
                            ?.chain()
                            .focus()
                            .toggleHeading({ level: 2 })
                            .run()
                    }
                    aria-label="Heading 2"
                >
                    <Heading2 />
                </Toggle>
                <Toggle
                    type="button"
                    size="sm"
                    disabled={disabled}
                    pressed={editor?.isActive('heading', { level: 3 }) ?? false}
                    onPressedChange={() =>
                        editor
                            ?.chain()
                            .focus()
                            .toggleHeading({ level: 3 })
                            .run()
                    }
                    aria-label="Heading 3"
                >
                    <Heading3 />
                </Toggle>
                <Toggle
                    type="button"
                    size="sm"
                    disabled={disabled}
                    pressed={editor?.isActive('bulletList') ?? false}
                    onPressedChange={() =>
                        editor?.chain().focus().toggleBulletList().run()
                    }
                    aria-label="Bullet list"
                >
                    <List />
                </Toggle>
                <Toggle
                    type="button"
                    size="sm"
                    disabled={disabled}
                    pressed={editor?.isActive('orderedList') ?? false}
                    onPressedChange={() =>
                        editor?.chain().focus().toggleOrderedList().run()
                    }
                    aria-label="Numbered list"
                >
                    <ListOrdered />
                </Toggle>
            </div>
            <EditorContent editor={editor} />
            {name && <input type="hidden" name={name} value={value} />}
        </div>
    );
}
