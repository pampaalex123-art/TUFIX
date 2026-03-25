import React from 'react';
import { JobRequest, Worker, User, Invoice } from '../../types';
import StarRating from '../common/StarRating';
import JobProgressSidebar from '../new/JobProgressSidebar';
import LocationDisplay from '../shared/LocationDisplay';

interface JobRequestDetailsProps {
  job: JobRequest;
  invoice?: Invoice;
  client: User;
  worker: Worker;
  onBack: () => void;
  onContactClient: (user: User) => void;
  onUpdateStatus: (jobId: string, status: JobRequest['status']) => void;
  onCancelJob: (jobId: string, reason: string) => void;
  onLeaveReview: (job: JobRequest) => void;
  onCreateInvoice: (job: JobRequest) => void;
  onViewClientProfile: (user: User, fromJob: JobRequest) => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
}

const JobRequestDetails: React.FC<JobRequestDetailsProps> = ({ job, invoice, client, worker, onBack, onContactClient, onUpdateStatus, onCancelJob, onLeaveReview, onCreateInvoice, onViewClientProfile, t }) => {
    
    const isJobPaid = invoice && (invoice.status === 'held' || invoice.status === 'released');

    const renderActionButtons = () => {
        const hasInvoice = !!invoice;
        switch (job.status) {
            case 'accepted':
                if (!hasInvoice) {
                    return <button onClick={() => onCreateInvoice(job)} className="bg-purple-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-purple-700">{t('create_invoice')}</button>;
                }
                return <button onClick={() => onUpdateStatus(job.id, 'in_progress')} className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg">{t('start_job')}</button>;
            case 'in_progress':
                return <button onClick={() => onUpdateStatus(job.id, 'worker_completed')} className="bg-purple-600 text-white font-bold py-2 px-4 rounded-lg">{t('finish_request_confirmation')}</button>;
            case 'completed':
                if (!job.workerReview) {
                    return <button onClick={() => onLeaveReview(job)} className="bg-teal-500 text-white font-bold py-2 px-4 rounded-lg">{t('review_client')}</button>;
                }
                return <p className="text-sm text-black opacity-70">{t('job_is_complete')}</p>;
            default:
                return null;
        }
    };

    return (
        <div className="container mx-auto max-w-5xl">
            <button onClick={onBack} className="flex items-center text-black hover:text-purple-600 font-semibold mb-6">
                &larr; {t('back_to_dashboard')}
            </button>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-lg border border-slate-200">
                    <h1 className="text-3xl font-bold text-black">{t(job.service)}</h1>
                    <p className="text-black opacity-70">{t('requested_for')} {new Date(`${job.date}T${job.time}`).toLocaleString()}</p>
                    <div className="mt-4 border-t border-slate-200 pt-4">
                        <h2 className="font-bold text-lg mb-2 text-black">{t('job_description')}</h2>
                        <p className="text-black whitespace-pre-wrap">{job.description}</p>
                    </div>
                    <div className="mt-4 border-t border-slate-200 pt-4">
                        <h2 className="font-bold text-lg mb-2 text-black">{t('job_location')}</h2>
                        {isJobPaid ? (
                            <LocationDisplay 
                                address={job.location || ''} 
                                coordinates={job.coordinates} 
                                t={t} 
                            />
                        ) : (
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-center">
                                <p className="text-slate-500">{t('location_hidden_until_paid')}</p>
                            </div>
                        )}
                    </div>
                    <div className="mt-4 border-t border-slate-200 pt-4 flex justify-end space-x-3">
                        {renderActionButtons()}
                    </div>
                </div>
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white p-4 rounded-xl shadow-lg border border-slate-200">
                        <h2 className="font-bold text-lg mb-3 border-b border-slate-200 pb-2 text-black">{t('client_information')}</h2>
                        <div className="flex items-center space-x-3">
                            <img src={client.avatarUrl} alt={client.name} className="w-12 h-12 rounded-full"/>
                            <div>
                                <p className="font-bold text-black">{client.name}</p>
                                <div className="flex items-center text-xs text-black"><StarRating rating={client.rating} /> <span className="ml-1">({(client.reviews || []).length})</span></div>
                            </div>
                        </div>
                         <div className="mt-3 space-y-2">
                             <button onClick={() => onViewClientProfile(client, job)} className="w-full text-center text-sm bg-slate-100 text-black py-2 px-3 rounded-lg hover:bg-slate-200 transition-colors">{t('view_profile')}</button>
                             <button onClick={() => onContactClient(client)} className="w-full text-center text-sm bg-purple-50 text-purple-700 py-2 px-3 rounded-lg hover:bg-purple-100 transition-colors">{t('contact_client')}</button>
                             {job.status === 'pending' && (
                                 <div className="flex space-x-2 pt-2">
                                     <button onClick={() => onUpdateStatus(job.id, 'accepted')} className="flex-1 bg-green-600 text-white font-bold py-2 rounded-lg">{t('accept_job')}</button>
                                     <button onClick={() => {const reason = prompt(t('decline_reason_prompt')); if(reason) onUpdateStatus(job.id, 'declined')}} className="flex-1 bg-red-600 text-white font-bold py-2 rounded-lg">{t('decline')}</button>
                                 </div>
                             )}
                        </div>
                    </div>
                    <JobProgressSidebar job={job} invoice={invoice} t={t} />
                </div>
            </div>
        </div>
    );
};

export default JobRequestDetails;