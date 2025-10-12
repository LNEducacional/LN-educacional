import { toast } from 'sonner';

export const showToast = {
  success: (message: string) => {
    toast.success(message, {
      duration: 4000,
    });
  },

  error: (message: string) => {
    toast.error(message, {
      duration: 5000,
    });
  },

  loading: (message: string) => {
    return toast.loading(message);
  },

  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((err: unknown) => string);
    }
  ) => {
    return toast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
    });
  },

  custom: (message: string, icon?: string) => {
    toast(message, {
      duration: 4000,
    });
  },

  dismiss: (toastId?: string) => {
    if (toastId) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss();
    }
  },
};

// Error handler with toast
export const handleError = (error: unknown, fallbackMessage = 'Ocorreu um erro') => {
  const message = error?.response?.data?.message || error?.message || fallbackMessage;
  showToast.error(message);
  console.error('Error:', error);
};

// Success handler with toast
export const handleSuccess = (message: string) => {
  showToast.success(message);
};

// API response handler
export const handleApiResponse = async <T>(
  apiCall: Promise<T>,
  options?: {
    loadingMessage?: string;
    successMessage?: string | ((data: T) => string);
    errorMessage?: string;
    showLoading?: boolean;
  }
): Promise<T | null> => {
  const {
    loadingMessage = 'Processando...',
    successMessage = 'Operação realizada com sucesso!',
    errorMessage = 'Erro ao processar solicitação',
    showLoading = true,
  } = options || {};

  if (showLoading) {
    const loadingToast = showToast.loading(loadingMessage);

    try {
      const result = await apiCall;
      toast.dismiss(loadingToast);

      const message =
        typeof successMessage === 'function' ? successMessage(result) : successMessage;

      showToast.success(message);
      return result;
    } catch (error: unknown) {
      toast.dismiss(loadingToast);
      handleError(error, errorMessage);
      return null;
    }
  } else {
    try {
      const result = await apiCall;

      const message =
        typeof successMessage === 'function' ? successMessage(result) : successMessage;

      showToast.success(message);
      return result;
    } catch (error: unknown) {
      handleError(error, errorMessage);
      return null;
    }
  }
};

// Form validation toast
export const showValidationErrors = (errors: Record<string, unknown>) => {
  const errorMessages = Object.values(errors)
    .filter(Boolean)
    .map((error) => {
      if (typeof error === 'object' && error.message) {
        return error.message;
      }
      return String(error);
    });

  if (errorMessages.length > 0) {
    for (const message of errorMessages) {
      showToast.error(message);
    }
  }
};

// Network status toasts
export const showNetworkStatus = () => {
  window.addEventListener('online', () => {
    showToast.success('Conexão reestabelecida');
  });

  window.addEventListener('offline', () => {
    showToast.error('Sem conexão com a internet');
  });
};

// Copy to clipboard with toast
export const copyToClipboard = async (
  text: string,
  successMessage = 'Copiado para a área de transferência'
) => {
  try {
    await navigator.clipboard.writeText(text);
    showToast.success(successMessage);
    return true;
  } catch (_error) {
    showToast.error('Erro ao copiar');
    return false;
  }
};

// File upload progress toast
export const showUploadProgress = (progress: number, fileName: string) => {
  const message = `Enviando ${fileName}: ${progress}%`;

  if (progress < 100) {
    return toast.loading(message);
  }
  showToast.success(`${fileName} enviado com sucesso!`);
};
