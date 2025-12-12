import {
    ForbiddenException,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
    UnauthorizedException,
    UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { AxiosHttp } from '../axios-http.service';
import { HigherAuthService } from './higher-auth.service';
import { InternalTransferPayload, InternalTransferProviderResponse } from '../../../core/dto/internal-transfer.dto';
import { InternalTransferProviderPort } from '../../../core/ports/internal-transfer-provider.port';
import { HigherErrorCode } from '../../../domain/higher/higher.errors';

@Injectable()
export class HigherInternalTransferService implements InternalTransferProviderPort {
    private readonly baseUrl: string;
    private readonly apiKey: string;
    private readonly tenant: string;
    private readonly serviceAccountName: string;
    private readonly internalTransferEmail: string;

    constructor(
        private readonly http: AxiosHttp,
        private readonly auth: HigherAuthService,
        private readonly config: ConfigService,
        private readonly logger: PinoLogger,
    ) {
        this.logger.setContext(HigherInternalTransferService.name);
        const apiBaseUrl = (this.config.get<string>('HIGHER_API_BASE_URL') ?? '').replace(/\/$/, '');

        if (!apiBaseUrl) {
            throw new Error('Missing ENV: HIGHER_API_BASE_URL');
        }

        this.baseUrl = apiBaseUrl;
        this.apiKey = this.config.get<string>('HIGHER_API_KEY', '');
        this.tenant = this.config.get<string>('HIGHER_TENANT', '');
        this.serviceAccountName = this.config.get<string>('HIGHER_SERVICE_ACCOUNT_NAME', '');
        this.internalTransferEmail = this.config.get<string>('HIGHER_INTERNAL_TRANSFER_EMAIL', '');

        if (!this.apiKey) {
            throw new Error('Missing ENV: HIGHER_API_KEY');
        }
        if (!this.tenant) {
            throw new Error('Missing ENV: HIGHER_TENANT');
        }
        if (!this.serviceAccountName) {
            throw new Error('Missing ENV: HIGHER_SERVICE_ACCOUNT_NAME');
        }
        if (!this.internalTransferEmail) {
            throw new Error('Missing ENV: HIGHER_INTERNAL_TRANSFER_EMAIL');
        }
    }

    async createInternalTransfer(payload: InternalTransferPayload): Promise<InternalTransferProviderResponse> {
        const headers = await this.buildHeaders();
        const body = {
            email: payload.email ?? this.internalTransferEmail,
            amount: payload.amount,
        };

        try {
            return await this.http.post<InternalTransferProviderResponse>(
                `${this.baseUrl}/v1/pix/cashout/createinternaltransfer`,
                body,
                { headers },
            );
        } catch (error: any) {
            if (error?.response?.status === 401) {
                this.auth.invalidate();
            }

            this.logger.error(this.summarizeError(error), 'Higher internal transfer request failed');
            this.handleHttpError(error);
        }
    }

    private async buildHeaders(): Promise<Record<string, string>> {
        const token = await this.auth.getToken();

        return {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            APIKEY: this.apiKey,
            'X-Tenant': this.tenant,
            ServiceAccountName: this.serviceAccountName,
        };
    }

    private handleHttpError(error: any): never {
        const status = error?.response?.status;
        const rawMessage = error?.response?.data?.message ?? error?.response?.data?.error?.message ?? error?.response?.data;
        const message = rawMessage ?? 'Unexpected Higher response';
        const details = error?.response?.data?.details ?? error?.response?.data?.error?.details ?? error?.response?.data;
        const lowerMessage = typeof rawMessage === 'string' ? rawMessage.toLowerCase() : '';
        const normalizedStatus =
            status && status < 500
                ? status
                : lowerMessage.includes('unauthorized')
                    ? 401
                    : lowerMessage.includes('forbidden')
                        ? 403
                        : status;

        switch (normalizedStatus) {
            case 401:
                throw new UnauthorizedException({
                    code: HigherErrorCode.UNAUTHORIZED,
                    message,
                    details,
                });
            case 403:
                throw new ForbiddenException({
                    code: HigherErrorCode.FORBIDDEN,
                    message,
                    details,
                });
            case 404:
                throw new NotFoundException({
                    code: HigherErrorCode.NOT_FOUND,
                    message: message ?? 'Higher resource not found',
                    details,
                });
            case 422:
                throw new UnprocessableEntityException({
                    code: HigherErrorCode.VALIDATION_ERROR,
                    message,
                    details,
                });
            default:
                throw new InternalServerErrorException({
                    code: HigherErrorCode.REQUEST_FAILED,
                    message,
                    details,
                });
        }
    }

    private summarizeError(error: any) {
        return {
            status: error?.response?.status,
            code: error?.code,
            message: error?.message,
            responseData: this.truncate(error?.response?.data),
        };
    }

    private truncate(data: unknown): unknown {
        if (data === undefined || data === null) return data;
        const stringified = this.safeStringify(data);
        if (!stringified) return data;
        if (stringified.length > 1500) {
            return `${stringified.slice(0, 1500)}... [truncated ${stringified.length - 1500} chars]`;
        }
        return stringified;
    }

    private safeStringify(data: unknown): string | undefined {
        if (typeof data === 'string') return data;
        try {
            return JSON.stringify(data);
        } catch {
            return undefined;
        }
    }
}
