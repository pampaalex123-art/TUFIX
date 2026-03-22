import React from 'react';
import { JobRequest, Invoice } from '../../types';

interface JobProgressSidebarProps {
  job: JobRequest;
  invoice?: Invoice;
  t: (key: string, replacements?: Record<string, string | number>) => string;
}

const Step: React.FC<{ title: string; status: 'complete' | 'current' | 'upcoming'; timestamp?: string; isLast: boolean }> = ({ title, status, timestamp, isLast }) => {
    const getIcon = () => {
        const baseClasses = "h-5 w-5";
        switch (status) {
            case 'complete':
                return <svg xmlns="http://www.w3.org/2000/svg" className={`${baseClasses} text-white`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>;
            case 'current':
                return <div className="h-2 w-2 bg-purple-600 rounded-full" />;
            case 'upcoming':
                return <div className="h-2 w-2 bg-slate-400 rounded-full" />;
        }
    };

    const getRingColor = () => {
        switch (status) {
            case 'complete': return 'bg-purple-600';
            case 'current': return 'border-2 border-purple-600 bg-white';
            case 'upcoming': return 'border-2 border-slate-300 bg-white';
        }
    };

    const getTextColor = () => {
        switch (status) {
            case 'complete': return 'text-purple-600';
            case 'current': return 'text-purple-600 font-bold';
            case 'upcoming': return 'text-black';
        }
    };

    return (
        <li className={`relative ${!isLast ? 'pb-8' : ''}`}>
            {!isLast && <div className="absolute top-2 left-2 -ml-px mt-0.5 h-full w-0.5 bg-slate-300" />}
            <div className="relative flex items-start space-x-3">
                <div>
                    <span className={`h-4 w-4 rounded-full flex items-center justify-center ${getRingColor()}`}>
                        {getIcon()}
                    </span>
                </div>
                <div className="min-w-0 flex-1 -mt-1">
                    <p className={`text-sm ${getTextColor()}`}>{title}</p>
                    {timestamp && <p className="text-xs text-black mt-0.5">{new Date(timestamp).toLocaleString()}</p>}
                </div>
            </div>
        </li>
    );
};

const JobProgressSidebar: React.FC<JobProgressSidebarProps> = ({ job, invoice, t }) => {
  const steps = [
    { name: 'job created', timestamp: job.createdAt },
    { name: 'invoice sent', timestamp: invoice?.createdAt },
    { name: 'payment made', timestamp: invoice?.paidAt },
    { name: 'job started', timestamp: job.startedAt },
    { name: 'job finished by worker', timestamp: job.workerCompletedAt },
    { name: 'payment released', timestamp: invoice?.releasedAt },
  ];

  let currentStepIndex = steps.findIndex(step => !step.timestamp);
  if (currentStepIndex === -1 && job.status === 'completed') {
    currentStepIndex = steps.length;
  }

  return (
    <div className="p-4 bg-slate-50 rounded-xl border">
      <h3 className="font-bold text-lg mb-4 text-black">{t('job progress')}</h3>
      <nav aria-label="Progress">
        <ol>
          {steps.map((step, stepIdx) => {
            const status = stepIdx < currentStepIndex ? 'complete' : stepIdx === currentStepIndex ? 'current' : 'upcoming';
            return <Step key={step.name} title={t(step.name)} status={status} timestamp={step.timestamp} isLast={stepIdx === steps.length - 1} />;
          })}
        </ol>
      </nav>
    </div>
  );
};

export default JobProgressSidebar;