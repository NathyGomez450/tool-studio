import { ArrowRight } from 'lucide-react';
import { TopBar } from '@/components/top-bar';
import { Badge } from '@/components/ui/badge';
import { type RoadmapQuarter } from '@/lib/data';
import { useRoadmap } from '@/queries/hooks';
import { ScreenLoading, ScreenError, ScreenEmpty } from '@/components/screen-state';
import { useAuth } from '@/auth/auth-context';

const statusTone: Record<RoadmapQuarter['status'], any> = { 'em andamento': 'accent', planejado: 'neutral', 'concluído': 'success' };
const bulletColor: Record<RoadmapQuarter['status'], string> = {
  'em andamento': 'bg-accent',
  planejado: 'bg-[var(--gray-500)]',
  'concluído': 'bg-success',
};

export function Roadmap() {
  const { activeProject } = useAuth();
  const projectId = activeProject?.id ?? '';
  const { data: roadmap, isLoading, isError } = useRoadmap(projectId);
  return (
    <>
      <TopBar title={`Roadmap — ${activeProject?.name ?? 'Projeto'}`} subtitle="Próximos trimestres" icon={<ArrowRight size={20} />} iconTone="success" />
      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <ScreenLoading />
        ) : isError || !roadmap ? (
          <ScreenError />
        ) : roadmap.length === 0 ? (
          <ScreenEmpty message="Nenhum item no roadmap." />
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {roadmap.map((r) => (
              <div key={r.quarter} className="bg-surface border border-border rounded-md p-[18px] flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-[15px] font-bold text-primary">{r.quarter}</span>
                  <Badge tone={statusTone[r.status]}>{r.status}</Badge>
                </div>
                <div className="flex flex-col gap-2.5">
                  {r.items.map((it) => (
                    <div key={it} className="flex gap-2.5 items-start text-[13px] text-secondary leading-relaxed">
                      <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${bulletColor[r.status]}`} />
                      {it}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
