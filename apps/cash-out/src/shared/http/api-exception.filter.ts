import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Logger } from 'nestjs-pino';
import type { ApiErrorResponse } from './api-response';
import { extractTraceId } from './api-response';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
    constructor(private readonly logger: Logger) { }

    catch(exception: unknown, host: ArgumentsHost) {
        const httpContext = host.switchToHttp();
        const response = httpContext.getResponse<Response>();
        const request = httpContext.getRequest<Request>();
        const traceId = extractTraceId(request);

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let code = 'INTERNAL_SERVER_ERROR';
        let message = 'Internal server error';
        let details: unknown;

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const { derivedCode, derivedDetails, derivedMessage } = this.normalizeHttpException(
                exception.getResponse(),
                exception,
                status,
            );
            code = derivedCode;
            message = derivedMessage;
            details = derivedDetails;
        } else if (exception instanceof Error) {
            message = exception.message || message;
        }

        const body: ApiErrorResponse = { success: false, error: { code, httpStatus: status, message, details, traceId } };

        this.logger.error(
            { err: exception instanceof Error ? exception : { raw: exception }, traceId, path: request?.url },
            message,
        );

        response.status(status).json(body);
    }

    private normalizeHttpException(response: unknown, exception: HttpException, status: number) {
        let message: string | undefined;
        let details: unknown;
        let code: string | undefined;

        if (typeof response === 'string') {
            message = response;
        } else if (response && typeof response === 'object') {
            const responseObject = response as Record<string, unknown>;
            if (typeof responseObject.message === 'string') message = responseObject.message;
            else if (Array.isArray(responseObject.message) && responseObject.message.length > 0) {
                message = responseObject.message.join(', ');
                details = responseObject.message;
            }
            if (responseObject.details !== undefined) details = responseObject.details;
            else if (responseObject.errors !== undefined) details = responseObject.errors;
            if (typeof responseObject.code === 'string') code = responseObject.code;
        }

        if (!code) code = this.toErrorCode(exception, status);
        if (!message) message = exception.message || 'Internal server error';
        return { derivedCode: code, derivedDetails: details, derivedMessage: message };
    }

    private toErrorCode(exception: HttpException, status: number) {
        const name = exception?.name ?? '';
        if (name) {
            return name.replace(/Exception$/, '').replace(/([a-z0-9])([A-Z])/g, '$1_$2').toUpperCase();
        }
        return `HTTP_${status}`;
    }
}
