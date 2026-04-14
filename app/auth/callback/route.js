import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

/**
 * Route Handler — troca o `code` OAuth pelo token de sessão.
 * O Supabase redireciona para cá após login com Google (ou confirm de e-mail).
 */
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Código ausente ou erro → retorna para login com indicador de erro
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
