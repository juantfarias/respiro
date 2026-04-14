import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Cria o client Supabase para uso em Server Components e Route Handlers.
 * Lê e escreve cookies via next/headers.
 * @returns {Promise<import('@supabase/supabase-js').SupabaseClient>}
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component — cookies de resposta não podem ser mutados aqui.
            // O middleware garante a renovação do token.
          }
        },
      },
    }
  )
}
