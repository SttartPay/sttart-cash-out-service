import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import http from 'http';
import https from 'https';

export class AxiosHttp {
    private readonly client: AxiosInstance;
    private readonly maxRetries = 2;

    constructor() {
        this.client = axios.create({
            timeout: 10_000,
            httpAgent: new http.Agent({
                keepAlive: true,
                keepAliveMsecs: 30_000,
                maxSockets: 50,
            }),
            httpsAgent: new https.Agent({
                keepAlive: true,
                keepAliveMsecs: 30_000,
                maxSockets: 50,
            }),
        });
    }

    get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
        return this.requestWithRetry(() => this.client.get(url, config).then((r) => r.data));
    }

    post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
        return this.requestWithRetry(() => this.client.post(url, data, config).then((r) => r.data));
    }

    patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
        return this.requestWithRetry(() => this.client.patch(url, data, config).then((r) => r.data));
    }

    private async requestWithRetry<T>(fn: () => Promise<T>, attempt = 1): Promise<T> {
        try {
            return await fn();
        } catch (error: any) {
            if (!this.shouldRetry(error, attempt)) {
                throw error;
            }
            await this.delay(this.backoff(attempt));
            return this.requestWithRetry(fn, attempt + 1);
        }
    }

    private shouldRetry(error: any, attempt: number): boolean {
        if (attempt > this.maxRetries) return false;

        const status = error?.response?.status;
        const code = error?.code;

        if (code === 'ECONNABORTED') return true;
        if (status === 429) return true;
        if (status >= 500 && status !== 501) return true;

        return false;
    }

    private backoff(attempt: number): number {
        const jitter = Math.floor(Math.random() * 250);
        return Math.min(1000 * 2 ** (attempt - 1) + jitter, 5_000);
    }

    private delay(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
