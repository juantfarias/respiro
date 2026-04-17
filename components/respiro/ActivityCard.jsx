'use client'

import { Trash2, Play, Clock, Calendar, Pencil, CheckCircle, CheckCircle2, CalendarClock } from 'lucide-react'
import { getNextScheduledDay } from '@/utils/adapters'

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

/**
 * Card de atividade com três estados visuais baseados em flags enriquecidas:
 * - Pendente hoje: exibe CTA de ação primária
 * - Concluída hoje: badge de sucesso + opacidade reduzida
 * - Agendada para outro dia: indicativo de próxima ocorrência
 *
 * @param {{
 *   activity: object & { isScheduledForToday?: boolean, isCompletedToday?: boolean },
 *   onDelete: Function,
 *   onStartFocus: Function,
 *   onEdit: Function,
 *   onCheckComplete: Function
 * }} props
 */
export default function ActivityCard({ activity, onDelete, onStartFocus, onEdit, onCheckComplete }) {
  const activityType = activity.type ?? 'TIMER'
  const { isScheduledForToday = true, isCompletedToday = false } = activity

  const formattedDays = activity.days
    .map(dayId => DAY_LABELS[dayId])
    .join(', ')

  const handleDelete = () => {
    if (window.confirm(`Deseja realmente excluir "${activity.name}"?`)) {
      onDelete(activity.id)
    }
  }

  return (
    <div className={`group relative rounded-lg border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md ${
      isCompletedToday ? 'opacity-60' : ''
    }`}>
      {/* Ações no hover */}
      <button
        onClick={() => onEdit(activity)}
        className="absolute right-9 top-2 rounded-md p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-accent hover:text-foreground group-hover:opacity-100"
        aria-label={`Editar ${activity.name}`}
      >
        <Pencil className="h-4 w-4" />
      </button>
      <button
        onClick={handleDelete}
        className="absolute right-2 top-2 rounded-md p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
        aria-label={`Excluir ${activity.name}`}
      >
        <Trash2 className="h-4 w-4" />
      </button>

      {/* Nome */}
      <h3 className="mb-3 pr-16 text-base font-semibold text-foreground">
        {activity.name}
      </h3>

      {/* Informações */}
      <div className="mb-4 space-y-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span>{formattedDays}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span>{activity.startTime} - {activity.endTime}</span>
        </div>
        <div className="flex items-center gap-2">
          {activityType === 'TIMER' && activity.duration && (
            <div className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs">
              {activity.duration} min
            </div>
          )}
          <div className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
            activityType === 'CHECK'
              ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
              : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'
          }`}>
            {activityType === 'CHECK' ? 'Check' : 'Timer'}
          </div>
        </div>
      </div>

      {/* CTA condicional por estado */}
      {isCompletedToday ? (
        // Concluída hoje — badge de sucesso
        <div className="flex w-full items-center justify-center gap-2 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-4 py-2 text-sm font-medium text-green-700 dark:text-green-400">
          <CheckCircle2 className="h-4 w-4" />
          Concluído hoje
        </div>
      ) : !isScheduledForToday ? (
        // Agendada para outro dia — indicativo sutil
        <div className="flex w-full items-center justify-center gap-2 rounded-md bg-muted/50 border border-border px-4 py-2 text-sm text-muted-foreground">
          <CalendarClock className="h-4 w-4 flex-shrink-0" />
          Agendada para {getNextScheduledDay(activity.days)}
        </div>
      ) : activityType === 'CHECK' ? (
        // Pendente hoje — Check
        <button
          onClick={() => onCheckComplete(activity)}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
        >
          <CheckCircle className="h-4 w-4" />
          Concluir
        </button>
      ) : (
        // Pendente hoje — Timer
        <button
          onClick={() => onStartFocus(activity)}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Play className="h-4 w-4" />
          Iniciar Agora
        </button>
      )}
    </div>
  )
}
