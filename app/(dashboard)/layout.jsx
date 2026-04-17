import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

/**
 * Layout server-side do dashboard.
 * Valida a sessão — redireciona para /login se não autenticado.
 * O DashboardHeader é renderizado pelo page.jsx (client component)
 * pois precisa de estado compartilhado (activeTab, onNewActivity).
 */
export default async function DashboardLayout({ children }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return <>{children}</>
}
