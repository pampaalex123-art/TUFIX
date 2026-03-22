import React, { useMemo, useState } from 'react';
import { Transaction, User, Worker } from '../../types';
import { formatCurrency } from '../../constants';

interface AdminTransactionsScreenProps {
    transactions: Transaction[];
    users: User[];
    workers: Worker[];
    t: (key: string) => string;
}

type SortDirection = 'ascending' | 'descending';
type SortKey = 'paidAt' | 'total' | 'platformFee' | 'status';

interface Filters {
    search: string;
    status: 'all' | 'held' | 'released';
    dateStart: string;
    dateEnd: string;
    minAmount: string;
    maxAmount: string;
}

// FIX: Changed icon type from `JSX.Element` to `React.ReactNode` to resolve namespace error.
const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-white p-4 rounded-xl shadow-sm flex items-center space-x-4">
        <div className="bg-purple-100 p-3 rounded-full">{icon}</div>
        <div>
            <p className="text-sm text-black font-medium">{title}</p>
            <p className="text-xl font-bold text-black">{value}</p>
        </div>
    </div>
);

const AdminTransactionsScreen: React.FC<AdminTransactionsScreenProps> = ({ transactions, users, workers, t }) => {
    const initialFilters: Filters = { search: '', status: 'all', dateStart: '', dateEnd: '', minAmount: '', maxAmount: '' };
    const [filters, setFilters] = useState<Filters>(initialFilters);
    const [sort, setSort] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'paidAt', direction: 'descending' });

    const userMap = useMemo(() => new Map(users.map(u => [u.id, u])), [users]);
    const workerMap = useMemo(() => new Map(workers.map(w => [w.id, w])), [workers]);

    const financialStats = useMemo(() => {
        const totalVolume = transactions.reduce((sum, t) => sum + t.total, 0);
        const platformRevenue = transactions.reduce((sum, t) => sum + t.platformFee, 0);
        const releasedTransactions = transactions.filter(t => t.status === 'released');
        const paidOutToWorkers = releasedTransactions.reduce((sum, t) => sum + t.subtotal, 0);
        const heldTransactions = transactions.filter(t => t.status === 'held');
        const inEscrow = heldTransactions.reduce((sum, t) => sum + t.total, 0);
        return { totalVolume, platformRevenue, paidOutToWorkers, inEscrow };
    }, [transactions]);
    
    const filteredAndSortedTransactions = useMemo(() => {
        let filtered = [...transactions].filter(t => {
            const client = userMap.get(t.clientId);
            const worker = workerMap.get(t.workerId);
            const searchLower = filters.search.toLowerCase();
            const minAmount = parseFloat(filters.minAmount) || 0;
            const maxAmount = parseFloat(filters.maxAmount) || Infinity;

            return (
                (!filters.search || 
                    client?.name.toLowerCase().includes(searchLower) || 
                    client?.email.toLowerCase().includes(searchLower) ||
                    worker?.name.toLowerCase().includes(searchLower) ||
                    worker?.email.toLowerCase().includes(searchLower) ||
                    t.id.toLowerCase().includes(searchLower)
                ) &&
                (filters.status === 'all' || t.status === filters.status) &&
                (!filters.dateStart || new Date(t.paidAt) >= new Date(filters.dateStart)) &&
                (!filters.dateEnd || new Date(t.paidAt) <= new Date(filters.dateEnd)) &&
                t.total >= minAmount &&
                t.total <= maxAmount
            );
        });

        filtered.sort((a, b) => {
            const valA = a[sort.key];
            const valB = b[sort.key];
            
            let comparison = 0;
            if (valA! > valB!) comparison = 1;
            else if (valA! < valB!) comparison = -1;
            
            return sort.direction === 'ascending' ? comparison : -comparison;
        });

        return filtered;
    }, [transactions, filters, sort, userMap, workerMap]);
    
    const handleSort = (key: SortKey) => {
        setSort(prev => ({ key, direction: prev.key === key && prev.direction === 'descending' ? 'ascending' : 'descending' }));
    };

    const SortableHeader: React.FC<{ children: React.ReactNode; sortKey: SortKey; }> = ({ children, sortKey }) => {
        const isSorted = sort.key === sortKey;
        return <th scope="col" className="px-4 py-3">
            <button onClick={() => handleSort(sortKey)} className="flex items-center space-x-1 group">
                <span className="group-hover:text-purple-500 text-black">{children}</span>
                <span className={`text-black ${isSorted ? 'font-bold' : ''}`}>{isSorted && sort.direction === 'ascending' ? '▲' : '▼'}</span>
            </button>
        </th>;
    };

    const formatDate = (isoString?: string) => isoString ? new Date(isoString).toLocaleString() : 'N/A';

    return (
        <div className="space-y-6 mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title={t('total platform revenue')} value={formatCurrency(financialStats.platformRevenue, 'USD')} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg>} />
                <StatCard title={t('total volume')} value={formatCurrency(financialStats.totalVolume, 'USD')} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>} />
                <StatCard title={t('paid out to providers')} value={formatCurrency(financialStats.paidOutToWorkers, 'USD')} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} />
                <StatCard title={t('currently in escrow')} value={formatCurrency(financialStats.inEscrow, 'USD')} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>} />
            </div>

            <div className="bg-white rounded-xl shadow-lg">
                <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
                    <h2 className="text-lg sm:text-xl font-bold text-black">{t('transactions')} ({filteredAndSortedTransactions.length})</h2>
                    <details className="w-full sm:w-auto"><summary className="cursor-pointer font-semibold text-purple-600 text-sm">{t('toggle filters')}</summary>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-3 text-sm">
                            <input type="text" placeholder={t('search by name email id')} value={filters.search} onChange={e => setFilters(f => ({...f, search: e.target.value}))} className="p-2 border rounded-md bg-slate-100 border-slate-300 text-black" />
                            <select value={filters.status} onChange={e => setFilters(f => ({...f, status: e.target.value as any}))} className="p-2 border rounded-md bg-slate-100 border-slate-300 text-black">
                                <option value="all">{t('all statuses')}</option>
                                <option value="held">{t('held in escrow')}</option>
                                <option value="released">{t('paid out')}</option>
                            </select>
                            <div><label className="block text-xs text-black">{t('paid between')}</label><div className="flex space-x-2"><input type="date" value={filters.dateStart} onChange={e => setFilters(f => ({...f, dateStart: e.target.value}))} className="w-1/2 p-2 border rounded-md bg-slate-100 border-slate-300 text-black"/><input type="date" value={filters.dateEnd} onChange={e => setFilters(f => ({...f, dateEnd: e.target.value}))} className="w-1/2 p-2 border rounded-md bg-slate-100 border-slate-300 text-black"/></div></div>
                            <div className="flex items-center space-x-2 text-black"><label>{t('amount label')}</label><input type="number" placeholder={t('min')} value={filters.minAmount} onChange={e => setFilters(f => ({...f, minAmount: e.target.value}))} className="w-1/2 p-2 border rounded-md bg-slate-100 border-slate-300 text-black" /><input type="number" placeholder={t('max')} value={filters.maxAmount} onChange={e => setFilters(f => ({...f, maxAmount: e.target.value}))} className="w-1/2 p-2 border rounded-md bg-slate-100 border-slate-300 text-black" /></div>
                            <div className="col-span-full text-right"><button onClick={() => setFilters(initialFilters)} className="text-xs bg-slate-200 px-3 py-1 rounded-md hover:bg-slate-300 text-black">{t('reset filters')}</button></div>
                        </div>
                    </details>
                </div>
                <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-sm text-left text-black">
                        <thead className="text-xs uppercase bg-slate-50 text-black">
                            <tr>
                                <th className="px-4 py-3">{t('transaction id')}</th>
                                <th className="px-4 py-3">{t('client')} / {t('provider')}</th>
                                <SortableHeader sortKey="paidAt">{t('date paid')}</SortableHeader>
                                <SortableHeader sortKey="total">{t('total')}</SortableHeader>
                                <SortableHeader sortKey="platformFee">{t('fee')}</SortableHeader>
                                <SortableHeader sortKey="status">{t('status')}</SortableHeader>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAndSortedTransactions.map(t => (
                                <tr key={t.id} className="bg-white border-b border-slate-200 hover:bg-slate-50">
                                    <td className="px-4 py-3 font-mono text-xs text-black">{t.id}</td>
                                    <td className="px-4 py-3">
                                        <p className="font-semibold text-black">{userMap.get(t.clientId)?.name || 'N/A'}</p>
                                        <p className="text-xs text-black">&rarr; {workerMap.get(t.workerId)?.name || 'N/A'}</p>
                                    </td>
                                    <td className="px-4 py-3 text-black">{formatDate(t.paidAt)}</td>
                                    <td className="px-4 py-3 font-semibold text-black">{formatCurrency(t.total, t.currency)}</td>
                                    <td className="px-4 py-3 text-black">{formatCurrency(t.platformFee, t.currency)}</td>
                                    <td className="px-4 py-3 text-black"><span className="capitalize">{t.status}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="sm:hidden divide-y divide-slate-200">
                    {filteredAndSortedTransactions.map(t => (
                        <div key={t.id} className="p-4 space-y-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-semibold text-black">{userMap.get(t.clientId)?.name || 'N/A'}</p>
                                    <p className="text-xs text-black">&rarr; {workerMap.get(t.workerId)?.name || 'N/A'}</p>
                                </div>
                                <span className="text-xs font-bold px-2 py-1 rounded-full bg-slate-100 text-black capitalize">{t.status}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-black opacity-60">{formatDate(t.paidAt)}</span>
                                <span className="font-bold text-black">{formatCurrency(t.total, t.currency)}</span>
                            </div>
                            <div className="flex justify-between text-xs text-black opacity-60">
                                <span>ID: {t.id.slice(-8)}</span>
                                <span>Fee: {formatCurrency(t.platformFee, t.currency)}</span>
                            </div>
                        </div>
                    ))}
                </div>
                {filteredAndSortedTransactions.length === 0 && <p className="text-center py-8 text-black">{t('no matching transactions')}</p>}
            </div>
        </div>
    );
};

export default AdminTransactionsScreen;