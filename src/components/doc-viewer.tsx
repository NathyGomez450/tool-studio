import * as React from 'react';
import DOMPurify from 'dompurify';
import { Loader2 } from 'lucide-react';
import { signedDocUrl } from '@/api/gdd';
import { type GddAttachment } from '@/lib/data';
import '@/components/rich-text.css';

/** Visualiza um documento privado: PDF via iframe nativo, DOCX convertido no cliente (mammoth). */
export function DocViewer({ attachment }: { attachment: GddAttachment }) {
  const [url, setUrl] = React.useState('');
  const [html, setHtml] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    let active = true;
    let objectUrl = '';
    setLoading(true);
    setError('');
    setHtml('');
    setUrl('');

    (async () => {
      try {
        const signed = await signedDocUrl(attachment.path);
        if (!active) return;
        if (attachment.kind === 'docx') {
          const res = await fetch(signed);
          const buf = await res.arrayBuffer();
          const mammoth = await import('mammoth/mammoth.browser');
          const result = await mammoth.convertToHtml({ arrayBuffer: buf });
          if (!active) return;
          setHtml(DOMPurify.sanitize(result.value));
        } else if (attachment.kind === 'pdf') {
          // Baixa como blob com tipo pdf → iframe renderiza inline (evita download forçado)
          const res = await fetch(signed);
          const buf = await res.arrayBuffer();
          if (!active) return;
          objectUrl = URL.createObjectURL(new Blob([buf], { type: 'application/pdf' }));
          setUrl(objectUrl);
        } else {
          setUrl(signed);
        }
      } catch {
        if (active) setError('Não foi possível abrir o documento.');
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [attachment.path, attachment.kind]);

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center gap-2 text-[13px] text-tertiary">
        <Loader2 className="animate-spin" size={16} /> Carregando documento…
      </div>
    );
  }
  if (error) {
    return <div className="h-[60vh] flex items-center justify-center text-[13px] text-[var(--red-400)]">{error}</div>;
  }
  if (attachment.kind === 'pdf') {
    return <iframe title={attachment.name} src={url} className="w-full h-[70vh] rounded-md border border-subtle bg-white" />;
  }
  if (attachment.kind === 'docx') {
    return <div className="rich-content max-h-[70vh] overflow-auto bg-surface rounded-md p-5" dangerouslySetInnerHTML={{ __html: html }} />;
  }
  return (
    <div className="h-[40vh] flex flex-col items-center justify-center gap-3 text-[13px] text-tertiary">
      <span>Pré-visualização não disponível para este tipo.</span>
      <a href={url} target="_blank" rel="noreferrer" className="text-[var(--accent-400)] underline">Baixar {attachment.name}</a>
    </div>
  );
}
