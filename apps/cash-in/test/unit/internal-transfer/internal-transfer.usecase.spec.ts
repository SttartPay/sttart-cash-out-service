import { InternalTransferUseCase } from '../../../src/core/use-cases/internal-transfer.usecase';

const envEmail = 'fixed@env.com';

describe('InternalTransferUseCase', () => {
    const build = ({
        providerResponse = { transactionId: 'prov-1', status: 'queued', message: 'ok' },
        persisted = { id: 'db-1', status: 'PENDING' },
    } = {}) => {
        const provider = {
            createInternalTransfer: jest.fn().mockResolvedValue(providerResponse),
        };
        const dataService = {
            createInternalTransfer: jest.fn().mockResolvedValue(persisted),
        };
        const config = {
            get: jest.fn((key: string) => (key === 'HIGHER_INTERNAL_TRANSFER_EMAIL' ? envEmail : undefined)),
        };

        const useCase = new InternalTransferUseCase(provider as any, dataService as any, config as any);

        return { useCase, provider, dataService };
    };

    it('should call provider with env email, persist and return provider response', async () => {
        const { useCase, provider, dataService } = build();

        const result = await useCase.create({ amount: 100.25, requestId: 'REQ-123' });

        expect(provider.createInternalTransfer).toHaveBeenCalledWith({ amount: 100.25, email: envEmail });
        expect(dataService.createInternalTransfer).toHaveBeenCalledWith(expect.objectContaining({
            requestId: 'REQ-123',
            amount: 100.25,
            email: envEmail,
            status: 'PENDING',
            providerTransactionId: 'prov-1',
            providerStatus: 'queued',
            providerMessage: 'ok',
        }));
        expect(result).toMatchObject({
            id: 'db-1',
            providerResponse: { transactionId: 'prov-1', status: 'queued', message: 'ok' },
        });
    });

    it('generates a requestId when missing', async () => {
        const { useCase, dataService } = build();

        await useCase.create({ amount: 50 });

        const calledPayload = (dataService.createInternalTransfer as jest.Mock).mock.calls[0][0];
        expect(calledPayload.requestId).toBeDefined();
        expect(typeof calledPayload.requestId).toBe('string');
        expect(calledPayload.requestId.length).toBeGreaterThan(0);
    });
});
