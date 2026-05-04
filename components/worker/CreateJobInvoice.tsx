import React, { useState } from 'react';
import { JobRequest, Worker, InvoiceLineItem } from '../../types';
import { formatCurrency } from '../../constants';

interface CreateJobInvoiceProps {
  job: JobRequest;
  worker: Worker;
  onBack: () => void;
  onSubmit: (jobId: string, invoiceData: { items: InvoiceLineItem[], subtotal: number, platformFee: number, total: number }) => void;
  t: (key: string, replacements?: Record<string, string>) => string;
}

const CreateJobInvoice: React.FC<CreateJobInvoiceProps> = ({ job, worker, onBack, onSubmit, t }) => {
    const [items, setItems] = useState<InvoiceLineItem[]>([{ description: '', amount: 0 }]);
    const [error, setError] = useState('');
    const [paymentType, setPaymentType] = useState<'one_time' | 'monthly'>('one_time');
    const [billingDay, setBillingDay] = useState(new Date().getDate());
    const currency = worker.avgJobCost.currency;
    const platformFeeRate = 0.10;

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

    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const platformFee = subtotal * platformFeeRate;
    const total = subtotal + platformFee;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        for (const item of items) {
            if (!item.description.trim() || item.amount <= 0) {
                setError(t('all items must have a description and an amount greater than zero'));
                return;
            }
        }
        if (items.length === 0) {
            setError(t('you must add at least one item to the invoice'));
            return;
        }
        onSubmit(job.id, { items, subtotal, platformFee, total, paymentType, billingDay: paymentType === 'monthly' ? billingDay : undefined } as any);
    };

    return (
    <div className="container mx-auto max-w-2xl">
      <button onClick={onBack} className="flex items-center text-black hover:text-purple-600 font-semibold mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 mr-2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        {t('back')}
      </button>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-xl p-8 space-y-6 border border-slate-200">
        <div>
          <h1 className="text-3xl font-bold text-black">{t('create invoice')}</h1>
          <p className="text-black opacity-70 mt-2">
            {t('invoice for', {service: t(job.service), name: job.user.name})}
          </p>
        </div>

        <div className="border-t border-slate-200 pt-6 space-y-3">
            {items.map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                    <input
                        type="text"
                        placeholder={t('item description placeholder')}
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        className="flex-grow p-2 border border-gray-300 rounded-md shadow-sm sm:text-sm bg-white text-black"
                    />
                    <div className="flex-shrink-0 relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">{currency}</span>
                        <input
                            type="number"
                            placeholder={t('amount')}
                            value={item.amount || ''}
                            onChange={(e) => handleItemChange(index, 'amount', e.target.value)}
                            className="w-32 p-2 pl-10 border border-gray-300 rounded-md shadow-sm sm:text-sm bg-white text-black"
                            min="0"
                            step="0.01"
                        />
                    </div>
                    <button type="button" onClick={() => removeItem(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-full flex-shrink-0">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                </div>
            ))}
            <button type="button" onClick={addItem} className="text-sm font-semibold text-purple-600 hover:underline">{t('add line item')}</button>
        </div>

        <div className="border-t border-slate-200 pt-4 space-y-2">
            <div className="flex justify-between items-center text-black opacity-80">
                <span>{t('subtotal')}</span>
                <span>{formatCurrency(subtotal, currency)}</span>
            </div>
             <div className="flex justify-between items-center text-black opacity-80">
                <span>{t('platform fee')}</span>
                <span>{formatCurrency(platformFee, currency)}</span>
            </div>
             <div className="flex justify-between items-center text-xl font-bold text-black pt-2 border-t border-slate-200 mt-2">
                <span>{t('total amount')}</span>
                <span>{formatCurrency(total, currency)}</span>
            </div>
        </div>
        
        <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50">
          <p className="text-sm font-bold text-slate-700">💳 Tipo de Pago</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPaymentType('one_time')}
              className={`p-3 rounded-lg border-2 text-sm font-semibold transition ${paymentType === 'one_time' ? 'border-purple-600 bg-purple-50 text-purple-700' : 'border-slate-200 bg-white text-slate-600 hover:border-purple-300'}`}
            >
              <div className="text-xl mb-1">💰</div>
              Pago Único
              <div className="text-xs font-normal mt-1 opacity-70">Se cobra una sola vez</div>
            </button>
            <button
              type="button"
              onClick={() => setPaymentType('monthly')}
              className={`p-3 rounded-lg border-2 text-sm font-semibold transition ${paymentType === 'monthly' ? 'border-purple-600 bg-purple-50 text-purple-700' : 'border-slate-200 bg-white text-slate-600 hover:border-purple-300'}`}
            >
              <div className="text-xl mb-1">🔄</div>
              Pago Mensual
              <div className="text-xs font-normal mt-1 opacity-70">Se debita automáticamente</div>
            </button>
          </div>
          {paymentType === 'monthly' && (
            <div className="mt-2 space-y-2">
              <label className="block text-xs font-semibold text-slate-600">Día de cobro mensual</label>
              <select
                value={billingDay}
                onChange={e => setBillingDay(Number(e.target.value))}
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
              >
                {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
                  <option key={d} value={d}>Día {d} de cada mes</option>
                ))}
              </select>
              <p className="text-xs text-slate-400">El cliente deberá aprobar el débito. Para Bolivia se enviará un recordatorio con QR ese día.</p>
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}
        
        <div className="pt-5 flex justify-end space-x-3">
          <button type="button" onClick={onBack} className="bg-slate-100 text-black font-bold py-2 px-4 rounded-lg hover:bg-slate-200 transition">
            {t('cancel')}
          </button>
          <button type="submit" className="bg-purple-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-purple-700 transition">
            {t('complete job send invoice')}
          </button>
        </div>
      </form>
    </div>
    );
};

export default CreateJobInvoice;