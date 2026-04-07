import React, { useState } from 'react';
import { Invoice } from '../../types';
import { formatCurrency } from '../../constants';
import { QrCode, Check, ChevronRight, X, CreditCard, MapPin } from 'lucide-react';
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

const MPLogo = ({ size = 40 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="40" cy="40" r="40" fill="#009EE3"/>
    <text x="40" y="52" textAnchor="middle" fontSize="32" fontWeight="bold" fill="white" fontFamily="Arial, sans-serif">MP</text>
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
    'stripe'
  );
  const [loading, setLoading] = useState(false);
  const [locationText, setLocationText] = useState(job?.location || '');

  const isCardMethod = selectedMethod === 'stripe' || selectedMethod === 'visa' || selectedMethod === 'mastercard';

  const paymentOptions = [
    {
      id: 'stripe' as PaymentMethod, name: 'Tarjeta de Crédito / Débito',
      icon: <CreditCard className="w-6 h-6 text-[#635BFF]" />,
      description: 'Visa, Mastercard, débito — pago seguro con Stripe'
    },
    {
      id: 'visa' as PaymentMethod, name: 'Visa',
      icon: <VisaLogo />,
      description: 'Paga con tu tarjeta Visa'
    },
    {
      id: 'mastercard' as PaymentMethod, name: 'Mastercard',
      icon: <MastercardLogo />,
      description: 'Paga con tu tarjeta Mastercard'
    },
    {
      id: 'mercadopago' as PaymentMethod, name: 'Mercado Pago',
      icon: <MPLogo size={40} />,
      description: 'Visa, Mastercard, Ualá, HSBC, ICBC y más — en ARS'
    },
    {
      id: 'qr_bob' as PaymentMethod, name: 'QR en Bolivianos',
      icon: <QrCode className="w-6 h-6 text-green-600" />,
      description: 'Yape, Tigo Money, $imple, todos los bancos bolivianos'
    },
  ];

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
      window.location.href = data.url;
    } catch (error: any) {
      alert(`Error al iniciar el pago con tarjeta: ${error.message}`);
      setLoading(false);
    }
  };

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
      alert(`Error al iniciar el pago con Mercado Pago: ${error.message}`);
      setLoading(false);
    }
  };

  const handleContinue = async () => {
    setLoading(true);
    try {
      // Save location as plain text if provided
      if (locationText.trim()) {
        if (onUpdateLocation) {
          await onUpdateLocation(locationText, { lat: 0, lng: 0 });
        } else if (invoice.jobId) {
          const jobRef = doc(db, 'jobRequests', invoice.jobId);
          await updateDoc(jobRef, { location: locationText });
        }
      }

      if (isCardMethod) {
        await handleStripePayment();
      } else if (selectedMethod === 'mercadopago') {
        await handleMercadoPagoPayment();
      } else if (selectedMethod === 'qr_bob') {
        onConfirm();
      }
    } catch (error) {
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
          <button onClick={onClose} className="p-2 bg-gray-50 rounded-full text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* Location — simple text field, no map */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">📍 Ubicación del trabajo</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={locationText}
                onChange={(e) => setLocationText(e.target.value)}
                placeholder="Ej: Av. Corrientes 1234, Buenos Aires"
                className="w-full pl-9 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">Dirección donde se realizará el trabajo</p>
          </div>

          {/* Stripe info banner */}
          {isCardMethod && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 flex items-center gap-3">
              <div className="text-xl">🔒</div>
              <p className="text-xs text-indigo-700">Serás redirigido a la página segura de Stripe. TUFIX nunca ve los datos de tu tarjeta.</p>
            </div>
          )}

          {/* MercadoPago card note */}
          {selectedMethod === 'mercadopago' && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
              <p className="text-xs text-blue-700">💳 Dentro de MercadoPago puedes pagar con cualquier tarjeta: Ualá, HSBC, ICBC, Galicia, Naranja X y más — en pesos argentinos.</p>
            </div>
          )}

          {/* Payment options */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-gray-700">Selecciona un método</h3>
            {paymentOptions.map((option) => (
              <button key={option.id} onClick={() => setSelectedMethod(option.id)}
                className={`w-full flex items-center p-4 rounded-2xl border-2 transition-all duration-200 text-left ${
                  selectedMethod === option.id ? 'border-purple-600 bg-purple-50' : 'border-gray-100 hover:border-gray-200 bg-white'}`}>
                <div className={`w-14 h-10 rounded-xl flex items-center justify-center ${selectedMethod === option.id ? 'bg-white shadow-sm' : 'bg-gray-50'}`}>
                  {option.icon}
                </div>
                <div className="flex-1 ml-4">
                  <p className={`text-sm font-bold ${selectedMethod === option.id ? 'text-purple-900' : 'text-gray-900'}`}>{option.name}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{option.description}</p>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedMethod === option.id ? 'border-purple-600 bg-purple-600' : 'border-gray-200'}`}>
                  {selectedMethod === option.id && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 space-y-3">
          <button onClick={handleContinue} disabled={loading}
            className="w-full bg-purple-600 text-white font-bold py-4 rounded-2xl hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-purple-200">
            {loading
              ? <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
              : <><span>{isCardMethod ? '🔒 Pagar con Tarjeta' : 'Pagar Factura'}</span><ChevronRight className="w-5 h-5" /></>
            }
          </button>
          <button onClick={onClose} className="w-full py-2 text-gray-400 text-sm font-medium hover:text-gray-600">Volver</button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;