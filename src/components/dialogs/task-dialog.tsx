import * as React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useCreateTask, useUpdateTask, useDeleteTask } from '@/queries/mutations';
import { type Task } from '@/lib/data';

const PRIORITIES: { value: Task['priority']; label: string }[] = [
  { value: 'low', label: 'Baixa' },
  { value: 'medium', label: 'Média' },
  { value: 'high', label: 'Alta' },
  { value: 'critical', label: 'Crítica' },
];

export function TaskDialog({
  open,
  onOpenChange,
  task,
  projectId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  task?: Task;
  projectId: string;
}) {
  const isEdit = !!task;
  const [title, setTitle] = React.useState('');
  const [priority, setPriority] = React.useState<Task['priority']>('medium');
  const [tags, setTags] = React.useState('');
  const [confirmingDelete, setConfirmingDelete] = React.useState(false);
  const createTask = useCreateTask(projectId);
  const updateTask = useUpdateTask(projectId);
  const deleteTask = useDeleteTask(projectId);

  // Sincroniza o formulário quando abre em modo edição (ou reseta ao criar).
  React.useEffect(() => {
    if (open) {
      setTitle(task?.title ?? '');
      setPriority(task?.priority ?? 'medium');
      setTags(task?.tags.join(', ') ?? '');
      setConfirmingDelete(false);
    }
  }, [open, task]);

  const pending = createTask.isPending || updateTask.isPending || deleteTask.isPending;

  function submit() {
    if (!title.trim()) return;
    const parsedTags = tags.split(',').map((t) => t.trim()).filter(Boolean);
    if (isEdit && task) {
      updateTask.mutate(
        { taskId: task.id, title: title.trim(), priority, tags: parsedTags },
        { onSuccess: () => onOpenChange(false) },
      );
    } else {
      createTask.mutate(
        { title: title.trim(), priority, tag: parsedTags[0] },
        { onSuccess: () => onOpenChange(false) },
      );
    }
  }

  function remove() {
    if (!task) return;
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    deleteTask.mutate({ taskId: task.id }, { onSuccess: () => onOpenChange(false) });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={isEdit ? 'Editar tarefa' : 'Nova tarefa'}
        footer={
          <>
            {isEdit && (
              <Button variant="danger" onClick={remove} disabled={pending} className="mr-auto">
                {confirmingDelete ? 'Confirmar exclusão?' : 'Excluir'}
              </Button>
            )}
            <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={submit} disabled={!title.trim() || pending}>
              {isEdit ? 'Salvar' : 'Criar'}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-tertiary">Título</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Balancear economia" autoFocus />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-tertiary">Prioridade</label>
            <Select options={PRIORITIES} value={priority} onChange={(e) => setPriority(e.target.value as Task['priority'])} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-tertiary">Tags (separadas por vírgula)</label>
            <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Ex.: gameplay, ui" />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
