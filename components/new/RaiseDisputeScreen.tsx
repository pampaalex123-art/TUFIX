import React, { useState } from 'react';
import { JobRequest } from '../../types';

interface RaiseDisputeScreenProps {
  job: JobRequest;
  onBack: () => void;
  onSubmit: (jobId: string, reason: string) => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
}

const RaiseDisputeScreen: React.FC<RaiseDisputeScreenProps> = ({ job, onBack, onSubmit, t }) => {
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim() === '') {
      alert(t('provide dispute reason alert'));
      return;
    }
    onSubmit(job.id, reason);
  };

  const formattedDate = new Date(job.date).toLocaleDateString();

  return (
    <div className="container mx-auto max-w-2xl">
      <button onClick={onBack} className="flex items-center text-black hover:text-purple-600 font-semibold mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 mr-2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        {t('back')}
      </button>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-black">{t('raise dispute title')}</h1>
          <p className="text-black mt-2">
            {t('dispute for job', { service: t(job.service), date: formattedDate })}
          </p>
        </div>

        <div className="border-t pt-6">
          <label htmlFor="reason" className="block text-lg font-medium text-black mb-2">
            {t('reason for dispute')}
          </label>
          <p className="text-sm text-black mb-3">
            {t('dispute reason subtitle')}
          </p>
          <textarea
            id="reason"
            rows={6}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t('dispute reason placeholder')}
            required
            className="w-full p-3 border border-slate-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm bg-white text-black"
          ></textarea>
        </div>
        
        <div className="pt-5 flex justify-end space-x-3">
          <button type="button" onClick={onBack} className="bg-slate-200 text-black font-bold py-2 px-4 rounded-lg hover:bg-slate-300 transition">
            {t('cancel')}
          </button>
          <button type="submit" className="bg-red-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-red-700 transition">
            {t('submit dispute')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RaiseDisputeScreen;