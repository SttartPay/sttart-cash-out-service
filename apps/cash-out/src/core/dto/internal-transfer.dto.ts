export interface InternalTransferPayload {
    amount: number;
    email?: string;
    requestId?: string;
}

export interface InternalTransferProviderResponse extends Record<string, unknown> {
    transactionId?: string;
    status?: string;
    message?: string;
}

export type InternalTransferStatus = string;

export interface CreateInternalTransferRecordPayload {
    requestId: string;
    amount: number;
    email: string;
    status: InternalTransferStatus;
    providerTransactionId?: string;
    providerStatus?: string;
    providerMessage?: string;
    providerPayload?: unknown;
    errorMessage?: string | null;
}

export interface UpdateInternalTransferPayload {
    status?: InternalTransferStatus;
    providerStatus?: string;
    providerMessage?: string;
    providerPayload?: unknown;
    errorMessage?: string | null;
}

export interface InternalTransferResponse extends Record<string, unknown> {
    id?: string;
    requestId?: string;
    amount?: number;
    email?: string;
    status?: InternalTransferStatus;
    providerTransactionId?: string;
    providerStatus?: string;
    providerMessage?: string;
    providerPayload?: unknown;
    errorMessage?: string | null;
    createdAt?: string;
    updatedAt?: string;
}
