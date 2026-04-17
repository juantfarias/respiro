'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/utils/supabase/client'
import { dbToActivity, activityToDb, dbToLog, logToDb } from '@/utils/adapters'

import DashboardHeader from '@/components/respiro/DashboardHeader'
import ActivityList from '@/components/respiro/ActivityList'
import ActivityHistory from '@/components/respiro/ActivityHistory'
import FocusTimer from '@/components/respiro/FocusTimer'
import ActivityForm from '@/components/respiro/ActivityForm'
import CheckCompletionModal from '@/components/respiro/CheckCompletionModal'
import { useNotificationScheduler } from '@/hooks/useNotificationScheduler'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export default function DashboardPage() {
  const supabase = useMemo(() => createClient(), [])

  const [userId, setUserId] = useState(null)
  const [user, setUser] = useState(null)
  const [activities, setActivities] = useState([])
  const [historyLogs, setHistoryLogs] = useState([])
  const [isFetching, setIsFetching] = useState(true)
  const [focusActivity, setFocusActivity] = useState(null)
  const [recoveryLogId, setRecoveryLogId] = useState(null)
  const [activeTab, setActiveTab] = useState('activities')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingActivity, setEditingActivity] = useState(null)
  const [checkActivity, setCheckActivity] = useState(null)

  // ─── Carregamento inicial ─────────────────────────────────────────────────

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id ?? null)

      const { data: authData } = await supabase.auth.getUser()
      if (authData?.user) setUser(authData.user)

      const [activitiesRes, logsRes] = await Promise.all([
        supabase.from('activities').select('*').order('created_at', { ascending: true }),
        supabase.from('history_logs').select('*').order('executed_at', { ascending: false }),
      ])

      if (activitiesRes.error) {
        toast.error('Não foi possível carregar as atividades.')
      } else {
        setActivities((activitiesRes.data ?? []).map(dbToActivity))
      }

      if (logsRes.error) {
        toast.error('Não foi possível carregar o histórico.')
      } else {
        setHistoryLogs((logsRes.data ?? []).map(dbToLog))
      }

      setIsFetching(false)
    }

    loadData()
  }, [supabase])

  // ─── UI helpers ──────────────────────────────────────────────────────────

  const closeForm = useCallback(() => {
    setIsFormOpen(false)
    setEditingActivity(null)
  }, [])

  // ─── CRUD de atividades ───────────────────────────────────────────────────

  /**
   * Cria nova atividade no banco. Aguarda resposta para obter UUID real.
   */
  const handleAddActivity = useCallback(async (formData) => {
    closeForm()

    const payload = { ...activityToDb(formData), user_id: userId }

    const { data, error } = await supabase
      .from('activities')
      .insert(payload)
      .select()
      .single()

    if (error) {
      console.error('[handleAddActivity] Supabase error:', error)
      toast.error(`Erro ao salvar: ${error.message}`)
      return
    }

    setActivities(prev => [...prev, dbToActivity(data)])
  }, [supabase, closeForm, userId])

  /**
   * Atualiza atividade com optimistic update.
   */
  const handleEditActivity = useCallback(async (updatedActivity) => {
    closeForm()

    // Optimistic: atualiza estado local imediatamente
    setActivities(prev => prev.map(a => a.id === updatedActivity.id ? updatedActivity : a))

    const { error } = await supabase
      .from('activities')
      .update(activityToDb(updatedActivity))
      .eq('id', updatedActivity.id)

    if (error) {
      // Reverte
      setActivities(prev => prev.map(a =>
        a.id === updatedActivity.id ? (prev.find(x => x.id === updatedActivity.id) ?? a) : a
      ))
      toast.error('Não foi possível atualizar a atividade.')
    }
  }, [supabase, closeForm])

  /**
   * Remove atividade com optimistic update.
   */
  const handleDeleteActivity = useCallback(async (id) => {
    const previous = activities.find(a => a.id === id)
    setActivities(prev => prev.filter(a => a.id !== id))

    const { error } = await supabase.from('activities').delete().eq('id', id)

    if (error) {
      if (previous) setActivities(prev => [...prev, previous])
      toast.error('Não foi possível excluir a atividade.')
    }
  }, [supabase, activities])

  // ─── Focus mode ───────────────────────────────────────────────────────────

  const handleStartFocus = useCallback((activity) => {
    setFocusActivity(activity)
  }, [])

  // ─── Check modal ─────────────────────────────────────────────────────────

  const handleShowCheckModal = useCallback((activity) => {
    setCheckActivity(activity)
  }, [])

  // ─── Helpers para log insertion ──────────────────────────────────────────

  /**
   * Insere um log no banco com optimistic UI.
   * Usa um ID temporário local até confirmar o UUID do servidor.
   *
   * @param {object} logData - Campos no formato dos componentes (sem `id`)
   * @returns {Promise<string|null>} ID real do log criado, ou null em caso de erro
   */
  const insertLog = useCallback(async (logData) => {
    const tempId = `temp_${Date.now()}`
    const optimisticLog = { ...logData, id: tempId }

    setHistoryLogs(prev => [optimisticLog, ...prev])

    const { data, error } = await supabase
      .from('history_logs')
      .insert({ ...logToDb(logData), user_id: userId })
      .select()
      .single()

    if (error) {
      console.error('[insertLog] Supabase error:', error)
      setHistoryLogs(prev => prev.filter(l => l.id !== tempId))
      toast.error(`Sem conexão com o servidor: ${error.message}`)
      return null
    }

    // Substitui temp ID pelo UUID real
    const serverLog = dbToLog(data)
    setHistoryLogs(prev => prev.map(l => l.id === tempId ? serverLog : l))
    return serverLog.id
  }, [supabase, userId])

  // ─── Handlers de log ─────────────────────────────────────────────────────

  /** Confirmação via modal de Check (notificação push) */
  const handleCheckConfirm = useCallback(async () => {
    if (!checkActivity) return
    setCheckActivity(null)

    await insertLog({
      activityId: checkActivity.id,
      activityName: checkActivity.name,
      type: 'CHECK',
      date: new Date().toISOString(),
      status: 'DONE',
      duration: null,
    })
  }, [checkActivity, insertLog])

  const handleCheckDismiss = useCallback(() => {
    setCheckActivity(null)
  }, [])

  /** Botão "Concluir" direto no card CHECK */
  const handleCheckComplete = useCallback(async (activity) => {
    await insertLog({
      activityId: activity.id,
      activityName: activity.name,
      type: 'CHECK',
      date: new Date().toISOString(),
      status: 'DONE',
      duration: null,
    })
  }, [insertLog])

  /** Finaliza o modo foco (TIMER) */
  const handleEndFocus = useCallback(async (completed = false) => {
    if (completed && focusActivity) {
      if (recoveryLogId) {
        // Atualiza log MISSED → COMPLETED (optimistic)
        setHistoryLogs(prev => prev.map(log =>
          log.id === recoveryLogId
            ? { ...log, status: 'COMPLETED', date: new Date().toISOString() }
            : log
        ))

        const { error } = await supabase
          .from('history_logs')
          .update({ status: 'COMPLETED', executed_at: new Date().toISOString() })
          .eq('id', recoveryLogId)

        if (error) {
          // Reverte
          setHistoryLogs(prev => prev.map(log =>
            log.id === recoveryLogId ? { ...log, status: 'MISSED' } : log
          ))
          toast.error('Não foi possível registrar a conclusão.')
        }

        setRecoveryLogId(null)
      } else {
        await insertLog({
          activityId: focusActivity.id,
          activityName: focusActivity.name,
          type: focusActivity.type ?? 'TIMER',
          date: new Date().toISOString(),
          status: 'COMPLETED',
          duration: focusActivity.duration,
        })
      }
    } else {
      setRecoveryLogId(null)
    }

    setFocusActivity(null)
  }, [focusActivity, recoveryLogId, supabase, insertLog])

  /** Inicia recuperação de atividade TIMER perdida */
  const handleRecoverMissed = useCallback((logId, activityId) => {
    const activity = activities.find(a => a.id === activityId)
    if (activity) {
      setRecoveryLogId(logId)
      setFocusActivity(activity)
    }
  }, [activities])

  /** Conclui atividade CHECK perdida no histórico (MISSED → DONE) */
  const handleCompleteMissedCheck = useCallback(async (logId) => {
    const now = new Date().toISOString()

    setHistoryLogs(prev => prev.map(log =>
      log.id === logId && log.status === 'MISSED'
        ? { ...log, status: 'DONE', date: now }
        : log
    ))

    const { error } = await supabase
      .from('history_logs')
      .update({ status: 'DONE', executed_at: now })
      .eq('id', logId)

    if (error) {
      setHistoryLogs(prev => prev.map(log =>
        log.id === logId ? { ...log, status: 'MISSED' } : log
      ))
      toast.error('Não foi possível registrar a conclusão.')
    }
  }, [supabase])

  /** Cria log MISSED para atividades que perderam a janela (chamado pelo scheduler) */
  const handleAddMissedLog = useCallback(async (activity, date) => {
    const dateStr = new Date(date).toDateString()
    const exists = historyLogs.some(log =>
      log.activityId === activity.id &&
      new Date(log.date).toDateString() === dateStr
    )
    if (exists) return

    await insertLog({
      activityId: activity.id,
      activityName: activity.name,
      type: activity.type ?? 'TIMER',
      date,
      status: 'MISSED',
      duration: activity.duration ?? null,
    })
  }, [historyLogs, insertLog])

  useNotificationScheduler(
    activities,
    handleStartFocus,
    handleAddMissedLog,
    historyLogs,
    focusActivity,
    handleShowCheckModal,
    isFetching,
  )

  // ─── Categorização de atividades ─────────────────────────────────────────

  const { pendingToday, futureOrCompleted } = useMemo(() => {
    const todayDow = new Date().getDay()
    const todayStr = new Date().toDateString()

    const completedTodayIds = new Set(
      historyLogs
        .filter(log =>
          ['COMPLETED', 'DONE'].includes(log.status) &&
          new Date(log.date).toDateString() === todayStr
        )
        .map(log => log.activityId)
    )

    const pending = []
    const rest = []

    activities.forEach(activity => {
      const isScheduledForToday = activity.days.includes(todayDow)
      const isCompletedToday = completedTodayIds.has(activity.id)
      const enriched = { ...activity, isScheduledForToday, isCompletedToday }

      if (isScheduledForToday && !isCompletedToday) {
        pending.push(enriched)
      } else {
        rest.push(enriched)
      }
    })

    return { pendingToday: pending, futureOrCompleted: rest }
  }, [activities, historyLogs])

  // ─── Render ──────────────────────────────────────────────────────────────

  if (focusActivity) {
    return (
      <FocusTimer
        activity={focusActivity}
        onFinish={() => handleEndFocus(true)}
        onCancel={() => handleEndFocus(false)}
      />
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        user={user}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onNewActivity={() => setIsFormOpen(true)}
      />

      {/* Conteúdo */}
      <div className="container mx-auto px-4 py-8">
        {isFetching ? (
          <div className="flex items-center justify-center py-24 text-sm text-muted-foreground">
            Carregando…
          </div>
        ) : activeTab === 'activities' ? (
          <ActivityList
            pendingToday={pendingToday}
            futureOrCompleted={futureOrCompleted}
            onDelete={handleDeleteActivity}
            onStartFocus={handleStartFocus}
            onEdit={(activity) => {
              setEditingActivity(activity)
              setIsFormOpen(true)
            }}
            onCheckComplete={handleCheckComplete}
          />
        ) : (
          <ActivityHistory
            logs={historyLogs}
            onRecoverMissed={handleRecoverMissed}
            onCompleteMissedCheck={handleCompleteMissedCheck}
          />
        )}
      </div>

      {/* Modal de cadastro / edição */}
      <Dialog
        open={isFormOpen}
        onOpenChange={(open) => { if (!open) closeForm(); else setIsFormOpen(true) }}
      >
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>
              {editingActivity ? 'Editar Atividade' : 'Nova Atividade'}
            </DialogTitle>
          </DialogHeader>
          <ActivityForm
            initialData={editingActivity}
            onSubmit={editingActivity ? handleEditActivity : handleAddActivity}
            onCancel={closeForm}
          />
        </DialogContent>
      </Dialog>

      {/* Modal de confirmação para atividades CHECK (notificação push) */}
      <CheckCompletionModal
        open={!!checkActivity}
        activity={checkActivity}
        onConfirm={handleCheckConfirm}
        onDismiss={handleCheckDismiss}
      />
    </div>
  )
}
