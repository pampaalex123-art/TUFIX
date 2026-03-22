import React from 'react';
import { Dispute, JobRequest, User, Worker } from '../../types';

interface DisputeDetailsScreenProps {
  dispute: Dispute;
  job: JobRequest;
  currentUser: User | Worker;
  onBack: () => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
}

const DisputeDetailsScreen: React.FC<DisputeDetailsScreenProps> = ({ dispute, job, currentUser, onBack, t }) => {

    const getStatusBadge = (status: Dispute['status']) => {
        const base = "text-sm font-medium px-3 py-1 rounded-full";
        switch (status) {
            case 'open': return <span className={`${base} bg-red-100 text-red-800`}>{t('dispute status open')}</span>;
            case 'under_review': return <span className={`${base} bg-yellow-100 text-yellow-800`}>{t('dispute status under review')}</span>;
            case 'resolved': return <span className={`${base} bg-green-100 text-green-800`}>{t('dispute status resolved')}</span>;
        }
    };
    
    return (
    <div className="container mx-auto max-w-3xl">
      <button onClick={onBack} className="flex items-center text-black hover:text-purple-600 font-semibold mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 mr-2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        {t('back to jobs')}
      </button>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 border-b flex justify-between items-center">
             <h1 className="text-2xl font-bold text-black">{t('dispute details')}</h1>
             {getStatusBadge(dispute.status)}
        </div>
        <div className="p-6 space-y-6">
            <div>
                <h2 className="text-lg font-semibold text-black mb-2">{t('original claim')}</h2>
                <div className="p-4 bg-slate-50 rounded-lg border">
                    <p className="text-black">{dispute.reason}</p>
                    <p className="text-xs text-black mt-2">
                        {t('raised on', { date: new Date(dispute.createdAt).toLocaleString() })}
                    </p>
                </div>
            </div>

            <div>
                <h2 className="text-lg font-semibold text-black mb-2">{t('mediation history')}</h2>
                 <div className="space-y-4 max-h-80 overflow-y-auto p-4 bg-slate-50 rounded-lg">
                    {dispute.messages.length === 0 && <p className="text-sm text-black">{t('no admin comment')}</p>}
                    {dispute.messages.map(msg => {
                        const isAdmin = msg.senderId.startsWith('admin');
                        return (
                            <div key={msg.id} className={`flex items-start gap-3 ${isAdmin ? '' : 'justify-end'}`}>
                                {isAdmin && <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-white font-bold flex-shrink-0">A</div>}
                                <div className={`p-3 rounded-lg max-w-sm ${isAdmin ? 'bg-white border' : 'bg-purple-100'}`}>
                                    <p className="text-sm text-black">{msg.text}</p>
                                    <p className="text-xs text-black mt-1 text-right">{new Date(msg.timestamp).toLocaleString()}</p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {dispute.status === 'resolved' && dispute.resolution && (
                <div>
                    <h2 className="text-lg font-semibold text-black mb-2">{t('final resolution details')}</h2>
                    <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                        <p className="text-black font-semibold">{dispute.resolution}</p>
                        <p className="text-xs text-green-700 mt-2">
                            {t('resolved on', { date: new Date(dispute.resolvedAt!).toLocaleString() })}
                        </p>
                    </div>
                </div>
            )}
        </div>

      </div>
    </div>
    )
}

export default DisputeDetailsScreen;