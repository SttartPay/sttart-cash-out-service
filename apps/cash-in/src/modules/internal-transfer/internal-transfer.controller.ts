import { Body, Controller, Post } from '@nestjs/common';
import { InternalTransferUseCase } from '../../core/use-cases/internal-transfer.usecase';
import { CreateInternalTransferDto } from './dto/internal-transfer.dto';

@Controller('v1/internal-transfers')
export class InternalTransferController {
    constructor(
        private readonly internalTransfer: InternalTransferUseCase,
    ) { }

    @Post()
    create(@Body() payload: CreateInternalTransferDto) {
        return this.internalTransfer.create(payload);
    }
}
