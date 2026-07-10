import { Sparkles } from 'lucide-react';
import { TopBar } from '@/components/top-bar';
import { Button } from '@/components/ui/button';
import { useBrainstormNotes } from '@/queries/hooks';
import { ScreenLoading, ScreenError, ScreenEmpty } from '@/components/screen-state';
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
  const { data: brainstormNotes, isLoading, isError } = useBrainstormNotes(projectId);
  return (
    <>
      <TopBar title="Brainstorm — Skyline Racer" subtitle="Board livre de ideias" icon={<Sparkles size={20} />} iconTone="warning" actions={<Button variant="secondary">+ Nota</Button>} />
      <div
        className="flex-1 relative overflow-auto bg-[var(--bg-canvas)]"
        style={{ backgroundImage: 'radial-gradient(var(--border-default) 1px, transparent 1px)', backgroundSize: '22px 22px' }}
      >
        {isLoading ? (
          <ScreenLoading />
        ) : isError || !brainstormNotes ? (
          <ScreenError />
        ) : brainstormNotes.length === 0 ? (
          <ScreenEmpty message="Nenhuma nota no brainstorm." />
        ) : (
          brainstormNotes.map((n, i) => (
            <div
              key={i}
              className="absolute w-[200px] min-h-[90px] rounded-md p-3.5 text-[13px] text-primary leading-relaxed shadow-md border"
              style={{
                left: n.x,
                top: n.y,
                background: toneBg[n.color] ?? toneBg.accent,
                borderColor: toneBorder[n.color] ?? toneBorder.accent,
                transform: `rotate(${(i % 2 === 0 ? -1 : 1) * (1 + (i % 3))}deg)`,
              }}
            >
              {n.text}
            </div>
          ))
        )}
      </div>
    </>
  );
}
