import { UnauthorizedException } from '@nestjs/common';
import { HigherInternalTransferService } from '../../../src/infrastructure/external/higher/higher-internal-transfer.service';
import { HigherErrorCode } from '../../../src/domain/higher/higher.errors';

const baseUrl = 'https://higher.test';
const apiKey = 'api-key';
const tenant = 'tenant-1';
const serviceAccount = 'svc-account';
const transferEmail = 'fixed@sttart.com.br';

const buildConfig = () =>
    ({
        get: jest.fn((key: string, defaultValue?: string) => {
            if (key === 'HIGHER_API_BASE_URL') return baseUrl;
            if (key === 'HIGHER_API_KEY') return apiKey;
            if (key === 'HIGHER_TENANT') return tenant;
            if (key === 'HIGHER_SERVICE_ACCOUNT_NAME') return serviceAccount;
            if (key === 'HIGHER_INTERNAL_TRANSFER_EMAIL') return transferEmail;
            return defaultValue;
        }),
    }) as any;

const buildAuth = () =>
    ({
        getToken: jest.fn().mockResolvedValue('token-123'),
        invalidate: jest.fn(),
    }) as any;

const buildLogger = () =>
    ({
        setContext: jest.fn(),
        error: jest.fn(),
    }) as any;

describe('HigherInternalTransferService', () => {
    it('should post internal transfer using env email and auth headers', async () => {
        const http = { post: jest.fn().mockResolvedValue({ ok: true }) };
        const auth = buildAuth();
        const service = new HigherInternalTransferService(http as any, auth, buildConfig(), buildLogger());

        await service.createInternalTransfer({ amount: 10.01 });

        expect(http.post).toHaveBeenCalledWith(
            `${baseUrl}/v1/pix/cashout/createinternaltransfer`,
            {
                email: transferEmail,
                amount: 10.01,
            },
            {
                headers: {
                    Authorization: 'Bearer token-123',
                    'Content-Type': 'application/json',
                    APIKEY: apiKey,
                    'X-Tenant': tenant,
                    ServiceAccountName: serviceAccount,
                },
            },
        );
    });

    it('should allow overriding email from payload when provided', async () => {
        const http = { post: jest.fn().mockResolvedValue({ ok: true }) };
        const auth = buildAuth();
        const service = new HigherInternalTransferService(http as any, auth, buildConfig(), buildLogger());

        await service.createInternalTransfer({ amount: 5, email: 'other@sttart.com.br' });

        expect(http.post).toHaveBeenCalledWith(
            `${baseUrl}/v1/pix/cashout/createinternaltransfer`,
            {
                email: 'other@sttart.com.br',
                amount: 5,
            },
            expect.any(Object),
        );
    });

    it('invalidates token and maps 401 to UnauthorizedException', async () => {
        const http = {
            post: jest.fn().mockRejectedValue({
                response: { status: 401, data: { message: 'invalid token' } },
            }),
        };
        const auth = buildAuth();
        const service = new HigherInternalTransferService(http as any, auth, buildConfig(), buildLogger());

        const promise = service.createInternalTransfer({ amount: 1 });

        await expect(promise).rejects.toBeInstanceOf(UnauthorizedException);
        await expect(promise).rejects.toHaveProperty('response.code', HigherErrorCode.UNAUTHORIZED);
        expect(auth.invalidate).toHaveBeenCalledTimes(1);
    });
});
