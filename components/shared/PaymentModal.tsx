import React, { useState } from 'react';
import { Invoice } from '../../types';
import { formatCurrency } from '../../constants';
import { CreditCard, QrCode, Wallet, Check, ChevronRight, X } from 'lucide-react';

interface PaymentModalProps {
  invoice: Invoice;
  onClose: () => void;
  onConfirm: () => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
}

type PaymentMethod = 'visa' | 'mastercard' | 'stripe' | 'mercadopago' | 'qr_bob';

interface PaymentOption {
  id: PaymentMethod;
  name: string;
  icon: React.ReactNode;
  description?: string;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ invoice, onClose, onConfirm, t }) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(
    invoice.currency === 'ARS' ? 'mercadopago' : (invoice.currency === 'BOB' ? 'qr_bob' : 'visa')
  );
  const [loading, setLoading] = useState(false);

  const paymentOptions: PaymentOption[] = [
    { 
      id: 'visa', 
      name: 'Visa', 
      icon: <CreditCard className="w-6 h-6 text-blue-600" />,
      description: 'Paga con tu tarjeta Visa'
    },
    { 
      id: 'mastercard', 
      name: 'Mastercard', 
      icon: <CreditCard className="w-6 h-6 text-red-500" />,
      description: 'Paga con tu tarjeta Mastercard'
    },
    { 
      id: 'stripe', 
      name: 'Stripe', 
      icon: <Wallet className="w-6 h-6 text-indigo-500" />,
      description: 'Pago seguro vía Stripe'
    },
    { 
      id: 'mercadopago', 
      name: 'Mercado Pago', 
      icon: <div className="w-6 h-6 bg-[#009EE3] rounded-full flex items-center justify-center text-[10px] text-white font-bold">MP</div>,
      description: 'Paga con tu cuenta de Mercado Pago'
    },
    { 
      id: 'qr_bob', 
      name: 'QR en Bolivianos', 
      icon: <QrCode className="w-6 h-6 text-green-600" />,
      description: 'Escanea el código QR'
    },
  ];

  const handleMercadoPagoPayment = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          itemId: invoice.id, 
          price: invoice.total, 
          title: `Pago de Servicio TUFIX - #${invoice.id.slice(-6)}` 
        }),
      });
      
      if (!response.ok) throw new Error('Failed to create payment preference');
      const { init_point } = await response.json();

      if (init_point) {
        window.location.href = init_point;
      } else {
        throw new Error('No payment URL returned');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Error al iniciar el pago con Mercado Pago. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtherPayment = (method: PaymentMethod) => {
    console.log(`Handling payment for method: ${method}`);
    // Placeholder for future SDK integrations (Stripe, PayPal, etc.)
    if (method === 'qr_bob') {
      onConfirm(); // Existing QR logic
    } else {
      alert(`El método ${method} estará disponible próximamente. Por ahora, usa Mercado Pago o QR.`);
    }
  };

  const handleContinue = () => {
    if (selectedMethod === 'mercadopago') {
      handleMercadoPagoPayment();
    } else {
      handleOtherPayment(selectedMethod);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true">
      <div className="bg-white w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Método de Pago</h2>
            <p className="text-sm text-gray-500 mt-1">
              Total a pagar: <span className="font-bold text-purple-600">{formatCurrency(invoice.total, invoice.currency)}</span>
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-gray-50 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Payment Options List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {paymentOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => setSelectedMethod(option.id)}
              className={`w-full flex items-center p-4 rounded-2xl border-2 transition-all duration-200 text-left group ${
                selectedMethod === option.id
                  ? 'border-purple-600 bg-purple-50/50 ring-1 ring-purple-600'
                  : 'border-gray-100 hover:border-gray-200 bg-white'
              }`}
            >
              <div className={`p-3 rounded-xl mr-4 transition-colors ${
                selectedMethod === option.id ? 'bg-white shadow-sm' : 'bg-gray-50'
              }`}>
                {option.icon}
              </div>
              
              <div className="flex-1">
                <h3 className={`font-bold transition-colors ${
                  selectedMethod === option.id ? 'text-purple-900' : 'text-gray-900'
                }`}>
                  {option.name}
                </h3>
                {option.description && (
                  <p className="text-xs text-gray-500 mt-0.5">{option.description}</p>
                )}
              </div>

              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                selectedMethod === option.id
                  ? 'border-purple-600 bg-purple-600'
                  : 'border-gray-200'
              }`}>
                {selectedMethod === option.id && <Check className="w-4 h-4 text-white" />}
              </div>
            </button>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-gray-50 border-t border-gray-100 space-y-3">
          <button
            onClick={handleContinue}
            disabled={loading}
            className="w-full bg-purple-600 text-white font-bold py-4 px-6 rounded-2xl hover:bg-purple-700 disabled:opacity-50 transition-all shadow-lg shadow-purple-200 active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Continuar</span>
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
          
          <button
            onClick={onClose}
            className="w-full py-4 px-6 text-gray-500 font-semibold hover:text-gray-700 transition-colors"
          >
            Volver
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;