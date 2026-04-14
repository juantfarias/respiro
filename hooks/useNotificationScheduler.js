'use client'

import { useEffect, useRef, useCallback } from 'react'

/**
 * Hook customizado para agendar notificações aleatórias
 * dentro das janelas de tempo das atividades.
 *
 * @param {Array} activities - Lista de atividades cadastradas
 * @param {Function} onStartFocus - Callback para iniciar o modo foco
 * @param {Function} onAddMissedLog - Callback para adicionar log de atividade perdida
 * @param {Array} historyLogs - Lista de logs do histórico
 * @param {Object|null} focusActivity - Atividade atualmente em modo foco (null se nenhuma)
 */
export function useNotificationScheduler(activities, onStartFocus, onAddMissedLog, historyLogs, focusActivity) {
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
   * Envia uma notificação push
   */
  const sendNotification = useCallback((activity) => {
    if (Notification.permission === 'granted') {
      const notification = new Notification('Hora do seu Respiro!', {
        body: `${activity.name} te espera por ${activity.duration} minutos. Vamos?`,
        icon: '/icon.svg',
        tag: activity.id, // Evita notificações duplicadas
        requireInteraction: true, // Mantém a notificação visível até interação
      })

      // Quando o usuário clicar na notificação, inicia o modo foco
      notification.onclick = () => {
        window.focus()
        onStartFocus(activity)
        notification.close()
      }
    }
  }, [onStartFocus])

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
    const currentDay = now.getDay() // 0 = Domingo, 1 = Segunda, etc.
    const currentMinutes = now.getHours() * 60 + now.getMinutes()

    // Verifica se hoje é um dia válido para a atividade
    if (!activity.days.includes(currentDay)) {
      return false
    }

    const startMinutes = timeToMinutes(activity.startTime)
    const endMinutes = timeToMinutes(activity.endTime)

    // Verifica se estamos dentro da janela de tempo
    return currentMinutes >= startMinutes && currentMinutes < endMinutes
  }, [])
  
  /**
   * Verifica se a janela de tempo de uma atividade já passou hoje
   */
  const hasWindowPassed = useCallback((activity) => {
    const now = new Date()
    const currentDay = now.getDay()
    const currentMinutes = now.getHours() * 60 + now.getMinutes()

    // Verifica se hoje é um dia válido para a atividade
    if (!activity.days.includes(currentDay)) {
      return false
    }

    const endMinutes = timeToMinutes(activity.endTime)

    // Verifica se a janela já passou
    return currentMinutes >= endMinutes
  }, [])
  
  /**
   * Verifica se existe um log COMPLETED para a atividade na data especificada
   */
  const hasCompletedLogForDate = useCallback((activityId, date) => {
    const dateStr = new Date(date).toDateString()
    return historyLogs.some(log => 
      log.activityId === activityId && 
      log.status === 'COMPLETED' &&
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

    // Calcula o tempo restante na janela (em milissegundos)
    const effectiveStart = Math.max(currentMinutes, startMinutes)
    const windowRemainingMs = (endMinutes - effectiveStart) * 60 * 1000 - currentSeconds * 1000

    // Se a janela já passou ou é muito curta, não agenda
    if (windowRemainingMs <= 60000) { // Menos de 1 minuto
      return
    }

    // Sorteia um momento aleatório dentro da janela restante
    // Garante pelo menos 30 segundos de delay
    const minDelay = 30000
    const maxDelay = Math.max(minDelay, windowRemainingMs - activity.duration * 60 * 1000)
    const randomDelay = Math.floor(Math.random() * (maxDelay - minDelay)) + minDelay

    // Agenda a notificação
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
    // Solicita permissão na montagem
    requestNotificationPermission()

    // Limpa notificações de ontem à meia-noite
    const clearAtMidnight = () => {
      const now = new Date()
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(0, 0, 0, 0)
      const msUntilMidnight = tomorrow.getTime() - now.getTime()

      setTimeout(() => {
        notifiedToday.current.clear()
        missedCheckedToday.current.clear()
        clearAtMidnight() // Reagenda para próxima meia-noite
      }, msUntilMidnight)
    }
    clearAtMidnight()

    // Função de verificação periódica
    const checkAndSchedule = () => {
      // BR3: focus lock — não agenda novas notificações durante sessão de foco
      if (focusActiveRef.current) return

      const today = new Date()
      
      activities.forEach((activity) => {
        // === LÓGICA DE VARREDURA PARA ATIVIDADES PERDIDAS ===
        // Verifica se a janela já passou e não tem log para hoje
        if (hasWindowPassed(activity) && 
            !missedCheckedToday.current.has(activity.id) &&
            !hasLogForDate(activity.id, today)) {
          
          // Marca como verificado para não criar duplicatas
          missedCheckedToday.current.add(activity.id)
          
          // Registra como MISSED
          const missedDate = new Date()
          missedDate.setHours(
            parseInt(activity.endTime.split(':')[0]),
            parseInt(activity.endTime.split(':')[1]),
            0, 0
          )
          onAddMissedLog(activity, missedDate.toISOString())
        }
        
        // === LÓGICA DE AGENDAMENTO DE NOTIFICAÇÕES ===
        // Pula se já foi notificado hoje
        if (notifiedToday.current.has(activity.id)) {
          return
        }

        // Pula se já está agendado
        if (scheduledTimeouts.current.has(activity.id)) {
          return
        }
        
        // Pula se já tem log COMPLETED para hoje
        if (hasCompletedLogForDate(activity.id, today)) {
          return
        }

        // Verifica se a janela está ativa
        if (isWindowActive(activity)) {
          scheduleRandomNotification(activity)
        }
      })
    }

    // Verifica imediatamente e depois a cada minuto
    checkAndSchedule()
    const intervalId = setInterval(checkAndSchedule, 60000)

    // Cleanup
    return () => {
      clearInterval(intervalId)
      scheduledTimeouts.current.forEach((timeoutId) => {
        clearTimeout(timeoutId)
      })
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
