import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApiErrorDetail, ApiErrorResponse, ApiResponseMeta } from './api-response';

export class ApiResponseMetaDto implements ApiResponseMeta {
    @ApiPropertyOptional({
        description: 'Trace ID propagated via x-request-id header',
        example: '4f5960e4-0f52-4c41-9d1f-0c71c50e5d45',
    })
    traceId?: string;
}

export class ApiErrorDetailDto implements ApiErrorDetail {
    @ApiProperty({
        description: 'Internal error code',
        example: 'INTERNAL_TRANSFER.VALIDATION_ERROR',
    })
    code!: string;

    @ApiProperty({ description: 'HTTP status', example: 400 })
    httpStatus!: number;

    @ApiProperty({ description: 'Short error description', example: 'Validation failed' })
    message!: string;

    @ApiPropertyOptional({
        description: 'Additional details (when available)',
        example: ['amount should not be empty', 'amount must be a positive number'],
    })
    details?: unknown;

    @ApiPropertyOptional({
        description: 'Trace ID propagated in the response',
        example: '4f5960e4-0f52-4c41-9d1f-0c71c50e5d45',
    })
    traceId?: string;
}

export class ApiErrorResponseDto implements ApiErrorResponse {
    @ApiProperty({ example: false, default: false })
    success: false = false;

    @ApiProperty({ type: ApiErrorDetailDto })
    error!: ApiErrorDetailDto;
}
