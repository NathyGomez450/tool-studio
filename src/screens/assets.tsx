import { Boxes } from 'lucide-react';
import { TopBar } from '@/components/top-bar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAssets } from '@/queries/hooks';
import { ScreenLoading, ScreenError, ScreenEmpty } from '@/components/screen-state';
import { useAuth } from '@/auth/auth-context';

const typeTone: Record<string, any> = {
  'Modelo 3D': 'info',
  Textura: 'accent',
  'Áudio': 'creative',
  UI: 'neutral',
  Ambiente: 'warning',
  Animação: 'info',
};

export function Assets() {
  const { activeProject } = useAuth();
  const projectId = activeProject?.id ?? '';
  const { data: assets, isLoading, isError } = useAssets(projectId);
  return (
    <>
      <TopBar title={`Assets — ${activeProject?.name ?? 'Projeto'}`} subtitle={`${assets?.length ?? 0} arquivos`} icon={<Boxes size={20} />} actions={<Button variant="secondary">+ Upload</Button>} />
      <div className="flex-1 overflow-auto p-5 px-6">
        {isLoading ? (
          <ScreenLoading />
        ) : isError || !assets ? (
          <ScreenError />
        ) : assets.length === 0 ? (
          <ScreenEmpty message="Nenhum asset encontrado." />
        ) : (
          <div className="grid grid-cols-3 gap-3.5">
            {assets.map((a) => (
              <div key={a.name} className="bg-surface border border-border rounded-md p-3.5 flex flex-col gap-2.5 transition-all hover:border-border-strong hover:-translate-y-0.5 hover:shadow-md">
                <div className="h-20 rounded-sm bg-surface3 flex items-center justify-center text-disabled text-[11px]">preview</div>
                <div className="text-xs font-mono text-primary truncate">{a.name}</div>
                <div className="flex justify-between items-center">
                  <Badge tone={typeTone[a.type] ?? 'neutral'}>{a.type}</Badge>
                  <span className="text-[11px] text-disabled">{a.size}</span>
                </div>
                <div className="text-[11px] text-tertiary">por {a.by}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
