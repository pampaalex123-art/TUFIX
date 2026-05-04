import React, { useEffect, useState } from 'react';

interface ApprovalPopupProps {
  onStart: () => void;
  t: (key: string) => string;
}

const ApprovalPopup: React.FC<ApprovalPopupProps> = ({ onStart }) => {
  const [countdown, setCountdown] = useState(6);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onStart();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [onStart]);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center space-y-5">
        <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
          <span className="text-4xl">✅</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900">¡Fuiste aprobado! 🎉</h2>
        <p className="text-slate-500 text-sm">Ya podés comenzar a buscar tu ayuda. ¡Bienvenido a TUFIX!</p>
        <button
          onClick={onStart}
          className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold py-3 px-6 rounded-xl hover:opacity-90 transition"
        >
          Comenzar a buscar
        </button>
        <p className="text-xs text-slate-400">Cerrando automáticamente en {countdown}s...</p>
      </div>
    </div>
  );
};

export default ApprovalPopup;