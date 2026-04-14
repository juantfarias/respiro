'use client'

import { useState } from 'react'
import { Plus, Save } from 'lucide-react'

// Dias da semana para os checkboxes
const WEEKDAYS = [
  { id: 0, label: 'Dom', name: 'domingo' },
  { id: 1, label: 'Seg', name: 'segunda' },
  { id: 2, label: 'Ter', name: 'terça' },
  { id: 3, label: 'Qua', name: 'quarta' },
  { id: 4, label: 'Qui', name: 'quinta' },
  { id: 5, label: 'Sex', name: 'sexta' },
  { id: 6, label: 'Sáb', name: 'sábado' },
]

const ACTIVITY_TYPES = [
  { id: 'TIMER', label: 'Timer', description: 'Atividade com contagem regressiva' },
  { id: 'CHECK', label: 'Check', description: 'Hábito pontual sem duração' },
]

export default function ActivityForm({ onSubmit, onCancel, initialData }) {
  const isEditing = !!initialData

  // Estado do formulário — pré-preenchido quando em modo edição
  const [formData, setFormData] = useState({
    name: initialData?.name ?? '',
    type: initialData?.type ?? 'TIMER',
    days: initialData?.days ?? [],
    startTime: initialData?.startTime ?? '09:00',
    endTime: initialData?.endTime ?? '11:00',
    duration: initialData?.duration ?? 30,
  })

  // Estado de erros de validação
  const [errors, setErrors] = useState({})

  // Handler para campos de texto/número
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  // Handler para seleção de tipo
  const handleTypeSelect = (type) => {
    setFormData(prev => ({ ...prev, type }))
    if (errors.duration) {
      setErrors(prev => ({ ...prev, duration: null }))
    }
  }

  // Handler para checkboxes de dias
  const handleDayToggle = (dayId) => {
    setFormData(prev => ({
      ...prev,
      days: prev.days.includes(dayId)
        ? prev.days.filter(d => d !== dayId)
        : [...prev.days, dayId]
    }))
    if (errors.days) {
      setErrors(prev => ({ ...prev, days: null }))
    }
  }

  // Validação do formulário
  const validate = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Nome da atividade é obrigatório'
    }

    if (formData.days.length === 0) {
      newErrors.days = 'Selecione pelo menos um dia'
    }

    if (!formData.startTime) {
      newErrors.startTime = 'Horário de início é obrigatório'
    }

    if (!formData.endTime) {
      newErrors.endTime = 'Horário de fim é obrigatório'
    }

    if (formData.startTime && formData.endTime && formData.startTime >= formData.endTime) {
      newErrors.endTime = 'Horário de fim deve ser maior que o de início'
    }

    // Validação de duração apenas para TIMER
    if (formData.type === 'TIMER') {
      if (!formData.duration || formData.duration < 1) {
        newErrors.duration = 'Duração deve ser de pelo menos 1 minuto'
      }

      if (formData.startTime && formData.endTime && formData.duration) {
        const [startHour, startMin] = formData.startTime.split(':').map(Number)
        const [endHour, endMin] = formData.endTime.split(':').map(Number)
        const windowMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin)

        if (formData.duration > windowMinutes) {
          newErrors.duration = 'Duração não pode exceder a janela de tempo'
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handler do submit
  const handleSubmit = (e) => {
    e.preventDefault()

    if (validate()) {
      onSubmit({
        ...(initialData ?? {}),
        name: formData.name.trim(),
        type: formData.type,
        days: formData.days.sort((a, b) => a - b),
        startTime: formData.startTime,
        endTime: formData.endTime,
        // CHECK não tem duração
        duration: formData.type === 'CHECK' ? null : parseInt(formData.duration, 10),
      })
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Campo: Nome da Atividade */}
      <div className="mb-4">
        <label htmlFor="name" className="mb-2 block text-sm font-medium text-foreground">
          Nome da Atividade
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Ex: Ler um livro, Meditar, Tomar creatina..."
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-destructive">{errors.name}</p>
        )}
      </div>

      {/* Campo: Tipo de Atividade */}
      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium text-foreground">
          Tipo de Atividade
        </label>
        <div className="flex gap-2">
          {ACTIVITY_TYPES.map((actType) => (
            <button
              key={actType.id}
              type="button"
              onClick={() => handleTypeSelect(actType.id)}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                formData.type === actType.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-accent'
              }`}
            >
              {actType.label}
            </button>
          ))}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {formData.type === 'TIMER'
            ? 'Abre um timer em tela cheia para focar na atividade.'
            : 'Registra a conclusão de um hábito rápido sem abrir o timer.'}
        </p>
      </div>

      {/* Campo: Dias da Semana */}
      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium text-foreground">
          Dias da Semana
        </label>
        <div className="flex flex-wrap gap-2">
          {WEEKDAYS.map((day) => (
            <button
              key={day.id}
              type="button"
              onClick={() => handleDayToggle(day.id)}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                formData.days.includes(day.id)
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-accent'
              }`}
            >
              {day.label}
            </button>
          ))}
        </div>
        {errors.days && (
          <p className="mt-1 text-sm text-destructive">{errors.days}</p>
        )}
      </div>

      {/* Campos: Horários */}
      <div className="mb-4 grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="startTime" className="mb-2 block text-sm font-medium text-foreground">
            Início da Janela
          </label>
          <input
            type="time"
            id="startTime"
            name="startTime"
            value={formData.startTime}
            onChange={handleChange}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {errors.startTime && (
            <p className="mt-1 text-sm text-destructive">{errors.startTime}</p>
          )}
        </div>
        <div>
          <label htmlFor="endTime" className="mb-2 block text-sm font-medium text-foreground">
            Fim da Janela
          </label>
          <input
            type="time"
            id="endTime"
            name="endTime"
            value={formData.endTime}
            onChange={handleChange}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {errors.endTime && (
            <p className="mt-1 text-sm text-destructive">{errors.endTime}</p>
          )}
        </div>
      </div>

      {/* Campo: Duração — somente para TIMER */}
      {formData.type === 'TIMER' && (
        <div className="mb-6">
          <label htmlFor="duration" className="mb-2 block text-sm font-medium text-foreground">
            Duração da Atividade (minutos)
          </label>
          <input
            type="number"
            id="duration"
            name="duration"
            value={formData.duration}
            onChange={handleChange}
            min="1"
            max="240"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {errors.duration && (
            <p className="mt-1 text-sm text-destructive">{errors.duration}</p>
          )}
        </div>
      )}

      {/* Espaçamento quando não há campo de duração */}
      {formData.type === 'CHECK' && <div className="mb-6" />}

      {/* Botões de ação */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="flex flex-1 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {isEditing ? (
            <>
              <Save className="h-4 w-4" />
              Salvar
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Adicionar
            </>
          )}
        </button>
      </div>
    </form>
  )
}
