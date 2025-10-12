export interface OrderItem {
  title: string;
  description: string;
  price: number; // in cents
}

export interface Order {
  id: number;
  items: OrderItem[];
  totalAmount: number; // in cents
  status: 'pending' | 'processing' | 'completed' | 'canceled';
  paymentMethod?: 'PIX' | 'BOLETO' | 'CREDIT_CARD' | 'DEBIT_CARD';
  customerName: string;
  customerEmail: string;
  customerCpfCnpj: string;
  customerPhone?: string;
  createdAt: Date;
}
