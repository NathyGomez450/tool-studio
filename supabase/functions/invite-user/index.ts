// Edge Function: invite-user
// Convida um usuário por email para um projeto. Só owner/admin do projeto pode chamar.
// service_role fica só aqui (server-side); nunca no cliente.
import { createClient } from 'jsr:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const url = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
  if (!token) return json({ error: 'Não autenticado' }, 401);

  const admin = createClient(url, serviceKey);

  // Quem está chamando?
  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userData.user) return json({ error: 'Sessão inválida' }, 401);
  const callerId = userData.user.id;

  let body: { email?: string; name?: string; role?: string; projectId?: string; redirectTo?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'JSON inválido' }, 400);
  }
  const { email, name, projectId, redirectTo } = body;
  const role = body.role === 'admin' ? 'admin' : body.role === 'owner' ? 'owner' : 'member';
  if (!email || !projectId) return json({ error: 'email e projectId obrigatórios' }, 400);

  // Chamador é owner/admin do projeto?
  const { data: adminRow } = await admin
    .from('project_members')
    .select('role')
    .eq('project_id', projectId)
    .eq('user_id', callerId)
    .in('role', ['owner', 'admin'])
    .maybeSingle();
  if (!adminRow) return json({ error: 'Apenas owner/admin podem convidar' }, 403);

  // Convidar (ou reaproveitar usuário existente)
  let invitedId: string | null = null;
  const { data: invited, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { name: name ?? email },
    redirectTo: redirectTo || undefined,
  });
  if (inviteErr) {
    // Provável: usuário já existe. Buscar por email.
    const { data: list } = await admin.auth.admin.listUsers();
    const existing = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (!existing) return json({ error: inviteErr.message }, 409);
    invitedId = existing.id;
  } else {
    invitedId = invited.user?.id ?? null;
  }
  if (!invitedId) return json({ error: 'Falha ao obter usuário convidado' }, 500);

  // Vincular ao projeto
  const { error: linkErr } = await admin
    .from('project_members')
    .upsert({ project_id: projectId, user_id: invitedId, role }, { onConflict: 'project_id,user_id' });
  if (linkErr) return json({ error: linkErr.message }, 500);

  return json({ ok: true }, 200);
});

function json(payload: unknown, status: number) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}
