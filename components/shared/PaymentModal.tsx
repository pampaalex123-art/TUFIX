import React, { useState } from 'react';
import { Invoice } from '../../types';
import { formatCurrency } from '../../constants';

interface PaymentModalProps {
  invoice: Invoice;
  onClose: () => void;
  onConfirm: () => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ invoice, onClose, onConfirm, t }) => {
  const [cardDetails, setCardDetails] = useState({ number: '', expiry: '', cvc: '', name: '' });
  const [error, setError] = useState('');

  const isBOB = invoice.currency === 'BOB';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isBOB) {
        onConfirm();
        return;
    }

    setError('');
    const { number, expiry, cvc, name } = cardDetails;
    if (!number.trim() || !expiry.trim() || !cvc.trim() || !name.trim()) {
      setError('Please fill in all card details.');
      return;
    }
    // Basic validation simulation
    if (number.replace(/\s/g, '').length !== 16) {
        setError('Please enter a valid 16-digit card number.');
        return;
    }
    if (!/^\d{2}\/\d{2}$/.test(expiry)) {
        setError('Please use MM/YY format for expiry date.');
        return;
    }
     if (cvc.length < 3 || cvc.length > 4) {
        setError('Please enter a valid CVC.');
        return;
    }
    onConfirm();
  };
  
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    value = value.substring(0, 16);
    const formattedValue = value.replace(/(\d{4})/g, '$1 ').trim();
    setCardDetails(prev => ({ ...prev, number: formattedValue }));
  };

  const qrData = encodeURIComponent(JSON.stringify({
    jobId: invoice.jobId,
    invoiceId: invoice.id,
    amount: invoice.total,
    currency: invoice.currency,
    recipient: "TUFIX Escrow"
  }));
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${qrData}`;
  const inputStyles = "mt-1 block w-full p-2 border border-slate-300 rounded-md shadow-sm sm:text-sm bg-white text-black";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="payment-modal-title">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative">
        <button type="button" onClick={onClose} className="absolute top-3 right-3 p-1 rounded-full text-black hover:bg-slate-200">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <h2 id="payment-modal-title" className="text-2xl font-bold text-black mb-2">{isBOB ? t('scan qr to pay') : 'Secure Payment'}</h2>
        <p className="text-black mb-6">You are paying a total of <span className="font-bold text-purple-600">{formatCurrency(invoice.total, invoice.currency)}</span>.</p>
        
        {isBOB ? (
            <div className="text-center">
                <img src={qrCodeUrl} alt="QR Code for Payment" className="mx-auto border-4 border-slate-200 rounded-lg" />
                <p className="text-sm text-black mt-4">{t('scan qr instruction', { amount: formatCurrency(invoice.total, invoice.currency) })}</p>
            </div>
        ) : (
            <div className="space-y-4">
                <div>
                    <label htmlFor="card-name" className="block text-sm font-medium text-black">Name on Card</label>
                    <input type="text" id="card-name" value={cardDetails.name} onChange={e => setCardDetails(p => ({...p, name: e.target.value}))} className={inputStyles} />
                </div>
                 <div>
                    <label htmlFor="card-number" className="block text-sm font-medium text-black">Card Number</label>
                    <input type="text" id="card-number" value={cardDetails.number} onChange={handleCardNumberChange} placeholder="0000 0000 0000 0000" className={inputStyles} />
                </div>
                <div className="flex space-x-4">
                    <div className="flex-1">
                        <label htmlFor="card-expiry" className="block text-sm font-medium text-black">Expiry Date</label>
                        <input type="text" id="card-expiry" value={cardDetails.expiry} onChange={e => setCardDetails(p => ({...p, expiry: e.target.value}))} placeholder="MM/YY" className={inputStyles} />
                    </div>
                    <div className="flex-1">
                        <label htmlFor="card-cvc" className="block text-sm font-medium text-black">CVC</label>
                        <input type="text" id="card-cvc" value={cardDetails.cvc} onChange={e => setCardDetails(p => ({...p, cvc: e.target.value.replace(/\D/g, '').substring(0, 4)}))} placeholder="123" className={inputStyles} />
                    </div>
                </div>
            </div>
        )}

        {error && <p className="text-sm text-red-500 mt-4 text-center">{error}</p>}
        
        <div className="mt-6">
            <button type="submit" className="w-full bg-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-purple-700 transition flex items-center justify-center space-x-2">
                {isBOB ? (
                    <span>{t('confirm payment transfer')}</span>
                ) : (
                    <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                    <span>Pay {formatCurrency(invoice.total, invoice.currency)}</span>
                    </>
                )}
            </button>
        </div>
      </form>
    </div>
  );
};

export default PaymentModal;