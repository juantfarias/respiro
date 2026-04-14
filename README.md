# Respiro

Aplicação web para trabalhadores remotos que querem organizar pausas e hobbies sem deixar a rotina dominar o dia. O Respiro agenda lembretes aleatórios dentro de janelas de tempo configuradas, incentivando você a sair da tela e fazer o que gosta.

## Funcionalidades

- Cadastro de atividades com nome, dias da semana, janela de horário e duração
- Notificações push aleatórias dentro da janela configurada
- Modo Foco: timer de contagem regressiva em tela cheia com progresso circular
- Histórico de atividades realizadas e perdidas
- Execução em atraso: atividades perdidas podem ser feitas fora do horário
- 100% client-side — nenhum dado sai do seu navegador (localStorage)

## Tecnologias

| Camada | Tecnologia |
|---|---|
| Framework | [Next.js 15](https://nextjs.org) (App Router) |
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
  ├── ActivityForm.jsx    # Formulário de cadastro de atividades
  ├── ActivityList.jsx    # Grade de cards de atividades
  ├── ActivityCard.jsx    # Card individual de atividade
  ├── FocusTimer.jsx      # Timer em tela cheia (Modo Foco)
  └── ActivityHistory.jsx # Histórico de logs com opção de reexecução

/hooks
  └── useNotificationScheduler.js  # Agendamento aleatório e detecção de perdidas
```

## Como funciona o agendamento

Quando a janela de horário de uma atividade se abre, o hook `useNotificationScheduler` sorteia um momento aleatório dentro do tempo restante e agenda uma notificação via `setTimeout`. Clicar na notificação abre o Modo Foco diretamente.

Se a janela fechar sem que a atividade tenha sido feita, um registro `MISSED` é criado automaticamente no histórico.