import * as React from 'react';
import { Boxes, Plus, Trash2, Box } from 'lucide-react';
import { TopBar } from '@/components/top-bar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useAssets } from '@/queries/hooks';
import { useDeleteAsset } from '@/queries/mutations';
import { AssetUploadDialog } from '@/components/dialogs/asset-upload-dialog';
import { ScreenLoading, ScreenError, ScreenEmpty } from '@/components/screen-state';
import { type Asset } from '@/lib/data';
import { useAuth } from '@/auth/auth-context';

const typeTone: Record<string, any> = {
  'Modelo 3D': 'info',
  Textura: 'accent',
  'Áudio': 'creative',
  UI: 'neutral',
  Ambiente: 'warning',
  Animação: 'info',
};

const ModelViewer = React.lazy(() =>
  import('@/components/model-viewer').then((m) => ({ default: m.ModelViewer })),
);

const isImage = (name: string) => /\.(png|jpe?g|gif|webp|svg|avif|bmp)$/i.test(name);
const is3D = (name: string) => /\.obj$/i.test(name);

export function Assets() {
  const { activeProject } = useAuth();
  const projectId = activeProject?.id ?? '';
  const { data: assets, isLoading, isError } = useAssets(projectId);
  const deleteAsset = useDeleteAsset(projectId);
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [confirmId, setConfirmId] = React.useState<string | null>(null);
  const [viewer, setViewer] = React.useState<Asset | null>(null);

  function onDelete(id: string, url: string) {
    if (confirmId !== id) {
      setConfirmId(id);
      return;
    }
    deleteAsset.mutate({ id, url }, { onSettled: () => setConfirmId(null) });
  }

  return (
    <>
      <TopBar
        title={`Assets — ${activeProject?.name ?? 'Projeto'}`}
        subtitle={`${assets?.length ?? 0} arquivos`}
        icon={<Boxes size={20} />}
        actions={<Button variant="secondary" onClick={() => setUploadOpen(true)}><Plus size={14} className="mr-1" /> Upload</Button>}
      />
      <div className="flex-1 overflow-auto p-5 px-6">
        {isLoading ? (
          <ScreenLoading />
        ) : isError || !assets ? (
          <ScreenError />
        ) : assets.length === 0 ? (
          <ScreenEmpty message="Nenhum asset. Envie um com “+ Upload”." />
        ) : (
          <div className="grid grid-cols-3 gap-3.5">
            {assets.map((a) => (
              <div key={a.id} className="group relative bg-surface border border-border rounded-md p-3.5 flex flex-col gap-2.5 transition-all hover:border-border-strong hover:-translate-y-0.5 hover:shadow-md">
                <button
                  type="button"
                  onClick={() => onDelete(a.id, a.url)}
                  className={`absolute top-2 right-2 z-10 rounded-md px-1.5 py-1 text-[11px] flex items-center gap-1 transition-opacity ${
                    confirmId === a.id ? 'bg-[var(--danger-soft)] text-[var(--red-400)] opacity-100' : 'opacity-0 group-hover:opacity-100 text-tertiary hover:text-[var(--red-400)]'
                  }`}
                  title="Excluir asset"
                >
                  <Trash2 size={13} /> {confirmId === a.id ? 'Confirmar?' : ''}
                </button>

                {isImage(a.name) && a.url ? (
                  <a href={a.url} target="_blank" rel="noreferrer" className="h-20 rounded-sm bg-surface3 flex items-center justify-center overflow-hidden">
                    <img src={a.url} alt={a.name} className="h-full w-full object-cover" loading="lazy" />
                  </a>
                ) : is3D(a.name) && a.url ? (
                  <button
                    type="button"
                    onClick={() => setViewer(a)}
                    className="h-20 rounded-sm bg-surface3 flex items-center justify-center gap-1.5 text-[11px] text-secondary hover:text-primary hover:bg-[var(--bg-hover)] transition-colors"
                    title="Ver modelo 3D"
                  >
                    <Box size={16} /> Ver em 3D
                  </button>
                ) : (
                  <a href={a.url || undefined} target="_blank" rel="noreferrer" className="h-20 rounded-sm bg-surface3 flex items-center justify-center text-disabled text-[11px] uppercase">
                    {a.name.split('.').pop() || 'arquivo'}
                  </a>
                )}

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

      <AssetUploadDialog open={uploadOpen} onOpenChange={setUploadOpen} projectId={projectId} />

      <Dialog open={!!viewer} onOpenChange={(o) => !o && setViewer(null)}>
        {viewer && (
          <DialogContent title={viewer.name} className="w-[680px]">
            <React.Suspense fallback={<div className="h-[360px] flex items-center justify-center text-[13px] text-tertiary">Carregando visualizador…</div>}>
              <ModelViewer url={viewer.url} />
            </React.Suspense>
            <p className="mt-2 text-[11px] text-tertiary">Arraste para girar · scroll para zoom</p>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
