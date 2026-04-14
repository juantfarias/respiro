import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import DashboardHeader from '@/components/respiro/DashboardHeader'

/**
 * Layout server-side do dashboard.
 * Valida a sessão e injeta o usuário no Header.
 */
export default async function DashboardLayout({ children }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <DashboardHeader user={user} />
      <main className="flex-1">{children}</main>
    </div>
  )
}
