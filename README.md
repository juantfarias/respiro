# Respiro

Aplicação web para trabalhadores remotos que querem organizar pausas e hobbies sem deixar a rotina dominar o dia. O Respiro agenda lembretes aleatórios dentro de janelas de tempo configuradas, incentivando você a sair da tela e fazer o que gosta.

## Funcionalidades

- Autenticação com e-mail/senha ou Google OAuth
- Dois tipos de atividade: **Timer** (foco com contagem regressiva) e **Check** (hábito pontual sem duração)
- Cadastro de atividades com nome, tipo, dias da semana e janela de horário
- Notificações push aleatórias dentro da janela configurada
- **Timer:** Modo Foco em tela cheia com progresso circular, pause/resume e controles de ajuste de tempo (+/-)
- **Check:** Modal de confirmação ao clicar na notificação; botão "Concluir" direto no card
- Histórico de atividades com status Realizado, Perdido e recuperação em atraso
- Dados por usuário isolados no banco — nenhum dado compartilhado entre contas

## Tecnologias

| Camada | Tecnologia |
|---|---|
| Framework | [Next.js](https://nextjs.org) (App Router) |
| UI | React 19 |
| Estilização | Tailwind CSS v4 |
| Componentes | shadcn/ui (Radix UI) |
| Ícones | lucide-react |
| Backend / Auth | [Supabase](https://supabase.com) (PostgreSQL + Auth) |
| OAuth | Google (via Supabase Auth) |
| Notificações | Notifications API nativa |
| Áudio | Web Audio API nativa |

---

## Instalação

### Pré-requisitos

- Node.js 18+
- Conta no [Supabase](https://supabase.com) (plano gratuito suficiente)

### 1. Clone o repositório

```bash
git clone https://github.com/juantfarias/respiro.git
cd respiro
npm install
```

### 2. Crie o projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um novo projeto.
2. Vá em **Settings → API** e anote o **Project URL** e a **anon public key**.

### 3. Configure as variáveis de ambiente

Crie o arquivo `.env.local` na raiz do projeto:

```
NEXT_PUBLIC_SUPABASE_URL=https://<seu-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### 4. Execute o SQL no Supabase

No Supabase Dashboard → **SQL Editor**, cole e execute:

```sql
-- Tabela de atividades
CREATE TABLE public.activities (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  type              TEXT NOT NULL CHECK (type IN ('TIMER', 'CHECK')),
  days              INTEGER[] NOT NULL,
  time_window_start TIME NOT NULL,
  time_window_end   TIME NOT NULL,
  duration          INTEGER,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX activities_user_id_idx ON public.activities(user_id);
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users see own activities"    ON public.activities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users insert own activities" ON public.activities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update own activities" ON public.activities FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users delete own activities" ON public.activities FOR DELETE USING (auth.uid() = user_id);

-- Tabela de histórico
CREATE TABLE public.history_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id     UUID REFERENCES public.activities(id) ON DELETE SET NULL,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title_snapshot  TEXT NOT NULL,
  type_snapshot   TEXT NOT NULL CHECK (type_snapshot IN ('TIMER', 'CHECK')),
  status          TEXT NOT NULL CHECK (status IN ('COMPLETED', 'DONE', 'MISSED')),
  executed_at     TIMESTAMPTZ NOT NULL,
  duration        INTEGER,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX history_logs_user_id_idx ON public.history_logs(user_id);
ALTER TABLE public.history_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users see own logs"    ON public.history_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users insert own logs" ON public.history_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update own logs" ON public.history_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "users delete own logs" ON public.history_logs FOR DELETE USING (auth.uid() = user_id);
```

### 5. Configure o Google OAuth (opcional)

Para habilitar login com Google:

1. **Supabase Dashboard → Authentication → Providers → Google → Enable**
2. Anote o **Callback URL** exibido (ex: `https://<ref>.supabase.co/auth/v1/callback`)
3. Acesse o [Google Cloud Console](https://console.cloud.google.com):
   - APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID
   - Application type: **Web application**
   - Authorized redirect URIs: cole o Callback URL do Supabase
   - Copie o **Client ID** e o **Client Secret**
4. De volta no Supabase, cole o Client ID e Client Secret na configuração do Google
5. **Supabase → Authentication → URL Configuration:**
   - Site URL: `http://localhost:3000`
   - Allowed Redirect URLs: `http://localhost:3000/**`

### 6. Inicie o servidor

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000). O app vai redirecionar para `/login` automaticamente.

> O navegador vai pedir permissão para enviar notificações na primeira vez que o dashboard carregar. Aceite para que os lembretes funcionem.

---

## Deploy (Vercel)

1. Importe o repositório no [Vercel](https://vercel.com)
2. Em **Settings → Environment Variables**, adicione:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. No Supabase, atualize as URLs de redirecionamento:
   - Site URL: `https://seu-dominio.vercel.app`
   - Allowed Redirect URLs: `https://seu-dominio.vercel.app/**`
4. Redeploy após salvar as variáveis

---

## Scripts disponíveis

```bash
npm run dev    # Servidor de desenvolvimento com hot reload
npm run build  # Build de produção
npm run start  # Servidor de produção (requer build)
npm run lint   # Verifica o código com ESLint
```

---

## Estrutura do projeto

```
/app
  ├── (auth)/
  │    ├── login/page.jsx          # Login — e-mail/senha + Google OAuth
  │    └── register/page.jsx       # Cadastro — e-mail/senha
  ├── (dashboard)/
  │    ├── layout.jsx              # Layout server-side — valida sessão
  │    └── page.jsx                # Dashboard — estado, CRUD, scheduler
  ├── auth/callback/route.js       # Callback OAuth — troca código por sessão
  └── layout.jsx                   # Layout raiz

/components/respiro
  ├── DashboardHeader.jsx          # Header com logo, iniciais e logout
  ├── ActivityForm.jsx             # Formulário de cadastro/edição (modal)
  ├── ActivityList.jsx             # Grade de cards de atividades
  ├── ActivityCard.jsx             # Card com ações por tipo
  ├── FocusTimer.jsx               # Timer em tela cheia (Modo Foco)
  ├── ActivityHistory.jsx          # Histórico com recuperação por tipo
  └── CheckCompletionModal.jsx     # Modal de confirmação para Check

/hooks
  └── useNotificationScheduler.js  # Agendamento aleatório e detecção de perdidas

/utils
  ├── adapters.js                  # Mapeamento DB ↔ componentes
  └── supabase/
       ├── client.js               # Browser client (Client Components)
       ├── server.js               # Server client (Server Components)
       └── middleware.js           # Middleware client (proxy.js)

proxy.js                           # Proteção de rotas + renovação de token
```

---

## Tipos de atividade

| Tipo | Descrição | CTA no card | Ao clicar na notificação | Recuperação no histórico |
|---|---|---|---|---|
| **Timer** | Atividade de foco com duração definida | "Iniciar Agora" → Modo Foco | Abre o Modo Foco | "Executar Atrasado" → Modo Foco |
| **Check** | Hábito pontual sem duração | "Concluir" → log imediato | Modal "Você realizou?" | "Concluir agora" → log imediato |

---

## Como funciona o agendamento

Quando a janela de horário de uma atividade se abre, o hook `useNotificationScheduler` sorteia um momento aleatório dentro do tempo restante e agenda uma notificação via `setTimeout`. Ao clicar na notificação, o sistema roteia para o Modo Foco (Timer) ou para o modal de confirmação (Check).

Se a janela fechar sem que a atividade tenha sido feita, um registro `MISSED` é criado automaticamente no histórico.
