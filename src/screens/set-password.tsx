import * as React from 'react';
import { KeyRound, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/auth/auth-context';

export function SetPasswordScreen() {
  const { completePassword, user } = useAuth();
  const [password, setPassword] = React.useState('');
  const [confirm, setConfirm] = React.useState('');
  const [error, setError] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('A senha deve ter ao menos 6 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('As senhas não coincidem.');
      return;
    }
    setSubmitting(true);
    try {
      await completePassword(password);
    } catch {
      setError('Não foi possível definir a senha. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-canvas text-primary flex items-center justify-center px-4">
      <section className="w-full max-w-[380px] border border-border bg-surface rounded-lg p-6 shadow-md">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-accent-soft border border-[var(--accent-soft-border)] text-[var(--accent-400)] flex items-center justify-center">
            <KeyRound size={20} />
          </div>
          <div>
            <h1 className="text-[20px] font-bold leading-tight">Defina sua senha</h1>
            <p className="text-[13px] text-tertiary mt-0.5">{user?.email ?? 'Bem-vindo(a) ao Origem Studio'}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block">
            <span className="block text-[12px] font-semibold text-secondary mb-1.5">Nova senha</span>
            <Input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required autoFocus />
          </label>
          <label className="block">
            <span className="block text-[12px] font-semibold text-secondary mb-1.5">Confirmar senha</span>
            <Input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          </label>
          {error && <div className="text-[12px] text-[var(--red-400)]">{error}</div>}
          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting && <Loader2 size={16} className="animate-spin" />}
            Salvar e entrar
          </Button>
        </form>
      </section>
    </main>
  );
}
