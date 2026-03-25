import React, { useState } from 'react';
import { JobRequest, Invoice } from '../../types';
import PaymentModal from '../shared/PaymentModal';
import ConfirmAndPayModal from '../new/ConfirmAndPayModal';
import JobProgressSidebar from '../new/JobProgressSidebar';
import LocationDisplay from '../shared/LocationDisplay';

interface MyJobsScreenProps {
  jobRequests: JobRequest[];
  invoices: Invoice[];
  onLeaveReview: (job: JobRequest) => void;
  onCancelJob: (jobId: string, reason: string) => void;
  onBack: () => void;
  onPayInvoice: (invoiceId: string) => void;
  onConfirmAndReleasePayment: (jobId: string) => void;
  onRaiseDispute: (job: JobRequest) => void;
  onViewDispute: (disputeId: string) => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
}

const MyJobsScreen: React.FC<MyJobsScreenProps> = ({ jobRequests, invoices, onLeaveReview, onCancelJob, onBack, onPayInvoice, onConfirmAndReleasePayment, onRaiseDispute, onViewDispute, t }) => {
  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
  const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedJob, setSelectedJob] = useState<JobRequest | null>(null);

  const invoiceMap = new Map<string, Invoice>(invoices.map(inv => [inv.jobId, inv]));
  
  const handlePay = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setPaymentModalOpen(true);
  };
  
  const handleConfirmCompletion = (job: JobRequest) => {
      setSelectedJob(job);
      setConfirmModalOpen(true);
  };

  const sortedJobs = [...jobRequests].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <>
      <div className="container mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold text-black mb-6">{t('my jobs')}</h1>
        <div className="space-y-6">
          {sortedJobs.length > 0 ? sortedJobs.map(job => {
            const invoice = invoiceMap.get(job.id);
            return (
              <div key={job.id} className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4 hover:border-purple-200 transition-colors">
                <div className="md:col-span-2 p-2">
                  <h2 className="text-xl font-bold text-black">{t(job.service)}</h2>
                  <p className="text-sm text-black">{t('requested on', { date: new Date(job.createdAt).toLocaleDateString() })}</p>
                  <p className="mt-2 text-black">{job.description}</p>
                  <div className="mt-4">
                    <p className="text-sm font-semibold text-slate-600 mb-2">{t('job_location')}</p>
                    <LocationDisplay 
                      address={job.location || ''} 
                      coordinates={job.coordinates} 
                      t={t} 
                    />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 items-center">
                    {invoice && invoice.status === 'pending' && <button onClick={() => handlePay(invoice)} className="bg-purple-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-purple-700">{t('pay invoice')}</button>}
                    {job.status === 'worker_completed' && <button onClick={() => handleConfirmCompletion(job)} className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg">{t('confirm completion')}</button>}
                    {job.status === 'completed' && !job.userReview && <button onClick={() => onLeaveReview(job)} className="bg-purple-600 text-white font-bold py-2 px-4 rounded-lg">{t('leave review')}</button>}
                    {job.status === 'pending' && <button onClick={() => { const reason = prompt(t('cancellation reason prompt')); if(reason) onCancelJob(job.id, reason)}} className="text-red-500 font-semibold text-sm">{t('cancel request')}</button>}
                    {job.disputeId ? <button onClick={() => onViewDispute(job.disputeId!)} className="text-yellow-600 font-semibold text-sm">{t('view dispute')}</button> : (job.status === 'completed' && <button onClick={() => onRaiseDispute(job)} className="text-red-500 font-semibold text-sm">{t('raise dispute')}</button>)}
                  </div>
                </div>
                <div className="md:col-span-1">
                  <JobProgressSidebar job={job} invoice={invoice} t={t} />
                </div>
              </div>
            );
          }) : <p className="text-center text-black py-12">{t('no jobs found')}</p>}
        </div>
      </div>
      {isPaymentModalOpen && selectedInvoice && (
        <PaymentModal
          invoice={selectedInvoice}
          onClose={() => setPaymentModalOpen(false)}
          onConfirm={() => {
            onPayInvoice(selectedInvoice.id);
            setPaymentModalOpen(false);
          }}
          t={t}
        />
      )}
      {isConfirmModalOpen && selectedJob && (
        <ConfirmAndPayModal
          invoice={invoiceMap.get(selectedJob.id)!}
          onClose={() => setConfirmModalOpen(false)}
          onConfirm={() => {
            onConfirmAndReleasePayment(selectedJob.id);
            setConfirmModalOpen(false);
          }}
          t={t}
        />
      )}
    </>
  );
};

export default MyJobsScreen;