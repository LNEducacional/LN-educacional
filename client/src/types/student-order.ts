export interface OrderItem {
  title: string;
  description?: string;
  price?: number; // in cents
}

export interface StudentOrder {
  id: number;
  userId: number | null;
  items: OrderItem[];
  totalAmount: number; // in cents
  status: 'pending' | 'processing' | 'completed' | 'canceled';
  paymentMethod: 'PIX' | 'BOLETO' | 'CREDIT_CARD' | 'DEBIT_CARD' | null;
  paymentStatus:
    | 'pending'
    | 'processing'
    | 'paid'
    | 'confirmed'
    | 'overdue'
    | 'refunded'
    | 'failed'
    | 'canceled';
  createdAt: Date;
}
