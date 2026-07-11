import * as React from 'react';
import { BookOpen, Pencil, Trash2, Plus, Paperclip, FileText, Upload, Loader2 } from 'lucide-react';
import { TopBar } from '@/components/top-bar';
import { type GddSection, type GddAttachment } from '@/lib/data';
import { useGddSections } from '@/queries/hooks';
import {
  useCreateGddSection,
  useUpdateGddSection,
  useDeleteGddSection,
  useUploadGddDoc,
  useRemoveGddDoc,
} from '@/queries/mutations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { RichTextEditor } from '@/components/rich-text-editor';
import { ScreenLoading, ScreenError, ScreenEmpty } from '@/components/screen-state';
import DOMPurify from 'dompurify';
import { useAuth } from '@/auth/auth-context';
import '@/components/rich-text.css';

const DocViewer = React.lazy(() =>
  import('@/components/doc-viewer').then((m) => ({ default: m.DocViewer })),
);

export function Gdd() {
  const { activeProject } = useAuth();
  const projectId = activeProject?.id ?? '';
  const title = `Game Design Document — ${activeProject?.name ?? 'Projeto'}`;
  const { data: gddSections, isLoading, isError } = useGddSections(projectId);

  if (isLoading) {
    return (
      <>
        <TopBar title={title} subtitle="Última edição" icon={<BookOpen size={20} />} iconTone="creative" />
        <div className="flex-1 overflow-auto"><ScreenLoading /></div>
      </>
    );
  }
  if (isError || !gddSections) {
    return (
      <>
        <TopBar title={title} subtitle="Última edição" icon={<BookOpen size={20} />} iconTone="creative" />
        <div className="flex-1 overflow-auto"><ScreenError /></div>
      </>
    );
  }
  return <GddContent sections={gddSections} projectId={projectId} title={title} />;
}

function GddContent({ sections, projectId, title }: { sections: GddSection[]; projectId: string; title: string }) {
  const [active, setActive] = React.useState(sections[0]?.key ?? '');
  const [editing, setEditing] = React.useState(false);
  const [editTitle, setEditTitle] = React.useState('');
  const [editBody, setEditBody] = React.useState('');
  const [confirmingDelete, setConfirmingDelete] = React.useState(false);

  const createSection = useCreateGddSection(projectId);
  const updateSection = useUpdateGddSection(projectId);
  const deleteSection = useDeleteGddSection(projectId);
  const uploadDoc = useUploadGddDoc(projectId);
  const removeDoc = useRemoveGddDoc(projectId);

  const docInputRef = React.useRef<HTMLInputElement | null>(null);
  const [viewerDoc, setViewerDoc] = React.useState<GddAttachment | null>(null);
  const [confirmDocPath, setConfirmDocPath] = React.useState<string | null>(null);

  const section = sections.find((s) => s.key === active) ?? sections[0];

  function onPickDoc(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !section) return;
    uploadDoc.mutate({ sectionId: section.id, file });
  }

  function onRemoveDoc(path: string) {
    if (!section) return;
    if (confirmDocPath !== path) {
      setConfirmDocPath(path);
      return;
    }
    removeDoc.mutate({ sectionId: section.id, path }, { onSettled: () => setConfirmDocPath(null) });
  }

  React.useEffect(() => {
    setEditing(false);
    setConfirmingDelete(false);
  }, [active]);

  async function handleCreate() {
    const created = await createSection.mutateAsync({ title: 'Nova seção', body: '' });
    setActive(created.key);
    setEditTitle(created.title);
    setEditBody(created.body);
    setEditing(true);
  }

  function startEdit() {
    if (!section) return;
    setEditTitle(section.title);
    setEditBody(section.body);
    setEditing(true);
  }

  function saveEdit() {
    if (!section || !editTitle.trim()) return;
    updateSection.mutate(
      { id: section.id, title: editTitle.trim(), body: editBody },
      { onSuccess: () => setEditing(false) },
    );
  }

  function remove() {
    if (!section) return;
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    const remaining = sections.filter((s) => s.id !== section.id);
    deleteSection.mutate(
      { id: section.id },
      { onSuccess: () => setActive(remaining[0]?.key ?? '') },
    );
  }

  const addAction = (
    <Button variant="secondary" onClick={handleCreate} disabled={createSection.isPending}>
      <Plus size={14} className="mr-1" /> Seção
    </Button>
  );

  return (
    <>
      <TopBar title={title} subtitle="Última edição" icon={<BookOpen size={20} />} iconTone="creative" actions={addAction} />
      <div className="flex-1 flex min-h-0">
        <div className="w-[220px] border-r border-border-subtle p-4 px-2 flex flex-col gap-0.5 shrink-0 overflow-auto">
          {sections.length === 0 && <div className="px-3 py-2 text-[12px] text-tertiary">Nenhuma seção ainda.</div>}
          {sections.map((s) => (
            <div
              key={s.id}
              onClick={() => setActive(s.key)}
              className={`px-3 py-2 rounded-lg text-[13px] cursor-pointer ${
                active === s.key ? 'text-primary font-semibold bg-[var(--bg-hover)]' : 'text-secondary font-medium'
              }`}
            >
              {s.label}
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-auto py-8 px-12 max-w-[760px]">
          {!section ? (
            <ScreenEmpty message="Nenhuma seção. Crie a primeira com “+ Seção”." />
          ) : editing ? (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-tertiary">Título</label>
                <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} autoFocus />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-tertiary">Conteúdo</label>
                <RichTextEditor value={editBody} onChange={setEditBody} projectId={projectId} />
              </div>
              <div className="flex gap-2">
                <Button onClick={saveEdit} disabled={!editTitle.trim() || updateSection.isPending}>
                  {updateSection.isPending ? 'Salvando…' : 'Salvar'}
                </Button>
                <Button variant="secondary" onClick={() => setEditing(false)}>Cancelar</Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-3 mb-4">
                <h1 className="text-[26px] font-semibold">{section.title}</h1>
                <div className="flex gap-2 shrink-0">
                  <Button variant="secondary" size="sm" onClick={startEdit}>
                    <Pencil size={13} className="mr-1" /> Editar
                  </Button>
                  <Button variant="danger" size="sm" onClick={remove} disabled={deleteSection.isPending}>
                    <Trash2 size={13} className="mr-1" /> {confirmingDelete ? 'Confirmar?' : 'Excluir'}
                  </Button>
                </div>
              </div>
              {section.body ? (
                <div className="rich-content" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(section.body) }} />
              ) : (
                <p className="text-sm text-tertiary italic">Sem conteúdo. Clique em Editar para adicionar.</p>
              )}

              <div className="mt-8 border-t border-border-subtle pt-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="flex items-center gap-1.5 text-[13px] font-semibold text-primary">
                    <Paperclip size={14} /> Documentos anexados
                  </span>
                  <Button variant="secondary" size="sm" onClick={() => docInputRef.current?.click()} disabled={uploadDoc.isPending}>
                    {uploadDoc.isPending ? <Loader2 size={13} className="mr-1 animate-spin" /> : <Upload size={13} className="mr-1" />}
                    Anexar (PDF/DOCX)
                  </Button>
                  <input ref={docInputRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={onPickDoc} />
                </div>
                {section.attachments.length === 0 ? (
                  <p className="text-[12px] text-tertiary">Nenhum documento. Anexe um PDF ou DOCX para visualizar aqui.</p>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {section.attachments.map((att) => (
                      <div key={att.path} className="group flex items-center gap-2.5 rounded-md border border-border-subtle bg-surface px-3 py-2">
                        <FileText size={15} className="text-tertiary shrink-0" />
                        <button type="button" onClick={() => setViewerDoc(att)} className="flex-1 text-left text-[13px] text-secondary hover:text-primary truncate">
                          {att.name}
                        </button>
                        <span className="text-[11px] text-disabled uppercase shrink-0">{att.kind}</span>
                        <span className="text-[11px] text-disabled shrink-0">{att.size}</span>
                        <button
                          type="button"
                          onClick={() => onRemoveDoc(att.path)}
                          className={`shrink-0 rounded px-1.5 py-0.5 text-[11px] flex items-center gap-1 ${confirmDocPath === att.path ? 'text-[var(--red-400)]' : 'text-tertiary opacity-0 group-hover:opacity-100 hover:text-[var(--red-400)]'}`}
                        >
                          <Trash2 size={13} /> {confirmDocPath === att.path ? 'Confirmar?' : ''}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <Dialog open={!!viewerDoc} onOpenChange={(o) => !o && setViewerDoc(null)}>
        {viewerDoc && (
          <DialogContent title={viewerDoc.name} className="w-[860px]">
            <React.Suspense fallback={<div className="h-[60vh] flex items-center justify-center text-[13px] text-tertiary">Abrindo visualizador…</div>}>
              <DocViewer attachment={viewerDoc} />
            </React.Suspense>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
