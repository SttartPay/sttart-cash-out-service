# sttart-cash-out-service

Serviço de transferência interna via Higher: expõe API para criar transferências internas e persiste no data-service.

## Requisitos
- Node 18+
- npm
- Docker (opcional para subir via compose)

## Configuração rápida
```bash
cp .env.example .env
npm install
npm run start:dev
```

## Principais envs
- `PORT` (default 3002)
- `DATA_SERVICE_URL`
- `HIGHER_API_BASE_URL`, `HIGHER_API_KEY`, `HIGHER_TENANT`, `HIGHER_SERVICE_ACCOUNT_NAME`, `HIGHER_AUTH_BASIC`, `HIGHER_INTERNAL_TRANSFER_EMAIL`

## Endpoints
- `POST /v1/internal-transfers` – cria transferência interna via Higher (e-mail fixo via env)
- `GET /health` – status do serviço

## Webhook
- `ValidationPipe` global com `whitelist` e `forbidNonWhitelisted`.
- `axios` com timeout e retries exponenciais com jitter.

## Testes
```bash
npm test
```

## Docker
```bash
docker compose up --build
# ou
docker build -t sttart-cash-out-service --target prod .
docker run --env-file .env -p 3002:3002 sttart-cash-out-service
```

## App Runner
- A imagem final usa `node` como usuário padrão e roda `node dist/apps/cash-out/main.js` escutando `0.0.0.0:$PORT` (default `3002`).
- Defina as envs direto no App Runner (dev/staging/prod): `PORT`, `NODE_ENV=production`, `DATA_SERVICE_*`, `HIGHER_*`.
- Logs saem em JSON no modo produção via `nestjs-pino`; sem `pino-pretty` quando `NODE_ENV=production`.
- Health check pronto em `/health`.

## Estrutura (resumida)
```
apps/cash-out/src
├─ core/              # DTOs, ports, use cases
├─ infrastructure/    # clientes externos (data-service, Higher, axios-http)
└─ modules/           # internal-transfer (controller/módulo)
apps/cash-out/test     # testes unitários
```
