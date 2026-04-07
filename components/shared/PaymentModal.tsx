import React, { useState } from 'react';
import { Invoice } from '../../types';
import { formatCurrency } from '../../constants';
import { QrCode, Check, ChevronRight, X, CreditCard } from 'lucide-react';
import LocationSelector from './LocationSelector';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase';

interface PaymentModalProps {
  invoice: Invoice;
  job?: any;
  onClose: () => void;
  onConfirm: () => void;
  onUpdateLocation?: (location: string, coordinates: { lat: number, lng: number }) => Promise<void>;
  t: (key: string, replacements?: Record<string, string | number>) => string;
}

type PaymentMethod = 'visa' | 'mastercard' | 'stripe' | 'mercadopago' | 'qr_bob';

interface PaymentOption {
  id: PaymentMethod;
  name: string;
  icon: React.ReactNode;
  description?: string;
}

// Inline logos — always render, no external URL needed
const MPLogo = ({ size = 40 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="40" cy="40" r="40" fill="#009EE3"/>
    <text x="40" y="52" textAnchor="middle" fontSize="32" fontWeight="bold" fill="white" fontFamily="Arial, sans-serif">MP</text>
  </svg>
);

const StripeLogo = ({ size = 40 }: { size?: number }) => (
  <svg width={size} height={size * 0.4} viewBox="0 0 80 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <text x="0" y="28" fontSize="30" fontWeight="bold" fill="#635BFF" fontFamily="Arial, sans-serif">stripe</text>
  </svg>
);

const VisaLogo = () => (
  <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa"
    className="w-10 h-auto max-h-full object-contain"
    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
);

const MastercardLogo = () => (
  <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard"
    className="w-10 h-auto max-h-full object-contain"
    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
);

const PaymentModal: React.FC<PaymentModalProps> = ({ invoice, job, onClose, onConfirm, onUpdateLocation, t }) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(
    invoice.currency === 'ARS' ? 'mercadopago' : 
    invoice.currency === 'BOB' ? 'qr_bob' : 
    'stripe' // Default to Stripe for USD and others
  );
  const [loading, setLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ address: string; lat: number; lng: number } | null>(
    job?.location && job?.coordinates ? { address: job.location, lat: job.coordinates.lat, lng: job.coordinates.lng } : null
  );

  const isCardMethod = selectedMethod === 'stripe' || selectedMethod === 'visa' || selectedMethod === 'mastercard';

  const paymentOptions: PaymentOption[] = [
    { 
      id: 'stripe', name: 'Tarjeta de Crédito / Débito',
      icon: (
        <div className="flex items-center gap-1">
          <CreditCard className="w-5 h-5 text-[#635BFF]" />
        </div>
      ),
      description: 'Visa, Mastercard, débito — pago seguro con Stripe'
    },
    { 
      id: 'visa', name: 'Visa',
      icon: <VisaLogo />,
      description: 'Paga con tu tarjeta Visa'
    },
    { 
      id: 'mastercard', name: 'Mastercard',
      icon: <MastercardLogo />,
      description: 'Paga con tu tarjeta Mastercard'
    },
    { 
      id: 'mercadopago', name: 'Mercado Pago',
      icon: <MPLogo size={40} />,
      description: 'Paga con tu cuenta de Mercado Pago'
    },
    { 
      id: 'qr_bob', name: 'QR en Bolivianos',
      icon: <QrCode className="w-6 h-6 text-green-600" />,
      description: 'Escanea el código QR'
    },
  ];

  // ─── Stripe Card Payment ────────────────────────────────────────────────────
  const handleStripePayment = async () => {
    try {
      const response = await fetch('/api/stripe/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: invoice.total,
          currency: invoice.currency || 'usd',
          invoiceId: invoice.id,
          jobId: invoice.jobId,
          workerId: invoice.workerId,
          description: `Pago de Servicio TUFIX - #${invoice.id.slice(-6)}`,
          customerEmail: auth.currentUser?.email || '',
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Failed to create Stripe session');
      if (!data.url) throw new Error('No Stripe URL returned');

      // Redirect to Stripe's hosted checkout page
      window.location.href = data.url;

    } catch (error: any) {
      console.error('Stripe error:', error);
      alert(`Error al iniciar el pago con tarjeta: ${error.message}`);
      setLoading(false);
    }
  };

  // ─── MercadoPago Payment ────────────────────────────────────────────────────
  const handleMercadoPagoPayment = async () => {
    try {
      const response = await fetch('/api/mercadopago/create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          items: [{ title: `Pago TUFIX #${invoice.id.slice(-6)}`, unit_price: invoice.total, quantity: 1, currency_id: invoice.currency || 'ARS' }],
          payer: { email: auth.currentUser?.email || 'test@test.com' },
          external_reference: invoice.jobId,
          workerId: invoice.workerId
        }),
      });

      const responseText = await response.text();
      let responseData;
      try { responseData = JSON.parse(responseText); }
      catch (e) { throw new Error(`Server returned invalid JSON: ${responseText.substring(0, 100)}`); }

      if (!response.ok) throw new Error(responseData.error || 'Failed to create payment preference');

      const { init_point, mobile_init_point } = responseData;
      if (!init_point) throw new Error('No payment URL returned');

      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile && mobile_init_point) {
        const deepLink = mobile_init_point.replace('https://', 'mercadopago://');
        const appOpenTimeout = setTimeout(() => { window.location.href = mobile_init_point; }, 2000);
        window.location.href = deepLink;
        window.addEventListener('blur', () => clearTimeout(appOpenTimeout), { once: true });
      } else {
        window.location.href = init_point;
      }
    } catch (error: any) {
      console.error('MP error:', error);
      alert(`Error al iniciar el pago con Mercado Pago: ${error.message}`);
      setLoading(false);
    }
  };

  const handleOtherPayment = (method: PaymentMethod) => {
    if (method === 'qr_bob') { onConfirm(); }
    else { alert(`Error inesperado con método ${method}.`); setLoading(false); }
  };

  const handleContinue = async () => {
    setLoading(true);
    try {
      // Save location if provided
      if (selectedLocation) {
        if (onUpdateLocation) {
          await onUpdateLocation(selectedLocation.address, { lat: selectedLocation.lat, lng: selectedLocation.lng });
        } else {
          const jobRef = doc(db, 'jobRequests', invoice.jobId);
          await updateDoc(jobRef, { location: selectedLocation.address, coordinates: { lat: selectedLocation.lat, lng: selectedLocation.lng } });
        }
      }

      // Route to correct payment handler
      if (isCardMethod) {
        await handleStripePayment();
      } else if (selectedMethod === 'mercadopago') {
        await handleMercadoPagoPayment();
      } else {
        handleOtherPayment(selectedMethod);
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Error al procesar. Intenta de nuevo.');
      setLoading(false);
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
          <button onClick={onClose} className="p-2 bg-gray-50 rounded-full text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <LocationSelector selectedLocation={selectedLocation} setSelectedLocation={setSelectedLocation} />

          {/* Stripe info banner when card is selected */}
          {isCardMethod && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 flex items-center gap-3">
              <div className="text-2xl">🔒</div>
              <div>
                <p className="text-xs font-bold text-indigo-800">Pago seguro con Stripe</p>
                <p className="text-xs text-indigo-600">Serás redirigido a la página de pago de Stripe. Tus datos de tarjeta son procesados directamente por Stripe — TUFIX nunca los ve.</p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-700">Selecciona un método</h3>
            {paymentOptions.map((option) => (
              <button key={option.id} onClick={() => setSelectedMethod(option.id)}
                className={`w-full flex items-center p-4 rounded-2xl border-2 transition-all duration-200 text-left ${
                  selectedMethod === option.id ? 'border-purple-600 bg-purple-50 ring-1 ring-purple-600/10' : 'border-gray-100 hover:border-gray-200 bg-white'}`}>
                <div className={`w-14 h-10 rounded-xl flex items-center justify-center transition-colors ${selectedMethod === option.id ? 'bg-white shadow-sm' : 'bg-gray-50'}`}>
                  {option.icon}
                </div>
                <div className="flex-1 ml-4">
                  <h3 className={`text-sm font-bold transition-colors ${selectedMethod === option.id ? 'text-purple-900' : 'text-gray-900'}`}>{option.name}</h3>
                  {option.description && <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">{option.description}</p>}
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedMethod === option.id ? 'border-purple-600 bg-purple-600' : 'border-gray-200'}`}>
                  {selectedMethod === option.id && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-white border-t border-gray-100 space-y-3">
          <button onClick={handleContinue} disabled={loading}
            className="w-full bg-purple-600 text-white font-bold py-4 px-6 rounded-2xl hover:bg-purple-700 disabled:opacity-50 transition-all shadow-lg shadow-purple-200 active:scale-[0.98] flex items-center justify-center gap-2">
            {loading ? (
              <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span className="text-base">
                  {isCardMethod ? '🔒 Pagar con Tarjeta' : 'Pagar Factura'}
                </span>
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
          <button onClick={onClose} className="w-full py-2 px-6 text-gray-400 text-sm font-medium hover:text-gray-600 transition-colors">
            Volver
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;