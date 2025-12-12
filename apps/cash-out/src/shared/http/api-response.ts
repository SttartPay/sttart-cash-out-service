import type { Request } from 'express';

export interface ApiResponseMeta {
    traceId?: string;
}

export interface ApiSuccessResponse<T> {
    success: true;
    data: T;
    meta?: ApiResponseMeta;
}

export interface ApiErrorDetail {
    code: string;
    httpStatus: number;
    message: string;
    details?: unknown;
    traceId?: string;
}

export interface ApiErrorResponse {
    success: false;
    error: ApiErrorDetail;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export function extractTraceId(req?: Request): string | undefined {
    const request = req as unknown as { id?: string; headers?: Request['headers'] };
    return request?.id ?? (request?.headers?.['x-request-id'] as string | undefined);
}
