import {
    ForbiddenException,
    Injectable,
    InternalServerErrorException,
    OnModuleInit,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { AxiosHttp } from '../axios-http.service';
import { HigherErrorCode } from '../../../domain/higher/higher.errors';

type HigherAuthResponse = {
    token?: string;
    access_token?: string;
    accessToken?: string;
    expires_in?: number;
    expiresIn?: number;
};

type CachedToken = {
    token: string;
    expiresAt: number;
};

@Injectable()
export class HigherAuthService implements OnModuleInit {
    private readonly loginUrl: string;
    private readonly authHeader: string;
    private readonly clockSkewMs = 60_000;
    private tokenCache?: CachedToken;
    private inflightTokenPromise?: Promise<string>;

    constructor(
        private readonly http: AxiosHttp,
        private readonly config: ConfigService,
        private readonly logger: PinoLogger,
    ) {
        this.logger.setContext(HigherAuthService.name);
        const apiBaseUrl = (this.config.get<string>('HIGHER_API_BASE_URL') ?? '').replace(/\/$/, '');
        this.authHeader = this.config.get<string>('HIGHER_AUTH_BASIC', '');
        this.loginUrl = `${apiBaseUrl}/v1/authentication/login`;

        if (!apiBaseUrl) throw new Error('Missing ENV: HIGHER_API_BASE_URL');
        if (!this.authHeader) throw new Error('Missing ENV: HIGHER_AUTH_BASIC');
    }

    onModuleInit(): void {
        void this.prewarmToken();
    }

    async getToken(): Promise<string> {
        if (this.tokenCache && this.tokenCache.expiresAt > Date.now()) {
            return this.tokenCache.token;
        }

        if (this.inflightTokenPromise) {
            return this.inflightTokenPromise;
        }

        this.inflightTokenPromise = this.fetchAndCacheToken();

        try {
            return await this.inflightTokenPromise;
        } finally {
            this.inflightTokenPromise = undefined;
        }
    }

    private async prewarmToken(): Promise<void> {
        try {
            await this.getToken();
        } catch (error) {
            this.logger.warn({ err: error }, 'Higher auth warmup failed');
        }
    }

    private async fetchAndCacheToken(): Promise<string> {
        try {
            const response = await this.http.post<HigherAuthResponse | string>(this.loginUrl, undefined, {
                headers: {
                    Authorization: `Basic ${this.authHeader}`,
                },
            });

            const token =
                typeof response === 'string'
                    ? response
                    : response?.access_token ?? response?.accessToken ?? response?.token;
            const expiresInSeconds =
                typeof response === 'string' ? 3600 : response?.expires_in ?? response?.expiresIn ?? 3600;

            if (!token) {
                this.logger.error(
                    {
                        responseData: response,
                    },
                    'Higher auth response missing access token',
                );
                throw new InternalServerErrorException({
                    code: HigherErrorCode.INVALID_AUTH_RESPONSE,
                    message: 'Higher did not return an access token',
                    details: response,
                });
            }

            const expiresAt = Math.max(
                Date.now(),
                Date.now() + expiresInSeconds * 1000 - this.clockSkewMs,
            );
            this.tokenCache = {
                token,
                expiresAt,
            };

            return token;
        } catch (error: any) {
            this.logger.error(this.summarizeError(error), 'Failed to obtain Higher auth token');
            this.handleHttpError(error);
        }
    }

    invalidate() {
        this.tokenCache = undefined;
    }

    private handleHttpError(error: any): never {
        const status = error?.response?.status;
        const message =
            error?.response?.data?.message
            ?? error?.response?.data?.error?.message
            ?? 'Unexpected error authenticating with Higher';
        const details = error?.response?.data;

        switch (status) {
            case 401:
                throw new UnauthorizedException({
                    code: HigherErrorCode.UNAUTHORIZED,
                    message: message ?? 'Higher auth rejected the credentials',
                    details,
                });
            case 403:
                throw new ForbiddenException({
                    code: HigherErrorCode.FORBIDDEN,
                    message: message ?? 'Higher auth forbidden',
                    details,
                });
            default:
                throw new InternalServerErrorException({
                    code: HigherErrorCode.AUTH_FAILED,
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
