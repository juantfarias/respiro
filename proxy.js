import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/middleware'

/**
 * Next.js Middleware — protege rotas e renova tokens de sessão Supabase.
 *
 * Rotas públicas (/login, /register):
 *   - Se sessão ativa → redireciona para /
 *
 * Rotas privadas (tudo o mais):
 *   - Se sem sessão → redireciona para /login?next=<pathname>
 *
 * @param {import('next/server').NextRequest} request
 */
export async function proxy(request) {
  const { supabase, response } = createClient(request)

  // Renova o token e lê o usuário autenticado.
  // getUser() é mais seguro que getSession() pois valida o JWT no servidor.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register')

  // Usuário logado tentando acessar rota de auth → dashboard
  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Usuário não logado tentando acessar rota privada → login
  if (!user && !isAuthRoute) {
    const loginUrl = new URL('/login', request.url)
    if (pathname !== '/') {
      loginUrl.searchParams.set('next', pathname)
    }
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Executa em todas as rotas exceto:
     * - _next/static (arquivos estáticos)
     * - _next/image (otimização de imagem)
     * - favicon.ico
     * - arquivos com extensão (png, svg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
