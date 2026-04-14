'use client'

import { useState, useEffect, useCallback } from 'react'
import { Wind, ListTodo, History, Plus } from 'lucide-react'
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

// Chaves para persistência no localStorage
const STORAGE_KEY = 'respiro_activities'
const HISTORY_KEY = 'respiro_history'

export default function Home() {
  const [activities, setActivities] = useState([])
  const [historyLogs, setHistoryLogs] = useState([])
  const [focusActivity, setFocusActivity] = useState(null)
  const [recoveryLogId, setRecoveryLogId] = useState(null)
  const [activeTab, setActiveTab] = useState('activities')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingActivity, setEditingActivity] = useState(null)

  // Atividade CHECK aguardando confirmação via modal (notificação push)
  const [checkActivity, setCheckActivity] = useState(null)

  // Carrega dados do localStorage na montagem
  useEffect(() => {
    const storedActivities = localStorage.getItem(STORAGE_KEY)
    if (storedActivities) {
      try {
        setActivities(JSON.parse(storedActivities))
      } catch (error) {
        console.error('Erro ao carregar atividades:', error)
      }
    }

    const storedHistory = localStorage.getItem(HISTORY_KEY)
    if (storedHistory) {
      try {
        setHistoryLogs(JSON.parse(storedHistory))
      } catch (error) {
        console.error('Erro ao carregar histórico:', error)
      }
    }
  }, [])

  // Persiste atividades no localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(activities))
    } catch (e) {
      console.error('Não foi possível salvar as atividades. Espaço de armazenamento do navegador cheio.', e)
    }
  }, [activities])

  // Persiste histórico no localStorage
  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(historyLogs))
    } catch (e) {
      console.error('Não foi possível salvar o registro. Espaço de armazenamento do navegador cheio.', e)
    }
  }, [historyLogs])

  // Fecha o modal de formulário e limpa o estado de edição
  const closeForm = useCallback(() => {
    setIsFormOpen(false)
    setEditingActivity(null)
  }, [])

  // Adiciona nova atividade
  const handleAddActivity = useCallback((newActivity) => {
    setActivities(prev => [...prev, { ...newActivity, id: Date.now().toString() }])
    closeForm()
  }, [closeForm])

  // Edita atividade existente
  const handleEditActivity = useCallback((updatedActivity) => {
    setActivities(prev => prev.map(a => a.id === updatedActivity.id ? updatedActivity : a))
    closeForm()
  }, [closeForm])

  // Exclui atividade
  const handleDeleteActivity = useCallback((id) => {
    setActivities(prev => prev.filter(a => a.id !== id))
  }, [])

  // Inicia o modo foco (atividades TIMER)
  const handleStartFocus = useCallback((activity) => {
    setFocusActivity(activity)
  }, [])

  // Abre modal de confirmação (atividades CHECK via notificação push)
  const handleShowCheckModal = useCallback((activity) => {
    setCheckActivity(activity)
  }, [])

  // Usuário confirma conclusão no modal CHECK
  const handleCheckConfirm = useCallback(() => {
    if (!checkActivity) return
    const newLog = {
      id: Date.now().toString(),
      activityId: checkActivity.id,
      activityName: checkActivity.name,
      type: 'CHECK',
      date: new Date().toISOString(),
      status: 'DONE',
      duration: null,
    }
    setHistoryLogs(prev => [newLog, ...prev])
    setCheckActivity(null)
  }, [checkActivity])

  // Usuário rejeita ou fecha o modal CHECK
  const handleCheckDismiss = useCallback(() => {
    setCheckActivity(null)
  }, [])

  // Clique direto no botão "Concluir" do card CHECK (sem modal)
  const handleCheckComplete = useCallback((activity) => {
    const newLog = {
      id: Date.now().toString(),
      activityId: activity.id,
      activityName: activity.name,
      type: 'CHECK',
      date: new Date().toISOString(),
      status: 'DONE',
      duration: null,
    }
    setHistoryLogs(prev => [newLog, ...prev])
  }, [])

  // Inicia execução de atividade TIMER atrasada (MISSED → FocusTimer)
  const handleRecoverMissed = useCallback((logId, activityId) => {
    const activity = activities.find(a => a.id === activityId)
    if (activity) {
      setRecoveryLogId(logId)
      setFocusActivity(activity)
    }
  }, [activities])

  // Conclui atividade CHECK atrasada no histórico (MISSED → DONE)
  const handleCompleteMissedCheck = useCallback((logId) => {
    setHistoryLogs(prev => prev.map(log =>
      log.id === logId && log.status === 'MISSED'
        ? { ...log, status: 'DONE', date: new Date().toISOString() }
        : log
    ))
  }, [])

  // Finaliza o modo foco
  const handleEndFocus = useCallback((completed = false) => {
    if (completed && focusActivity) {
      if (recoveryLogId) {
        setHistoryLogs(prev => prev.map(log =>
          log.id === recoveryLogId
            ? { ...log, status: 'COMPLETED' }
            : log
        ))
        setRecoveryLogId(null)
      } else {
        const newLog = {
          id: Date.now().toString(),
          activityId: focusActivity.id,
          activityName: focusActivity.name,
          type: focusActivity.type ?? 'TIMER',
          date: new Date().toISOString(),
          status: 'COMPLETED',
          duration: focusActivity.duration,
        }
        setHistoryLogs(prev => [newLog, ...prev])
      }
    } else {
      setRecoveryLogId(null)
    }
    setFocusActivity(null)
  }, [focusActivity, recoveryLogId])

  // Cria log MISSED para atividades que perderam a janela (chamado pelo hook)
  const handleAddMissedLog = useCallback((activity, date) => {
    const newLog = {
      id: Date.now().toString() + '_' + activity.id,
      activityId: activity.id,
      activityName: activity.name,
      type: activity.type ?? 'TIMER',
      date: date,
      status: 'MISSED',
      duration: activity.duration ?? null,
    }
    setHistoryLogs(prev => {
      const dateStr = new Date(date).toDateString()
      const exists = prev.some(log =>
        log.activityId === activity.id &&
        new Date(log.date).toDateString() === dateStr
      )
      if (exists) return prev
      return [newLog, ...prev]
    })
  }, [])

  useNotificationScheduler(
    activities,
    handleStartFocus,
    handleAddMissedLog,
    historyLogs,
    focusActivity,
    handleShowCheckModal,
  )

  // Modo foco — tela cheia exclusiva
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
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
              <Wind className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Respiro</h1>
              <p className="text-sm text-muted-foreground">
                Gerencie suas pausas e hobbies
              </p>
            </div>
            <button
              onClick={() => setIsFormOpen(true)}
              className="ml-auto flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Nova Atividade
            </button>
          </div>
        </div>
      </header>

      {/* Tabs de navegação */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('activities')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === 'activities'
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <ListTodo className="h-4 w-4" />
              Minhas Atividades
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === 'history'
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <History className="h-4 w-4" />
              Histórico
            </button>
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="container mx-auto px-4 py-8">
        {activeTab === 'activities' ? (
          <ActivityList
            activities={activities}
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
        onOpenChange={(open) => {
          if (!open) closeForm()
          else setIsFormOpen(true)
        }}
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
    </main>
  )
}
