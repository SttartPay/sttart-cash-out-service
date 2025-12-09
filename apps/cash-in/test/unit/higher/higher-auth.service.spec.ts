import { HigherAuthService } from '../../../src/infrastructure/external/higher/higher-auth.service';

const baseUrl = 'https://higher.test';
const authBasic = 'basic-token';

const buildConfig = () =>
    ({
        get: jest.fn((key: string, defaultValue?: string) => {
            if (key === 'HIGHER_API_BASE_URL') return baseUrl;
            if (key === 'HIGHER_AUTH_BASIC') return authBasic;
            return defaultValue;
        }),
    }) as any;

const buildLogger = () =>
    ({
        setContext: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
    }) as any;

describe('HigherAuthService', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('prewarms auth token on module init', async () => {
        const http = { post: jest.fn().mockResolvedValue({ access_token: 'token-1', expires_in: 3600 }) };
        const service = new HigherAuthService(http as any, buildConfig(), buildLogger());

        service.onModuleInit();
        await new Promise((resolve) => setImmediate(resolve));

        expect(http.post).toHaveBeenCalledWith(`${baseUrl}/v1/authentication/login`, undefined, {
            headers: {
                Authorization: `Basic ${authBasic}`,
            },
        });
    });

    it('reuses inflight auth requests', async () => {
        const http = { post: jest.fn().mockResolvedValue({ access_token: 'token-2', expires_in: 3600 }) };
        const service = new HigherAuthService(http as any, buildConfig(), buildLogger());

        const [token1, token2] = await Promise.all([service.getToken(), service.getToken()]);

        expect(token1).toBe('token-2');
        expect(token2).toBe('token-2');
        expect(http.post).toHaveBeenCalledTimes(1);
    });

    it('logs warmup errors without throwing', async () => {
        const http = { post: jest.fn().mockRejectedValue(new Error('fail')) };
        const logger = buildLogger();
        const service = new HigherAuthService(http as any, buildConfig(), logger);

        service.onModuleInit();
        await new Promise((resolve) => setImmediate(resolve));

        expect(logger.warn).toHaveBeenCalledWith(expect.objectContaining({ err: expect.any(Error) }), 'Higher auth warmup failed');
    });
});
