import * as React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useCreateRoadmapItem, useUpdateRoadmapItem, useDeleteRoadmapItem } from '@/queries/mutations';
import { type RoadmapItem } from '@/lib/data';

const STATUSES: { value: RoadmapItem['status']; label: string }[] = [
  { value: 'planejado', label: 'Planejado' },
  { value: 'em andamento', label: 'Em andamento' },
  { value: 'concluído', label: 'Concluído' },
];

export function RoadmapDialog({
  open,
  onOpenChange,
  projectId,
  editing,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  projectId: string;
  editing?: { id: string; title: string; status: RoadmapItem['status']; quarter: string };
}) {
  const isEdit = !!editing;
  const [quarter, setQuarter] = React.useState('');
  const [title, setTitle] = React.useState('');
  const [status, setStatus] = React.useState<RoadmapItem['status']>('planejado');
  const [confirmingDelete, setConfirmingDelete] = React.useState(false);

  const createItem = useCreateRoadmapItem(projectId);
  const updateItem = useUpdateRoadmapItem(projectId);
  const deleteItem = useDeleteRoadmapItem(projectId);

  React.useEffect(() => {
    if (open) {
      setQuarter(editing?.quarter ?? '');
      setTitle(editing?.title ?? '');
      setStatus(editing?.status ?? 'planejado');
      setConfirmingDelete(false);
    }
  }, [open, editing]);

  const pending = createItem.isPending || updateItem.isPending || deleteItem.isPending;

  function submit() {
    if (!title.trim() || !quarter.trim()) return;
    if (isEdit && editing) {
      updateItem.mutate(
        { id: editing.id, title: title.trim(), status, quarter: quarter.trim() },
        { onSuccess: () => onOpenChange(false) },
      );
    } else {
      createItem.mutate(
        { quarter: quarter.trim(), title: title.trim(), status },
        { onSuccess: () => onOpenChange(false) },
      );
    }
  }

  function remove() {
    if (!editing) return;
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    deleteItem.mutate({ id: editing.id }, { onSuccess: () => onOpenChange(false) });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={isEdit ? 'Editar item' : 'Novo item do roadmap'}
        footer={
          <>
            {isEdit && (
              <Button variant="danger" onClick={remove} disabled={pending} className="mr-auto">
                {confirmingDelete ? 'Confirmar exclusão?' : 'Excluir'}
              </Button>
            )}
            <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={submit} disabled={!title.trim() || !quarter.trim() || pending}>
              {isEdit ? 'Salvar' : 'Criar'}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-tertiary">Trimestre</label>
            <Input value={quarter} onChange={(e) => setQuarter(e.target.value)} placeholder="Ex.: Q3 2026" autoFocus />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-tertiary">Título</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Modo multiplayer" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-tertiary">Status</label>
            <Select options={STATUSES} value={status} onChange={(e) => setStatus(e.target.value as RoadmapItem['status'])} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
