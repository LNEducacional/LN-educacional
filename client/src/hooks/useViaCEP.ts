import { useState, useCallback, useEffect, useRef } from 'react';

interface AddressData {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  erro?: boolean;
}

export function useViaCEP() {
  const isMountedRef = useRef(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchAddress = useCallback(async (cep: string): Promise<AddressData | null> => {
    const cleanCep = cep.replace(/\D/g, '');

    if (cleanCep.length !== 8) {
      if (isMountedRef.current) {
        setError('CEP deve ter 8 dígitos');
      }
      return null;
    }

    if (isMountedRef.current) {
      setLoading(true);
      setError(null);
    }

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data: AddressData = await response.json();

      if (data.erro) {
        if (isMountedRef.current) {
          setError('CEP não encontrado');
        }
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      if (isMountedRef.current) {
        setError('Erro ao buscar CEP. Tente novamente.');
      }
      return null;
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const formatCep = useCallback((value: string) => {
    const cleanValue = value.replace(/\D/g, '');
    return cleanValue.replace(/(\d{5})(\d{3})/, '$1-$2');
  }, []);

  const clearError = useCallback(() => {
    if (isMountedRef.current) {
      setError(null);
    }
  }, []);

  return {
    fetchAddress,
    formatCep,
    loading,
    error,
    clearError,
  };
}