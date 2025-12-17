import 'reflect-metadata';
import { randomUUID } from 'crypto';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { createRequire } from 'module';
import { dirname, join } from 'path';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { ApiExceptionFilter } from './shared/http/api-exception.filter';
import { SuccessResponseInterceptor } from './shared/http/success-response.interceptor';
import { Request, Response, NextFunction } from 'express';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, { bufferLogs: true });
    const logger = app.get(Logger);

    app.useLogger(logger);

    app.use((req: Request, res: Response, next: NextFunction) => {
        const requestId =
            (req as any).id
            ?? (req.headers['x-request-id'] as string | undefined)
            ?? randomUUID();

        (req as any).id = requestId;
        res.setHeader('x-request-id', requestId);
        next();
    });

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );
    app.useGlobalInterceptors(new SuccessResponseInterceptor());
    app.useGlobalFilters(new ApiExceptionFilter(logger));
    app.setGlobalPrefix('v1/api/cash-out');
    app.enableCors();

    const swaggerConfig = new DocumentBuilder()
        .setTitle('Sttart Cash-out Service')
        .setDescription('API docs for internal transfers (v1/api/cash-out/internal-transfers).')
        .setVersion('1.0')
        .addTag('Internal Transfer')
        .build();
    const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);

    const httpServer = app.getHttpAdapter().getInstance();
    httpServer.get('/docs-json', (_req: Request, res: Response) => res.json(swaggerDocument));
    const require = createRequire(__filename);
    const scalarEntryPath = require.resolve('@scalar/api-reference');
    const scalarBundlePath = join(dirname(scalarEntryPath), 'browser/standalone.js');
    httpServer.get('/docs-cdn', (_req: Request, res: Response) => res.sendFile(scalarBundlePath));
    const { apiReference } = await importScalarApiReference();
    httpServer.use(
        '/docs',
        apiReference({
            spec: { url: '/docs-json' },
            cdn: '/docs-cdn',
            theme: 'alternate',
            customCss: `
      .references-rendered .section,
      .references-rendered .section-container,
      .references-rendered .section-content,
      .references-rendered .scalar-card,
      .references-rendered .scalar-card-content,
      .references-rendered .scalar-card-header,
      .references-rendered .section:focus,
      .references-rendered .section:focus-visible,
      .references-rendered .section:active {
        border: none !important;
        box-shadow: none !important;
        background: transparent !important;
        outline: none !important;
      }
      .references-rendered *:focus,
      .references-rendered *:focus-visible,
      .references-rendered *:active {
        outline: none !important;
        box-shadow: none !important;
      }
      :root {
        --scalar-border-width: 0px !important;
        --scalar-border-color: transparent !important;
      }
    `,
        }),
    );

    const config = app.get(ConfigService);
    const port = config.get('PORT') || 3002;
    const host = '0.0.0.0';

    await app.listen(port, host);
    logger.log(`🚀 Sttart cash-out Service rodando em http://localhost:${port}`);
}

function importScalarApiReference() {
    return eval('import("@scalar/nestjs-api-reference")') as Promise<typeof import('@scalar/nestjs-api-reference')>;
}
bootstrap();
