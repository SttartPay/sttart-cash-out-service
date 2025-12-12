import { Module } from '@nestjs/common';
import { HigherModule } from '../../infrastructure/external/higher/higher.module';
import { DataServiceModule } from '../../infrastructure/external/data-service/data-service.module';
import { InternalTransferController } from './internal-transfer.controller';
import { InternalTransferUseCase } from '../../core/use-cases/internal-transfer.usecase';

@Module({
    imports: [HigherModule, DataServiceModule],
    controllers: [InternalTransferController],
    providers: [InternalTransferUseCase],
})
export class InternalTransferModule { }
