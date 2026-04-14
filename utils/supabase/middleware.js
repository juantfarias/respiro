import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

/**
 * Cria o client Supabase para uso no Next.js Middleware.
 * Usa request/response para ler e propagar cookies.
 * @param {import('next/server').NextRequest} request
 * @returns {{ supabase: import('@supabase/supabase-js').SupabaseClient, response: NextResponse }}
 */
export function createClient(request) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  return { supabase, response }
}
