import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { AxiosHttpModule } from '../axios-http.module';
import { HigherAuthService } from './higher-auth.service';
import { HigherInternalTransferService } from './higher-internal-transfer.service';
import { InternalTransferProviderPortToken } from '../../../core/ports/internal-transfer-provider.port';

@Module({
    imports: [AxiosHttpModule, ConfigModule],
    providers: [
        HigherAuthService,
        HigherInternalTransferService,
        PinoLogger,
        {
            provide: InternalTransferProviderPortToken,
            useExisting: HigherInternalTransferService,
        },
    ],
    exports: [InternalTransferProviderPortToken],
})
export class HigherModule { }
