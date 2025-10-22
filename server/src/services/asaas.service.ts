import axios, { type AxiosInstance } from 'axios';
import { prisma } from '../prisma';

interface AsaasConfig {
  apiKey: string;
  environment: 'production' | 'sandbox';
}

interface AsaasCustomer {
  name: string;
  cpfCnpj: string;
  email: string;
  phone?: string;
  mobilePhone?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  postalCode?: string;
}

interface AsaasCharge {
  customer: string; // Customer ID
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX' | 'UNDEFINED';
  value: number;
  dueDate: string; // YYYY-MM-DD
  description?: string;
  externalReference?: string; // ID do curso/order
  installmentCount?: number; // Para cartão parcelado
  installmentValue?: number;
  discount?: {
    value?: number;
    dueDateLimitDays?: number;
    type?: 'FIXED' | 'PERCENTAGE';
  };
  fine?: {
    value?: number;
    type?: 'FIXED' | 'PERCENTAGE';
  };
  interest?: {
    value?: number;
    type?: 'PERCENTAGE';
  };
  postalService?: boolean;
}

interface AsaasCreditCardPayment {
  creditCard: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
  };
  creditCardHolderInfo: {
    name: string;
    email: string;
    cpfCnpj: string;
    postalCode: string;
    addressNumber: string;
    phone: string;
  };
  remoteIp?: string;
}

interface AsaasChargeResponse {
  id: string;
  customer: string;
  billingType: string;
  value: number;
  netValue: number;
  originalValue: number;
  dueDate: string;
  status: 'PENDING' | 'RECEIVED' | 'CONFIRMED' | 'OVERDUE' | 'REFUNDED' | 'RECEIVED_IN_CASH' | 'REFUND_REQUESTED' | 'CHARGEBACK_REQUESTED' | 'CHARGEBACK_DISPUTE' | 'AWAITING_CHARGEBACK_REVERSAL' | 'DUNNING_REQUESTED' | 'DUNNING_RECEIVED' | 'AWAITING_RISK_ANALYSIS';
  description: string;
  externalReference: string;
  invoiceUrl: string;
  bankSlipUrl?: string;
  invoiceNumber: string;
  pixTransaction?: {
    payload: string;
    encodedImage: string;
    expirationDate: string;
  };
}

export class AsaasService {
  private client: AxiosInstance;
  private apiKey: string;

  constructor(config: AsaasConfig) {
    this.apiKey = config.apiKey;

    const baseURL = config.environment === 'production'
      ? 'https://api.asaas.com/v3'
      : 'https://sandbox.asaas.com/api/v3';

    this.client = axios.create({
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
  static async initialize(): Promise<AsaasService | null> {
    try {
      const integration = await prisma.apiIntegration.findFirst({
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
        environment: (integration.environment as 'production' | 'sandbox') || 'production',
      });
    } catch (error) {
      console.error('[ASAAS] Failed to initialize:', error);
      return null;
    }
  }

  /**
   * Criar ou atualizar cliente no Asaas
   */
  async createOrUpdateCustomer(customerData: AsaasCustomer): Promise<{ id: string }> {
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
    } catch (error: any) {
      console.error('[ASAAS] Create/Update customer error:', error.response?.data || error);
      throw new Error('Erro ao criar cliente no Asaas: ' + (error.response?.data?.errors?.[0]?.description || error.message));
    }
  }

  /**
   * Criar cobrança
   */
  async createCharge(chargeData: AsaasCharge): Promise<AsaasChargeResponse> {
    try {
      const response = await this.client.post('/payments', chargeData);
      return response.data;
    } catch (error: any) {
      console.error('[ASAAS] Create charge error:', error.response?.data || error);
      throw new Error('Erro ao criar cobrança no Asaas: ' + (error.response?.data?.errors?.[0]?.description || error.message));
    }
  }

  /**
   * Processar pagamento com cartão de crédito
   */
  async payWithCreditCard(
    chargeId: string,
    paymentData: AsaasCreditCardPayment
  ): Promise<AsaasChargeResponse> {
    try {
      const response = await this.client.post(`/payments/${chargeId}/payWithCreditCard`, paymentData);
      return response.data;
    } catch (error: any) {
      console.error('[ASAAS] Credit card payment error:', error.response?.data || error);
      throw new Error('Erro ao processar pagamento: ' + (error.response?.data?.errors?.[0]?.description || error.message));
    }
  }

  /**
   * Consultar status de cobrança
   */
  async getCharge(chargeId: string): Promise<AsaasChargeResponse> {
    try {
      const response = await this.client.get(`/payments/${chargeId}`);
      return response.data;
    } catch (error: any) {
      console.error('[ASAAS] Get charge error:', error.response?.data || error);
      throw new Error('Erro ao consultar cobrança: ' + (error.response?.data?.errors?.[0]?.description || error.message));
    }
  }

  /**
   * Gerar QR Code PIX para cobrança
   */
  async getPixQrCode(chargeId: string): Promise<{ payload: string; encodedImage: string; expirationDate: string }> {
    try {
      const response = await this.client.get(`/payments/${chargeId}/pixQrCode`);
      return response.data;
    } catch (error: any) {
      console.error('[ASAAS] Get PIX QR Code error:', error.response?.data || error);
      throw new Error('Erro ao gerar QR Code PIX: ' + (error.response?.data?.errors?.[0]?.description || error.message));
    }
  }

  /**
   * Cancelar cobrança
   */
  async deleteCharge(chargeId: string): Promise<void> {
    try {
      await this.client.delete(`/payments/${chargeId}`);
    } catch (error: any) {
      console.error('[ASAAS] Delete charge error:', error.response?.data || error);
      throw new Error('Erro ao cancelar cobrança: ' + (error.response?.data?.errors?.[0]?.description || error.message));
    }
  }

  /**
   * Estornar pagamento
   */
  async refundPayment(chargeId: string, value?: number, description?: string): Promise<void> {
    try {
      await this.client.post(`/payments/${chargeId}/refund`, {
        value,
        description,
      });
    } catch (error: any) {
      console.error('[ASAAS] Refund payment error:', error.response?.data || error);
      throw new Error('Erro ao estornar pagamento: ' + (error.response?.data?.errors?.[0]?.description || error.message));
    }
  }
}
