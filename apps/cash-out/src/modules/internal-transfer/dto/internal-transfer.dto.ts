import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';
import {
    InternalTransferPayload,
    InternalTransferProviderResponse,
    InternalTransferResponse,
} from '../../../core/dto/internal-transfer.dto';
import { ApiResponseMetaDto } from '../../../shared/http/api-error-response.dto';

export class CreateInternalTransferDto implements InternalTransferPayload {
    @ApiProperty({ description: 'Internal transfer amount', example: 150.75, minimum: 0.01 })
    @Type(() => Number)
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    amount!: number;

    @ApiPropertyOptional({
        description: 'Idempotency key (auto-generated when not provided)',
        example: 'req-0c5e74f0-810d-4b38-9c31-b02adab94c9f',
    })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    requestId?: string;
}

export class InternalTransferProviderResponseDto implements InternalTransferProviderResponse {
    [key: string]: unknown;

    @ApiPropertyOptional({ example: 'f8d6e5c8-5c9f-4e0d-8d0a-4d3f2a1b9c8e' })
    transactionId?: string;

    @ApiPropertyOptional({ example: 'SUCCESS' })
    status?: string;

    @ApiPropertyOptional({ example: 'Internal transfer created successfully' })
    message?: string;
}

export class InternalTransferResponseDto implements InternalTransferResponse {
    [key: string]: unknown;

    @ApiPropertyOptional({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
    id?: string;

    @ApiPropertyOptional({ example: 'req-0c5e74f0-810d-4b38-9c31-b02adab94c9f' })
    requestId?: string;

    @ApiPropertyOptional({ example: 150.75 })
    amount?: number;

    @ApiPropertyOptional({ example: 'pagamentos@sttart.com' })
    email?: string;

    @ApiPropertyOptional({ example: 'PENDING' })
    status?: string;

    @ApiPropertyOptional({ example: 'higher-txn-123' })
    providerTransactionId?: string;

    @ApiPropertyOptional({ example: 'PENDING' })
    providerStatus?: string;

    @ApiPropertyOptional({ example: 'Awaiting processing' })
    providerMessage?: string;

    @ApiPropertyOptional({
        description: 'Payload returned by the provider',
        type: 'object',
        additionalProperties: true,
    })
    providerPayload?: unknown;

    @ApiPropertyOptional({ example: null, nullable: true })
    errorMessage?: string | null;

    @ApiPropertyOptional({ example: '2024-08-10T12:00:00.000Z' })
    createdAt?: string;

    @ApiPropertyOptional({ example: '2024-08-10T12:00:00.000Z' })
    updatedAt?: string;

    @ApiPropertyOptional({ type: InternalTransferProviderResponseDto })
    providerResponse?: InternalTransferProviderResponseDto;
}

export class InternalTransferSuccessResponseDto {
    @ApiProperty({ example: true, default: true })
    success: true = true;

    @ApiProperty({ type: InternalTransferResponseDto })
    data!: InternalTransferResponseDto;

    @ApiPropertyOptional({ type: ApiResponseMetaDto })
    meta?: ApiResponseMetaDto;
}
