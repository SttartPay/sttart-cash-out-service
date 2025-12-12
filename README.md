# sttart-cash-out-service

Servico de transferencia interna via Higher: expoe API para criar transferencias internas e persiste no data-service.

## Requisitos
- Node 20+
- npm
- Docker (para build e execucao)

## Setup rapido (dev)
```bash
cp .env.example .env
npm install
npm run start:dev
```

## Principais envs
- `PORT` (default 3002)
- `DATA_SERVICE_URL`
- `HIGHER_API_BASE_URL`
- `HIGHER_API_KEY`
- `HIGHER_TENANT`
- `HIGHER_SERVICE_ACCOUNT_NAME`
- `HIGHER_AUTH_BASIC`
- `HIGHER_INTERNAL_TRANSFER_EMAIL`

## Endpoints
- `POST /v1/api/cash-out/internal-transfers` — cria transferencia interna via Higher (e-mail fixo via env)
- `GET /v1/api/cash-out/health` — health check

## Webhook
- `ValidationPipe` global com `whitelist` e `forbidNonWhitelisted`.
- `axios` com timeout e retries exponenciais com jitter.

## Testes
```bash
npm test
```

## Docker local
```bash
docker compose up --build                         # dev
docker build -t sttart-cash-out-service --target prod .   # imagem final
docker run --env-file .env -p 3002:3002 sttart-cash-out-service
```

## Build e push para AWS ECR (ex.: staging)
```bash
aws ecr get-login-password --region <regiao> | docker login --username AWS --password-stdin <account>.dkr.ecr.<regiao>.amazonaws.com
docker build -t sttart-cash-out-service --target prod .
docker tag sttart-cash-out-service:latest <account>.dkr.ecr.<regiao>.amazonaws.com/sttart-cash-out-service:stg
docker push <account>.dkr.ecr.<regiao>.amazonaws.com/sttart-cash-out-service:stg
```

## Task definition (ECS/App Runner)
- Container image: `<account>.dkr.ecr.<regiao>.amazonaws.com/sttart-cash-out-service:<tag>`
- Comando: `node dist/apps/cash-out/main.js`
- Porta: 3002 (health check em `/v1/api/cash-out/health`)
- Usuario: `node`
- Envs: `NODE_ENV=production`, `PORT=3002`, `DATA_SERVICE_URL`, `HIGHER_API_BASE_URL`, `HIGHER_API_KEY`, `HIGHER_TENANT`, `HIGHER_SERVICE_ACCOUNT_NAME`, `HIGHER_AUTH_BASIC`, `HIGHER_INTERNAL_TRANSFER_EMAIL`

## Estrutura (resumida)
```
apps/cash-out/src
  core/              # DTOs, ports, use cases
  infrastructure/    # clientes externos (data-service, Higher, axios-http)
  modules/           # internal-transfer (controller/modulo)
apps/cash-out/test   # testes unitarios
```
