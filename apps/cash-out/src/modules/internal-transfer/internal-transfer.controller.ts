import { Body, Controller, Post } from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBody,
    ApiCreatedResponse,
    ApiExtraModels,
    ApiInternalServerErrorResponse,
    ApiOperation,
    ApiTags,
    ApiUnprocessableEntityResponse,
    getSchemaPath,
} from '@nestjs/swagger';
import { InternalTransferUseCase } from '../../core/use-cases/internal-transfer.usecase';
import {
    CreateInternalTransferDto,
    InternalTransferResponseDto,
    InternalTransferSuccessResponseDto,
} from './dto/internal-transfer.dto';
import { ApiErrorResponseDto } from '../../shared/http/api-error-response.dto';

@ApiTags('Internal Transfer')
@ApiExtraModels(ApiErrorResponseDto, InternalTransferResponseDto)
@Controller('internal-transfers')
export class InternalTransferController {
    constructor(
        private readonly internalTransfer: InternalTransferUseCase,
    ) { }

    @ApiOperation({
        summary: 'Create an internal transfer via Higher',
        description: 'Generates the requestId when omitted and persists the record in the data-service.',
    })
    @ApiBody({ type: CreateInternalTransferDto })
    @ApiCreatedResponse({
        description: 'Internal transfer created successfully',
        type: InternalTransferSuccessResponseDto,
    })
    @ApiBadRequestResponse({
        schema: {
            allOf: [{ $ref: getSchemaPath(ApiErrorResponseDto) }],
            example: {
                success: false,
                error: {
                    code: 'INTERNAL_TRANSFER.VALIDATION_ERROR',
                    httpStatus: 400,
                    message: 'amount should not be empty',
                },
            },
        },
    })
    @ApiUnprocessableEntityResponse({
        schema: {
            allOf: [{ $ref: getSchemaPath(ApiErrorResponseDto) }],
            example: {
                success: false,
                error: {
                    code: 'INTERNAL_TRANSFER.VALIDATION_ERROR',
                    httpStatus: 422,
                    message: 'Validation failed',
                    details: ['amount must be a positive number'],
                },
            },
        },
    })
    @ApiInternalServerErrorResponse({
        schema: {
            allOf: [{ $ref: getSchemaPath(ApiErrorResponseDto) }],
            example: {
                success: false,
                error: {
                    code: 'INTERNAL_TRANSFER.DATA_SERVICE_ERROR',
                    httpStatus: 500,
                    message: 'Unexpected data-service error',
                },
            },
        },
    })
    @Post()
    create(@Body() payload: CreateInternalTransferDto) {
        return this.internalTransfer.create(payload);
    }
}
