# Rodando o Bolão 2026 com Docker

## Pré-requisitos
- Docker 24+
- Docker Compose v2

## Início rápido

```bash
# 1. Copie o arquivo de variáveis de ambiente
cp .env.example .env

# 2. (Opcional) Edite o .env e troque o SESSION_SECRET
nano .env

# 3. Suba tudo
docker compose up --build

# O app estará disponível em: http://localhost:3030/bolao2026/
```

## Serviços

| Serviço    | Porta interna | Descrição                        |
|------------|---------------|----------------------------------|
| nginx      | 3030 (host)   | Proxy reverso — porta pública    |
| api        | 8080          | API Express (interno)            |
| postgres   | 5432          | PostgreSQL 16 (interno)          |
| frontend   | —             | Build estático servido via nginx |

## Credenciais padrão

- **Admin:** `admin@bolao.com` / `admin2026`
- **Banco:** `postgres://bolao:bolao2026@postgres:5432/bolao2026`

> ⚠️ Mude a senha do admin e o `SESSION_SECRET` antes de expor em produção!

## Comandos úteis

```bash
# Rodar em background
docker compose up -d --build

# Ver logs
docker compose logs -f api

# Parar tudo
docker compose down

# Resetar banco (apaga dados)
docker compose down -v
docker compose up --build
```

## Variáveis de ambiente

| Variável         | Padrão                                    | Descrição             |
|------------------|-------------------------------------------|-----------------------|
| `SESSION_SECRET` | `change_this_secret_in_production_2026`   | Chave JWT (mude isso) |

O `DATABASE_URL` é configurado automaticamente pelo docker-compose.
