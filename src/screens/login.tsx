import * as React from 'react';
import { LockKeyhole, Loader2, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/auth/auth-context';

export function LoginScreen({
  accessError,
  onSignOut,
}: {
  accessError?: string;
  onSignOut?: () => Promise<void>;
}) {
  const { signIn } = useAuth();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await signIn(email, password);
    } catch {
      setError('E-mail ou senha invalidos.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-canvas text-primary flex items-center justify-center px-4">
      <section className="w-full max-w-[380px] border border-border bg-surface rounded-lg p-6 shadow-md">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-accent-soft border border-[var(--accent-soft-border)] text-[var(--accent-400)] flex items-center justify-center">
            <LockKeyhole size={20} />
          </div>
          <div>
            <h1 className="text-[20px] font-bold leading-tight">Origem Studio</h1>
            <p className="text-[13px] text-tertiary mt-0.5">Acesso da equipe</p>
          </div>
        </div>

        {accessError && (
          <div className="mb-4 rounded-sm border border-[var(--danger-soft-border)] bg-[var(--danger-soft)] px-3 py-2 text-[12px] text-[var(--red-400)]">
            {accessError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block">
            <span className="block text-[12px] font-semibold text-secondary mb-1.5">E-mail</span>
            <Input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label className="block">
            <span className="block text-[12px] font-semibold text-secondary mb-1.5">Senha</span>
            <Input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          {error && <div className="text-[12px] text-[var(--red-400)]">{error}</div>}

          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting && <Loader2 size={16} className="animate-spin" />}
            Entrar
          </Button>
        </form>

        {onSignOut && (
          <Button type="button" variant="ghost" className="mt-3 w-full" onClick={() => void onSignOut()}>
            <LogOut size={15} />
            Sair desta conta
          </Button>
        )}
      </section>
    </main>
  );
}
