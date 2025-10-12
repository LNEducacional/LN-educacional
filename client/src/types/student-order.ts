export interface OrderItem {
  title: string;
  description?: string;
  price?: number; // in cents
}

export interface StudentOrder {
  id: string;
  userId: string | null;
  items: OrderItem[];
  totalAmount: number; // in cents
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELED';
  paymentMethod: 'PIX' | 'BOLETO' | 'CREDIT_CARD' | 'DEBIT_CARD' | null;
  paymentStatus:
    | 'PENDING'
    | 'PROCESSING'
    | 'PAID'
    | 'CONFIRMED'
    | 'OVERDUE'
    | 'REFUNDED'
    | 'FAILED'
    | 'CANCELED';
  createdAt: string | Date;
}

export interface StudentOrdersResponse {
  orders: StudentOrder[];
  total: number;
}
