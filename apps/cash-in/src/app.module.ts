import { randomUUID } from 'crypto';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { InternalTransferModule } from './modules/internal-transfer/internal-transfer.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        transport:
          process.env.NODE_ENV !== 'production'
            ? {
              target: 'pino-pretty',
              options: {
                colorize: true,
                translateTime: 'SYS:standard',
                singleLine: true,
              },
            }
            : undefined,
        genReqId: (req) => {
          const requestId =
            (req as any)?.id
            ?? (req.headers['x-request-id'] as string | undefined)
            ?? randomUUID();

          (req as any).id = requestId;
          return requestId;
        },
        customProps: (req) => {
          const traceId = (req as any)?.id ?? (req.headers['x-request-id'] as string | undefined);
          return traceId ? { traceId } : {};
        },
        autoLogging: true,
        redact: ['req.headers.authorization', 'req.headers.cookie'],
      },
    }),

    HealthModule,
    InternalTransferModule,
  ],
})
export class AppModule { }
