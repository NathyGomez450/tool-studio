import { supabase } from '@/lib/supabase';

export async function inviteUser(
  projectId: string,
  input: { email: string; name?: string; role: 'owner' | 'admin' | 'member' },
): Promise<void> {
  const { data, error } = await supabase.functions.invoke('invite-user', {
    body: {
      projectId,
      email: input.email,
      name: input.name,
      role: input.role,
      redirectTo: window.location.origin,
    },
  });
  if (error) {
    // Erros HTTP da função vêm em error.context (Response); tentar extrair a mensagem.
    let msg = error.message;
    try {
      const ctx = (error as { context?: Response }).context;
      if (ctx && typeof ctx.json === 'function') {
        const body = await ctx.json();
        if (body?.error) msg = body.error as string;
      }
    } catch {
      /* mantém msg padrão */
    }
    throw new Error(msg);
  }
  if (data && (data as { error?: string }).error) {
    throw new Error((data as { error: string }).error);
  }
}
