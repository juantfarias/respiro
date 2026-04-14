'use client'

import { CheckCircle, XCircle, PlayCircle, Calendar, Clock } from 'lucide-react'

/**
 * Componente para exibir o histórico de atividades realizadas e perdidas
 * 
 * @param {Array} logs - Lista de logs de atividades
 * @param {Function} onRecoverMissed - Callback para executar atividade atrasada
 */
export default function ActivityHistory({ logs, onRecoverMissed }) {
  // Formata a data para exibição
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    if (date.toDateString() === today.toDateString()) {
      return 'Hoje'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ontem'
    } else {
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    }
  }
  
  // Formata o horário para exibição
  const formatTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  // Ordena logs do mais recente para o mais antigo
  const sortedLogs = [...logs].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )
  
  // Agrupa logs por data
  const groupedLogs = sortedLogs.reduce((groups, log) => {
    const dateKey = new Date(log.date).toDateString()
    if (!groups[dateKey]) {
      groups[dateKey] = []
    }
    groups[dateKey].push(log)
    return groups
  }, {})

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Calendar className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mb-2 text-lg font-medium text-foreground">
          Nenhum registro ainda
        </h3>
        <p className="max-w-sm text-sm text-muted-foreground">
          Quando você completar ou perder uma atividade, ela aparecerá aqui no histórico.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {Object.entries(groupedLogs).map(([dateKey, dayLogs]) => (
        <div key={dateKey}>
          {/* Header do grupo de data */}
          <div className="mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium text-muted-foreground">
              {formatDate(dayLogs[0].date)}
            </h3>
          </div>
          
          {/* Lista de logs do dia */}
          <div className="space-y-2">
            {dayLogs.map((log) => (
              <div
                key={log.id}
                className={`flex items-center justify-between rounded-lg border p-4 transition-colors ${
                  log.status === 'COMPLETED'
                    ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30'
                    : 'border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Ícone de status */}
                  {log.status === 'COMPLETED' ? (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/50">
                      <XCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                  )}
                  
                  {/* Informações da atividade */}
                  <div>
                    <h4 className="font-medium text-foreground">
                      {log.activityName}
                    </h4>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(log.date)}
                      </span>
                      <span>{log.duration} min</span>
                      <span className={`font-medium ${
                        log.status === 'COMPLETED' 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-orange-600 dark:text-orange-400'
                      }`}>
                        {log.status === 'COMPLETED' ? 'Realizado' : 'Perdido'}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Botão de recuperação para atividades perdidas */}
                {log.status === 'MISSED' && (
                  <button
                    onClick={() => onRecoverMissed(log.id, log.activityId)}
                    className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    <PlayCircle className="h-4 w-4" />
                    Executar Atrasado
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
