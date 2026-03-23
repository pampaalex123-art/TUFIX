import React from 'react';
import { User, JobRequest, Worker, Message } from '../../types';
import StarRating from '../common/StarRating';

interface ClientProfileAdminViewProps {
  user: User;
  jobs: JobRequest[];
  workers: Worker[];
  messages: Message[];
  onBack: () => void;
  onViewConversation: (conversationId: string) => void;
  t: (key: string) => string;
}

const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

const getStatusBadge = (status: JobRequest['status'], t: (key: string) => string) => {
    const baseClasses = "text-xs font-medium px-2.5 py-0.5 rounded-full";
    switch (status) {
        case 'pending': return <span className={`${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300`}>{t('pending')}</span>;
        case 'accepted': return <span className={`${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300`}>{t('accepted')}</span>;
        case 'in_progress': return <span className={`${baseClasses} bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300`}>{t('in_progress')}</span>;
        case 'worker_completed': return <span className={`${baseClasses} bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300`}>{t('worker_completed')}</span>;
        case 'declined': return <span className={`${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300`}>{t('declined')}</span>;
        case 'completed': return <span className={`${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300`}>{t('completed')}</span>;
        case 'cancelled': return <span className={`${baseClasses} bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300`}>{t('cancelled')}</span>;
    }
};

const ClientProfileAdminView: React.FC<ClientProfileAdminViewProps> = ({ user, jobs, workers, messages, onBack, onViewConversation, t }) => {

  const workerMap = new Map<string, Worker>(workers.map(w => [w.id, w]));
  const sortedJobs = [...jobs].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const conversations = React.useMemo(() => {
    const userMessages = messages.filter(m => m.senderId === user.id || m.receiverId === user.id);
    // FIX: Explicitly typing `new Set<string>` helps TypeScript correctly infer the type of `partnerId` later in the chain.
    const partnerIds = new Set<string>(userMessages.map(m => m.senderId === user.id ? m.receiverId : m.senderId));
    return Array.from(partnerIds).map(partnerId => {
        const partner = workerMap.get(partnerId);
        const conversationId = `conv_${[user.id, partnerId].sort().join('_')}`;
        return {
            partner,
            conversationId
        }
    }).filter((c): c is { partner: Worker, conversationId: string } => !!c.partner);
  }, [messages, user.id, workerMap]);

  return (
    <div className="container mx-auto max-w-5xl">
      <button onClick={onBack} className="flex items-center text-black hover:text-purple-600 font-semibold mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 mr-2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        {t('back_to_admin_dashboard')}
      </button>

      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="p-8">
            <div className="flex flex-col md:flex-row md:items-center space-y-6 md:space-y-0 md:space-x-8">
                <img className="w-24 h-24 rounded-full object-cover ring-4 ring-purple-100" src={user.avatarUrl} alt={user.name} />
                <div className="flex-grow">
                  <h1 className="text-3xl font-bold text-black">{user.name}</h1>
                  <p className="text-md text-black opacity-70 mt-1">{user.email}</p>
                  <p className="text-sm text-black opacity-60 mt-2">{user.location}</p>
                  <div className="flex items-center mt-2 space-x-2">
                    <StarRating rating={user.rating} />
                    <span className="text-black font-semibold">{user.rating.toFixed(1)}</span>
                    <span className="text-black opacity-60">({user.reviews.length} {t('reviews')})</span>
                  </div>
                </div>
                <div className="text-sm text-black opacity-80 self-start md:self-center">
                    <p><strong>{t('joined_label')}</strong> {formatDate(user.signupDate)}</p>
                    <p><strong>{t('last_seen_label')}</strong> {formatDate(user.lastLoginDate)}</p>
                    <p><strong>{t('id_number_label')}</strong> {user.idNumber}</p>
                </div>
            </div>
        </div>

        <div className="bg-white border-t border-slate-200 p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
                <h2 className="text-2xl font-bold text-black mb-6">{t('job_history')} ({jobs.length})</h2>
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-4">
                    {sortedJobs.length > 0 ? sortedJobs.map(job => (
                    <div key={job.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-start">
                            <div>
                                <div className="flex items-center space-x-3 mb-1">
                                    <h3 className="text-lg font-bold text-black">{t(job.service)}</h3>
                                    {getStatusBadge(job.status, t)}
                                </div>
                                <p className="text-sm text-black opacity-60">
                                    {t('requested_for')} {new Date(`${job.date}T${job.time}`).toLocaleString(undefined, { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric' })}
                                </p>
                                <p className="text-sm text-black opacity-60">
                                    {t('provider_label')} <span className="font-semibold text-black">{workerMap.get(job.workerId)?.name || t('not available')}</span>
                                </p>
                            </div>
                            <div className="mt-2 sm:mt-0 text-right">
                                {job.status === 'completed' && job.finalPrice && (
                                    <p className="text-lg font-bold text-green-600">${job.finalPrice.toFixed(2)}</p>
                                )}
                                {job.userReview && (
                                    <div className="flex items-center justify-end mt-1">
                                        <StarRating rating={job.userReview.rating} />
                                        <span className="text-xs text-black opacity-60 ml-1">({job.userReview.rating})</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    )) : (
                    <p className="text-center text-black opacity-60 py-8">{t('no_client_jobs')}</p>
                    )}
                </div>
            </div>

            <div className="lg:col-span-1">
                <h2 className="text-2xl font-bold text-black mb-6">{t('conversations')}</h2>
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                    {conversations.length > 0 ? conversations.map(({ partner, conversationId }) => (
                        <button key={conversationId} onClick={() => onViewConversation(conversationId)} className="w-full text-left p-3 bg-white rounded-lg shadow-sm border border-slate-200 flex items-center space-x-3 hover:bg-slate-50 transition">
                             <img className="w-10 h-10 rounded-full object-cover" src={partner.avatarUrl} alt={partner.name} />
                             <div>
                                <p className="font-bold text-black">{partner.name}</p>
                                <p className="text-xs text-purple-600 font-semibold">{t('view_messages')} &rarr;</p>
                             </div>
                        </button>
                    )) : (
                        <p className="text-center text-black opacity-60 py-8">{t('no_conversations_found')}</p>
                    )}
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default ClientProfileAdminView;