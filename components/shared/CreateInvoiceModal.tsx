
import React, { useState } from 'react';
import { InvoiceLineItem } from '../../types';

interface CreateInvoiceModalProps {
  clientName: string;
  onClose: () => void;
  onSend: (items: InvoiceLineItem[]) => void;
}

const CreateInvoiceModal: React.FC<CreateInvoiceModalProps> = ({ clientName, onClose, onSend }) => {
  const [items, setItems] = useState<InvoiceLineItem[]>([{ description: '', amount: 0 }]);
  const [error, setError] = useState('');

  const handleItemChange = (index: number, field: keyof InvoiceLineItem, value: string) => {
    const newItems = [...items];
    if (field === 'amount') {
        newItems[index][field] = parseFloat(value) || 0;
    } else {
        newItems[index][field] = value;
    }
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { description: '', amount: 0 }]);
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const total = items.reduce((sum, item) => sum + item.amount, 0);

  const handleSubmit = () => {
    setError('');
    for (const item of items) {
        if (!item.description.trim() || item.amount <= 0) {
            setError('All items must have a description and a valid amount greater than zero.');
            return;
        }
    }
    if (items.length === 0) {
        setError('You must add at least one item to the invoice.');
        return;
    }
    onSend(items);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="invoice-modal-title">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg p-6 relative">
        <button onClick={onClose} className="absolute top-3 right-3 p-1 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <h2 id="invoice-modal-title" className="text-2xl font-bold text-gray-800 dark:text-white mb-1">Create Invoice</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">For: {clientName}</p>

        <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
            {items.map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                    <input
                        type="text"
                        placeholder="Item Description (e.g., Labor)"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        className="flex-grow p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm sm:text-sm bg-white dark:bg-gray-700 dark:text-white"
                    />
                    <input
                        type="number"
                        placeholder="Amount"
                        value={item.amount || ''}
                        onChange={(e) => handleItemChange(index, 'amount', e.target.value)}
                        className="w-28 p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm sm:text-sm bg-white dark:bg-gray-700 dark:text-white"
                        min="0"
                        step="0.01"
                    />
                    <button onClick={() => removeItem(index)} className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                </div>
            ))}
        </div>
        <button onClick={addItem} className="mt-3 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline">+ Add Line Item</button>
        
        <div className="mt-6 border-t dark:border-gray-700 pt-4 flex justify-between items-center">
            <span className="text-lg font-bold text-gray-800 dark:text-white">Total:</span>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">${total.toFixed(2)}</span>
        </div>

        {error && <p className="text-sm text-red-500 mt-4 text-center">{error}</p>}

        <div className="mt-6 flex justify-end space-x-3">
          <button onClick={onClose} className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-100 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition">Cancel</button>
          <button onClick={handleSubmit} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition">Send Invoice</button>
        </div>
      </div>
    </div>
  );
};

export default CreateInvoiceModal;