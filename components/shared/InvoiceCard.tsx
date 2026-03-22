

import React from 'react';
import { Invoice, UserType } from '../../types';
import { formatCurrency } from '../../constants';

interface InvoiceCardProps {
  invoice: Invoice;
  userType: UserType;
  onPay: (invoice: Invoice) => void;
  onViewReceipt: (invoice: Invoice) => void;
  t: (key: string) => string;
}

const InvoiceCard: React.FC<InvoiceCardProps> = ({ invoice, userType, onPay, onViewReceipt, t }) => {

  const StatusBadge: React.FC = () => {
    switch(invoice.status) {
        case 'pending':
            return <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-800">{t('pending')}</span>;
        case 'held':
            return <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">{t('payment held')}</span>;
        case 'released':
            return (
                <span className="flex items-center text-xs font-medium px-2.5 py-1 rounded-full bg-green-100 text-green-800">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  {t('paid out')}
                </span>
            );
        case 'cancelled':
             return <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-200 text-gray-800">{t('cancelled')}</span>;
        default:
             return null;
    }
  };

  return (
    <div className="border border-slate-300 rounded-lg overflow-hidden my-2 bg-slate-50 text-black w-full max-w-sm">
      <div className="p-3 bg-slate-100 flex justify-between items-center">
        <h3 className="font-bold text-md text-black">{t('invoice')}</h3>
        <StatusBadge />
      </div>
      <div className="p-3">
        <div className="space-y-1 border-b pb-2 mb-2">
            {invoice.items.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                    <span className="text-black">{item.description}</span>
                    <span className="text-black">{formatCurrency(item.amount, invoice.currency)}</span>
                </div>
            ))}
        </div>
        <div className="space-y-1 text-sm pt-1">
            <div className="flex justify-between">
                <span className="text-black">{t('subtotal')}</span>
                <span className="text-black">{formatCurrency(invoice.subtotal, invoice.currency)}</span>
            </div>
             <div className="flex justify-between">
                <span className="text-black">{t('platform fee')}</span>
                <span className="text-black">{formatCurrency(invoice.platformFee, invoice.currency)}</span>
            </div>
        </div>
        <div className="flex justify-between items-center font-bold mt-2 pt-2 border-t">
            <span className="text-black">{t('total amount')}</span>
            <span className="text-xl text-black">{formatCurrency(invoice.total, invoice.currency)}</span>
        </div>
      </div>
       <div className="p-3 bg-slate-100">
            {invoice.status === 'released' ? (
                 <button onClick={() => onViewReceipt(invoice)} className="w-full bg-slate-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-slate-600 transition text-sm">{t('view receipt')}</button>
            ) : invoice.status === 'held' ? (
                 <p className="text-xs text-center text-black">{t('payment secured')}</p>
            ) : invoice.status === 'pending' ? (
                userType === 'user' ? (
                     <button onClick={() => onPay(invoice)} className="w-full bg-purple-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-purple-700 transition text-sm">{t('pay now')}</button>
                ) : (
                    <p className="text-xs text-center text-black">{t('waiting for payment')}</p>
                )
            ) : null }
       </div>
    </div>
  );
};

export default InvoiceCard;