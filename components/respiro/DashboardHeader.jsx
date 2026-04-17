'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Wind, Plus, HelpCircle, LogOut, ListTodo, History, Timer, CheckCircle2, Bell } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

const TABS = [
  { id: 'activities', label: 'Minhas Atividades', icon: ListTodo },
  { id: 'history', label: 'Histórico', icon: History },
]

/**
 * Navbar unificada do dashboard: logo, abas de navegação, ações e onboarding.
 *
 * @param {{
 *   user: import('@supabase/supabase-js').User | null,
 *   activeTab: string,
 *   onTabChange: (tab: string) => void,
 *   onNewActivity: () => void
 * }} props
 */
export default function DashboardHeader({ user, activeTab, onTabChange, onNewActivity }) {
  const router = useRouter()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  /** Gera iniciais a partir do nome ou e-mail do usuário. */
  function getInitials() {
    const name = user?.user_metadata?.full_name || user?.email || '??'
    const parts = name.split(/[\s@]/).filter(Boolean)
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
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
    <>
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        {/* Barra principal */}
        <div className="flex h-14 items-center gap-3 px-4">

          {/* Esquerda: Logo */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Wind className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground text-sm tracking-tight">Respiro</span>
          </div>

          {/* Centro: Abas de navegação — visíveis apenas em desktop */}
          <nav className="hidden md:flex flex-1 items-center justify-center gap-1">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => onTabChange(id)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activeTab === id
                    ? 'bg-accent text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </nav>

          {/* Direita: Ações */}
          <div className="flex items-center gap-1.5 ml-auto md:ml-0">

            {/* Nova Atividade — texto em desktop, ícone em mobile */}
            <button
              onClick={onNewActivity}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline">Nova Atividade</span>
            </button>

            {/* Ajuda / Onboarding */}
            <button
              onClick={() => setSheetOpen(true)}
              title="Como funciona"
              className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* Avatar + Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center hover:bg-primary/25 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  title="Menu do usuário"
                >
                  <span className="text-xs font-semibold text-primary leading-none">
                    {getInitials()}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  {loggingOut ? 'Saindo…' : 'Sair'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Sub-barra mobile: abas de navegação abaixo do header principal */}
        <div className="md:hidden border-t border-border/60 flex">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors border-b-2 -mb-px ${
                activeTab === id
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </header>

      {/* Sheet de Onboarding */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md flex flex-col overflow-y-auto">
          <SheetHeader className="pb-4">
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                <Wind className="w-4 h-4 text-primary-foreground" />
              </div>
              <SheetTitle className="text-base">Como o Respiro funciona</SheetTitle>
            </div>
            <SheetDescription className="text-sm leading-relaxed">
              Um sistema simples para criar pausas intencionais e cultivar hábitos com leveza no seu dia.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 flex-1">

            {/* Timer */}
            <div className="rounded-xl border border-border bg-accent/30 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-primary/15 flex items-center justify-center flex-shrink-0">
                  <Timer className="w-3.5 h-3.5 text-primary" />
                </div>
                <h3 className="font-semibold text-sm">Atividade Timer</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Ideal para <strong className="text-foreground font-medium">sessões de foco contínuo</strong>. Quando a notificação chegar, você entra em modo de tela cheia com uma contagem regressiva dedicada. Ao concluir, a atividade é registrada como completa no histórico.
              </p>
              <p className="text-xs text-muted-foreground">Exemplos: meditação, leitura, exercício, estudo.</p>
            </div>

            {/* Check */}
            <div className="rounded-xl border border-border bg-accent/30 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-primary/15 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                </div>
                <h3 className="font-semibold text-sm">Atividade Check</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Para <strong className="text-foreground font-medium">hábitos rápidos e pontuais</strong>. A notificação pergunta se você realizou a atividade. Um toque confirma e o hábito é registrado como feito. Sem cronômetro, sem fricção.
              </p>
              <p className="text-xs text-muted-foreground">Exemplos: tomar água, alongar, respirar fundo.</p>
            </div>

            {/* Notificações */}
            <div className="rounded-xl border border-border bg-accent/30 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-primary/15 flex items-center justify-center flex-shrink-0">
                  <Bell className="w-3.5 h-3.5 text-primary" />
                </div>
                <h3 className="font-semibold text-sm">Notificações Aleatórias</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Cada atividade tem uma <strong className="text-foreground font-medium">janela de tempo</strong> (ex: das 09h às 11h) e os dias da semana ativos. O Respiro sorteia um momento dentro desse intervalo para enviar a notificação, criando surpresa e quebrando ciclos de procrastinação.
              </p>
            </div>

            {/* Dicas */}
            <div className="space-y-3 pt-1">
              <h3 className="text-sm font-semibold">Dicas rápidas</h3>
              <ul className="space-y-2">
                {[
                  'Atividades perdidas ficam no Histórico e podem ser executadas com atraso.',
                  'Durante um Timer ativo, as demais notificações ficam pausadas.',
                  'Você pode iniciar qualquer atividade manualmente pelo card a qualquer momento.',
                ].map((tip) => (
                  <li key={tip} className="flex gap-2 text-sm text-muted-foreground">
                    <span className="text-primary mt-0.5 flex-shrink-0">→</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
