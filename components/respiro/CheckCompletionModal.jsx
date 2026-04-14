'use client'

import { CheckCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

/**
 * Modal exibido quando o usuário clica na notificação de uma atividade do tipo CHECK.
 * Pergunta se a atividade foi realizada e registra o log conforme a resposta.
 *
 * @param {boolean} open - Controla a visibilidade do modal
 * @param {Object|null} activity - Atividade CHECK que gerou a notificação
 * @param {Function} onConfirm - Chamado quando o usuário confirma a conclusão
 * @param {Function} onDismiss - Chamado quando o usuário rejeita ou fecha o modal
 */
export default function CheckCompletionModal({ open, activity, onConfirm, onDismiss }) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onDismiss() }}>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Você realizou?</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center py-4 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <p className="text-lg font-semibold text-foreground">
            {activity?.name}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Chegou a hora do seu hábito. Você já fez?
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onDismiss}
            className="flex-1 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Ainda não
          </button>
          <button
            onClick={onConfirm}
            className="flex flex-1 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <CheckCircle className="h-4 w-4" />
            Sim, realizei!
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
