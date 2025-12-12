import { CreateInternalTransferRecordPayload, InternalTransferResponse } from '../dto/internal-transfer.dto';

export const InternalTransferDataServicePortToken = Symbol('InternalTransferDataServicePort');

export interface InternalTransferDataServicePort {
    createInternalTransfer(payload: CreateInternalTransferRecordPayload): Promise<InternalTransferResponse>;
}
