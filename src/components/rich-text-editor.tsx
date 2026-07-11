import * as React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, Heading2, Heading3, List, ListOrdered, Link2, ImagePlus, Loader2, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { uploadGddImage } from '@/api/gdd';
import './rich-text.css';

// Imagem com atributos de tamanho (width) e alinhamento (data-align)
const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        renderHTML: (attrs) => (attrs.width ? { style: `width: ${attrs.width}` } : {}),
        parseHTML: (el) => (el as HTMLElement).style.width || null,
      },
      align: {
        default: null,
        renderHTML: (attrs) => (attrs.align ? { 'data-align': attrs.align } : {}),
        parseHTML: (el) => (el as HTMLElement).getAttribute('data-align'),
      },
    };
  },
});

export function RichTextEditor({
  value,
  onChange,
  projectId,
}: {
  value: string;
  onChange: (html: string) => void;
  projectId: string;
}) {
  const fileRef = React.useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = React.useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      ResizableImage,
      Link.configure({ openOnClick: false, autolink: true }),
      Placeholder.configure({ placeholder: 'Escreva a documentação…' }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: { attributes: { class: 'rich-content min-h-[300px] px-3 py-2' } },
  });

  if (!editor) return null;

  function setLink() {
    const { from, to } = editor!.state.selection;
    const hasSelection = from !== to;
    const prev = editor!.getAttributes('link').href as string | undefined;
    const url = window.prompt('URL do link:', prev ?? 'https://');
    if (url === null) return;
    if (url === '') {
      editor!.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    if (hasSelection) {
      editor!.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    } else {
      // Sem texto selecionado: insere a própria URL como link clicável
      editor!.chain().focus().insertContent(`<a href="${url}">${url}</a> `).run();
    }
  }

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadGddImage(projectId, file);
      editor!.chain().focus().setImage({ src: url, alt: file.name }).run();
    } catch {
      window.alert('Falha ao enviar a imagem.');
    } finally {
      setUploading(false);
    }
  }

  const btn = (active: boolean) =>
    `p-1.5 rounded-md text-sm transition-colors ${active ? 'bg-[var(--bg-active)] text-primary' : 'text-tertiary hover:text-primary hover:bg-[var(--bg-hover)]'}`;

  return (
    <div className="border border-subtle rounded-md bg-canvas overflow-hidden">
      <div
        className="flex items-center gap-0.5 flex-wrap border-b border-subtle px-2 py-1.5"
        onMouseDown={(e) => e.preventDefault()}
      >
        <button type="button" className={btn(editor.isActive('bold'))} onClick={() => editor.chain().focus().toggleBold().run()} title="Negrito"><Bold size={15} /></button>
        <button type="button" className={btn(editor.isActive('italic'))} onClick={() => editor.chain().focus().toggleItalic().run()} title="Itálico"><Italic size={15} /></button>
        <span className="w-px h-4 bg-[var(--border-subtle)] mx-1" />
        <button type="button" className={btn(editor.isActive('heading', { level: 2 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Título"><Heading2 size={15} /></button>
        <button type="button" className={btn(editor.isActive('heading', { level: 3 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Subtítulo"><Heading3 size={15} /></button>
        <button type="button" className={btn(editor.isActive('bulletList'))} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Lista"><List size={15} /></button>
        <button type="button" className={btn(editor.isActive('orderedList'))} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Lista numerada"><ListOrdered size={15} /></button>
        <span className="w-px h-4 bg-[var(--border-subtle)] mx-1" />
        <button type="button" className={btn(editor.isActive('link'))} onClick={setLink} title="Link"><Link2 size={15} /></button>
        <button type="button" className={btn(false)} onClick={() => fileRef.current?.click()} title="Inserir imagem" disabled={uploading}>
          {uploading ? <Loader2 size={15} className="animate-spin" /> : <ImagePlus size={15} />}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickImage} />

        {editor.isActive('image') && (
          <>
            <span className="w-px h-4 bg-[var(--border-subtle)] mx-1" />
            {(['25%', '50%', '100%'] as const).map((w) => (
              <button
                key={w}
                type="button"
                className={btn(editor.getAttributes('image').width === w)}
                onClick={() => editor.chain().focus().updateAttributes('image', { width: w }).run()}
                title={`Largura ${w}`}
              >
                <span className="text-[11px] px-0.5">{w}</span>
              </button>
            ))}
            <button type="button" className={btn(editor.getAttributes('image').align === 'left')} onClick={() => editor.chain().focus().updateAttributes('image', { align: 'left' }).run()} title="Alinhar à esquerda"><AlignLeft size={15} /></button>
            <button type="button" className={btn(editor.getAttributes('image').align === 'center')} onClick={() => editor.chain().focus().updateAttributes('image', { align: 'center' }).run()} title="Centralizar"><AlignCenter size={15} /></button>
            <button type="button" className={btn(editor.getAttributes('image').align === 'right')} onClick={() => editor.chain().focus().updateAttributes('image', { align: 'right' }).run()} title="Alinhar à direita"><AlignRight size={15} /></button>
          </>
        )}
      </div>
      <div className="max-h-[52vh] overflow-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
