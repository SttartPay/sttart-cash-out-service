import {
    ConflictException,
    ForbiddenException,
    HttpException,
    HttpStatus,
    Injectable,
    NotFoundException,
    UnauthorizedException,
    UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosHttp } from '../axios-http.service';
import { InternalTransferDataServicePort } from '../../../core/ports/internal-transfer-data-service.port';
import {
    CreateInternalTransferRecordPayload,
    InternalTransferResponse,
} from '../../../core/dto/internal-transfer.dto';
import { ApiErrorDetail, ApiResponse } from '../../../shared/http/api-response';
import { InternalTransferErrorCode } from '../../../domain/internal-transfer/internal-transfer.errors';

@Injectable()
export class InternalTransferDataService implements InternalTransferDataServicePort {
    private readonly baseUrl: string;

    constructor(
        private readonly http: AxiosHttp,
        private readonly config: ConfigService,
    ) {
        this.baseUrl = this.config.get<string>('DATA_SERVICE_URL', '');

        if (!this.baseUrl) {
            throw new Error('Missing ENV: DATA_SERVICE_URL');
        }
    }

    async createInternalTransfer(payload: CreateInternalTransferRecordPayload): Promise<InternalTransferResponse> {
        const body = this.removeUndefined(payload);

        try {
            const response = await this.http.post<ApiResponse<InternalTransferResponse>>(
                `${this.baseUrl}/v1/api/data/internal-transfers`,
                body,
                {
                    headers: this.buildHeaders(),
                },
            );
            return this.unwrapApiResponse(response);
        } catch (error) {
            this.handleHttpError(error);
        }
    }

    private unwrapApiResponse<T>(response: ApiResponse<T> | T): T {
        if (response && typeof response === 'object' && 'success' in (response as Record<string, unknown>)) {
            const apiResponse = response as ApiResponse<T>;
            if (apiResponse.success) {
                return apiResponse.data;
            }
            if (apiResponse.error) {
                this.throwFromDetail(apiResponse.error);
            }
        }

        return response as T;
    }

    private extractApiError(error: any): ApiErrorDetail | null {
        const responseData = error?.response?.data;
        if (responseData && typeof responseData === 'object' && 'error' in responseData) {
            const apiError = (responseData as { error?: ApiErrorDetail }).error;
            if (apiError && typeof apiError === 'object') {
                return {
                    code: apiError.code,
                    httpStatus: apiError.httpStatus ?? error?.response?.status,
                    message: apiError.message,
                    details: apiError.details,
                    traceId: apiError.traceId,
                };
            }
        }

        return null;
    }

    private throwFromDetail(detail: ApiErrorDetail): never {
        const status = detail.httpStatus ?? HttpStatus.INTERNAL_SERVER_ERROR;
        const code = detail.code ?? this.defaultCodeForStatus(status);
        const message = detail.message ?? this.defaultMessageForStatus(status);

        this.throwHttpException(status, code, message, detail.details);
    }

    private defaultCodeForStatus(status: number): InternalTransferErrorCode {
        switch (status) {
            case HttpStatus.BAD_REQUEST:
            case HttpStatus.UNPROCESSABLE_ENTITY:
                return InternalTransferErrorCode.VALIDATION_ERROR;
            case HttpStatus.UNAUTHORIZED:
                return InternalTransferErrorCode.UNAUTHORIZED;
            case HttpStatus.FORBIDDEN:
                return InternalTransferErrorCode.FORBIDDEN;
            case HttpStatus.NOT_FOUND:
                return InternalTransferErrorCode.NOT_FOUND;
            case HttpStatus.CONFLICT:
                return InternalTransferErrorCode.ALREADY_EXISTS;
            default:
                return InternalTransferErrorCode.DATA_SERVICE_ERROR;
        }
    }

    private defaultMessageForStatus(status: number): string {
        switch (status) {
            case HttpStatus.NOT_FOUND:
                return 'Internal transfer not found';
            case HttpStatus.CONFLICT:
                return 'Internal transfer already exists';
            case HttpStatus.BAD_REQUEST:
            case HttpStatus.UNPROCESSABLE_ENTITY:
                return 'Validation failed';
            default:
                return 'Unexpected data-service error';
        }
    }

    private throwHttpException(status: number, code: string, message: string, details?: unknown): never {
        const payload = { code, message, details };
        switch (status) {
            case HttpStatus.BAD_REQUEST:
            case HttpStatus.UNPROCESSABLE_ENTITY:
                throw new UnprocessableEntityException(payload);
            case HttpStatus.UNAUTHORIZED:
                throw new UnauthorizedException(payload);
            case HttpStatus.FORBIDDEN:
                throw new ForbiddenException(payload);
            case HttpStatus.NOT_FOUND:
                throw new NotFoundException(payload);
            case HttpStatus.CONFLICT:
                throw new ConflictException(payload);
            default:
                throw new HttpException(payload, status || HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private buildHeaders(): Record<string, string> {
        return {
            'Content-Type': 'application/json',
        };
    }

    private removeUndefined<T>(payload: T | undefined): Partial<T> {
        if (!payload) {
            return {};
        }

        return Object.fromEntries(
            Object.entries(payload as Record<string, unknown>).filter(([, value]) => value !== undefined),
        ) as Partial<T>;
    }

    private handleHttpError(error: any): never {
        const apiError = this.extractApiError(error);
        if (apiError) {
            this.throwFromDetail(apiError);
        }

        const status = error?.response?.status ?? HttpStatus.INTERNAL_SERVER_ERROR;
        const message =
            error?.response?.data?.message
            ?? error?.response?.data?.error?.message
            ?? error?.response?.data;
        const details =
            error?.response?.data?.details
            ?? error?.response?.data?.error?.details
            ?? error?.response?.data?.errors;

        this.throwHttpException(
            status,
            this.defaultCodeForStatus(status),
            message ?? this.defaultMessageForStatus(status),
            details,
        );
    }
}
