'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Wind, LogOut } from 'lucide-react'

/**
 * Header fixo do dashboard.
 * Exibe logo, iniciais do usuário e botão de logout.
 *
 * @param {{ user: import('@supabase/supabase-js').User }} props
 */
export default function DashboardHeader({ user }) {
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  /** Gera iniciais a partir do e-mail ou nome do usuário. */
  function getInitials() {
    const name = user.user_metadata?.full_name || user.email || ''
    const parts = name.split(/[\s@]/).filter(Boolean)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }

  async function handleLogout() {
    setLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="border-b border-border bg-background px-4 py-3 flex items-center justify-between">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
          <Wind className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className="font-semibold text-foreground text-sm">Respiro</span>
      </div>

      {/* Usuário + Logout */}
      <div className="flex items-center gap-3">
        {/* Avatar com iniciais */}
        <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
          <span className="text-xs font-semibold text-primary">{getInitials()}</span>
        </div>

        <button
          onClick={handleLogout}
          disabled={loggingOut}
          title="Sair"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Sair</span>
        </button>
      </div>
    </header>
  )
}
