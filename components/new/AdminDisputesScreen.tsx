import React, { useMemo, useState } from 'react';
import { Dispute, User, Worker, JobRequest } from '../../types';

interface AdminDisputesScreenProps {
    disputes: Dispute[];
    users: User[];
    workers: Worker[];
    jobs: JobRequest[];
    onSelectDispute: (dispute: Dispute) => void;
    t: (key: string) => string;
}

type SortDirection = 'ascending' | 'descending';
type SortKey = 'createdAt' | 'status';
type StatusFilter = 'all' | 'open' | 'under_review' | 'resolved';

const AdminDisputesScreen: React.FC<AdminDisputesScreenProps> = ({ disputes, users, workers, jobs, onSelectDispute, t }) => {
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('open');
    const [sort, setSort] = useState<{ key: SortKey, direction: SortDirection }>({ key: 'createdAt', direction: 'descending' });

    const userMap = useMemo(() => new Map(users.map(u => [u.id, u])), [users]);
    const workerMap = useMemo(() => new Map(workers.map(w => [w.id, w])), [workers]);
    const jobMap = useMemo(() => new Map(jobs.map(j => [j.id, j])), [jobs]);

    const filteredAndSortedDisputes = useMemo(() => {
        const filtered = disputes.filter(d => statusFilter === 'all' || d.status === statusFilter);
        
        filtered.sort((a, b) => {
            const valA = a[sort.key] || '';
            const valB = b[sort.key] || '';
            const comparison = valA > valB ? 1 : valA < valB ? -1 : 0;
            return sort.direction === 'ascending' ? comparison : -comparison;
        });

        return filtered;
    }, [disputes, statusFilter, sort]);
    
    const handleSort = (key: SortKey) => {
        setSort(prev => ({ key, direction: prev.key === key && prev.direction === 'descending' ? 'ascending' : 'descending' }));
    };

    const getStatusBadge = (status: Dispute['status']) => {
        const base = "text-xs font-medium px-2.5 py-0.5 rounded-full";
        switch (status) {
            case 'open': return <span className={`${base} bg-red-100 text-red-800`}>{t('dispute status open')}</span>;
            case 'under_review': return <span className={`${base} bg-yellow-100 text-yellow-800`}>{t('dispute status under review')}</span>;
            case 'resolved': return <span className={`${base} bg-green-100 text-green-800`}>{t('dispute status resolved')}</span>;
        }
    };
    
    return (
        <div className="bg-white rounded-xl shadow-lg mt-6 overflow-hidden">
            <div className="p-4 border-b flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
                <h2 className="text-lg sm:text-xl font-bold text-black">{t('dispute management')} ({filteredAndSortedDisputes.length})</h2>
                <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-lg overflow-x-auto scrollbar-hide max-w-full">
                    {(['open', 'under_review', 'resolved', 'all'] as StatusFilter[]).map(status => (
                        <button key={status} onClick={() => setStatusFilter(status)} className={`px-3 py-1 text-sm font-semibold rounded-md transition capitalize whitespace-nowrap ${statusFilter === status ? 'bg-white text-purple-600 shadow' : 'text-black hover:bg-slate-200'}`}>
                            {t(status === 'all' ? 'all' : `dispute status ${status}`)}
                        </button>
                    ))}
                </div>
            </div>
            <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-slate-50 text-black">
                        <tr>
                            <th className="px-4 py-3">{t('job details')}</th>
                            <th className="px-4 py-3">{t('parties involved')}</th>
                            <th className="px-4 py-3 cursor-pointer" onClick={() => handleSort('createdAt')}>{t('date raised')}</th>
                            <th className="px-4 py-3 cursor-pointer" onClick={() => handleSort('status')}>{t('status')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAndSortedDisputes.map(d => {
                             const job = jobMap.get(d.jobId);
                             const client = job ? userMap.get(job.user.id) : undefined;
                             const worker = job ? workerMap.get(job.workerId) : undefined;
                             const raisedBy = d.raisedByType === 'user' ? client : worker;
                            return (
                            <tr key={d.id} onClick={() => onSelectDispute(d)} className="bg-white border-b hover:bg-slate-50 cursor-pointer">
                                <td className="px-4 py-3">
                                    <p className="font-semibold text-black">{job?.service ? t(job.service) : 'N/A'}</p>
                                    <p className="text-xs text-black">{t('job id label')} {d.jobId.slice(-6)}</p>
                                </td>
                                <td className="px-4 py-3 text-black">
                                    <p>{t('client abbr label')} {client?.name || 'N/A'}</p>
                                    <p>{t('worker abbr label')} {worker?.name || 'N/A'}</p>
                                    <p className="text-xs text-black mt-1">{t('raised by label')} {raisedBy?.name || 'N/A'} {t(`${d.raisedByType} role label`)}</p>
                                </td>
                                <td className="px-4 py-3 text-black">{new Date(d.createdAt).toLocaleDateString()}</td>
                                <td className="px-4 py-3">{getStatusBadge(d.status)}</td>
                            </tr>
                        )})}
                    </tbody>
                </table>
            </div>
            <div className="sm:hidden divide-y divide-slate-200">
                {filteredAndSortedDisputes.map(d => {
                    const job = jobMap.get(d.jobId);
                    const client = job ? userMap.get(job.user.id) : undefined;
                    const worker = job ? workerMap.get(job.workerId) : undefined;
                    return (
                        <div key={d.id} onClick={() => onSelectDispute(d)} className="p-4 space-y-3 active:bg-slate-50">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold text-black">{job?.service ? t(job.service) : 'N/A'}</p>
                                    <p className="text-xs text-black opacity-60">ID: {d.jobId.slice(-6)}</p>
                                </div>
                                {getStatusBadge(d.status)}
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                    <p className="text-xs text-black opacity-60">{t('client')}</p>
                                    <p className="text-black font-medium">{client?.name || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-black opacity-60">{t('worker')}</p>
                                    <p className="text-black font-medium">{worker?.name || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="text-xs text-black opacity-60">
                                {t('raised on')} {new Date(d.createdAt).toLocaleDateString()}
                            </div>
                        </div>
                    );
                })}
            </div>
            {filteredAndSortedDisputes.length === 0 && <p className="text-center py-8 text-black">{t('no matching disputes')}</p>}
        </div>
    );
};

export default AdminDisputesScreen;