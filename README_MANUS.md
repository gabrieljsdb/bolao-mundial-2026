# Projeto Bolão 2026 - Documentação Técnica (Manus AI)

Este documento detalha as tecnologias utilizadas, as correções aplicadas e como rodar o projeto de forma eficiente.

## 🚀 Tecnologias Utilizadas

### Frontend
- **React 18** com **TypeScript**
- **Vite** (Build tool)
- **Tailwind CSS 4.0** (Estilização)
- **Lucide React** (Ícones)
- **Wouter** (Roteamento leve)

### Backend (API)
- **Node.js** com **Express**
- **Drizzle ORM** (Interação com Banco de Dados)
- **Pino** (Logging de alta performance)
- **Bcryptjs** (Criptografia de senhas)

### Banco de Dados
- **PostgreSQL 16** (Rodando via Docker)

### Infraestrutura & Ferramentas
- **Docker & Docker Compose**
- **pnpm** (Gerenciador de pacotes)
- **Node-Proxy** (Proxy reverso unificado para Frontend e API)

---

## 🛠 Melhorias e Correções Aplicadas

1. **Correção de Query SQL:** Corrigido bug na rota `/api/predictions` onde a coluna `user_id` estava sendo chamada incorretamente em vez de `id`.
2. **Interface Visual:** 
   - Cores da fase de grupos e eliminatórias clareadas para melhor legibilidade.
   - Ranking Global: Setor destacado em amarelo e centralizado.
   - Menu Superior: Adição de setas azuis para scroll lateral.
   - Inclusão da imagem da taça (`taca.png`) no cabeçalho.
3. **Migração Automática:** Scripts para garantir que as tabelas do banco de dados sejam criadas via Drizzle-Kit.

---

## 🏃 Como Rodar o Projeto

Para garantir que o projeto rode sem problemas de kernel ou rede (como no ambiente sandbox), recomenda-se a execução híbrida:

### 1. Iniciar o Banco de Dados (Docker)
```bash
docker run -d --name bolao2026-postgres -p 5432:5432 \
  -e POSTGRES_USER=bolao \
  -e POSTGRES_PASSWORD=bolao2026 \
  -e POSTGRES_DB=bolao2026 \
  postgres:16-alpine
```

### 2. Configurar e Iniciar a API
No diretório `artifacts/api-server`:
```bash
export DATABASE_URL=postgres://bolao:bolao2026@localhost:5432/bolao2026
export SESSION_SECRET=seu_segredo_aqui
export PORT=8080
pnpm install
node ./dist/index.mjs
```

### 3. Iniciar o Frontend
No diretório `artifacts/bolao2026`:
```bash
pnpm install
pnpm run build
# Servir a pasta dist/public em um servidor HTTP (ex: Nginx ou Python)
```

### 4. Proxy (Opcional, mas recomendado)
Use um proxy reverso (Nginx ou o `proxy.js` incluído) para mapear:
- `/api` -> `http://localhost:8080`
- `/` -> `http://localhost:3030` (ou seu servidor estático)

---

## 👤 Credenciais Padrão
- **Admin:** `admin@bolao.com`
- **Senha:** `admin2026`

---
*Documentação gerada automaticamente por Manus AI para facilitar a transição de projeto.*
