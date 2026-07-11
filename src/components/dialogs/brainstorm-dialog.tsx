import * as React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { useUpdateBrainstormNote, useDeleteBrainstormNote, useAddNoteComment } from '@/queries/mutations';
import { useNoteComments } from '@/queries/hooks';
import { type BrainstormNote } from '@/lib/data';

const COLORS = [
  { value: 'accent', label: 'Azul' },
  { value: 'creative', label: 'Roxo' },
  { value: 'info', label: 'Ciano' },
  { value: 'warning', label: 'Âmbar' },
];

export function BrainstormDialog({
  open,
  onOpenChange,
  projectId,
  note,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  projectId: string;
  note: BrainstormNote | null;
}) {
  const [text, setText] = React.useState('');
  const [color, setColor] = React.useState('accent');
  const [confirmingDelete, setConfirmingDelete] = React.useState(false);
  const [commentText, setCommentText] = React.useState('');
  const updateNote = useUpdateBrainstormNote(projectId);
  const deleteNote = useDeleteBrainstormNote(projectId);
  const addComment = useAddNoteComment(projectId);
  const { data: comments } = useNoteComments(projectId, open ? note?.id : undefined);

  React.useEffect(() => {
    if (open && note) {
      setText(note.text);
      setColor(note.color);
      setConfirmingDelete(false);
      setCommentText('');
    }
  }, [open, note]);

  function submitComment() {
    if (!note || !commentText.trim()) return;
    addComment.mutate({ noteId: note.id, text: commentText.trim() }, { onSuccess: () => setCommentText('') });
  }

  const pending = updateNote.isPending || deleteNote.isPending;

  function save() {
    if (!note || !text.trim()) return;
    updateNote.mutate({ id: note.id, text: text.trim(), color }, { onSuccess: () => onOpenChange(false) });
  }

  function remove() {
    if (!note) return;
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    deleteNote.mutate({ id: note.id }, { onSuccess: () => onOpenChange(false) });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title="Editar nota"
        footer={
          <>
            <Button variant="danger" onClick={remove} disabled={pending} className="mr-auto">
              {confirmingDelete ? 'Confirmar exclusão?' : 'Excluir'}
            </Button>
            <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={save} disabled={!text.trim() || pending}>Salvar</Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-tertiary">Texto</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              autoFocus
              className="w-full rounded-md border border-subtle bg-canvas p-2.5 text-sm text-primary leading-relaxed resize-y focus:outline-none focus:ring-1 focus:ring-[var(--accent-500)]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-tertiary">Cor</label>
            <Select options={COLORS} value={color} onChange={(e) => setColor(e.target.value)} />
          </div>

          <div className="flex flex-col gap-2 border-t border-border-subtle pt-3 mt-1">
            <label className="text-xs text-tertiary">Comentários</label>
            <div className="flex flex-col gap-2 max-h-[200px] overflow-auto pr-1">
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
