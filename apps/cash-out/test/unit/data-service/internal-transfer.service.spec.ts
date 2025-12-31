import { ConflictException, UnprocessableEntityException } from '@nestjs/common';
import { InternalTransferDataService } from '../../../src/infrastructure/external/data-service/internal-transfer.service';
import { InternalTransferErrorCode } from '../../../src/domain/internal-transfer/internal-transfer.errors';

describe('InternalTransferDataService', () => {
    const baseUrl = 'http://localhost:3001';
    const config = {
        get: jest.fn((key: string, defaultValue?: string) => {
            if (key === 'DATA_SERVICE_URL') return baseUrl;
            return defaultValue;
        }),
    } as any;

    const payload = {
        requestId: 'REQ-123',
        amount: 150.25,
        email: 'user@example.com',
        status: 'PENDING',
        providerTransactionId: 'prov-abc',
        providerStatus: 'queued',
        providerMessage: 'awaiting',
        providerPayload: { origin: 'api' },
        errorMessage: null,
    };

    it('should create internal transfer with headers', async () => {
        const http = { post: jest.fn().mockResolvedValue({ success: true, data: { id: 'it-1' } }) };
        const service = new InternalTransferDataService(http as any, config);

        await service.createInternalTransfer(payload);

        expect(http.post).toHaveBeenCalledWith(
            `${baseUrl}/v1/api/data/internal-transfers`,
            payload,
            {
                headers: { 'Content-Type': 'application/json' },
            },
        );
    });

    it('unwraps success envelopes from data-service', async () => {
        const http = { post: jest.fn().mockResolvedValue({ success: true, data: { id: 'it-10', status: 'PENDING' } }) };
        const service = new InternalTransferDataService(http as any, config);

        const response = await service.createInternalTransfer(payload);

        expect(response).toEqual({ id: 'it-10', status: 'PENDING' });
    });

    it('maps conflict to ConflictException with namespaced code', async () => {
        const http = {
            post: jest.fn().mockRejectedValue({
                response: {
                    status: 409,
                    data: { error: { httpStatus: 409, code: InternalTransferErrorCode.ALREADY_EXISTS, message: 'duplicate' } },
                },
            }),
        };
        const service = new InternalTransferDataService(http as any, config);

        await expect(service.createInternalTransfer(payload)).rejects.toBeInstanceOf(ConflictException);
        await expect(service.createInternalTransfer(payload)).rejects.toHaveProperty(
            'response.code',
            InternalTransferErrorCode.ALREADY_EXISTS,
        );
    });

    it('defaults validation errors to INTERNAL_TRANSFER.VALIDATION_ERROR when code absent', async () => {
        const http = {
            post: jest.fn().mockRejectedValue({
                response: {
                    status: 400,
                    data: { message: 'invalid body' },
                },
            }),
        };
        const service = new InternalTransferDataService(http as any, config);

        await expect(service.createInternalTransfer(payload)).rejects.toHaveProperty(
            'response.code',
            InternalTransferErrorCode.VALIDATION_ERROR,
        );
        await expect(service.createInternalTransfer(payload)).rejects.toBeInstanceOf(UnprocessableEntityException);
    });
});
