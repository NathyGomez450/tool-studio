import * as React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useInviteUser } from '@/queries/mutations';

const ROLES = [
  { value: 'member', label: 'Membro' },
  { value: 'admin', label: 'Admin' },
  { value: 'owner', label: 'Owner' },
];

export function InviteDialog({
  projectId,
  open,
  onOpenChange,
}: {
  projectId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const invite = useInviteUser(projectId);
  const [email, setEmail] = React.useState('');
  const [name, setName] = React.useState('');
  const [role, setRole] = React.useState<'owner' | 'admin' | 'member'>('member');
  const [error, setError] = React.useState('');
  const [done, setDone] = React.useState('');

  React.useEffect(() => {
    if (open) {
      setEmail('');
      setName('');
      setRole('member');
      setError('');
      setDone('');
    }
  }, [open]);

  function submit() {
    if (!email.trim()) return;
    setError('');
    setDone('');
    invite.mutate(
      { email: email.trim(), name: name.trim() || undefined, role },
      {
        onSuccess: () => setDone(`Convite enviado para ${email.trim()}.`),
        onError: (e) => setError(e instanceof Error ? e.message : 'Falha ao convidar'),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title="Convidar para o projeto"
        footer={
          <>
            <Button variant="secondary" onClick={() => onOpenChange(false)}>Fechar</Button>
            <Button onClick={submit} disabled={!email.trim() || invite.isPending}>
              {invite.isPending ? 'Enviando…' : 'Enviar convite'}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-tertiary">Email</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="pessoa@exemplo.com" autoFocus />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-tertiary">Nome (opcional)</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-tertiary">Papel</label>
            <Select options={ROLES} value={role} onChange={(e) => setRole(e.target.value as 'owner' | 'admin' | 'member')} />
          </div>
          {error && <p className="text-sm text-[var(--red-400)]">{error}</p>}
          {done && <p className="text-sm text-[var(--green-400)]">{done}</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
