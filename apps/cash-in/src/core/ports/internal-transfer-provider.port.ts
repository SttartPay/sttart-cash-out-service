import { InternalTransferPayload, InternalTransferProviderResponse } from '../dto/internal-transfer.dto';

export const InternalTransferProviderPortToken = Symbol('InternalTransferProviderPort');

export interface InternalTransferProviderPort {
    createInternalTransfer(payload: InternalTransferPayload): Promise<InternalTransferProviderResponse>;
}
