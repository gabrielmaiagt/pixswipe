import type { PlanType } from '@/types';

interface CaktoTokenResponse {
    access_token: string;
    expires_in: number;
    token_type: string;
    scope: string;
}

export interface CaktoOrder {
    id: string;
    refId: string;
    status: string;
    amount: string;
    customer: {
        name: string;
        email: string;
        phone?: string;
    };
    product: {
        id: string;
        name: string;
    };
    paymentMethod: string;
    createdAt: string;
    paidAt?: string;
}

class CaktoAPIClient {
    private baseUrl: string;
    private clientId: string;
    private clientSecret: string;
    private accessToken: string | null = null;
    private tokenExpiry: number | null = null;

    constructor() {
        this.baseUrl = process.env.CAKTO_BASE_URL || 'https://api.cakto.com.br';
        this.clientId = process.env.CAKTO_CLIENT_ID || '';
        this.clientSecret = process.env.CAKTO_CLIENT_SECRET || '';
    }

    private async authenticate(): Promise<string> {
        // Return cached token if valid
        if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
            return this.accessToken;
        }

        if (!this.clientId || !this.clientSecret) {
            throw new Error('CAKTO_CLIENT_ID and CAKTO_CLIENT_SECRET are required');
        }

        const response = await fetch(`${this.baseUrl}/public_api/token/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: this.clientId,
                client_secret: this.clientSecret,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Cakto authentication failed: ${JSON.stringify(error)}`);
        }

        const data: CaktoTokenResponse = await response.json();

        this.accessToken = data.access_token;
        // Expire slightly earlier to be safe
        this.tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;

        return this.accessToken;
    }

    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const token = await this.authenticate();
        const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;

        const response = await fetch(url, {
            ...options,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Cakto API request failed: ${JSON.stringify(error)}`);
        }

        return response.json();
    }

    /**
     * List orders with optional filters
     */
    async getOrders(filters: Record<string, string> = {}): Promise<{ count: number; results: CaktoOrder[]; next: string | null }> {
        const params = new URLSearchParams(filters);
        return this.request(`/public_api/orders/?${params.toString()}`);
    }

    /**
     * Refund an order
     */
    async refundOrder(orderId: string): Promise<{ detail: string }> {
        return this.request(`/public_api/orders/${orderId}/refund/`, {
            method: 'POST',
        });
    }

    /**
     * Resend access to a customer
     */
    async resendAccess(orderId: string): Promise<{ detail: string }> {
        return this.request(`/public_api/orders/${orderId}/resend_access/`, {
            method: 'POST',
        });
    }
}

// Export singleton
export const caktoClient = new CaktoAPIClient();
