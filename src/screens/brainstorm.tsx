import * as React from 'react';
import { Sparkles, Plus } from 'lucide-react';
import { TopBar } from '@/components/top-bar';
import { Button } from '@/components/ui/button';
import { useBrainstormNotes } from '@/queries/hooks';
import { useCreateBrainstormNote, useUpdateBrainstormNote } from '@/queries/mutations';
import { BrainstormDialog } from '@/components/dialogs/brainstorm-dialog';
import { ScreenLoading, ScreenError, ScreenEmpty } from '@/components/screen-state';
import { type BrainstormNote } from '@/lib/data';
import { useAuth } from '@/auth/auth-context';

const toneBg: Record<string, string> = {
  creative: 'var(--creative-soft)',
  accent: 'var(--accent-soft)',
  info: 'var(--info-soft)',
  warning: 'var(--warning-soft)',
};
const toneBorder: Record<string, string> = {
  creative: 'oklch(0.58 0.19 300 / 0.35)',
  accent: 'var(--accent-soft-border)',
  info: 'oklch(0.62 0.16 250 / 0.35)',
  warning: 'oklch(0.75 0.16 75 / 0.35)',
};

export function Brainstorm() {
  const { activeProject } = useAuth();
  const projectId = activeProject?.id ?? '';
  const { data: notes, isLoading, isError } = useBrainstormNotes(projectId);
  const createNote = useCreateBrainstormNote(projectId);
  const updateNote = useUpdateBrainstormNote(projectId);

  const [editing, setEditing] = React.useState<BrainstormNote | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [livePos, setLivePos] = React.useState<Record<string, { x: number; y: number }>>({});
  const dragRef = React.useRef<{ id: string; startX: number; startY: number; origX: number; origY: number; moved: boolean } | null>(null);

  function onPointerDown(e: React.PointerEvent, note: BrainstormNote) {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { id: note.id, startX: e.clientX, startY: e.clientY, origX: note.x, origY: note.y, moved: false };
  }
  function onPointerMove(e: React.PointerEvent) {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) d.moved = true;
    setLivePos((p) => ({ ...p, [d.id]: { x: Math.max(0, d.origX + dx), y: Math.max(0, d.origY + dy) } }));
  }
  function onPointerUp(_e: React.PointerEvent, note: BrainstormNote) {
    const d = dragRef.current;
    dragRef.current = null;
    if (!d) return;
    if (d.moved) {
      const pos = livePos[d.id];
      if (pos) updateNote.mutate({ id: note.id, x: Math.round(pos.x), y: Math.round(pos.y) });
    } else {
      setEditing(note);
      setDialogOpen(true);
    }
  }

  function addNote() {
    createNote.mutate({ text: 'Nova ideia', color: 'accent', x: 60, y: 60 });
  }

  return (
    <>
      <TopBar
        title={`Brainstorm — ${activeProject?.name ?? 'Projeto'}`}
        subtitle="Board livre de ideias"
        icon={<Sparkles size={20} />}
        iconTone="warning"
        actions={<Button variant="secondary" onClick={addNote} disabled={createNote.isPending}><Plus size={14} className="mr-1" /> Nota</Button>}
      />
      <div
        className="flex-1 relative overflow-auto bg-[var(--bg-canvas)]"
        style={{ backgroundImage: 'radial-gradient(var(--border-default) 1px, transparent 1px)', backgroundSize: '22px 22px' }}
      >
        {isLoading ? (
          <ScreenLoading />
        ) : isError || !notes ? (
          <ScreenError />
        ) : notes.length === 0 ? (
          <ScreenEmpty message="Nenhuma nota. Crie uma com “+ Nota”." />
        ) : (
          notes.map((n) => {
            const pos = livePos[n.id] ?? { x: n.x, y: n.y };
            return (
              <div
                key={n.id}
                onPointerDown={(e) => onPointerDown(e, n)}
                onPointerMove={onPointerMove}
                onPointerUp={(e) => onPointerUp(e, n)}
                className="absolute w-[200px] min-h-[90px] rounded-md p-3.5 text-[13px] text-primary leading-relaxed shadow-md border cursor-grab active:cursor-grabbing select-none touch-none"
                style={{
                  left: pos.x,
                  top: pos.y,
                  background: toneBg[n.color] ?? toneBg.accent,
                  borderColor: toneBorder[n.color] ?? toneBorder.accent,
                }}
              >
                {n.text}
              </div>
            );
          })
        )}
      </div>
      <BrainstormDialog open={dialogOpen} onOpenChange={setDialogOpen} projectId={projectId} note={editing} />
    </>
  );
}
