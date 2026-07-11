import * as React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useUploadAsset } from '@/queries/mutations';

const TYPES = [
  { value: 'Modelo 3D', label: 'Modelo 3D' },
  { value: 'Textura', label: 'Textura' },
  { value: 'Áudio', label: 'Áudio' },
  { value: 'UI', label: 'UI' },
  { value: 'Ambiente', label: 'Ambiente' },
  { value: 'Animação', label: 'Animação' },
  { value: 'Outro', label: 'Outro' },
];

export function AssetUploadDialog({
  open,
  onOpenChange,
  projectId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  projectId: string;
}) {
  const upload = useUploadAsset(projectId);
  const [file, setFile] = React.useState<File | null>(null);
  const [type, setType] = React.useState('Modelo 3D');
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (open) {
      setFile(null);
      setType('Modelo 3D');
      setError('');
    }
  }, [open]);

  function submit() {
    if (!file) return;
    setError('');
    upload.mutate(
      { file, type },
      {
        onSuccess: () => onOpenChange(false),
        onError: (e) => setError(e instanceof Error ? e.message : 'Falha no upload'),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title="Enviar asset"
        footer={
          <>
            <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={submit} disabled={!file || upload.isPending}>
              {upload.isPending ? 'Enviando…' : 'Enviar'}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-tertiary">Arquivo</label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="text-sm text-secondary file:mr-3 file:rounded-md file:border-0 file:bg-[var(--bg-hover)] file:px-3 file:py-1.5 file:text-sm file:text-primary hover:file:bg-[var(--bg-active)]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-tertiary">Tipo</label>
            <Select options={TYPES} value={type} onChange={(e) => setType(e.target.value)} />
          </div>
          {error && <p className="text-sm text-[var(--red-400)]">{error}</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
