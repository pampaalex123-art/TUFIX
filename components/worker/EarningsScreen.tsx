import React, { useState, useMemo } from 'react';
import { JobRequest, Worker } from '../../types';
// FIX: Changed import to a named import to resolve module loading error.
import { EarningsChart } from './EarningsChart';
// FIX: The file 'components/shared/LoginScreen.tsx' was missing. It has been created with the 'useTranslations' hook.
import { Language } from '../shared/LoginScreen';

interface EarningsScreenProps {
  worker: Worker;
  jobRequests: JobRequest[];
  onBack: () => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
  language: Language;
}

type TimePeriod = 'Weekly' | 'Monthly' | 'Yearly';

// Date utility functions
const getStartOfWeek = (d: Date) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  return new Date(date.setDate(diff));
};

const EarningsScreen: React.FC<EarningsScreenProps> = ({ worker, jobRequests, onBack, t, language }) => {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('Monthly');

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(`${dateString}T12:00:00Z`).toLocaleDateString(language, options);
  };

  const completedJobs = useMemo(() => {
    return jobRequests
      .filter(job => job.status === 'completed' && job.finalPrice)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [jobRequests]);

  const chartData = useMemo(() => {
    const data: { [key: string]: number } = {};
    const now = new Date();

    completedJobs.forEach(job => {
      const jobDate = new Date(job.date);
      let key = '';

      if (timePeriod === 'Weekly') {
        if (now.getTime() - jobDate.getTime() > 90 * 24 * 60 * 60 * 1000) return; // Only show last ~3 months for weekly
        const startOfWeek = getStartOfWeek(jobDate);
        key = `W/o ${startOfWeek.toLocaleDateString(language, { month: 'short', day: 'numeric' })}`;
      } else if (timePeriod === 'Monthly') {
         if (now.getFullYear() !== jobDate.getFullYear()) return; // Only current year for monthly
        key = jobDate.toLocaleString(language, { month: 'short' });
      } else { // Yearly
        key = jobDate.getFullYear().toString();
      }

      if (!data[key]) {
        data[key] = 0;
      }
      data[key] += job.finalPrice!;
    });
    
    let processedData = Object.entries(data).map(([label, value]) => ({ label, value }));

    // Sort data chronologically
    if (timePeriod === 'Monthly') {
        const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const esMonthOrder = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
        const currentOrder = language === 'es' ? esMonthOrder : monthOrder;
        processedData.sort((a,b) => currentOrder.indexOf(a.label.replace('.','')) - currentOrder.indexOf(b.label.replace('.','')));
    } else if (timePeriod === 'Weekly') {
        processedData.sort((a,b) => new Date(a.label.replace('W/o ', '')).getTime() - new Date(b.label.replace('W/o ', '')).getTime());
    } else {
        processedData.sort((a, b) => parseInt(a.label) - parseInt(b.label));
    }

    return processedData;

  }, [completedJobs, timePeriod, language]);

  const stats = useMemo(() => {
    const totalEarnings = completedJobs.reduce((acc, job) => acc + job.finalPrice!, 0);
    const jobsCompleted = completedJobs.length;
    const avgJobValue = jobsCompleted > 0 ? totalEarnings / jobsCompleted : 0;
    return {
      totalEarnings,
      jobsCompleted,
      avgJobValue
    };
  }, [completedJobs]);

  const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-white p-6 rounded-xl shadow-lg flex items-center space-x-4">
      <div className="bg-purple-100 p-3 rounded-full">{icon}</div>
      <div>
        <p className="text-sm text-black font-medium">{title}</p>
        <p className="text-2xl font-bold text-black">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto">
      <button onClick={onBack} className="flex items-center text-black hover:text-purple-600 font-semibold mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 mr-2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        {t('back_to_dashboard')}
      </button>

      <div className="flex flex-col md:flex-row justify-between md:items-center mb-6">
        <h1 className="text-3xl font-bold text-black">{t('my_earnings')}</h1>
        <div className="bg-slate-100 p-1 rounded-lg mt-4 md:mt-0 flex items-center space-x-1">
          {(['Weekly', 'Monthly', 'Yearly'] as TimePeriod[]).map(period => (
            <button
              key={period}
              onClick={() => setTimePeriod(period)}
              className={`px-4 py-1.5 text-sm font-semibold rounded-md transition ${timePeriod === period ? 'bg-white text-purple-600 shadow' : 'text-black hover:bg-white/70'}`}
            >
              {t(period.toLowerCase())}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard title={t('total earnings all time')} value={`${worker.country === 'bolivia' ? 'Bs.' : worker.country === 'argentina' ? 'AR$' : '$'}${stats.totalEarnings.toFixed(2)}`} />
        <StatCard title={t('jobs completed all time')} value={stats.jobsCompleted.toString()} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>} />
        <StatCard title={t('average job value')} value={`${worker.country === 'bolivia' ? 'Bs.' : worker.country === 'argentina' ? 'AR$' : '$'}${stats.avgJobValue.toFixed(2)}`} />
      </div>

      <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
        <h2 className="text-xl font-bold text-black mb-4">{t('period earnings', { period: t(timePeriod.toLowerCase()) })}</h2>
        <div style={{ height: '350px' }}>
          <EarningsChart data={chartData} t={t} />
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-lg">
        <h2 className="text-xl font-bold text-black p-6 border-b border-slate-200">{t('job history')}</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-black">
            <thead className="text-xs text-black uppercase bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3">{t('client')}</th>
                <th scope="col" className="px-6 py-3">{t('service')}</th>
                <th scope="col" className="px-6 py-3">{t('date completed')}</th>
                <th scope="col" className="px-6 py-3 text-right">{t('amount earned')}</th>
              </tr>
            </thead>
            <tbody>
              {completedJobs.length > 0 ? completedJobs.map(job => (
                <tr key={job.id} className="bg-white border-b hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-black whitespace-nowrap">{job.user.name}</td>
                  <td className="px-6 py-4">{t(job.service)}</td>
                  <td className="px-6 py-4">{formatDate(job.date)}</td>
                  <td className="px-6 py-4 text-right font-semibold text-green-600">{worker.country === 'bolivia' ? 'Bs.' : worker.country === 'argentina' ? 'AR$' : '$'}{job.finalPrice!.toFixed(2)}</td>
                </tr>
              )) : (
                <tr>
                    <td colSpan={4} className="text-center py-8 text-black">{t('no_completed_jobs')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EarningsScreen;
