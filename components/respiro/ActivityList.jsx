'use client'

import { Wind } from 'lucide-react'
import ActivityCard from './ActivityCard'

export default function ActivityList({ activities, onDelete, onStartFocus, onEdit, onCheckComplete }) {
  // Renderiza mensagem quando não há atividades
  if (activities.length === 0) {
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

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">
        Suas Atividades ({activities.length})
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {activities.map((activity) => (
          <ActivityCard
            key={activity.id}
            activity={activity}
            onDelete={onDelete}
            onStartFocus={onStartFocus}
            onEdit={onEdit}
            onCheckComplete={onCheckComplete}
          />
        ))}
      </div>
    </div>
  )
}
