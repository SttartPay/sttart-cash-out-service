import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import type { Request } from 'express';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { ApiSuccessResponse } from './api-response';
import { extractTraceId } from './api-response';

@Injectable()
export class SuccessResponseInterceptor<T> implements NestInterceptor<T, ApiSuccessResponse<T>> {
    intercept(context: ExecutionContext, next: CallHandler): Observable<ApiSuccessResponse<T>> {
        const httpContext = context.switchToHttp();
        const request = httpContext.getRequest<Request>();
        const traceId = extractTraceId(request);

        return next.handle().pipe(
            map((data) => {
                const response: ApiSuccessResponse<T> = { success: true, data };
                if (traceId) response.meta = { traceId };
                return response;
            }),
        );
    }
}
