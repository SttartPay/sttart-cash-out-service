
import 'reflect-metadata';
import { randomUUID } from 'crypto';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { ApiExceptionFilter } from './shared/http/api-exception.filter';
import { SuccessResponseInterceptor } from './shared/http/success-response.interceptor';
import { Request, Response, NextFunction} from 'express'

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
    app.enableCors();
    const config = app.get(ConfigService);
    const port = config.get('PORT') || 3002;
    const host = '0.0.0.0';

    await app.listen(port, host);
    logger.log(`🚀 Sttart cash-out Service rodando em http://localhost:${port}`);
}
bootstrap();
