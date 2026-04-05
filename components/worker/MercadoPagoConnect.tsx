import React, { useState, useEffect } from 'react';
import { Worker } from '../../types';

interface MercadoPagoConnectProps {
  worker: Worker;
}

const MercadoPagoConnect: React.FC<MercadoPagoConnectProps> = ({ worker }) => {
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Check if already connected
    const payoutDetails = (worker as any).payoutDetails?.mercadoPago;
    if (payoutDetails?.accessToken) {
      setConnected(true);
    }

    // Check URL params for success/error after OAuth redirect
    const params = new URLSearchParams(window.location.search);
    if (params.get('mp_success') === 'worker') {
      setConnected(true);
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    }
    if (params.get('mp_error')) {
      alert('Error al conectar Mercado Pago. Por favor intenta de nuevo.');
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
        // Poll for popup close
        const poll = setInterval(() => {
          if (popup?.closed) {
            clearInterval(poll);
            setLoading(false);
            // Check if connected after popup closes
            window.location.reload();
          }
        }, 500);
      }
    } catch (error) {
      console.error('OAuth error:', error);
      alert('Error al conectar Mercado Pago.');
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
        <img
          src="https://img.icons8.com/color/48/000000/mercadopago.png"
          alt="MP"
          className="w-8 h-8"
        />
      </div>
    );
  }

  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl space-y-3">
      <div className="flex items-center gap-3">
        <img
          src="https://img.icons8.com/color/48/000000/mercadopago.png"
          alt="Mercado Pago"
          className="w-10 h-10"
        />
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
        className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2"
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <img src="https://img.icons8.com/color/48/000000/mercadopago.png" alt="" className="w-5 h-5" />
            Conectar Mercado Pago
          </>
        )}
      </button>
    </div>
  );
};

export default MercadoPagoConnect;