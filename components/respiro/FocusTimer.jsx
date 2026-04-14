'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Wind, Check, X, Pause, Play, Plus, Minus } from 'lucide-react'

export default function FocusTimer({ activity, onFinish, onCancel }) {
  // Tempo restante em segundos
  const [timeLeft, setTimeLeft] = useState(activity.duration * 60)

  // Estado se o timer está rodando ou pausado
  const [isRunning, setIsRunning] = useState(true)

  // Estado de conclusão
  const [isCompleted, setIsCompleted] = useState(false)

  // Valor de ajuste em segundos (controles +/-)
  const [adjustSeconds, setAdjustSeconds] = useState(10)

  // Referência para o intervalo
  const intervalRef = useRef(null)

  // Formata o tempo em MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Calcula a porcentagem de progresso
  const progressPercent = ((activity.duration * 60 - timeLeft) / (activity.duration * 60)) * 100

  // Função para tocar som de conclusão
  const playCompletionSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.value = 800
      oscillator.type = 'sine'

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.5)
    } catch (error) {
      // Áudio não disponível — sem impacto funcional
    }
  }, [])

  // Efeito para o contador regressivo
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current)
            setIsCompleted(true)
            setIsRunning(false)
            playCompletionSound()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, playCompletionSound])

  // Handler para pausar/retomar
  const togglePause = () => {
    setIsRunning(prev => !prev)
  }

  // Handler para finalizar manualmente
  const handleFinishEarly = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    setIsCompleted(true)
    setIsRunning(false)
    playCompletionSound()
  }

  // Handler para ajustar o tempo (+/-)
  const handleAdjust = (delta) => {
    setTimeLeft(prev => Math.max(0, prev + delta))
  }

  // Handler para o input de ajuste
  const handleAdjustInput = (e) => {
    const val = parseInt(e.target.value, 10)
    if (!isNaN(val) && val > 0) setAdjustSeconds(val)
  }

  // Se completou, mostra tela de sucesso
  if (isCompleted) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="flex flex-col items-center text-center">
          {/* Ícone de sucesso */}
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <Check className="h-12 w-12 text-green-600 dark:text-green-400" />
          </div>

          {/* Mensagem de sucesso */}
          <h1 className="mb-2 text-3xl font-bold text-foreground">
            Parabéns!
          </h1>
          <p className="mb-8 text-lg text-muted-foreground">
            Você completou seu momento de <strong>{activity.name}</strong>!
          </p>

          {/* Botão para voltar */}
          <button
            onClick={onFinish}
            className="flex items-center gap-2 rounded-lg bg-primary px-8 py-3 text-lg font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Wind className="h-5 w-5" />
            Voltar ao Início
          </button>
        </div>
      </main>
    )
  }

  // Tela do timer ativo
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="flex w-full max-w-md flex-col items-center text-center">
        {/* Header com nome da atividade — flex para centralizar o ícone */}
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Wind className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {activity.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            Aproveite seu momento de respiro
          </p>
        </div>

        {/* Timer circular */}
        <div className="relative mb-6">
          <svg className="h-64 w-64 -rotate-90 transform">
            {/* Círculo de fundo */}
            <circle
              cx="128"
              cy="128"
              r="120"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-muted"
            />
            {/* Círculo de progresso */}
            <circle
              cx="128"
              cy="128"
              r="120"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              className="text-primary transition-all duration-1000"
              strokeDasharray={`${2 * Math.PI * 120}`}
              strokeDashoffset={`${2 * Math.PI * 120 * (1 - progressPercent / 100)}`}
            />
          </svg>

          {/* Tempo no centro */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-bold tabular-nums text-foreground">
              {formatTime(timeLeft)}
            </span>
            <span className="text-sm text-muted-foreground">
              {isRunning ? 'restantes' : 'pausado'}
            </span>
          </div>
        </div>

        {/* Controles de ajuste de tempo */}
        <div className="mb-6 flex items-center gap-2">
          <button
            onClick={() => handleAdjust(-adjustSeconds)}
            className="flex items-center justify-center rounded-lg border border-border bg-card p-2 text-foreground transition-colors hover:bg-accent"
            aria-label="Diminuir tempo"
          >
            <Minus className="h-4 w-4" />
          </button>
          <input
            type="number"
            value={adjustSeconds}
            onChange={handleAdjustInput}
            min="1"
            className="w-16 rounded-md border border-input bg-background px-2 py-1.5 text-center text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <span className="text-xs text-muted-foreground">s</span>
          <button
            onClick={() => handleAdjust(adjustSeconds)}
            className="flex items-center justify-center rounded-lg border border-border bg-card p-2 text-foreground transition-colors hover:bg-accent"
            aria-label="Aumentar tempo"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Botões de controle */}
        <div className="flex w-full gap-3">
          {/* Botão Cancelar */}
          <button
            onClick={onCancel}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            <X className="h-4 w-4" />
            Cancelar
          </button>

          {/* Botão Pausar/Continuar */}
          <button
            onClick={togglePause}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-3 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
          >
            {isRunning ? (
              <>
                <Pause className="h-4 w-4" />
                Pausar
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Continuar
              </>
            )}
          </button>

          {/* Botão Finalizar */}
          <button
            onClick={handleFinishEarly}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Check className="h-4 w-4" />
            Finalizar
          </button>
        </div>
      </div>
    </main>
  )
}
