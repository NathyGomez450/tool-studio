import * as React from 'react';
import { BookOpen } from 'lucide-react';
import { TopBar } from '@/components/top-bar';
import { type GddSection } from '@/lib/data';
import { useGddSections } from '@/queries/hooks';
import { ScreenLoading, ScreenError, ScreenEmpty } from '@/components/screen-state';
import { useAuth } from '@/auth/auth-context';

export function Gdd() {
  const { activeProject } = useAuth();
  const projectId = activeProject?.id ?? '';
  const { data: gddSections, isLoading, isError } = useGddSections(projectId);
  if (isLoading) {
    return (
      <>
        <TopBar title={`Game Design Document — ${activeProject?.name ?? 'Projeto'}`} subtitle="Última edição" icon={<BookOpen size={20} />} iconTone="creative" />
        <div className="flex-1 overflow-auto">
          <ScreenLoading />
        </div>
      </>
    );
  }
  if (isError || !gddSections) {
    return (
      <>
        <TopBar title={`Game Design Document — ${activeProject?.name ?? 'Projeto'}`} subtitle="Última edição" icon={<BookOpen size={20} />} iconTone="creative" />
        <div className="flex-1 overflow-auto">
          <ScreenError />
        </div>
      </>
    );
  }
  return <GddContent sections={gddSections} />;
}

function GddContent({ sections }: { sections: GddSection[] }) {
  const { activeProject } = useAuth();
  const [active, setActive] = React.useState(sections[0]?.key ?? '');
  const section = sections.find((s) => s.key === active) ?? sections[0];

  if (!section) return <ScreenEmpty message="Nenhuma seção encontrada." />;

  return (
    <>
      <TopBar title={`Game Design Document — ${activeProject?.name ?? 'Projeto'}`} subtitle="Última edição" icon={<BookOpen size={20} />} iconTone="creative" />
      <div className="flex-1 flex min-h-0">
        <div className="w-[220px] border-r border-border-subtle p-4 px-2 flex flex-col gap-0.5 shrink-0">
          {sections.map((s) => (
            <div
              key={s.key}
              onClick={() => setActive(s.key)}
              className={`px-3 py-2 rounded-lg text-[13px] cursor-pointer ${
                active === s.key ? 'text-primary font-semibold bg-[var(--bg-hover)]' : 'text-secondary font-medium'
              }`}
            >
              {s.label}
            </div>
          ))}
        </div>
        <div className="flex-1 overflow-auto py-8 px-12 max-w-[760px]">
          <h1 className="text-[26px] mb-4 font-semibold">{section.title}</h1>
          <p className="text-sm text-secondary leading-relaxed">{section.body}</p>
        </div>
      </div>
    </>
  );
}
