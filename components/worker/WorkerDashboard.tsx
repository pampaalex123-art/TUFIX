import React from 'react';
import { Worker, JobRequest, User, DayOfWeek, Invoice } from '../../types';

interface WorkerDashboardProps {
  worker: Worker;
  jobRequests: JobRequest[];
  invoices: Invoice[];
  onContactClient: (user: User) => void;
  onEditProfile: () => void;
  onSelectJob: (job: JobRequest) => void;
  onRaiseDispute: (job: JobRequest) => void;
  onViewDispute: (disputeId: string) => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
}

const getDayOfWeekForDate = (date: Date): DayOfWeek => {
  const days: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
};

const formatDate = (dateString: string): string => {
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
  // Adding a time component to avoid timezone issues where the date might shift.
  return new Date(`${dateString}T12:00:00Z`).toLocaleDateString(undefined, options);
}

const WorkerDashboard: React.FC<WorkerDashboardProps> = ({ worker, jobRequests, invoices, onContactClient, onEditProfile, onSelectJob, onRaiseDispute, onViewDispute, t }) => {
  const invoiceMap = new Map<string, Invoice>(invoices.map(inv => [inv.jobId, inv]));

  // --- NEW: Split jobs into active and past ---
  const [showPastJobs, setShowPastJobs] = React.useState(false);
  const [pastJobsCount, setPastJobsCount] = React.useState(5);

  const activeStatuses = ['pending', 'accepted', 'in_progress', 'invoice_sent', 'paid', 'awaiting_confirmation'];

  const allSorted = [...jobRequests].sort(
    (a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime()
  );

  const activeJobs = allSorted.filter(j => activeStatuses.includes(j.status));
  const pastJobs = allSorted.filter(j => !activeStatuses.includes(j.status));

  const jobsToShow = showPastJobs ? pastJobs.slice(0, pastJobsCount) : activeJobs;
  // --- END NEW ---

  return (
    <div className="container mx-auto max-w-5xl space-y-8">
      <div className="bg-slate-50 border border-slate-200 p-6 rounded-xl shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-black">{t('welcome_back', { name: worker.name })}</h1>
          <p className="text-black mt-1">{t('worker_dashboard_subtitle')}</p>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-black mb-4">{t('incoming_jobs')}</h2>

        {/* --- NEW: Tab buttons --- */}
        <div className="flex space-x-2 mb-6">
          <button
            onClick={() => setShowPastJobs(false)}
            className={`flex-1 py-2 rounded-lg font-semibold text-sm transition ${
              !showPastJobs
                ? 'bg-purple-600 text-white shadow'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Trabajos Activos ({activeJobs.length})
          </button>
          <button
            onClick={() => setShowPastJobs(true)}
            className={`flex-1 py-2 rounded-lg font-semibold text-sm transition ${
              showPastJobs
                ? 'bg-purple-600 text-white shadow'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Historial ({pastJobs.length})
          </button>
        </div>
        {/* --- END NEW --- */}

        {jobsToShow.length === 0 ? (
           <div className="bg-slate-50 border border-slate-200 rounded-xl shadow-sm p-12 text-center">
            <p className="text-black">
              {showPastJobs ? 'No tienes trabajos pasados.' : t('no_job_requests')}
            </p>
           </div>
        ) : (
          <div className="space-y-6">
            {jobsToShow.map((request: JobRequest) => {
              const requestDate = new Date(`${request.date}T00:00:00`);
              const dayOfWeek = getDayOfWeekForDate(requestDate);
              const isAvailable = !!worker.availability[dayOfWeek];
              const invoice = invoiceMap.get(request.id);
              const isDisputeActive = !!request.disputeId;

              return (
                <div key={request.id} className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 hover:border-purple-200 transition-colors">
                  <div className="flex flex-col md:flex-row justify-between">
                    <div className="flex items-start space-x-4">
                      <img src={request.user.avatarUrl} alt={request.user.name} className="w-16 h-16 rounded-full object-cover"/>
                      <div>
                        <div className="flex items-center space-x-3 flex-wrap">
                          <p className="text-lg font-bold text-black">{request.user.name}</p>
                          {request.status === 'pending' && <span className="text-xs bg-yellow-100 text-yellow-800 font-medium px-2.5 py-0.5 rounded-full">{t('new_status')}</span>}
                          {request.status === 'accepted' && <span className="text-xs bg-green-100 text-green-800 font-medium px-2.5 py-0.5 rounded-full">{t('accepted_status')}</span>}
                          {request.status === 'completed' && <span className="text-xs bg-blue-100 text-blue-800 font-medium px-2.5 py-0.5 rounded-full">{t('completed_status')}</span>}
                           {isDisputeActive && <span className="text-xs bg-red-100 text-red-800 font-medium px-2.5 py-0.5 rounded-full">{t('disputed_status')}</span>}
                        </div>
                        <p className="text-sm text-black mt-1">{request.user.location} &bull; {t('requested_on', { date: formatDate(request.date) })}</p>
                        
                        <div className="mt-2">
                          {isAvailable ? (
                              <span className="flex items-center text-xs bg-green-100 text-green-800 font-medium px-2.5 py-0.5 rounded-full w-fit">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                  {t('available_this_day')}
                              </span>
                          ) : (
                              <span className="flex items-center text-xs bg-yellow-100 text-yellow-800 font-medium px-2.5 py-0.5 rounded-full w-fit">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                  </svg>
                                  {t('potentially_unavailable')}
                              </span>
                          )}
                        </div>

                        <p className="mt-3 text-black line-clamp-2">{request.description}</p>
                      </div>
                    </div>
                    <div className="mt-4 md:mt-0 flex flex-col items-stretch md:items-end space-y-2 md:pl-4">
                        <button onClick={() => onSelectJob(request)} className="w-full text-center md:w-auto bg-purple-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-purple-700">{t('view_details')}</button>
                         {request.status === 'completed' && invoice && invoice.status === 'held' && (
                            isDisputeActive ? 
                            <button onClick={() => onViewDispute(request.disputeId!)} className="text-sm font-semibold text-yellow-500 hover:underline text-right">{t('view_dispute')}</button>
                            : <button onClick={() => onRaiseDispute(request)} className="text-sm font-semibold text-red-500 hover:underline text-right">{t('raise_dispute')}</button>
                        )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* --- NEW: Load More button for past jobs --- */}
        {showPastJobs && pastJobs.length > pastJobsCount && (
          <div className="text-center pt-4">
            <button
              onClick={() => setPastJobsCount(c => c + 5)}
              className="text-sm font-semibold text-purple-600 hover:text-purple-800 hover:underline"
            >
              Cargar más trabajos ({pastJobs.length - pastJobsCount} restantes)
            </button>
          </div>
        )}
        {/* --- END NEW --- */}

      </div>
    </div>
  );
};

export default WorkerDashboard;