

import React from 'react';

interface TermsModalProps {
  content: string;
  onClose: () => void;
  t: (key: string) => string;
}

const TermsModal: React.FC<TermsModalProps> = ({ content, onClose, t }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="terms-modal-title">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl flex flex-col" style={{maxHeight: '90vh'}}>
        <div className="p-6 border-b flex-shrink-0">
          <h2 id="terms-modal-title" className="text-2xl font-bold text-black">{t('terms and services')}</h2>
        </div>
        
        <div className="p-6 overflow-y-auto flex-grow">
          <pre className="whitespace-pre-wrap text-sm text-black font-sans">{content}</pre>
        </div>

        <div className="p-4 bg-slate-50 border-t flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="bg-purple-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-purple-700 transition"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsModal;