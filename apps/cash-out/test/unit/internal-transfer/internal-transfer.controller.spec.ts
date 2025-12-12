import { InternalTransferController } from '../../../src/modules/internal-transfer/internal-transfer.controller';
import { InternalTransferUseCase } from '../../../src/core/use-cases/internal-transfer.usecase';

describe('InternalTransferController', () => {
    let controller: InternalTransferController;
    let useCase: InternalTransferUseCase;

    beforeEach(() => {
        useCase = {
            create: jest.fn().mockResolvedValue({ id: '10', requestId: 'REQ-1' }),
        } as any;

        controller = new InternalTransferController(useCase);
    });

    it('should create internal transfer via use case', async () => {
        const payload = { amount: 10.5 };

        const result = await controller.create(payload as any);

        expect(useCase.create).toHaveBeenCalledWith(payload);
        expect(result).toEqual({ id: '10', requestId: 'REQ-1' });
    });
});
