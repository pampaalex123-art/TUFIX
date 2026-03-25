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
      icon: (
        <img 
          src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" 
          alt="Visa" 
          className="w-10 h-auto max-h-full object-contain" 
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "https://img.icons8.com/color/48/000000/visa.png";
          }}
        />
      ),
      description: 'Paga con tu tarjeta Visa'
    },
    { 
      id: 'mastercard', 
      name: 'Mastercard', 
      icon: (
        <img 
          src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" 
          alt="Mastercard" 
          className="w-10 h-auto max-h-full object-contain" 
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "https://img.icons8.com/color/48/000000/mastercard.png";
          }}
        />
      ),
      description: 'Paga con tu tarjeta Mastercard'
    },
    { 
      id: 'stripe', 
      name: 'Stripe', 
      icon: (
        <img 
          src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" 
          alt="Stripe" 
          className="w-10 h-auto max-h-full object-contain" 
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "https://img.icons8.com/color/48/000000/stripe.png";
          }}
        />
      ),
      description: 'Pago seguro vía Stripe'
    },
    { 
      id: 'mercadopago', 
      name: 'Mercado Pago', 
      icon: (
        <img 
          src="https://ais-pre-jlotlyayfwrmgg2tok4ehy-268659277257.us-east1.run.app/api/attachments/acef3cf3-6ef6-44a2-af30-033b89100744/image_33.png" 
          alt="Mercado Pago" 
          className="w-10 h-auto object-contain" 
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "https://img.icons8.com/color/48/000000/mercadopago.png";
          }}
        />
      ),
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
      <div className="bg-white w-full max-w-md rounded-t-[24px] sm:rounded-[24px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Método de Pago</h2>
            <p className="text-xs text-gray-500 mt-1">
              Total: <span className="font-bold text-purple-600">{formatCurrency(invoice.total, invoice.currency)}</span>
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-gray-50 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Payment Options List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {paymentOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => setSelectedMethod(option.id)}
              className={`w-full flex items-center p-4 rounded-2xl border-2 transition-all duration-200 text-left group ${
                selectedMethod === option.id
                  ? 'border-purple-600 bg-purple-50 ring-1 ring-purple-600/10'
                  : 'border-gray-100 hover:border-gray-200 bg-white'
              }`}
            >
              <div className={`w-14 h-10 rounded-xl flex items-center justify-center transition-colors ${
                selectedMethod === option.id ? 'bg-white shadow-sm' : 'bg-gray-50'
              }`}>
                {option.icon}
              </div>
              
              <div className="flex-1 ml-4">
                <h3 className={`text-sm font-bold transition-colors ${
                  selectedMethod === option.id ? 'text-purple-900' : 'text-gray-900'
                }`}>
                  {option.name}
                </h3>
                {option.description && (
                  <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">{option.description}</p>
                )}
              </div>

              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                selectedMethod === option.id
                  ? 'border-purple-600 bg-purple-600'
                  : 'border-gray-200'
              }`}>
                {selectedMethod === option.id && <Check className="w-3.5 h-3.5 text-white" />}
              </div>
            </button>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-white border-t border-gray-100 space-y-3">
          <button
            onClick={handleContinue}
            disabled={loading}
            className="w-full bg-purple-600 text-white font-bold py-4 px-6 rounded-2xl hover:bg-purple-700 disabled:opacity-50 transition-all shadow-lg shadow-purple-200 active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span className="text-base">Continuar</span>
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
          
          <button
            onClick={onClose}
            className="w-full py-2 px-6 text-gray-400 text-sm font-medium hover:text-gray-600 transition-colors"
          >
            Volver
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;