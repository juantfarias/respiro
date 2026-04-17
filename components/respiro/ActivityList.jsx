'use client'

import { Wind, CheckCircle2 } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import ActivityCard from './ActivityCard'

/**
 * Lista de atividades dividida em duas seções:
 * "Para Hoje" (pendentes do dia atual) e "Concluídas & Futuras".
 *
 * @param {{
 *   pendingToday: object[],
 *   futureOrCompleted: object[],
 *   onDelete: Function,
 *   onStartFocus: Function,
 *   onEdit: Function,
 *   onCheckComplete: Function
 * }} props
 */
export default function ActivityList({
  pendingToday,
  futureOrCompleted,
  onDelete,
  onStartFocus,
  onEdit,
  onCheckComplete,
}) {
  const totalCount = pendingToday.length + futureOrCompleted.length

  // Estado vazio total
  if (totalCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/50 p-12 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Wind className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mb-2 text-lg font-medium text-foreground">
          Nenhuma atividade cadastrada
        </h3>
        <p className="max-w-sm text-sm text-muted-foreground">
          Adicione sua primeira atividade para começar a receber lembretes
          aleatórios durante suas janelas de tempo.
        </p>
      </div>
    )
  }

  const cardProps = { onDelete, onStartFocus, onEdit, onCheckComplete }

  return (
    <div className="space-y-6">
      {/* Seção: Para Hoje */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
          Para Hoje
          {pendingToday.length > 0 && (
            <span className="ml-2 text-xs font-normal text-muted-foreground normal-case tracking-normal">
              ({pendingToday.length})
            </span>
          )}
        </h2>

        {pendingToday.length === 0 ? (
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card/50 px-4 py-3">
            <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
            <span className="text-sm text-muted-foreground">
              Tudo em dia hoje — nenhuma atividade pendente.
            </span>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pendingToday.map((activity) => (
              <ActivityCard key={activity.id} activity={activity} {...cardProps} />
            ))}
          </div>
        )}
      </section>

      {/* Separador + seção: Concluídas & Futuras */}
      {futureOrCompleted.length > 0 && (
        <>
          <Separator />
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
              Concluídas & Futuras
              <span className="ml-2 text-xs font-normal text-muted-foreground normal-case tracking-normal">
                ({futureOrCompleted.length})
              </span>
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {futureOrCompleted.map((activity) => (
                <ActivityCard key={activity.id} activity={activity} {...cardProps} />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
