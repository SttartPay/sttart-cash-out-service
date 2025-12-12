import { randomUUID } from 'crypto';
import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    CreateInternalTransferRecordPayload,
    InternalTransferPayload,
    InternalTransferProviderResponse,
    InternalTransferResponse,
} from '../dto/internal-transfer.dto';
import {
    InternalTransferProviderPort,
    InternalTransferProviderPortToken,
} from '../ports/internal-transfer-provider.port';
import {
    InternalTransferDataServicePort,
    InternalTransferDataServicePortToken,
} from '../ports/internal-transfer-data-service.port';

@Injectable()
export class InternalTransferUseCase {
    constructor(
        @Inject(InternalTransferProviderPortToken)
        private readonly transferProvider: InternalTransferProviderPort,
        @Inject(InternalTransferDataServicePortToken)
        private readonly dataService: InternalTransferDataServicePort,
        private readonly config: ConfigService,
    ) { }

    async create(payload: InternalTransferPayload): Promise<
        InternalTransferResponse & { providerResponse: InternalTransferProviderResponse }
    > {
        const email = this.resolveEmail(payload.email);
        const requestId = this.resolveRequestId(payload.requestId);
        const providerResponse = await this.transferProvider.createInternalTransfer({ amount: payload.amount, email });

        const persisted = await this.dataService.createInternalTransfer(
            this.buildPersistencePayload(requestId, email, payload.amount, providerResponse),
        );

        return { ...persisted, providerResponse };
    }

    private buildPersistencePayload(
        requestId: string,
        email: string,
        amount: number,
        providerResponse: InternalTransferProviderResponse,
    ): CreateInternalTransferRecordPayload {
        return {
            requestId,
            amount,
            email,
            status: 'PENDING',
            providerTransactionId: this.normalizeString(providerResponse.transactionId),
            providerStatus: this.normalizeString(providerResponse.status),
            providerMessage: this.normalizeString(providerResponse.message),
            providerPayload: providerResponse,
            errorMessage: null,
        };
    }

    private resolveEmail(email?: string): string {
        const finalEmail = email ?? this.config.get<string>('HIGHER_INTERNAL_TRANSFER_EMAIL', '');

        if (!finalEmail) {
            throw new InternalServerErrorException('Missing env HIGHER_INTERNAL_TRANSFER_EMAIL');
        }

        return finalEmail;
    }

    private resolveRequestId(requestId?: string): string {
        const normalized = (requestId ?? '').trim();
        return normalized || randomUUID();
    }

    private normalizeString(value: unknown): string | undefined {
        if (value === null || value === undefined) return undefined;
        const text = value.toString().trim();
        return text.length ? text : undefined;
    }
}
