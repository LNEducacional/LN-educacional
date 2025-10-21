import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../services/api';
import { getErrorMessage } from '../lib/error';

export interface CartItem {
  id: string;
  title: string;
  description: string;
  price: number;
  type: 'paper' | 'course' | 'ebook';
  quantity?: number;
  thumbnailUrl?: string;
}

interface CheckoutData {
  items: CartItem[];
  customer: {
    name: string;
    email: string;
    cpfCnpj: string;
    phone: string;
  };
  paymentMethod: 'PIX' | 'BOLETO' | 'CREDIT_CARD' | 'DEBIT_CARD';
}

interface CheckoutResponse {
  orderId: string;
  paymentUrl?: string;
  pixQRCode?: string;
  boletoUrl?: string;
  status: string;
}

const CART_STORAGE_KEY = 'ln_educacional_cart';

export const useCart = () => {
  const isMountedRef = useRef(false);
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    isMountedRef.current = true;

    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setItems(parsedCart);
      } catch (error) {
        console.error('Erro ao carregar carrinho:', error);
      }
    }

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const saveCart = useCallback((newItems: CartItem[]) => {
    setItems(newItems);
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newItems));
  }, []);

  const addItem = useCallback(
    (item: CartItem) => {
      const existingItem = items.find((i) => i.id === item.id);

      if (existingItem) {
        const updatedItems = items.map((i) =>
          i.id === item.id ? { ...i, quantity: (i.quantity || 1) + 1 } : i
        );
        saveCart(updatedItems);
      } else {
        const newItem = { ...item, quantity: 1 };
        saveCart([...items, newItem]);
      }
    },
    [items, saveCart]
  );

  const removeItem = useCallback(
    (itemId: string) => {
      const updatedItems = items.filter((item) => item.id !== itemId);
      saveCart(updatedItems);
    },
    [items, saveCart]
  );

  const updateQuantity = useCallback(
    (itemId: string, quantity: number) => {
      if (quantity <= 0) {
        removeItem(itemId);
      } else {
        const updatedItems = items.map((item) =>
          item.id === itemId ? { ...item, quantity } : item
        );
        saveCart(updatedItems);
      }
    },
    [items, removeItem, saveCart]
  );

  const clearCart = useCallback(() => {
    setItems([]);
    localStorage.removeItem(CART_STORAGE_KEY);
  }, []);

  const getTotal = useCallback(() => {
    return items.reduce((total, item) => {
      return total + item.price * (item.quantity || 1);
    }, 0);
  }, [items]);

  const getItemCount = useCallback(() => {
    return items.reduce((count, item) => count + (item.quantity || 1), 0);
  }, [items]);

  const checkout = useCallback(
    async (checkoutData: Omit<CheckoutData, 'items'>): Promise<CheckoutResponse> => {
      if (!isMountedRef.current) return Promise.reject(new Error('Component unmounted'));

      setIsLoading(true);
      setError(null);

      try {
        const formattedItems = items.map((item) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          price: item.price,
          type: item.type.toUpperCase() as string,
        }));

        const response = await api.post<CheckoutResponse>('/checkout', {
          items: formattedItems,
          customer: checkoutData.customer,
          paymentMethod: checkoutData.paymentMethod,
        });

        if (isMountedRef.current) {
          clearCart();
        }
        return response.data;
      } catch (error: unknown) {
        if (isMountedRef.current) {
          setError(getErrorMessage(error, 'Erro ao processar pagamento'));
        }
        throw error;
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    },
    [items, clearCart]
  );

  const validateCart = useCallback(async () => {
    if (items.length === 0) return true;

    try {
      const productIds = items.map((item) => item.id);
      const response = await api.post('/products/validate', { ids: productIds });
      const unavailable = response.data.unavailable || [];

      if (unavailable.length > 0) {
        if (isMountedRef.current) {
          const updatedItems = items.filter((item) => !unavailable.includes(item.id));
          saveCart(updatedItems);
        }
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao validar carrinho:', error);
      return true;
    }
  }, [items, saveCart]);

  return {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getTotal,
    getItemCount,
    checkout,
    validateCart,
    isLoading,
    error,
  };
};
