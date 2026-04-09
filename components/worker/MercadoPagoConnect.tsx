import React, { useState, useEffect } from 'react';
import { Worker } from '../../types';
import { useToast } from '../common/Toast';

interface MercadoPagoConnectProps {
  worker: Worker;
}

// Inline MP logo — always renders, no external URL
const MPLogo = ({ size = 32 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="40" cy="40" r="40" fill="#009EE3"/>
    <text x="40" y="52" textAnchor="middle" fontSize="32" fontWeight="bold" fill="white" fontFamily="Arial, sans-serif">MP</text>
  </svg>
);

const MercadoPagoConnect: React.FC<MercadoPagoConnectProps> = ({ worker }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const payoutDetails = (worker as any).payoutDetails?.mercadoPago;
    if (payoutDetails?.accessToken) setConnected(true);

    const params = new URLSearchParams(window.location.search);
    if (params.get('mp_success') === 'worker') {
      setConnected(true);
      window.history.replaceState({}, '', window.location.pathname);
    }
    if (params.get('mp_error')) {
      showToast('Error al conectar Mercado Pago. Por favor intenta de nuevo.', 'error');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [worker]);

  const handleConnect = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/mercadopago/auth-url?workerId=${worker.id}`);
      if (!response.ok) throw new Error('Failed to get auth URL');
      const { url } = await response.json();

      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        window.location.href = url;
      } else {
        const popup = window.open(url, 'mp_oauth', 'width=600,height=700');
        const poll = setInterval(() => {
          if (popup?.closed) {
            clearInterval(poll);
            setLoading(false);
            window.location.reload();
          }
        }, 500);
      }
    } catch (error) {
      console.error('OAuth error:', error);
      showToast('Error al conectar Mercado Pago.', 'error');
      setLoading(false);
    }
  };

  if (connected) {
    return (
      <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-2xl">
        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
          <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-green-800">Mercado Pago Conectado ✓</p>
          <p className="text-xs text-green-600">Recibirás el 90% de cada pago automáticamente</p>
        </div>
        <MPLogo size={32} />
      </div>
    );
  }

  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl space-y-3">
      <div className="flex items-center gap-3">
        <MPLogo size={40} />
        <div>
          <p className="text-sm font-bold text-blue-900">Conecta tu Mercado Pago</p>
          <p className="text-xs text-blue-600">Necesario para recibir pagos de tus trabajos</p>
        </div>
      </div>
      <ul className="text-xs text-blue-700 space-y-1 pl-1">
        <li>✓ Recibes el <strong>90%</strong> de cada pago automáticamente</li>
        <li>✓ Los fondos se liberan cuando ambas partes confirman</li>
        <li>✓ Conexión segura — TUFIX nunca ve tu contraseña</li>
      </ul>
      <button
        type="button"
        onClick={handleConnect}
        disabled={loading}
        className="w-full bg-[#009EE3] hover:bg-[#0088cc] disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2"
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <MPLogo size={20} />
            Conectar Mercado Pago
          </>
        )}
      </button>
    </div>
  );
};

export default MercadoPagoConnect;