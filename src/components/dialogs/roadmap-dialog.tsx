import * as React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useCreateRoadmapItem, useUpdateRoadmapItem, useDeleteRoadmapItem } from '@/queries/mutations';
import { useTeam } from '@/queries/hooks';
import { type RoadmapStatus, type RoadmapBucket } from '@/lib/data';

const STATUSES: { value: RoadmapStatus; label: string }[] = [
  { value: 'planejado', label: 'Planejado' },
  { value: 'em andamento', label: 'Em andamento' },
  { value: 'concluído', label: 'Concluído' },
];
const BUCKETS: { value: string; label: string }[] = [
  { value: '', label: 'Sem categoria' },
  { value: 'now', label: 'Agora (Now)' },
  { value: 'next', label: 'Próximo (Next)' },
  { value: 'later', label: 'Futuro (Later)' },
];

export type RoadmapEditing = {
  id: string;
  title: string;
  status: RoadmapStatus;
  quarter: string;
  bucket: RoadmapBucket;
  description: string;
  assignee: string;
};

export function RoadmapDialog({
  open,
  onOpenChange,
  projectId,
  editing,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  projectId: string;
  editing?: RoadmapEditing;
}) {
  const isEdit = !!editing;
  const { data: team } = useTeam(projectId);
  const [quarter, setQuarter] = React.useState('');
  const [title, setTitle] = React.useState('');
  const [status, setStatus] = React.useState<RoadmapStatus>('planejado');
  const [bucket, setBucket] = React.useState<string>('');
  const [description, setDescription] = React.useState('');
  const [assignee, setAssignee] = React.useState('—');
  const [confirmingDelete, setConfirmingDelete] = React.useState(false);

  const createItem = useCreateRoadmapItem(projectId);
  const updateItem = useUpdateRoadmapItem(projectId);
  const deleteItem = useDeleteRoadmapItem(projectId);

  React.useEffect(() => {
    if (open) {
      setQuarter(editing?.quarter ?? '');
      setTitle(editing?.title ?? '');
      setStatus(editing?.status ?? 'planejado');
      setBucket(editing?.bucket ?? '');
      setDescription(editing?.description ?? '');
      setAssignee(editing?.assignee ?? '—');
      setConfirmingDelete(false);
    }
  }, [open, editing]);

  const assigneeOptions = React.useMemo(
    () => [{ value: '—', label: 'Sem responsável' }, ...(team ?? []).map((m) => ({ value: m.name, label: m.name }))],
    [team],
  );

  const pending = createItem.isPending || updateItem.isPending || deleteItem.isPending;

  function submit() {
    if (!title.trim() || !quarter.trim()) return;
    const payload = {
      quarter: quarter.trim(),
      title: title.trim(),
      status,
      bucket: (bucket || null) as RoadmapBucket,
      description: description.trim(),
      assignee,
    };
    if (isEdit && editing) {
      updateItem.mutate({ id: editing.id, ...payload }, { onSuccess: () => onOpenChange(false) });
    } else {
      createItem.mutate(payload, { onSuccess: () => onOpenChange(false) });
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
            <label className="text-xs text-tertiary">Título</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Modo multiplayer" autoFocus />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-tertiary">Descrição</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="O porquê / detalhes do item"
              className="w-full rounded-md border border-subtle bg-canvas p-2.5 text-sm text-primary leading-relaxed resize-y focus:outline-none focus:ring-1 focus:ring-[var(--accent-500)]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-tertiary">Trimestre</label>
              <Input value={quarter} onChange={(e) => setQuarter(e.target.value)} placeholder="Ex.: Q3 2026" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-tertiary">Fase (Now/Next/Later)</label>
              <Select options={BUCKETS} value={bucket} onChange={(e) => setBucket(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-tertiary">Status</label>
              <Select options={STATUSES} value={status} onChange={(e) => setStatus(e.target.value as RoadmapStatus)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-tertiary">Responsável</label>
              <Select options={assigneeOptions} value={assignee} onChange={(e) => setAssignee(e.target.value)} />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
