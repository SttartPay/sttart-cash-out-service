export type WebhookEventStatus = 'consumed' | 'error_publish' | 'error_consume';

export interface UpdateWebhookEventPayload {
    webhookId: string;
    status: WebhookEventStatus;
    consumedAt?: string;
    errorMessage?: string | null;
}
