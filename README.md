# Respiro

Aplicação web para trabalhadores remotos que querem organizar pausas e hobbies sem deixar a rotina dominar o dia. O Respiro agenda lembretes aleatórios dentro de janelas de tempo configuradas, incentivando você a sair da tela e fazer o que gosta.

## Funcionalidades

- Dois tipos de atividade: **Timer** (foco com contagem regressiva) e **Check** (hábito pontual sem duração)
- Cadastro de atividades com nome, tipo, dias da semana e janela de horário
- Notificações push aleatórias dentro da janela configurada
- **Timer:** Modo Foco em tela cheia com progresso circular, pause/resume e controles de ajuste de tempo (+/-)
- **Check:** Modal de confirmação ao clicar na notificação; botão "Concluir" direto no card
- Histórico de atividades com status Realizado, Perdido e recuperação em atraso
- Atividades perdidas do tipo Timer abrem o Modo Foco; do tipo Check registram conclusão diretamente
- 100% client-side — nenhum dado sai do seu navegador (localStorage)

## Tecnologias

| Camada | Tecnologia |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router) |
| UI | React 19 |
| Estilização | Tailwind CSS v4 |
| Componentes | shadcn/ui (Radix UI) |
| Ícones | lucide-react |
| Armazenamento | localStorage nativo |
| Notificações | Notifications API nativa |
| Áudio | Web Audio API nativa |

## Instalação

**Pré-requisitos:** Node.js 18+ e npm.

```bash
# 1. Clone o repositório
git clone https://github.com/juantfarias/respiro.git
cd respiro

# 2. Instale as dependências
npm install

# 3. Inicie o servidor de desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) no navegador.

> O navegador vai pedir permissão para enviar notificações na primeira vez que você abrir o app. Aceite para que os lembretes funcionem.

## Scripts disponíveis

```bash
npm run dev    # Servidor de desenvolvimento com hot reload
npm run build  # Build de produção
npm run start  # Servidor de produção (requer build)
npm run lint   # Verifica o código com ESLint
```

## Estrutura do projeto

```
/app
  ├── layout.jsx          # Layout raiz
  ├── page.jsx            # Página principal e gerenciamento de estado
  └── globals.css         # Variáveis de tema e estilos globais

/components/respiro
  ├── ActivityForm.jsx        # Formulário de cadastro e edição (modal) com seletor Timer/Check
  ├── ActivityList.jsx        # Grade de cards de atividades
  ├── ActivityCard.jsx        # Card com ações de iniciar/concluir, editar e excluir por tipo
  ├── FocusTimer.jsx          # Timer em tela cheia com controles +/- de tempo (Modo Foco)
  ├── ActivityHistory.jsx     # Histórico de logs com recuperação por tipo de atividade
  └── CheckCompletionModal.jsx # Modal de confirmação para atividades Check via notificação

/hooks
  └── useNotificationScheduler.js  # Agendamento aleatório, detecção de perdidas e roteamento por tipo
```

## Tipos de atividade

| Tipo | Descrição | CTA no card | Ao clicar na notificação | Recuperação no histórico |
|---|---|---|---|---|
| **Timer** | Atividade de foco com duração definida | "Iniciar Agora" → Modo Foco | Abre o Modo Foco | "Executar Atrasado" → Modo Foco |
| **Check** | Hábito pontual sem duração | "Concluir" → log imediato | Modal "Você realizou?" | "Concluir agora" → log imediato |

## Como funciona o agendamento

Quando a janela de horário de uma atividade se abre, o hook `useNotificationScheduler` sorteia um momento aleatório dentro do tempo restante e agenda uma notificação via `setTimeout`. Ao clicar na notificação, o sistema roteia para o Modo Foco (Timer) ou para o modal de confirmação (Check).

Se a janela fechar sem que a atividade tenha sido feita, um registro `MISSED` é criado automaticamente no histórico.
