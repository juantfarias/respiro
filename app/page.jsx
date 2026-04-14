'use client'

import { useState, useEffect, useCallback } from 'react'
import { Wind, ListTodo, History } from 'lucide-react'
import ActivityForm from '@/components/respiro/ActivityForm'
import ActivityList from '@/components/respiro/ActivityList'
import ActivityHistory from '@/components/respiro/ActivityHistory'
import FocusTimer from '@/components/respiro/FocusTimer'
import { useNotificationScheduler } from '@/hooks/useNotificationScheduler'

// Chaves para persistência no localStorage
const STORAGE_KEY = 'respiro_activities'
const HISTORY_KEY = 'respiro_history'

export default function Home() {
  // Estado das atividades cadastradas
  const [activities, setActivities] = useState([])
  
  // Estado do histórico de logs
  const [historyLogs, setHistoryLogs] = useState([])
  
  // Estado do modo foco (atividade ativa no timer)
  const [focusActivity, setFocusActivity] = useState(null)
  
  // Estado para rastrear se estamos executando uma atividade atrasada
  const [recoveryLogId, setRecoveryLogId] = useState(null)
  
  // Controla se o formulário está visível
  const [showForm, setShowForm] = useState(false)
  
  // Estado da aba ativa: 'activities' ou 'history'
  const [activeTab, setActiveTab] = useState('activities')

  // Carrega atividades do localStorage na montagem do componente
  useEffect(() => {
    const storedActivities = localStorage.getItem(STORAGE_KEY)
    if (storedActivities) {
      try {
        const parsed = JSON.parse(storedActivities)
        setActivities(parsed)
      } catch (error) {
        console.error('Erro ao carregar atividades:', error)
      }
    }
    
    const storedHistory = localStorage.getItem(HISTORY_KEY)
    if (storedHistory) {
      try {
        const parsed = JSON.parse(storedHistory)
        setHistoryLogs(parsed)
      } catch (error) {
        console.error('Erro ao carregar histórico:', error)
      }
    }
  }, [])

  // Persiste atividades no localStorage sempre que mudarem
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(activities))
  }, [activities])
  
  // Persiste histórico no localStorage sempre que mudar
  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(historyLogs))
  }, [historyLogs])

  // Função para adicionar nova atividade
  const handleAddActivity = useCallback((newActivity) => {
    const activityWithId = {
      ...newActivity,
      id: Date.now().toString(), // ID único baseado em timestamp
    }
    setActivities(prev => [...prev, activityWithId])
    setShowForm(false)
  }, [])

  // Função para excluir atividade
  const handleDeleteActivity = useCallback((id) => {
    setActivities(prev => prev.filter(activity => activity.id !== id))
  }, [])

  // Função para iniciar o modo foco
  const handleStartFocus = useCallback((activity) => {
    setFocusActivity(activity)
  }, [])
  
  // Função para iniciar execução de atividade atrasada (MISSED)
  const handleRecoverMissed = useCallback((logId, activityId) => {
    const activity = activities.find(a => a.id === activityId)
    if (activity) {
      setRecoveryLogId(logId)
      setFocusActivity(activity)
    }
  }, [activities])

  // Função para finalizar o modo foco
  const handleEndFocus = useCallback((completed = false) => {
    if (completed && focusActivity) {
      // Se estamos recuperando uma atividade MISSED, atualiza o log existente
      if (recoveryLogId) {
        setHistoryLogs(prev => prev.map(log => 
          log.id === recoveryLogId 
            ? { ...log, status: 'COMPLETED' }
            : log
        ))
        setRecoveryLogId(null)
      } else {
        // Cria um novo log de COMPLETED
        const newLog = {
          id: Date.now().toString(),
          activityId: focusActivity.id,
          activityName: focusActivity.name,
          date: new Date().toISOString(),
          status: 'COMPLETED',
          duration: focusActivity.duration,
        }
        setHistoryLogs(prev => [newLog, ...prev])
      }
    } else {
      // Se cancelou, limpa o recoveryLogId sem alterar nada
      setRecoveryLogId(null)
    }
    setFocusActivity(null)
  }, [focusActivity, recoveryLogId])
  
  // Função para adicionar log de MISSED (chamada pelo hook)
  const handleAddMissedLog = useCallback((activity, date) => {
    const newLog = {
      id: Date.now().toString() + '_' + activity.id,
      activityId: activity.id,
      activityName: activity.name,
      date: date,
      status: 'MISSED',
      duration: activity.duration,
    }
    setHistoryLogs(prev => {
      // Evita duplicatas verificando se já existe um log para essa atividade nessa data
      const dateStr = new Date(date).toDateString()
      const exists = prev.some(log => 
        log.activityId === activity.id && 
        new Date(log.date).toDateString() === dateStr
      )
      if (exists) return prev
      return [newLog, ...prev]
    })
  }, [])

  // Hook customizado para agendar notificações aleatórias
  useNotificationScheduler(activities, handleStartFocus, handleAddMissedLog, historyLogs, focusActivity)

  // Se estiver no modo foco, renderiza apenas o timer
  if (focusActivity) {
    return (
      <FocusTimer 
        activity={focusActivity} 
        onFinish={() => handleEndFocus(true)}
        onCancel={() => handleEndFocus(false)}
      />
    )
  }

  // Tela principal com lista de atividades
  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
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
          <>
            {/* Botão para mostrar/esconder formulário */}
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="mb-6 w-full rounded-lg border-2 border-dashed border-border bg-card p-4 text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
              >
                + Adicionar nova atividade
              </button>
            )}

            {/* Formulário de cadastro */}
            {showForm && (
              <div className="mb-6">
                <ActivityForm 
                  onSubmit={handleAddActivity}
                  onCancel={() => setShowForm(false)}
                />
              </div>
            )}

            {/* Lista de atividades */}
            <ActivityList 
              activities={activities}
              onDelete={handleDeleteActivity}
              onStartFocus={handleStartFocus}
            />
          </>
        ) : (
          <ActivityHistory 
            logs={historyLogs}
            onRecoverMissed={handleRecoverMissed}
          />
        )}
      </div>
    </main>
  )
}
