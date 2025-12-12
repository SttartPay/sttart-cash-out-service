import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';
import { InternalTransferPayload } from '../../../core/dto/internal-transfer.dto';

export class CreateInternalTransferDto implements InternalTransferPayload {
    @Type(() => Number)
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    amount!: number;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    requestId?: string;
}
