import * as React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useUpdateBrainstormNote, useDeleteBrainstormNote } from '@/queries/mutations';
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
  const updateNote = useUpdateBrainstormNote(projectId);
  const deleteNote = useDeleteBrainstormNote(projectId);

  React.useEffect(() => {
    if (open && note) {
      setText(note.text);
      setColor(note.color);
      setConfirmingDelete(false);
    }
  }, [open, note]);

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
        </div>
      </DialogContent>
    </Dialog>
  );
}
