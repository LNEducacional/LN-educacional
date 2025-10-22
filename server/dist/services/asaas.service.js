"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AsaasService = void 0;
const axios_1 = __importDefault(require("axios"));
const prisma_1 = require("../prisma");
class AsaasService {
    client;
    apiKey;
    constructor(config) {
        this.apiKey = config.apiKey;
        const baseURL = config.environment === 'production'
            ? 'https://api.asaas.com/v3'
            : 'https://sandbox.asaas.com/api/v3';
        this.client = axios_1.default.create({
            baseURL,
            headers: {
                'Content-Type': 'application/json',
                'access_token': this.apiKey,
            },
        });
    }
    /**
     * Busca ou cria configuração Asaas do banco
     */
    static async initialize() {
        try {
            const integration = await prisma_1.prisma.apiIntegration.findFirst({
                where: {
                    name: 'asaas',
                    isActive: true,
                },
            });
            if (!integration || !integration.apiKey) {
                console.warn('[ASAAS] Integration not found or API key missing');
                return null;
            }
            return new AsaasService({
                apiKey: integration.apiKey,
                environment: integration.environment || 'production',
            });
        }
        catch (error) {
            console.error('[ASAAS] Failed to initialize:', error);
            return null;
        }
    }
    /**
     * Criar ou atualizar cliente no Asaas
     */
    async createOrUpdateCustomer(customerData) {
        try {
            // Tentar buscar cliente existente por CPF/CNPJ
            const existingResponse = await this.client.get('/customers', {
                params: {
                    cpfCnpj: customerData.cpfCnpj,
                },
            });
            if (existingResponse.data.data && existingResponse.data.data.length > 0) {
                const customerId = existingResponse.data.data[0].id;
                // Atualizar dados do cliente
                await this.client.post(`/customers/${customerId}`, customerData);
                return { id: customerId };
            }
            // Criar novo cliente
            const response = await this.client.post('/customers', customerData);
            return { id: response.data.id };
        }
        catch (error) {
            console.error('[ASAAS] Create/Update customer error:', error.response?.data || error);
            throw new Error('Erro ao criar cliente no Asaas: ' + (error.response?.data?.errors?.[0]?.description || error.message));
        }
    }
    /**
     * Criar cobrança
     */
    async createCharge(chargeData) {
        try {
            const response = await this.client.post('/payments', chargeData);
            return response.data;
        }
        catch (error) {
            console.error('[ASAAS] Create charge error:', error.response?.data || error);
            throw new Error('Erro ao criar cobrança no Asaas: ' + (error.response?.data?.errors?.[0]?.description || error.message));
        }
    }
    /**
     * Processar pagamento com cartão de crédito
     */
    async payWithCreditCard(chargeId, paymentData) {
        try {
            const response = await this.client.post(`/payments/${chargeId}/payWithCreditCard`, paymentData);
            return response.data;
        }
        catch (error) {
            console.error('[ASAAS] Credit card payment error:', error.response?.data || error);
            throw new Error('Erro ao processar pagamento: ' + (error.response?.data?.errors?.[0]?.description || error.message));
        }
    }
    /**
     * Consultar status de cobrança
     */
    async getCharge(chargeId) {
        try {
            const response = await this.client.get(`/payments/${chargeId}`);
            return response.data;
        }
        catch (error) {
            console.error('[ASAAS] Get charge error:', error.response?.data || error);
            throw new Error('Erro ao consultar cobrança: ' + (error.response?.data?.errors?.[0]?.description || error.message));
        }
    }
    /**
     * Gerar QR Code PIX para cobrança
     */
    async getPixQrCode(chargeId) {
        try {
            const response = await this.client.get(`/payments/${chargeId}/pixQrCode`);
            return response.data;
        }
        catch (error) {
            console.error('[ASAAS] Get PIX QR Code error:', error.response?.data || error);
            throw new Error('Erro ao gerar QR Code PIX: ' + (error.response?.data?.errors?.[0]?.description || error.message));
        }
    }
    /**
     * Cancelar cobrança
     */
    async deleteCharge(chargeId) {
        try {
            await this.client.delete(`/payments/${chargeId}`);
        }
        catch (error) {
            console.error('[ASAAS] Delete charge error:', error.response?.data || error);
            throw new Error('Erro ao cancelar cobrança: ' + (error.response?.data?.errors?.[0]?.description || error.message));
        }
    }
    /**
     * Estornar pagamento
     */
    async refundPayment(chargeId, value, description) {
        try {
            await this.client.post(`/payments/${chargeId}/refund`, {
                value,
                description,
            });
        }
        catch (error) {
            console.error('[ASAAS] Refund payment error:', error.response?.data || error);
            throw new Error('Erro ao estornar pagamento: ' + (error.response?.data?.errors?.[0]?.description || error.message));
        }
    }
}
exports.AsaasService = AsaasService;
//# sourceMappingURL=asaas.service.js.map