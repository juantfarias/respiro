'use client'

import { useEffect, useRef, useCallback } from 'react'

/**
 * Hook customizado para agendar notificações aleatórias
 * dentro das janelas de tempo das atividades.
 *
 * @param {Array} activities - Lista de atividades cadastradas
 * @param {Function} onStartFocus - Callback para iniciar o modo foco (atividades TIMER)
 * @param {Function} onAddMissedLog - Callback para adicionar log de atividade perdida
 * @param {Array} historyLogs - Lista de logs do histórico
 * @param {Object|null} focusActivity - Atividade atualmente em modo foco (null se nenhuma)
 * @param {Function} onShowCheckModal - Callback para exibir o modal de confirmação (atividades CHECK)
 */
export function useNotificationScheduler(activities, onStartFocus, onAddMissedLog, historyLogs, focusActivity, onShowCheckModal) {
  // Referência para os timeouts agendados
  const scheduledTimeouts = useRef(new Map())

  // Referência para atividades já notificadas hoje
  const notifiedToday = useRef(new Set())

  // Referência para atividades já marcadas como MISSED hoje
  const missedCheckedToday = useRef(new Set())

  // Ref para verificar focus lock sem re-executar o efeito principal
  const focusActiveRef = useRef(!!focusActivity)

  /**
   * Solicita permissão para enviar notificações
   */
  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      return false
    }

    if (Notification.permission === 'granted') {
      return true
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }

    return false
  }, [])

  /**
   * Envia uma notificação push e roteia o clique de acordo com o tipo da atividade.
   * - TIMER → abre o FocusTimer via onStartFocus
   * - CHECK → abre o modal de confirmação via onShowCheckModal
   */
  const sendNotification = useCallback((activity) => {
    if (Notification.permission !== 'granted') return

    const activityType = activity.type ?? 'TIMER'
    const body = activityType === 'CHECK'
      ? `Hora de: ${activity.name}. Você fez?`
      : `${activity.name} te espera por ${activity.duration} minutos. Vamos?`

    const notification = new Notification('Hora do seu Respiro!', {
      body,
      icon: '/icon.svg',
      tag: activity.id,
      requireInteraction: true,
      data: { id: activity.id, type: activityType },
    })

    notification.onclick = () => {
      window.focus()
      if (activityType === 'CHECK') {
        onShowCheckModal(activity)
      } else {
        onStartFocus(activity)
      }
      notification.close()
    }
  }, [onStartFocus, onShowCheckModal])

  /**
   * Converte string de horário (HH:MM) para minutos desde meia-noite
   */
  const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number)
    return hours * 60 + minutes
  }

  /**
   * Verifica se a janela de tempo de uma atividade está ativa agora
   */
  const isWindowActive = useCallback((activity) => {
    const now = new Date()
    const currentDay = now.getDay()
    const currentMinutes = now.getHours() * 60 + now.getMinutes()

    if (!activity.days.includes(currentDay)) {
      return false
    }

    const startMinutes = timeToMinutes(activity.startTime)
    const endMinutes = timeToMinutes(activity.endTime)

    return currentMinutes >= startMinutes && currentMinutes < endMinutes
  }, [])

  /**
   * Verifica se a janela de tempo de uma atividade já passou hoje
   */
  const hasWindowPassed = useCallback((activity) => {
    const now = new Date()
    const currentDay = now.getDay()
    const currentMinutes = now.getHours() * 60 + now.getMinutes()

    if (!activity.days.includes(currentDay)) {
      return false
    }

    const endMinutes = timeToMinutes(activity.endTime)
    return currentMinutes >= endMinutes
  }, [])

  /**
   * Verifica se existe um log de conclusão (COMPLETED ou DONE) para a atividade na data.
   * Cobre tanto atividades TIMER legadas (COMPLETED) quanto CHECK novas (DONE).
   */
  const hasCompletedLogForDate = useCallback((activityId, date) => {
    const dateStr = new Date(date).toDateString()
    return historyLogs.some(log =>
      log.activityId === activityId &&
      (log.status === 'COMPLETED' || log.status === 'DONE') &&
      new Date(log.date).toDateString() === dateStr
    )
  }, [historyLogs])

  /**
   * Verifica se existe qualquer log para a atividade na data especificada
   */
  const hasLogForDate = useCallback((activityId, date) => {
    const dateStr = new Date(date).toDateString()
    return historyLogs.some(log =>
      log.activityId === activityId &&
      new Date(log.date).toDateString() === dateStr
    )
  }, [historyLogs])

  /**
   * Calcula o tempo aleatório dentro da janela para agendar a notificação
   */
  const scheduleRandomNotification = useCallback((activity) => {
    const now = new Date()
    const currentMinutes = now.getHours() * 60 + now.getMinutes()
    const currentSeconds = now.getSeconds()

    const startMinutes = timeToMinutes(activity.startTime)
    const endMinutes = timeToMinutes(activity.endTime)

    const effectiveStart = Math.max(currentMinutes, startMinutes)
    const windowRemainingMs = (endMinutes - effectiveStart) * 60 * 1000 - currentSeconds * 1000

    if (windowRemainingMs <= 60000) {
      return
    }

    const minDelay = 30000
    // CHECK não tem duration — usa apenas o minDelay como margem mínima
    const durationBuffer = (activity.duration ?? 0) * 60 * 1000
    const maxDelay = Math.max(minDelay, windowRemainingMs - durationBuffer)
    const randomDelay = Math.floor(Math.random() * (maxDelay - minDelay)) + minDelay

    const timeoutId = setTimeout(() => {
      sendNotification(activity)
      notifiedToday.current.add(activity.id)
    }, randomDelay)

    scheduledTimeouts.current.set(activity.id, timeoutId)
  }, [sendNotification])

  /**
   * Efeito de focus lock: atualiza a ref e cancela timeouts pendentes
   * quando uma sessão de foco começa, sem re-executar o efeito principal.
   */
  useEffect(() => {
    focusActiveRef.current = !!focusActivity
    if (focusActivity) {
      scheduledTimeouts.current.forEach((timeoutId) => clearTimeout(timeoutId))
      scheduledTimeouts.current.clear()
    }
  }, [focusActivity])

  /**
   * Efeito principal: verifica e agenda notificações
   */
  useEffect(() => {
    requestNotificationPermission()

    // Limpa controles de notificação à meia-noite
    const clearAtMidnight = () => {
      const now = new Date()
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(0, 0, 0, 0)
      const msUntilMidnight = tomorrow.getTime() - now.getTime()

      setTimeout(() => {
        notifiedToday.current.clear()
        missedCheckedToday.current.clear()
        clearAtMidnight()
      }, msUntilMidnight)
    }
    clearAtMidnight()

    const checkAndSchedule = () => {
      // BR3: focus lock — não agenda novas notificações durante sessão de foco
      if (focusActiveRef.current) return

      const today = new Date()

      activities.forEach((activity) => {
        // === LÓGICA DE VARREDURA PARA ATIVIDADES PERDIDAS ===
        if (hasWindowPassed(activity) &&
            !missedCheckedToday.current.has(activity.id) &&
            !hasLogForDate(activity.id, today)) {

          missedCheckedToday.current.add(activity.id)

          const missedDate = new Date()
          missedDate.setHours(
            parseInt(activity.endTime.split(':')[0]),
            parseInt(activity.endTime.split(':')[1]),
            0, 0
          )
          onAddMissedLog(activity, missedDate.toISOString())
        }

        // === LÓGICA DE AGENDAMENTO DE NOTIFICAÇÕES ===
        if (notifiedToday.current.has(activity.id)) return
        if (scheduledTimeouts.current.has(activity.id)) return
        if (hasCompletedLogForDate(activity.id, today)) return

        if (isWindowActive(activity)) {
          scheduleRandomNotification(activity)
        }
      })
    }

    checkAndSchedule()
    const intervalId = setInterval(checkAndSchedule, 60000)

    return () => {
      clearInterval(intervalId)
      scheduledTimeouts.current.forEach((timeoutId) => clearTimeout(timeoutId))
      scheduledTimeouts.current.clear()
    }
  }, [activities, historyLogs, isWindowActive, hasWindowPassed, hasCompletedLogForDate, hasLogForDate, onAddMissedLog, requestNotificationPermission, scheduleRandomNotification])

  // Efeito para limpar timeouts de atividades removidas
  useEffect(() => {
    const activityIds = new Set(activities.map(a => a.id))

    scheduledTimeouts.current.forEach((timeoutId, id) => {
      if (!activityIds.has(id)) {
        clearTimeout(timeoutId)
        scheduledTimeouts.current.delete(id)
      }
    })
  }, [activities])
}
