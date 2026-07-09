export const config = {
  matcher: '/(.*)',
};

function unauthorized() {
  return new Response('Acesso Negado: Area Restrita', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Ambiente de Homologacao"',
    },
  });
}

export default function middleware(request) {
  const expectedUser = process.env.AUTH_USER;
  const expectedPass = process.env.AUTH_PASS;

  if (!expectedUser || !expectedPass) {
    return new Response('Basic Auth nao configurado', { status: 500 });
  }

  const basicAuth = request.headers.get('authorization');

  if (!basicAuth?.startsWith('Basic ')) {
    return unauthorized();
  }

  try {
    const authValue = basicAuth.split(' ')[1];
    const [user, pass] = atob(authValue).split(':');

    if (user === expectedUser && pass === expectedPass) {
      return;
    }
  } catch {
    return unauthorized();
  }

  return unauthorized();
}
