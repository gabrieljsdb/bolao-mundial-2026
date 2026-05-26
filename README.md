# ⚽ Bolão Copa do Mundo 2026

Aplicação web completa de bolão para a Copa do Mundo 2026. Permite que participantes façam previsões de partidas, acompanhem o ranking em tempo real e o administrador gerencie resultados oficiais.

![Node.js](https://img.shields.io/badge/Node.js-24-green) ![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue) ![React](https://img.shields.io/badge/React-19-61dafb) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-336791)

---

## ✨ Funcionalidades

### Participantes
- Cadastro com nome, email, senha e setor (CAASC / Compras / TI / etc.)
- Previsões da fase de grupos (72 jogos)
- Previsões das fases eliminatórias (oitavas, quartas, semis, final)
- Escolha de finalistas e campeão
- Confirmação de palpites com bloqueio após prazo
- Acompanhamento de pontuação individual e ranking geral

### Administrador
- Lançamento de resultados oficiais (grupos e eliminatórias)
- Painel de participantes com status de pagamento
- Configuração do sistema (prazo de apostas, pontuação)
- Envio de comprovantes individuais por email (PDF)
- **Aba de Auditoria:**
  - Histórico de alterações de resultados com valores anteriores e novos
  - Palpites de todos os participantes (visíveis após fechamento do bolão)
  - Download de PDF consolidado com todos os palpites

---

## 🏗️ Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 19 + Vite + Tailwind CSS |
| Backend | Express 5 + Node.js 24 |
| Banco de dados | PostgreSQL + Drizzle ORM |
| Autenticação | JWT (jsonwebtoken) + bcrypt |
| PDF | PDFKit |
| Email | Nodemailer |
| Monorepo | pnpm workspaces + TypeScript 5.9 |

---

## 📁 Estrutura do Projeto

```
bolao2026/
├── artifacts/
│   ├── bolao2026/          # Frontend React + Vite
│   │   └── src/
│   │       ├── pages/      # Home, Admin, Register, Login
│   │       ├── components/ # ScoreInput, etc.
│   │       ├── contexts/   # AuthContext
│   │       ├── hooks/      # useAuth
│   │       └── lib/        # worldCupData, knockoutData
│   └── api-server/         # Backend Express
│       └── src/
│           └── routes/
│               ├── auth.ts         # Registro, login, JWT
│               ├── predictions.ts  # Palpites dos usuários
│               ├── ranking.ts      # Cálculo de pontuação
│               ├── admin.ts        # Painel administrativo
│               ├── reports.ts      # PDF e envio de emails
│               └── config.ts       # Configurações do sistema
├── lib/
│   └── db/                 # Schema PostgreSQL + Drizzle ORM
│       └── src/schema/
│           └── bolao.ts    # Tabelas: users, predictions, results, logs
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── package.json
```

---

## 🚀 Como Rodar Localmente

### Pré-requisitos
- Node.js 20+
- pnpm 9+
- PostgreSQL 15+

### 1. Clonar e instalar dependências

```bash
git clone https://github.com/seu-usuario/bolao2026.git
cd bolao2026
pnpm install
```

### 2. Configurar variáveis de ambiente

Crie um arquivo `.env` na raiz:

```env
DATABASE_URL=postgresql://usuario:senha@localhost:5432/bolao2026
SESSION_SECRET=sua-chave-secreta-aqui
```

### 3. Criar o banco de dados

```bash
# Criar o banco
createdb bolao2026

# Aplicar o schema
pnpm --filter @workspace/db run push
```

### 4. Rodar o projeto

Em dois terminais separados:

```bash
# Terminal 1 — API (porta 8080)
pnpm --filter @workspace/api-server run dev

# Terminal 2 — Frontend (porta 5173)
pnpm --filter @workspace/bolao2026 run dev
```

Acesse: `http://localhost:5173`

---

## 🔑 Acesso Padrão

Para criar o primeiro usuário admin, registre-se normalmente e depois execute no banco:

```sql
UPDATE users SET role = 'admin' WHERE email = 'seu@email.com';
```

---

## ⚙️ Configuração de Email (opcional)

Para envio de comprovantes por email, configure o SMTP no painel Admin → Configurações → SMTP.

Campos necessários:
- Host SMTP (ex: `smtp.gmail.com`)
- Porta (587 para TLS, 465 para SSL)
- Usuário e senha
- Email de origem

---

## 🗃️ Schema do Banco de Dados

```sql
users               -- Participantes e admins
user_predictions    -- Palpites por usuário (grupos + eliminatórias)
official_results    -- Resultados oficiais lançados pelo admin
system_config       -- Configurações (prazo, pontuação, SMTP)
activity_logs       -- Auditoria de ações administrativas
```

---

## 📊 Sistema de Pontuação

| Acerto | Pontos |
|--------|--------|
| Placar exato | Configurável (padrão: 3 pts) |
| Vencedor/Empate correto | Configurável (padrão: 1 pt) |
| Campeão correto | Configurável (padrão: 10 pts) |
| Finalista correto | Configurável (padrão: 5 pts) |

A pontuação é configurável pelo administrador via painel.

---

## 🏆 Fases do Campeonato

- **Fase de Grupos** — 8 grupos (A–H), 3 jogos por seleção, 72 partidas
- **Melhores Terceiros** — os 4 melhores terceiros avançam
- **Segunda Rodada / Oitavas de Final**
- **Quartas de Final**
- **Semifinais**
- **Final** + escolha de campeão

---

## 🔒 Segurança

- Senhas armazenadas com bcrypt (salt rounds: 10)
- Autenticação via JWT assinado com `SESSION_SECRET`
- Palpites bloqueados após prazo configurado pelo admin
- Endpoints administrativos protegidos por middleware de role

---

## 📄 Licença

MIT — sinta-se livre para usar, modificar e distribuir.
