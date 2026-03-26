import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Clock, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

interface ConfirmationPageProps {
  onBack: () => void;
}

const ConfirmationPage: React.FC<ConfirmationPageProps> = ({ onBack }) => {
  const [status, setStatus] = useState<string | null>(null);
  const [itemId, setItemId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setStatus(params.get('status'));
    setItemId(params.get('itemId') || params.get('jobId'));
  }, []);

  const renderStatus = () => {
    switch (status) {
      case 'success':
        return (
          <div className="text-center">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Pago Exitoso!</h1>
            <p className="text-gray-600 mb-6">Tu pedido ha sido confirmado. El trabajador ha sido notificado.</p>
          </div>
        );
      case 'failure':
        return (
          <div className="text-center">
            <XCircle className="w-20 h-20 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Pago Fallido</h1>
            <p className="text-gray-600 mb-6">Hubo un problema al procesar tu pago. Por favor, intenta de nuevo.</p>
          </div>
        );
      case 'pending':
        return (
          <div className="text-center">
            <Clock className="w-20 h-20 text-yellow-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Pago Pendiente</h1>
            <p className="text-gray-600 mb-6">Tu pago está siendo procesado. Te notificaremos cuando se complete.</p>
          </div>
        );
      default:
        return (
          <div className="text-center">
            <Clock className="w-20 h-20 text-blue-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Verificando Estado</h1>
            <p className="text-gray-600 mb-6">Estamos verificando el estado de tu transacción...</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full"
      >
        {renderStatus()}
        
        <button
          onClick={onBack}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Inicio
        </button>
      </motion.div>
    </div>
  );
};

export default ConfirmationPage;
