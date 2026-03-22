import React from 'react';
import { Invoice } from '../../types';
import { formatCurrency } from '../../constants';

interface ConfirmAndPayModalProps {
  invoice: Invoice;
  onClose: () => void;
  onConfirm: () => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
}

const ConfirmAndPayModal: React.FC<ConfirmAndPayModalProps> = ({ invoice, onClose, onConfirm, t }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative">
        <div className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center bg-yellow-100 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <h2 id="confirm-modal-title" className="text-2xl font-bold text-black">{t('confirm_release_title')}</h2>
            <p className="text-black mt-2">
                {t('confirm_release_body', { amount: formatCurrency(invoice.total, invoice.currency) })}
            </p>
        </div>
        <div className="mt-6 flex justify-center space-x-4">
          <button onClick={onClose} className="bg-slate-200 text-black font-bold py-2 px-6 rounded-lg hover:bg-slate-300 transition">{t('cancel')}</button>
          <button onClick={onConfirm} className="bg-green-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-700 transition">{t('confirm_release_action')}</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmAndPayModal;