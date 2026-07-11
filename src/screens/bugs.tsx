import * as React from 'react';
import { Bug as BugIcon, Trash2 } from 'lucide-react';
import { TopBar } from '@/components/top-bar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { type Bug } from '@/lib/data';
import { useBugs, useTeam } from '@/queries/hooks';
import { useUpdateBugStatus, useUpdateBugAssignee, useDeleteBug } from '@/queries/mutations';
import { ScreenLoading, ScreenError, ScreenEmpty } from '@/components/screen-state';
import { BugDialog } from '@/components/dialogs/bug-dialog';
import { FilterBar } from '@/components/filter-bar';
import { useFilterStore } from '@/stores/filter-store';
import { useAuth } from '@/auth/auth-context';

const sevTone: Record<Bug['severity'], any> = { critical: 'danger', high: 'warning', medium: 'info', low: 'neutral' };
const STATUS_OPTIONS: { value: Bug['status']; label: string }[] = [
  { value: 'aberto', label: 'aberto' },
  { value: 'em análise', label: 'em análise' },
  { value: 'em correção', label: 'em correção' },
  { value: 'corrigido', label: 'corrigido' },
];
const SEVERITY_FILTER_OPTIONS = [
  { value: '', label: 'Todas severidades' },
  { value: 'low', label: 'Baixa' },
  { value: 'medium', label: 'Média' },
  { value: 'high', label: 'Alta' },
  { value: 'critical', label: 'Crítica' },
];
const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'Todos status' },
  { value: 'aberto', label: 'aberto' },
  { value: 'em análise', label: 'em análise' },
  { value: 'em correção', label: 'em correção' },
  { value: 'corrigido', label: 'corrigido' },
];

type DialogState = null | { mode: 'create' } | { mode: 'edit'; bug: Bug };

export function Bugs() {
  const { activeProject } = useAuth();
  const projectId = activeProject?.id ?? '';
  const { data: bugs, isLoading, isError } = useBugs(projectId);
  const { data: team } = useTeam(projectId);
  const [dialog, setDialog] = React.useState<DialogState>(null);
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);
  const updateStatus = useUpdateBugStatus(projectId);
  const updateAssignee = useUpdateBugAssignee(projectId);
  const deleteBug = useDeleteBug(projectId);

  const assigneeOptions = React.useMemo(() => {
    const names = (team ?? []).map((m) => m.name);
    const base = [{ value: '—', label: 'Sem responsável' }, ...names.map((n) => ({ value: n, label: n }))];
    return base;
  }, [team]);

  function onDeleteRow(id: string) {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      return;
    }
    deleteBug.mutate({ bugId: id }, { onSettled: () => setConfirmDeleteId(null) });
  }

  const filter = useFilterStore((s) => s.bugs);
  const setFilter = useFilterStore((s) => s.setBugsFilter);
  const clearFilter = useFilterStore((s) => s.clearBugs);

  const allAssignees = Array.from(new Set((bugs ?? []).map((b) => b.assignee).filter((a) => a !== '—'))).sort();

  function matchBug(b: Bug): boolean {
    const q = filter.text.trim().toLowerCase();
    if (q && !`${b.title} ${b.displayId}`.toLowerCase().includes(q)) return false;
    if (filter.severity && b.severity !== filter.severity) return false;
    if (filter.status && b.status !== filter.status) return false;
    if (filter.assignee && b.assignee !== filter.assignee) return false;
    return true;
  }

  const filteredBugs = bugs?.filter(matchBug) ?? [];
  const hasActiveFilter = !!(filter.text || filter.severity || filter.status || filter.assignee);
  const criticosAbertos = filteredBugs.filter((b) => b.severity === 'critical' && b.status !== 'corrigido').length;
  return (
    <>
      <TopBar
        title={`Bug Tracker — ${activeProject?.name ?? 'Projeto'}`}
        subtitle={`${filteredBugs.length} bugs · ${criticosAbertos} críticos`}
        icon={<BugIcon size={20} />}
        iconTone="danger"
        actions={<Button onClick={() => setDialog({ mode: 'create' })}>+ Reportar bug</Button>}
      />
      <FilterBar
        search={filter.text}
        onSearch={(v) => setFilter({ text: v })}
        onClear={clearFilter}
        hasActiveFilter={hasActiveFilter}
      >
        <Select
          className="w-[180px]"
          options={SEVERITY_FILTER_OPTIONS}
          value={filter.severity}
          onChange={(e) => setFilter({ severity: e.target.value })}
        />
        <Select
          className="w-[160px]"
          options={STATUS_FILTER_OPTIONS}
          value={filter.status}
          onChange={(e) => setFilter({ status: e.target.value })}
        />
        <Select
          className="w-[180px]"
          options={[{ value: '', label: 'Todos responsáveis' }, ...allAssignees.map((a) => ({ value: a, label: a }))]}
          value={filter.assignee}
          onChange={(e) => setFilter({ assignee: e.target.value })}
        />
      </FilterBar>
      <div className="flex-1 overflow-auto p-5 px-6">
        {isLoading ? (
          <ScreenLoading />
        ) : isError || !bugs ? (
          <ScreenError />
        ) : filteredBugs.length === 0 ? (
          <ScreenEmpty message="Nenhum bug encontrado." />
        ) : (
          <div className="flex flex-col border border-border rounded-md overflow-hidden">
            <div className="grid grid-cols-[110px_1fr_110px_130px_170px_80px_44px] px-4 py-2.5 bg-surface2 text-[11px] font-semibold text-tertiary uppercase tracking-wide">
              <div>ID</div>
              <div>Título</div>
              <div>Severidade</div>
              <div>Status</div>
              <div>Responsável</div>
              <div>Quando</div>
              <div />
            </div>
            {filteredBugs.map((b, i) => (
              <div
                key={b.id}
                className={`grid grid-cols-[110px_1fr_110px_130px_170px_80px_44px] px-4 py-3 items-center bg-surface ${i > 0 ? 'border-t border-border-subtle' : ''}`}
              >
                <div className="font-mono text-xs text-tertiary">{b.displayId}</div>
                <div
                  className="text-[13px] text-primary font-medium cursor-pointer hover:text-accent"
                  onClick={() => setDialog({ mode: 'edit', bug: b })}
                >
                  {b.title}
                </div>
                <div>
                  <Badge tone={sevTone[b.severity]} dot>
                    {b.severity}
                  </Badge>
                </div>
                <div className="pr-2">
                  <Select
                    options={STATUS_OPTIONS}
                    value={b.status}
                    onChange={(e) => updateStatus.mutate({ bugId: b.id, status: e.target.value as Bug['status'] })}
                  />
                </div>
                <div className="pr-2">
                  <Select
                    options={assigneeOptions}
                    value={b.assignee}
                    onChange={(e) => updateAssignee.mutate({ bugId: b.id, assignee: e.target.value })}
                  />
                </div>
                <div className="text-[11px] text-disabled">{b.when}</div>
                <div>
                  <button
                    type="button"
                    onClick={() => onDeleteRow(b.id)}
                    className={`rounded-md p-1.5 transition-colors ${confirmDeleteId === b.id ? 'text-[var(--red-400)] bg-[var(--danger-soft)]' : 'text-tertiary hover:text-[var(--red-400)] hover:bg-[var(--bg-hover)]'}`}
                    title={confirmDeleteId === b.id ? 'Confirmar exclusão' : 'Excluir bug'}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <BugDialog
        open={dialog !== null}
        bug={dialog?.mode === 'edit' ? dialog.bug : undefined}
        projectId={projectId}
        onOpenChange={(v) => { if (!v) setDialog(null); }}
      />
    </>
  );
}
