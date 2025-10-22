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
    customer: string;
    billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX' | 'UNDEFINED';
    value: number;
    dueDate: string;
    description?: string;
    externalReference?: string;
    installmentCount?: number;
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
export declare class AsaasService {
    private client;
    private apiKey;
    constructor(config: AsaasConfig);
    /**
     * Busca ou cria configuração Asaas do banco
     */
    static initialize(): Promise<AsaasService | null>;
    /**
     * Criar ou atualizar cliente no Asaas
     */
    createOrUpdateCustomer(customerData: AsaasCustomer): Promise<{
        id: string;
    }>;
    /**
     * Criar cobrança
     */
    createCharge(chargeData: AsaasCharge): Promise<AsaasChargeResponse>;
    /**
     * Processar pagamento com cartão de crédito
     */
    payWithCreditCard(chargeId: string, paymentData: AsaasCreditCardPayment): Promise<AsaasChargeResponse>;
    /**
     * Consultar status de cobrança
     */
    getCharge(chargeId: string): Promise<AsaasChargeResponse>;
    /**
     * Gerar QR Code PIX para cobrança
     */
    getPixQrCode(chargeId: string): Promise<{
        payload: string;
        encodedImage: string;
        expirationDate: string;
    }>;
    /**
     * Cancelar cobrança
     */
    deleteCharge(chargeId: string): Promise<void>;
    /**
     * Estornar pagamento
     */
    refundPayment(chargeId: string, value?: number, description?: string): Promise<void>;
}
export {};
//# sourceMappingURL=asaas.service.d.ts.map