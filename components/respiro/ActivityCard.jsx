'use client'

import { Trash2, Play, Clock, Calendar, Pencil, CheckCircle } from 'lucide-react'

// Mapeamento de IDs para labels dos dias
const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export default function ActivityCard({ activity, onDelete, onStartFocus, onEdit, onCheckComplete }) {
  const activityType = activity.type ?? 'TIMER'

  // Formata a lista de dias selecionados
  const formattedDays = activity.days
    .map(dayId => DAY_LABELS[dayId])
    .join(', ')

  // Handler para deletar com confirmação
  const handleDelete = () => {
    if (window.confirm(`Deseja realmente excluir "${activity.name}"?`)) {
      onDelete(activity.id)
    }
  }

  return (
    <div className="group relative rounded-lg border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
      {/* Botões de ação (visíveis no hover) */}
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

      {/* Nome da atividade */}
      <h3 className="mb-3 pr-16 text-base font-semibold text-foreground">
        {activity.name}
      </h3>

      {/* Informações da atividade */}
      <div className="mb-4 space-y-2 text-sm text-muted-foreground">
        {/* Dias */}
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span>{formattedDays}</span>
        </div>

        {/* Janela de tempo */}
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span>
            {activity.startTime} - {activity.endTime}
          </span>
        </div>

        {/* Badges: duração (TIMER) e tipo */}
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

      {/* CTA condicional por tipo */}
      {activityType === 'CHECK' ? (
        <button
          onClick={() => onCheckComplete(activity)}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
        >
          <CheckCircle className="h-4 w-4" />
          Concluir
        </button>
      ) : (
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
