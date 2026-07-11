import * as React from 'react';
import DOMPurify from 'dompurify';
import { Loader2 } from 'lucide-react';
import * as pdfjs from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { signedDocUrl } from '@/api/gdd';
import { type GddAttachment } from '@/lib/data';
import '@/components/rich-text.css';

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

/** Visualiza um documento privado: PDF renderizado com PDF.js (canvas), DOCX via mammoth. */
export function DocViewer({ attachment }: { attachment: GddAttachment }) {
  const [html, setHtml] = React.useState('');
  const [otherUrl, setOtherUrl] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const pdfRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    setHtml('');
    setOtherUrl('');

    (async () => {
      try {
        const signed = await signedDocUrl(attachment.path);
        if (!active) return;
        const res = await fetch(signed);
        const buf = await res.arrayBuffer();
        if (!active) return;

        if (attachment.kind === 'docx') {
          const mammoth = await import('mammoth/mammoth.browser');
          const result = await mammoth.convertToHtml({ arrayBuffer: buf });
          if (!active) return;
          setHtml(DOMPurify.sanitize(result.value));
        } else if (attachment.kind === 'pdf') {
          const pdf = await pdfjs.getDocument({ data: buf }).promise;
          if (!active) return;
          const container = pdfRef.current;
          if (container) {
            container.innerHTML = '';
            for (let i = 1; i <= pdf.numPages; i++) {
              const page = await pdf.getPage(i);
              if (!active) return;
              const viewport = page.getViewport({ scale: 1.4 });
              const canvas = document.createElement('canvas');
              canvas.width = viewport.width;
              canvas.height = viewport.height;
              canvas.className = 'mx-auto mb-3 max-w-full h-auto shadow rounded-sm';
              const ctx = canvas.getContext('2d');
              if (!ctx) continue;
              container.appendChild(canvas);
              await page.render({ canvasContext: ctx, viewport }).promise;
            }
          }
        } else {
          setOtherUrl(signed);
        }
      } catch {
        if (active) setError('Não foi possível abrir o documento.');
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [attachment.path, attachment.kind]);

  const overlay = loading ? (
    <div className="absolute inset-0 flex items-center justify-center gap-2 text-[13px] text-tertiary">
      <Loader2 className="animate-spin" size={16} /> Carregando documento…
    </div>
  ) : error ? (
    <div className="absolute inset-0 flex items-center justify-center text-[13px] text-[var(--red-400)]">{error}</div>
  ) : null;

  if (attachment.kind === 'pdf') {
    return (
      <div className="relative h-[70vh] overflow-auto rounded-md bg-[#3a3d42] p-3">
        {overlay}
        <div ref={pdfRef} />
      </div>
    );
  }
  if (attachment.kind === 'docx') {
    return (
      <div className="relative min-h-[40vh]">
        {overlay}
        {!loading && !error && (
          <div className="rich-content max-h-[70vh] overflow-auto bg-surface rounded-md p-5" dangerouslySetInnerHTML={{ __html: html }} />
        )}
      </div>
    );
  }
  return (
    <div className="relative h-[40vh]">
      {overlay}
      {!loading && !error && (
        <div className="h-full flex flex-col items-center justify-center gap-3 text-[13px] text-tertiary">
          <span>Pré-visualização não disponível para este tipo.</span>
          <a href={otherUrl} target="_blank" rel="noreferrer" className="text-[var(--accent-400)] underline">Baixar {attachment.name}</a>
        </div>
      )}
    </div>
  );
}
