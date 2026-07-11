import * as React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useCreateBug, useUpdateBug, useDeleteBug, useAddBugComment } from '@/queries/mutations';
import { useBugComments } from '@/queries/hooks';
import { Avatar } from '@/components/ui/avatar';
import { type Bug } from '@/lib/data';

const SEVERITIES: { value: Bug['severity']; label: string }[] = [
  { value: 'low', label: 'Baixa' },
  { value: 'medium', label: 'Média' },
  { value: 'high', label: 'Alta' },
  { value: 'critical', label: 'Crítica' },
];

export function BugDialog({
  open,
  onOpenChange,
  bug,
  projectId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  bug?: Bug;
  projectId: string;
}) {
  const isEdit = !!bug;
  const [title, setTitle] = React.useState('');
  const [severity, setSeverity] = React.useState<Bug['severity']>('medium');
  const [confirmingDelete, setConfirmingDelete] = React.useState(false);
  const [commentText, setCommentText] = React.useState('');
  const createBug = useCreateBug(projectId);
  const updateBug = useUpdateBug(projectId);
  const deleteBug = useDeleteBug(projectId);
  const addComment = useAddBugComment(projectId);
  const { data: comments } = useBugComments(projectId, open && isEdit ? bug?.id : undefined);

  function submitComment() {
    if (!bug || !commentText.trim()) return;
    addComment.mutate({ bugId: bug.id, text: commentText.trim() }, { onSuccess: () => setCommentText('') });
  }

  React.useEffect(() => {
    if (open) {
      setTitle(bug?.title ?? '');
      setSeverity(bug?.severity ?? 'medium');
      setConfirmingDelete(false);
      setCommentText('');
    }
  }, [open, bug]);

  const pending = createBug.isPending || updateBug.isPending || deleteBug.isPending;

  function submit() {
    if (!title.trim()) return;
    if (isEdit && bug) {
      updateBug.mutate({ bugId: bug.id, title: title.trim(), severity }, { onSuccess: () => onOpenChange(false) });
    } else {
      createBug.mutate({ title: title.trim(), severity }, { onSuccess: () => onOpenChange(false) });
    }
  }

  function remove() {
    if (!bug) return;
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    deleteBug.mutate({ bugId: bug.id }, { onSuccess: () => onOpenChange(false) });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={isEdit ? 'Editar bug' : 'Reportar bug'}
        footer={
          <>
            {isEdit && (
              <Button variant="danger" onClick={remove} disabled={pending} className="mr-auto">
                {confirmingDelete ? 'Confirmar exclusão?' : 'Excluir'}
              </Button>
            )}
            <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={submit} disabled={!title.trim() || pending}>
              {isEdit ? 'Salvar' : 'Reportar'}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-tertiary">Título</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Crash ao entrar no lobby" autoFocus />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-tertiary">Severidade</label>
            <Select options={SEVERITIES} value={severity} onChange={(e) => setSeverity(e.target.value as Bug['severity'])} />
          </div>

          {isEdit && (
            <div className="flex flex-col gap-2 border-t border-border-subtle pt-3 mt-1">
              <label className="text-xs text-tertiary">Comentários</label>
              <div className="flex flex-col gap-2 max-h-[220px] overflow-auto pr-1">
                {(comments ?? []).length === 0 && <p className="text-[12px] text-tertiary">Sem comentários ainda.</p>}
                {(comments ?? []).map((c) => (
                  <div key={c.id} className="flex gap-2">
                    <Avatar name={c.author} size={24} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="text-[12px] font-semibold text-primary truncate">{c.author}</span>
                        <span className="text-[10px] text-disabled shrink-0">{c.when}</span>
                      </div>
                      <p className="text-[13px] text-secondary whitespace-pre-wrap break-words">{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Escreva um comentário…"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      submitComment();
                    }
                  }}
                />
                <Button onClick={submitComment} disabled={!commentText.trim() || addComment.isPending}>
                  {addComment.isPending ? '…' : 'Comentar'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
