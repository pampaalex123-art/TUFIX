

import React from 'react';
import { Invoice } from '../../types';

interface ReceiptModalProps {
  invoice: Invoice;
  clientName: string;
  workerName: string;
  onClose: () => void;
}

const ReceiptModal: React.FC<ReceiptModalProps> = ({ invoice, clientName, workerName, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="receipt-modal-title">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative">
        <button onClick={onClose} className="absolute top-3 right-3 p-1 rounded-full text-black hover:bg-slate-200">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <div className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center bg-green-100 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h2 id="receipt-modal-title" className="text-2xl font-bold text-black">Payment Successful</h2>
            <p className="text-black mt-1">A receipt for your transaction</p>
        </div>

        <div className="mt-6 border-t border-b divide-y">
            <div className="py-3 flex justify-between text-sm">
                <span className="text-black">Paid by:</span>
                <span className="font-medium text-black">{clientName}</span>
            </div>
             <div className="py-3 flex justify-between text-sm">
                <span className="text-black">Paid to:</span>
                <span className="font-medium text-black">{workerName}</span>
            </div>
            <div className="py-3 flex justify-between text-sm">
                <span className="text-black">Date Paid:</span>
                <span className="font-medium text-black">{invoice.paidAt ? new Date(invoice.paidAt).toLocaleString() : 'N/A'}</span>
            </div>
            <div className="py-3 flex justify-between text-sm">
                <span className="text-black">Transaction ID:</span>
                <span className="font-mono text-xs text-black">{invoice.transactionId}</span>
            </div>
        </div>

        <div className="mt-4">
            <h3 className="font-semibold mb-2 text-black">Summary:</h3>
            <div className="space-y-1 text-sm border-b pb-2">
                {invoice.items.map((item, index) => (
                    <div key={index} className="flex justify-between">
                        <span className="text-black">{item.description}</span>
                        <span className="text-black">${item.amount.toFixed(2)}</span>
                    </div>
                ))}
            </div>
             <div className="mt-2 pt-2 border-t space-y-1 text-sm">
                <div className="flex justify-between">
                    <span className="text-black">Subtotal</span>
                    <span className="text-black">${invoice.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-black">Platform Fee (10%)</span>
                    <span className="text-black">${invoice.platformFee.toFixed(2)}</span>
                </div>
            </div>
            <div className="mt-2 flex justify-between items-center font-bold">
                 <span className="text-black">Total Paid</span>
                 <span className="text-xl text-green-600">${invoice.total.toFixed(2)}</span>
            </div>
        </div>

        <div className="mt-6">
          <button onClick={onClose} className="w-full bg-purple-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-purple-700 transition">Close</button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;