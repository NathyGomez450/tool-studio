import * as React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useCreateBug, useUpdateBug, useDeleteBug } from '@/queries/mutations';
import { type Bug } from '@/lib/data';

const SEVERITIES: { value: Bug['severity']; label: string }[] = [
  { value: 'low', label: 'Baixa' },
  { value: 'medium', label: 'Média' },
  { value: 'high', label: 'Alta' },
  { value: 'critical', label: 'Crítica' },
];

export function BugDialog({ open, onOpenChange, bug }: { open: boolean; onOpenChange: (v: boolean) => void; bug?: Bug }) {
  const isEdit = !!bug;
  const [title, setTitle] = React.useState('');
  const [severity, setSeverity] = React.useState<Bug['severity']>('medium');
  const [confirmingDelete, setConfirmingDelete] = React.useState(false);
  const createBug = useCreateBug();
  const updateBug = useUpdateBug();
  const deleteBug = useDeleteBug();

  React.useEffect(() => {
    if (open) {
      setTitle(bug?.title ?? '');
      setSeverity(bug?.severity ?? 'medium');
      setConfirmingDelete(false);
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
