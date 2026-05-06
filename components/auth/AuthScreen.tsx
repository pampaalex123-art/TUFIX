import React, { useMemo, useState } from 'react';
import { useToast } from '../common/Toast';
import { User, Worker, JobRequest, ServiceCategory, Transaction, Dispute, AppNotification, Message, Invoice } from '../../types';
import { SERVICE_CATEGORIES } from '../../constants';
import AdminTransactionsScreen from './AdminTransactionsScreen';
import AdminDisputesScreen from '../new/AdminDisputesScreen';
import { formatDistanceToNow } from '../../utils/time';
import AdminPayoutPanel from './AdminPayoutPanel';
import AppAnalyticsDashboard from './AppAnalyticsDashboard';

// --- HELPER FUNCTIONS for CSV Download ---
const escapeCSVCell = (cell: any): string => {
    if (cell === null || cell === undefined) {
        return '';
    }
    const stringCell = String(cell);
    // If the cell contains a comma, a double-quote, or a newline, wrap it in double-quotes.
    if (/[",\n]/.test(stringCell)) {
        // Within a double-quoted field, double-quotes must be escaped by another double-quote.
        return `"${stringCell.replace(/"/g, '""')}"`;
    }
    return stringCell;
};

const convertToCSV = (data: any[]): string => {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [];

    // Add header row
    csvRows.push(headers.map(escapeCSVCell).join(','));

    // Add data rows
    for (const row of data) {
        const values = headers.map(header => escapeCSVCell(row[header]));
        csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
};

const downloadCSV = (csvString: string, filename: string) => {
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url); // Clean up
    }
};

// --- TYPE DEFINITIONS ---
type SortDirection = 'ascending' | 'descending';
type ClientSortKey = 'name' | 'location' | 'jobsRequested' | 'signupDate';
type WorkerSortKey = 'name' | 'service' | 'location' | 'rating' | 'jobsCompleted' | 'totalEarnings' | 'signupDate';
type AdminTab = 'clients' | 'providers' | 'transactions' | 'disputes' | 'support' | 'verifications' | 'settings' | 'pagos' | 'ai_analytics';

interface ClientFilters {
    nameOrEmail: string;
    location: string;
    signupDateStart: string;
    signupDateEnd: string;
    lastLoginDateStart: string;
    lastLoginDateEnd: string;
    minJobs: string;
    maxJobs: string;
}

interface WorkerFilters {
    nameOrEmail: string;
    service: string;
    location: string;
    signupDateStart: string;
    signupDateEnd: string;
    lastLoginDateStart: string;
    lastLoginDateEnd: string;
    minRating: string;
    maxRating: string;
    minJobs: string;
    maxJobs: string;
    minEarnings: string;
    maxEarnings: string;
}

interface AdminDashboardProps {
    users: User[];
    workers: Worker[];
    allJobs: JobRequest[];
    transactions: Transaction[];
    disputes: Dispute[];
    notifications: AppNotification[];
    messages: Message[];
    invoices: Invoice[];
    pendingVerifications: Worker[];
    pendingUsers?: User[];
    onSelectUser: (user: User) => void;
    onDeleteUser: (user: User) => void;
    onSelectWorker: (worker: Worker) => void;
    onDeleteWorker: (worker: Worker) => void;
    onSelectDispute: (dispute: Dispute) => void;
    onSelectSupportConversation: (conversationId: string) => void;
    onSelectVerification: (worker: Worker) => void;
    onEditTerms: () => void;
    onClearAllData: () => void;
    t: (key: string) => string;
    adminId: string;
}

// --- INITIAL STATES ---
const initialClientFilters: ClientFilters = { nameOrEmail: '', location: '', signupDateStart: '', signupDateEnd: '', lastLoginDateStart: '', lastLoginDateEnd: '', minJobs: '', maxJobs: '' };
const initialWorkerFilters: WorkerFilters = { nameOrEmail: '', service: '', location: '', signupDateStart: '', signupDateEnd: '', lastLoginDateStart: '', lastLoginDateEnd: '', minRating: '', maxRating: '', minJobs: '', maxJobs: '', minEarnings: '', maxEarnings: '' };
const ADMIN_ID = 'admin-1';
// --- HELPER COMPONENTS ---
const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-white p-6 rounded-xl shadow-lg flex items-center space-x-4">
        <div className="bg-purple-100 p-3 rounded-full">{icon}</div>
        <div>
            <p className="text-sm text-black font-medium">{title}</p>
            <p className="text-2xl font-bold text-black">{value}</p>
        </div>
    </div>
);

const PieChart: React.FC<{ data: { label: string; value: number; color: string }[]; t: (key: string) => string }> = ({ data, t }) => {
    const total = data.reduce((acc, d) => acc + d.value, 0);
    if (total === 0) return <div className="flex items-center justify-center h-full text-black">{t('no worker data')}</div>;
    let cumulative = 0;
    return (
        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
            {data.map(slice => {
                if (slice.value === 0) return null;
                const percentage = (slice.value / total) * 100;
                const startAngle = (cumulative / 100) * 360;
                const endAngle = ((cumulative + percentage) / 100) * 360;
                cumulative += percentage;
                const largeArcFlag = percentage > 50 ? 1 : 0;
                const pathData = `M 50 50 L ${50 + 50 * Math.cos(startAngle * Math.PI / 180)} ${50 + 50 * Math.sin(startAngle * Math.PI / 180)} A 50 50 0 ${largeArcFlag} 1 ${50 + 50 * Math.cos(endAngle * Math.PI / 180)} ${50 + 50 * Math.sin(endAngle * Math.PI / 180)} Z`;
                return <path key={slice.label} d={pathData} fill={slice.color} />;
            })}
        </svg>
    );
};

// --- MAIN COMPONENT ---
const AdminDashboard: React.FC<AdminDashboardProps> = ({ users, workers, allJobs, transactions, disputes, notifications, messages, invoices, pendingVerifications, pendingUsers = [], onSelectUser, onDeleteUser, onSelectWorker, onDeleteWorker, onSelectDispute, onSelectSupportConversation, onSelectVerification, onEditTerms, onClearAllData, t, adminId }) => {
    const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<AdminTab>('clients');
    const [clientFilters, setClientFilters] = useState<ClientFilters>(initialClientFilters);
    const [workerFilters, setWorkerFilters] = useState<WorkerFilters>(initialWorkerFilters);
    const [clientSort, setClientSort] = useState<{ key: ClientSortKey; direction: SortDirection }>({ key: 'name', direction: 'ascending' });
    const [workerSort, setWorkerSort] = useState<{ key: WorkerSortKey; direction: SortDirection }>({ key: 'name', direction: 'ascending' });
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [workerToDelete, setWorkerToDelete] = useState<Worker | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [boliviaBankAccount, setBoliviaBankAccount] = useState(() => localStorage.getItem('tufix_bolivia_account') || '');
    const [boliviaBankName, setBoliviaBankName] = useState(() => localStorage.getItem('tufix_bolivia_bank') || '');
    const [boliviaBankHolder, setBoliviaBankHolder] = useState(() => localStorage.getItem('tufix_bolivia_holder') || '');
    const [boliviaBankSaved, setBoliviaBankSaved] = useState(false);

  const handleSaveBoliviaBank = () => {
    localStorage.setItem('tufix_bolivia_account', boliviaBankAccount);
    localStorage.setItem('tufix_bolivia_bank', boliviaBankName);
    localStorage.setItem('tufix_bolivia_holder', boliviaBankHolder);
    setBoliviaBankSaved(true);
    setTimeout(() => setBoliviaBankSaved(false), 3000);
  };

    React.useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            const origin = event.origin;
            if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
                return;
            }
            if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
                console.log('Mercado Pago Holding Account linked successfully');
                showToast('Mercado Pago Holding Account linked successfully', 'success');
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    const handleLinkHoldingAccount = async () => {
        const isMobile = window.innerWidth < 768;
        let authWindow: Window | null = null;

        if (!isMobile) {
            // Pre-open window to bypass popup blockers on desktop
            authWindow = window.open('', 'oauth_popup', 'width=600,height=700');
        }

        try {
            const response = await fetch('/api/mercadopago/auth-url?isAdmin=true');
            if (!response.ok) {
                throw new Error('Failed to get auth URL');
            }
            const { url } = await response.json();
            
            if (isMobile) {
                // Direct redirect on mobile
                window.location.href = url;
            } else if (authWindow) {
                // Set URL for pre-opened window on desktop
                authWindow.location.href = url;
            }
        } catch (error) {
            console.error('OAuth error:', error);
            if (authWindow) authWindow.close();
            showToast('Failed to initiate Mercado Pago linking.', 'error');
        }
    };

    const participantMap = useMemo(() => {
        const map = new Map<string, User | Worker>();
        users.forEach(u => map.set(u.id, u));
        workers.forEach(w => map.set(w.id, w));
        return map;
    }, [users, workers]);

    // --- DATA PROCESSING ---
    const workerAnalytics = useMemo(() => {
        const categoryCounts = new Map<ServiceCategory, number>();
        SERVICE_CATEGORIES.forEach(cat => categoryCounts.set(cat.name, 0));
        workers.forEach(worker => categoryCounts.set(worker.service, (categoryCounts.get(worker.service) || 0) + 1));
        const totalWorkers = workers.length;
        const colors = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#6366F1', '#14B8A6'];
        return Array.from(categoryCounts.entries()).map(([category, count], index) => ({
            category, count, percentage: totalWorkers > 0 ? ((count / totalWorkers) * 100).toFixed(1) : '0.0', color: colors[index % colors.length]
        })).sort((a, b) => b.count - a.count);
    }, [workers]);

    const usersWithStats = useMemo(() => users.map(user => ({ ...user, jobsRequested: allJobs.filter(job => job.user.id === user.id).length })), [users, allJobs]);
    const workersWithStats = useMemo(() => workers.map(worker => {
        const completed = allJobs.filter(j => j.workerId === worker.id && j.status === 'completed');
        return { ...worker, jobsCompleted: completed.length, totalEarnings: completed.reduce((sum, j) => sum + (j.finalPrice || 0), 0) };
    }), [workers, allJobs]);

    const filteredAndSortedClients = useMemo(() => {
        let filtered = usersWithStats.filter(user => {
            const minJobs = parseInt(clientFilters.minJobs) || 0;
            const maxJobs = parseInt(clientFilters.maxJobs) || Infinity;
            return (
                ((user.name || '').toLowerCase().includes((clientFilters.nameOrEmail || '').toLowerCase()) || (user.email || '').toLowerCase().includes((clientFilters.nameOrEmail || '').toLowerCase())) &&
                (user.location || '').toLowerCase().includes((clientFilters.location || '').toLowerCase()) &&
                (!clientFilters.signupDateStart || new Date(user.signupDate) >= new Date(clientFilters.signupDateStart)) &&
                (!clientFilters.signupDateEnd || new Date(user.signupDate) <= new Date(clientFilters.signupDateEnd)) &&
                (!clientFilters.lastLoginDateStart || new Date(user.lastLoginDate) >= new Date(clientFilters.lastLoginDateStart)) &&
                (!clientFilters.lastLoginDateEnd || new Date(user.lastLoginDate) <= new Date(clientFilters.lastLoginDateEnd)) &&
                user.jobsRequested >= minJobs &&
                user.jobsRequested <= maxJobs
            );
        });

        // FIX: Replaced sorting logic to use direct property access to ensure type safety.
        filtered.sort((a, b) => {
            const key = clientSort.key;
            let comparison = 0;
            switch (key) {
                case 'name':
                    comparison = a.name.localeCompare(b.name);
                    break;
                case 'location':
                    comparison = a.location.localeCompare(b.location);
                    break;
                case 'signupDate':
                    comparison = a.signupDate.localeCompare(b.signupDate);
                    break;
                case 'jobsRequested':
                    comparison = a.jobsRequested - b.jobsRequested;
                    break;
            }

            return clientSort.direction === 'ascending' ? comparison : -comparison;
        });

        return filtered;
    }, [usersWithStats, clientFilters, clientSort]);

    const filteredAndSortedWorkers = useMemo(() => {
        let filtered = workersWithStats.filter(worker => {
            const minRating = parseFloat(workerFilters.minRating) || 0;
            const maxRating = parseFloat(workerFilters.maxRating) || 5;
            const minJobs = parseInt(workerFilters.minJobs) || 0;
            const maxJobs = parseInt(workerFilters.maxJobs) || Infinity;
            const minEarnings = parseInt(workerFilters.minEarnings) || 0;
            const maxEarnings = parseInt(workerFilters.maxEarnings) || Infinity;
            return (
                 ((worker.name || '').toLowerCase().includes((workerFilters.nameOrEmail || '').toLowerCase()) || (worker.email || '').toLowerCase().includes((workerFilters.nameOrEmail || '').toLowerCase())) &&
                (worker.location || '').toLowerCase().includes((workerFilters.location || '').toLowerCase()) &&
                (!workerFilters.service || worker.service === workerFilters.service) &&
                (!workerFilters.signupDateStart || new Date(worker.signupDate) >= new Date(workerFilters.signupDateStart)) &&
                (!workerFilters.signupDateEnd || new Date(worker.signupDate) <= new Date(workerFilters.signupDateEnd)) &&
                 (!workerFilters.lastLoginDateStart || new Date(worker.lastLoginDate) >= new Date(workerFilters.lastLoginDateStart)) &&
                (!workerFilters.lastLoginDateEnd || new Date(worker.lastLoginDate) <= new Date(workerFilters.lastLoginDateEnd)) &&
                worker.rating >= minRating && worker.rating <= maxRating &&
                worker.jobsCompleted >= minJobs && worker.jobsCompleted <= maxJobs &&
                worker.totalEarnings >= minEarnings && worker.totalEarnings <= maxEarnings
            );
        });

        // FIX: Replaced sorting logic to use direct property access to ensure type safety.
        filtered.sort((a, b) => {
            const key = workerSort.key;
            let comparison = 0;
            switch(key) {
                case 'name':
                    comparison = a.name.localeCompare(b.name);
                    break;
                case 'service':
                    comparison = a.service.localeCompare(b.service);
                    break;
                case 'location':
                    comparison = a.location.localeCompare(b.location);
                    break;
                case 'signupDate':
                    comparison = a.signupDate.localeCompare(b.signupDate);
                    break;
                case 'rating':
                    comparison = a.rating - b.rating;
                    break;
                case 'jobsCompleted':
                    comparison = a.jobsCompleted - b.jobsCompleted;
                    break;
                case 'totalEarnings':
                    comparison = a.totalEarnings - b.totalEarnings;
                    break;
            }
            
            return workerSort.direction === 'ascending' ? comparison : -comparison;
        });

        return filtered;
    }, [workersWithStats, workerFilters, workerSort]);

    const supportConversations = useMemo(() => {
        const convoMap = new Map<string, { user: User | Worker, lastMessage: Message, unreadCount: number }>();

        // Get all unique conversation IDs involving the admin (including the legacy admin-1 ID)
        const adminConvoIds = new Set<string>(
            messages
                .filter(m => m.senderId === adminId || m.receiverId === adminId || m.senderId === 'admin-1' || m.receiverId === 'admin-1')
                .map(m => {
                    const otherId = [m.senderId, m.receiverId].find(id => id !== adminId && id !== 'admin-1');
                    return otherId ? `conv_${[otherId, adminId].sort().join('_')}` : null;
                })
                .filter((id): id is string => !!id)
        );
        
        adminConvoIds.forEach((conversationId: string) => {
            const otherParticipantId = conversationId.replace('conv_', '').split('_').find(id => id !== adminId);
            if (!otherParticipantId) return;
            
            const participant = participantMap.get(otherParticipantId);
             if (participant) {
                const conversationMessages = messages.filter(m => 
                    (m.senderId === participant.id && (m.receiverId === adminId || m.receiverId === 'admin-1')) || 
                    ((m.senderId === adminId || m.senderId === 'admin-1') && m.receiverId === participant.id)
                );
                
                if (conversationMessages.length > 0) {
                    const lastMessage = conversationMessages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
                    const unreadCount = conversationMessages.filter(m => (m.receiverId === adminId || m.receiverId === 'admin-1') && !m.isRead).length;
                    
                    convoMap.set(conversationId, { user: participant, lastMessage, unreadCount });
                }
            }
        });

        return Array.from(convoMap.entries())
            .map(([id, data]) => ({ id, ...data }))
            .sort((a, b) => new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime());
    }, [messages, participantMap, adminId]);

    // --- HANDLERS ---
    const handleClientSort = (key: ClientSortKey) => setClientSort(prev => ({ key, direction: prev.key === key && prev.direction === 'ascending' ? 'descending' : 'ascending' }));
    const handleWorkerSort = (key: WorkerSortKey) => setWorkerSort(prev => ({ key, direction: prev.key === key && prev.direction === 'ascending' ? 'descending' : 'ascending' }));
    
    // --- DOWNLOAD HANDLERS ---
    const handleDownloadClients = () => {
        const clientsForExport = filteredAndSortedClients.map(client => ({
            id: client.id,
            name: client.name,
            email: client.email,
            location: client.location,
            phone: `${client.phoneNumber.code} ${client.phoneNumber.number}`,
            id_number: client.idNumber,
            rating: client.rating,
            reviews_count: (client.reviews || []).length,
            jobs_requested: client.jobsRequested,
            signup_date: client.signupDate,
            last_login_date: client.lastLoginDate,
        }));
        const csvData = convertToCSV(clientsForExport);
        downloadCSV(csvData, `tufix_clients_${new Date().toISOString().split('T')[0]}.csv`);
    };

    const handleDownloadWorkers = () => {
        const workersForExport = filteredAndSortedWorkers.map(worker => ({
            id: worker.id,
            name: worker.name,
            email: worker.email,
            service: worker.service,
            location: worker.location,
            phone: `${worker.phoneNumber.code} ${worker.phoneNumber.number}`,
            id_number: worker.idNumber,
            rating: worker.rating,
            reviews_count: (worker.reviews || []).length,
            jobs_completed: worker.jobsCompleted,
            total_earnings: worker.totalEarnings,
            verification_status: worker.verificationStatus,
            signup_date: worker.signupDate,
            last_login_date: worker.lastLoginDate,
            approval_date: worker.approvalDate || '',
            admin_approver_id: worker.adminApproverId || '',
            id_photo_url: worker.idPhotoUrl || '',
            selfie_photo_url: worker.selfiePhotoUrl || '',
        }));
        const csvData = convertToCSV(workersForExport);
        downloadCSV(csvData, `tufix_providers_${new Date().toISOString().split('T')[0]}.csv`);
    };

    // --- RENDER ---
    // FIX: Replaced React.FC with a generic functional component to ensure type safety for props.
    const SortableHeader = <T extends ClientSortKey | WorkerSortKey>({
        children,
        sortKey,
        currentSort,
        onSort,
    }: {
        children: React.ReactNode;
        sortKey: T;
        currentSort: { key: ClientSortKey | WorkerSortKey; direction: SortDirection };
        onSort: (key: T) => void;
    }) => {
        const isSorted = currentSort.key === sortKey;
        return (
            <th scope="col" className="px-6 py-3">
                <button onClick={() => onSort(sortKey)} className="flex items-center space-x-1 group">
                    <span className="group-hover:text-purple-600 text-black">{children}</span>
                    <span className={`text-black ${isSorted ? 'font-bold' : ''}`}>
                        {isSorted && (currentSort.direction === 'ascending' ? '▲' : '▼')}
                    </span>
                </button>
            </th>
        );
    };
    
    const TabButton: React.FC<{tabId: AdminTab; children: React.ReactNode; badgeCount?: number}> = ({ tabId, children, badgeCount }) => (
        <button
            onClick={() => setActiveTab(tabId)}
            className={`px-3 py-2 text-sm font-semibold rounded-lg sm:rounded-none sm:rounded-t-lg sm:border-b-2 transition-colors flex items-center space-x-2 ${
                activeTab === tabId 
                ? 'bg-purple-100 text-purple-700 sm:bg-transparent sm:border-purple-500 sm:text-purple-600' 
                : 'bg-slate-50 text-black hover:bg-slate-100 sm:bg-transparent sm:border-transparent sm:hover:text-purple-600'
            }`}
        >
            <span>{children}</span>
            {badgeCount != null && badgeCount > 0 && <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">{badgeCount}</span>}
        </button>
    );

    const openDisputesCount = disputes.filter(d => d.status === 'open' || d.status === 'under_review').length;
    const openSupportChatsCount = supportConversations.filter(c => c.unreadCount > 0).length;
    const verificationsCount = pendingVerifications.length + pendingUsers.length;

    return (
        <div className="container mx-auto space-y-8 px-4 sm:px-0">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-black">{t('admin dashboard')}</h1>
                <button
                    onClick={onEditTerms}
                    className="bg-white border border-slate-200 text-black font-semibold py-2 px-4 rounded-lg hover:bg-slate-50 transition flex items-center justify-center space-x-2 w-full sm:w-auto"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span>{t('edit terms and services')}</span>
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title={t('total clients')} value={users.length} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M17 20v-2a3 3 0 00-3-3H10a3 3 0 00-3 3v2m7-10a3 3 0 11-6 0 3 3 0 016 0zm-7 4a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} />
                <StatCard title={t('total workers')} value={workers.length} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7.864 4.243A7.5 7.5 0 0119.5 12c0 2.42-.943 4.638-2.464 6.313M15.75 10.5a3 3 0 01-3 3M15.75 10.5a3 3 0 00-3-3M15.75 10.5V18m-4.5-3.375a3 3 0 01-3 3m3-3a3 3 0 00-3-3m3 3V18m-9-3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v6.75a1.5 1.5 0 001.5 1.5z" /></svg>} />
                <StatCard title={t('jobs completed')} value={allJobs.filter(j=>j.status === 'completed').length} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
                <StatCard title={t('open disputes')} value={openDisputesCount} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>} />
            </div>
            
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="border-b border-slate-200">
                    <div className="p-2 sm:px-4 sm:py-0">
                        <nav className="flex flex-wrap gap-2 sm:gap-0 sm:space-x-6 sm:-mb-px" aria-label="Tabs">
                            <TabButton tabId="clients">{t('clients')}</TabButton>
                            <TabButton tabId="providers">{t('providers')}</TabButton>
                            <TabButton tabId="verifications" badgeCount={verificationsCount}>{t('verifications')}</TabButton>
                            <TabButton tabId="transactions">{t('transactions')}</TabButton>
                            <TabButton tabId="pagos">💰 Pagos</TabButton>
                            <TabButton tabId="disputes" badgeCount={openDisputesCount}>{t('disputes')}</TabButton>
                            <TabButton tabId="support" badgeCount={openSupportChatsCount}>{t('support')}</TabButton>
                            <TabButton tabId="ai_analytics">📊 Analytics App</TabButton>
                            <TabButton tabId="settings">{t('settings')}</TabButton>
                        </nav>
                    </div>
                </div>

                {activeTab === 'clients' && (
                    <div>
                        <div className="p-4 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
                            <h2 className="text-lg sm:text-xl font-bold text-black">{t('client management')} ({filteredAndSortedClients.length})</h2>
                            <button onClick={handleDownloadClients} className="bg-purple-100 text-purple-700 font-semibold py-2 px-4 rounded-lg hover:bg-purple-200 text-sm flex items-center justify-center space-x-2 w-full sm:w-auto">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                <span>{t('download csv')}</span>
                            </button>
                        </div>
                        <details className="p-4 sm:p-6 pt-0"><summary className="cursor-pointer font-semibold text-purple-600 text-sm">{t('toggle filters')}</summary>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 text-sm">
                                <input type="text" placeholder={t('name or email')} value={clientFilters.nameOrEmail} onChange={e => setClientFilters(f => ({...f, nameOrEmail: e.target.value}))} className="p-2 border rounded-md bg-slate-100 border-slate-300 text-black" />
                                <input type="text" placeholder={t('location')} value={clientFilters.location} onChange={e => setClientFilters(f => ({...f, location: e.target.value}))} className="p-2 border rounded-md bg-slate-100 border-slate-300 text-black" />
                                <div className="flex items-center space-x-2"><input type="number" placeholder={t('min jobs')} value={clientFilters.minJobs} onChange={e => setClientFilters(f => ({...f, minJobs: e.target.value}))} className="w-1/2 p-2 border rounded-md bg-slate-100 border-slate-300 text-black" /><input type="number" placeholder={t('max jobs')} value={clientFilters.maxJobs} onChange={e => setClientFilters(f => ({...f, maxJobs: e.target.value}))} className="w-1/2 p-2 border rounded-md bg-slate-100 border-slate-300 text-black" /></div>
                                <div><label className="block text-xs text-black">{t('joined between')}</label><div className="flex space-x-2"><input type="date" value={clientFilters.signupDateStart} onChange={e => setClientFilters(f => ({...f, signupDateStart: e.target.value}))} className="w-1/2 p-2 border rounded-md bg-slate-100 border-slate-300 text-black"/><input type="date" value={clientFilters.signupDateEnd} onChange={e => setClientFilters(f => ({...f, signupDateEnd: e.target.value}))} className="w-1/2 p-2 border rounded-md bg-slate-100 border-slate-300 text-black"/></div></div>
                                <div><label className="block text-xs text-black">{t('last login between')}</label><div className="flex space-x-2"><input type="date" value={clientFilters.lastLoginDateStart} onChange={e => setClientFilters(f => ({...f, lastLoginDateStart: e.target.value}))} className="w-1/2 p-2 border rounded-md bg-slate-100 border-slate-300 text-black"/><input type="date" value={clientFilters.lastLoginDateEnd} onChange={e => setClientFilters(f => ({...f, lastLoginDateEnd: e.target.value}))} className="w-1/2 p-2 border rounded-md bg-slate-100 border-slate-300 text-black"/></div></div>
                                <div className="col-span-full text-right"><button onClick={() => setClientFilters(initialClientFilters)} className="text-xs bg-slate-200 px-3 py-1 rounded-md hover:bg-slate-300 text-black">{t('reset filters')}</button></div>
                            </div>
                        </details>
                        <div className="hidden sm:block overflow-x-auto"><table className="w-full text-sm text-left text-black">
                            <thead className="text-xs text-black uppercase bg-slate-50"><tr>
                                <SortableHeader sortKey="name" currentSort={clientSort} onSort={handleClientSort}>{t('client')}</SortableHeader>
                                <SortableHeader sortKey="location" currentSort={clientSort} onSort={handleClientSort}>{t('location')}</SortableHeader>
                                <SortableHeader sortKey="jobsRequested" currentSort={clientSort} onSort={handleClientSort}>{t('jobs')}</SortableHeader>
                                <SortableHeader sortKey="signupDate" currentSort={clientSort} onSort={handleClientSort}>{t('joined')}</SortableHeader>
                                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">{t('actions')}</th>
                            </tr></thead>
                            <tbody className="divide-y divide-slate-200">{filteredAndSortedClients.map(user => <tr key={user.id} onClick={() => onSelectUser(user)} className="hover:bg-slate-50 cursor-pointer">
                                <td className="px-6 py-4 flex items-center space-x-3"><img className="w-10 h-10 rounded-full" src={user.avatarUrl} alt={user.name}/><div><p className="font-medium text-black">{user.name}</p><p className="text-xs text-black">{user.email}</p></div></td>
                                <td className="px-6 py-4">{user.location}</td><td className="px-6 py-4">{user.jobsRequested}</td>
                                <td className="px-6 py-4">{new Date(user.signupDate).toLocaleDateString()}</td>
                                <td className="px-6 py-4">
                                    <button 
                                        onClick={(e) => { 
                                            e.stopPropagation(); 
                                            console.log('Delete button clicked for client:', user.id);
                                            setUserToDelete(user); 
                                        }}
                                        className="text-red-600 hover:text-red-800 font-medium text-sm"
                                    >
                                        {t('delete')}
                                    </button>
                                </td>
                            </tr>)}</tbody>
                        </table></div>
                        <div className="sm:hidden divide-y divide-slate-200">
                            {filteredAndSortedClients.map(user => (
                                <div key={user.id} onClick={() => onSelectUser(user)} className="p-4 space-y-3 active:bg-slate-50">
                                    <div className="flex items-center space-x-4">
                                        <img className="w-12 h-12 rounded-full" src={user.avatarUrl} alt={user.name}/>
                                        <div className="flex-1">
                                            <p className="font-bold text-black">{user.name}</p>
                                            <p className="text-xs text-black opacity-60">{user.email}</p>
                                        </div>
                                        <button 
                                            onClick={(e) => { 
                                                e.stopPropagation(); 
                                                console.log('Mobile delete button clicked for client:', user.id);
                                                setUserToDelete(user); 
                                            }}
                                            className="text-red-600 hover:text-red-800 font-medium text-sm px-3 py-1 border border-red-200 rounded-lg"
                                        >
                                            {t('delete')}
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                        <div className="bg-slate-50 p-2 rounded">
                                            <p className="text-black opacity-60">{t('location')}</p>
                                            <p className="font-bold text-black truncate">{user.location}</p>
                                        </div>
                                        <div className="bg-slate-50 p-2 rounded">
                                            <p className="text-black opacity-60">{t('jobs')}</p>
                                            <p className="font-bold text-black">{user.jobsRequested}</p>
                                        </div>
                                        <div className="bg-slate-50 p-2 rounded">
                                            <p className="text-black opacity-60">{t('joined')}</p>
                                            <p className="font-bold text-black">{new Date(user.signupDate).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                {activeTab === 'providers' && (
                    <div>
                        <div className="p-4 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
                            <h2 className="text-lg sm:text-xl font-bold text-black">{t('provider management')} ({filteredAndSortedWorkers.length})</h2>
                            <button onClick={handleDownloadWorkers} className="bg-purple-100 text-purple-700 font-semibold py-2 px-4 rounded-lg hover:bg-purple-200 text-sm flex items-center justify-center space-x-2 w-full sm:w-auto">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                <span>{t('download csv')}</span>
                            </button>
                        </div>
                        <details className="p-4 sm:p-6 pt-0"><summary className="cursor-pointer font-semibold text-purple-600 text-sm">{t('toggle filters')}</summary>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 text-sm">
                                <input type="text" placeholder={t('name or email')} value={workerFilters.nameOrEmail} onChange={e => setWorkerFilters(f => ({...f, nameOrEmail: e.target.value}))} className="p-2 border rounded-md bg-slate-100 border-slate-300 text-black" />
                                <input type="text" placeholder={t('location')} value={workerFilters.location} onChange={e => setWorkerFilters(f => ({...f, location: e.target.value}))} className="p-2 border rounded-md bg-slate-100 border-slate-300 text-black" />
                                <select value={workerFilters.service} onChange={e => setWorkerFilters(f => ({...f, service: e.target.value}))} className="p-2 border rounded-md bg-slate-100 border-slate-300 text-black"><option value="">{t('all services')}</option>{SERVICE_CATEGORIES.map(c=><option key={c.name} value={c.name}>{t(c.name)}</option>)}</select>
                                <div className="flex items-center space-x-2 text-black"><label>{t('rating label')}</label><input type="number" placeholder={t('min')} value={workerFilters.minRating} onChange={e => setWorkerFilters(f => ({...f, minRating: e.target.value}))} className="w-1/2 p-2 border rounded-md bg-slate-100 border-slate-300 text-black" /><input type="number" placeholder={t('max')} value={workerFilters.maxRating} onChange={e => setWorkerFilters(f => ({...f, maxRating: e.target.value}))} className="w-1/2 p-2 border rounded-md bg-slate-100 border-slate-300 text-black" /></div>
                                <div className="flex items-center space-x-2 text-black"><label>{t('jobs label')}</label><input type="number" placeholder={t('min')} value={workerFilters.minJobs} onChange={e => setWorkerFilters(f => ({...f, minJobs: e.target.value}))} className="w-1/2 p-2 border rounded-md bg-slate-100 border-slate-300 text-black" /><input type="number" placeholder={t('max')} value={workerFilters.maxJobs} onChange={e => setWorkerFilters(f => ({...f, maxJobs: e.target.value}))} className="w-1/2 p-2 border rounded-md bg-slate-100 border-slate-300 text-black" /></div>
                                <div className="flex items-center space-x-2 text-black"><label>{t('earnings label')}</label><input type="number" placeholder={t('min')} value={workerFilters.minEarnings} onChange={e => setWorkerFilters(f => ({...f, minEarnings: e.target.value}))} className="w-1/2 p-2 border rounded-md bg-slate-100 border-slate-300 text-black" /><input type="number" placeholder={t('max')} value={workerFilters.maxEarnings} onChange={e => setWorkerFilters(f => ({...f, maxEarnings: e.target.value}))} className="w-1/2 p-2 border rounded-md bg-slate-100 border-slate-300 text-black" /></div>
                                <div><label className="block text-xs text-black">{t('joined between')}</label><div className="flex space-x-2"><input type="date" value={workerFilters.signupDateStart} onChange={e => setWorkerFilters(f => ({...f, signupDateStart: e.target.value}))} className="w-1/2 p-2 border rounded-md bg-slate-100 border-slate-300 text-black"/><input type="date" value={workerFilters.signupDateEnd} onChange={e => setWorkerFilters(f => ({...f, signupDateEnd: e.target.value}))} className="w-1/2 p-2 border rounded-md bg-slate-100 border-slate-300 text-black"/></div></div>
                                <div><label className="block text-xs text-black">{t('last login between')}</label><div className="flex space-x-2"><input type="date" value={workerFilters.lastLoginDateStart} onChange={e => setWorkerFilters(f => ({...f, lastLoginDateStart: e.target.value}))} className="w-1/2 p-2 border rounded-md bg-slate-100 border-slate-300 text-black"/><input type="date" value={workerFilters.lastLoginDateEnd} onChange={e => setWorkerFilters(f => ({...f, lastLoginDateEnd: e.target.value}))} className="w-1/2 p-2 border rounded-md bg-slate-100 border-slate-300 text-black"/></div></div>
                                <div className="col-span-full text-right"><button onClick={() => setWorkerFilters(initialWorkerFilters)} className="text-xs bg-slate-200 px-3 py-1 rounded-md hover:bg-slate-300 text-black">{t('reset filters')}</button></div>
                            </div>
                        </details>
                        <div className="hidden sm:block overflow-x-auto"><table className="w-full text-sm text-left text-black">
                            <thead className="text-xs text-black uppercase bg-slate-50"><tr>
                                <SortableHeader sortKey="name" currentSort={workerSort} onSort={handleWorkerSort}>{t('provider')}</SortableHeader>
                                <SortableHeader sortKey="service" currentSort={workerSort} onSort={handleWorkerSort}>{t('service')}</SortableHeader>
                                <SortableHeader sortKey="location" currentSort={workerSort} onSort={handleWorkerSort}>{t('location')}</SortableHeader>
                                <SortableHeader sortKey="rating" currentSort={workerSort} onSort={handleWorkerSort}>{t('rating')}</SortableHeader>
                                <SortableHeader sortKey="jobsCompleted" currentSort={workerSort} onSort={handleWorkerSort}>{t('jobs done')}</SortableHeader>
                                <SortableHeader sortKey="totalEarnings" currentSort={workerSort} onSort={handleWorkerSort}>{t('earnings')}</SortableHeader>
                                <SortableHeader sortKey="signupDate" currentSort={workerSort} onSort={handleWorkerSort}>{t('joined')}</SortableHeader>
                                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">{t('actions')}</th>
                            </tr></thead>
                            <tbody className="divide-y divide-slate-200">{filteredAndSortedWorkers.map(worker => <tr key={worker.id} onClick={() => onSelectWorker(worker)} className="hover:bg-slate-50 cursor-pointer">
                                <td className="px-6 py-4 flex items-center space-x-3"><img className="w-10 h-10 rounded-full" src={worker.avatarUrl} alt={worker.name}/><div><p className="font-medium text-black">{worker.name}</p><p className="text-xs text-black">{worker.email}</p></div></td>
                                <td className="px-6 py-4"><span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">{t(worker.service)}</span></td>
                                <td className="px-6 py-4">{worker.location}</td><td className="px-6 py-4">{worker.rating.toFixed(1)} ★</td>
                                <td className="px-6 py-4">{worker.jobsCompleted}</td><td className="px-6 py-4">${worker.totalEarnings.toFixed(2)}</td>
                                <td className="px-6 py-4">{new Date(worker.signupDate).toLocaleDateString()}</td>
                                <td className="px-6 py-4">
                                    <button 
                                        onClick={(e) => { 
                                            e.stopPropagation(); 
                                            console.log('Delete button clicked for provider:', worker.id);
                                            setWorkerToDelete(worker); 
                                        }}
                                        className="text-red-600 hover:text-red-800 font-medium text-sm"
                                    >
                                        {t('delete')}
                                    </button>
                                </td>
                            </tr>)}</tbody>
                        </table></div>
                        <div className="sm:hidden divide-y divide-slate-200">
                            {filteredAndSortedWorkers.map(worker => (
                                <div key={worker.id} onClick={() => onSelectWorker(worker)} className="p-4 space-y-3 active:bg-slate-50">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center space-x-3">
                                            <img className="w-12 h-12 rounded-full" src={worker.avatarUrl} alt={worker.name}/>
                                            <div>
                                                <p className="font-bold text-black">{worker.name}</p>
                                                <p className="text-xs text-black opacity-60">{worker.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end space-y-2">
                                            <span className="px-2 py-1 text-[10px] font-bold rounded-full bg-green-100 text-green-800 uppercase">{t(worker.service)}</span>
                                            <button 
                                                onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    console.log('Mobile delete button clicked for provider:', worker.id);
                                                    setWorkerToDelete(worker); 
                                                }}
                                                className="text-red-600 hover:text-red-800 font-medium text-xs px-2 py-1 border border-red-200 rounded"
                                            >
                                                {t('delete')}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div className="flex justify-between bg-slate-50 p-2 rounded">
                                            <span className="text-black opacity-60">{t('location')}</span>
                                            <span className="font-bold text-black truncate max-w-[100px]">{worker.location}</span>
                                        </div>
                                        <div className="flex justify-between bg-slate-50 p-2 rounded">
                                            <span className="text-black opacity-60">{t('joined')}</span>
                                            <span className="font-bold text-black">{new Date(worker.signupDate).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex justify-between bg-slate-50 p-2 rounded">
                                            <span className="text-black opacity-60">{t('rating')}</span>
                                            <span className="font-bold text-black">{worker.rating.toFixed(1)} ★</span>
                                        </div>
                                        <div className="flex justify-between bg-slate-50 p-2 rounded">
                                            <span className="text-black opacity-60">{t('jobs done')}</span>
                                            <span className="font-bold text-black">{worker.jobsCompleted}</span>
                                        </div>
                                        <div className="col-span-2 flex justify-between bg-slate-50 p-2 rounded">
                                            <span className="text-black opacity-60">{t('earnings')}</span>
                                            <span className="font-bold text-black">${worker.totalEarnings.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
               {activeTab === 'verifications' && (
                    <div className="p-4 space-y-6">
                        <div>
                          <h2 className="text-xl font-bold text-black mb-3">🔧 Proveedores Pendientes ({pendingVerifications.length})</h2>
                          {pendingVerifications.length > 0 ? (
                              <div className="space-y-2">
                                  {pendingVerifications.map(worker => (
                                      <button
                                          key={worker.id}
                                          onClick={() => onSelectVerification(worker)}
                                          className="w-full text-left p-3 flex items-center space-x-4 rounded-lg hover:bg-slate-100"
                                      >
                                          <img className="w-12 h-12 rounded-full" src={worker.avatarUrl} alt={worker.name} />
                                          <div className="flex-1">
                                              <p className="font-bold text-black">{worker.name}</p>
                                              <p className="text-sm text-black">{worker.email}</p>
                                          </div>
                                          <div className="text-sm text-black">
                                              <p>{t('submitted')} {formatDistanceToNow(worker.signupDate, t)}</p>
                                          </div>
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                      </button>
                                  ))}
                              </div>
                          ) : (
                               <p className="text-center py-4 text-slate-400 text-sm">{t('no pending verifications')}</p>
                          )}
                        </div>
                        <div className="border-t border-slate-200 pt-6">
                          <h2 className="text-xl font-bold text-black mb-3">👤 Usuarios Pendientes ({pendingUsers.length})</h2>
                          {pendingUsers.length > 0 ? (
                              <div className="space-y-2">
                                  {pendingUsers.map(user => (
                                      <button
                                          key={user.id}
                                          onClick={() => onSelectUser(user)}
                                          className="w-full text-left p-3 flex items-center space-x-4 rounded-lg hover:bg-slate-100"
                                      >
                                          <img className="w-12 h-12 rounded-full" src={user.avatarUrl} alt={user.name} />
                                          <div className="flex-1">
                                              <p className="font-bold text-black">{user.name}</p>
                                              <p className="text-sm text-black">{user.email}</p>
                                          </div>
                                          <span className="text-xs bg-yellow-100 text-yellow-800 font-bold px-2 py-1 rounded-full">⏳ Pendiente</span>
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                      </button>
                                  ))}
                              </div>
                          ) : (
                              <p className="text-center py-4 text-slate-400 text-sm">No hay usuarios pendientes de verificación.</p>
                          )}
                        </div>
                    </div>
                )}

                {activeTab === 'transactions' && (
                    <div className="p-4">
                        <AdminTransactionsScreen transactions={transactions} users={users} workers={workers} t={t} />
                    </div>
                )}
                
                {activeTab === 'pagos' && (
                    <div className="p-4">
                        <AdminPayoutPanel
                            jobs={allJobs}
                            workers={workers}
                            users={users}
                            invoices={invoices}
                            t={t}
                        />
                    </div>
                )}
                {activeTab === 'support' && (
                    <div className="p-4">
                        <h2 className="text-xl font-bold text-black mb-4">{t('support requests')} ({supportConversations.length})</h2>
                        {supportConversations.length === 0 ? (
                            <p className="text-center py-8 text-black">{t('no support requests')}</p>
                        ) : (
                            <div className="space-y-2">
                                {supportConversations.map(convo => (
                                    <button 
                                        key={convo.id} 
                                        onClick={() => onSelectSupportConversation(convo.id)} 
                                        className="w-full text-left p-3 flex items-center space-x-4 rounded-lg hover:bg-slate-100"
                                    >
                                        <img src={convo.user.avatarUrl} alt={convo.user.name} className="w-12 h-12 rounded-full" />
                                        <div className="flex-1 overflow-hidden">
                                            <div className="flex justify-between items-baseline">
                                                <p className={`font-bold ${convo.unreadCount > 0 ? 'text-purple-600' : 'text-black'}`}>{convo.user.name}</p>
                                                <span className="text-xs text-black flex-shrink-0">{formatDistanceToNow(convo.lastMessage.timestamp, t)}</span>
                                            </div>
                                            <p className={`text-sm truncate ${convo.unreadCount > 0 ? 'font-semibold text-black' : 'text-black'}`}>
                                                {convo.lastMessage.senderId === adminId && <span>{t('you prefix')}</span>}
                                                {convo.lastMessage.text}
                                            </p>
                                        </div>
                                        {convo.unreadCount > 0 && (
                                            <span className="bg-purple-600 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center flex-shrink-0">{convo.unreadCount}</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
                {activeTab === 'ai_analytics' && (
                    <AppAnalyticsDashboard
                        users={users}
                        workers={workers}
                        allJobs={allJobs}
                        transactions={transactions}
                    />
                )}
                {activeTab === 'settings' && (
                    <div className="p-8 space-y-8">
                        <div>
                            <h2 className="text-2xl font-bold text-black mb-4">{t('financial settings')}</h2>
                            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                                <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
                                    <div>
                                        <h3 className="text-lg font-bold text-black">{t('mercado pago holding account')}</h3>
                                        <p className="text-sm text-slate-600 max-w-md">{t('mercado pago holding account desc')}</p>
                                    </div>
                                    {/* Bolivia Bank Account */}
                          <div className="border border-slate-200 rounded-xl p-5 mt-4">
                            <h3 className="font-semibold text-black mb-1">🏦 Cuenta Bancaria Bolivia (BOB)</h3>
                            <p className="text-sm text-slate-500 mb-4">Los pagos en Bolivia mediante QR o transferencia se acreditarán en esta cuenta. El 10% de comisión quedará retenido aquí.</p>
                            <div className="space-y-3">
                              <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Número de Cuenta</label>
                                <input
                                  type="text"
                                  value={boliviaBankAccount}
                                  onChange={e => setBoliviaBankAccount(e.target.value)}
                                  placeholder="Ej: 1234567890"
                                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-black focus:ring-2 focus:ring-purple-500"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Banco</label>
                                <select
                                  value={boliviaBankName}
                                  onChange={e => setBoliviaBankName(e.target.value)}
                                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-black focus:ring-2 focus:ring-purple-500"
                                >
                                  <option value="">Seleccionar banco...</option>
                                  <option>Banco Union</option>
                                  <option>BNB - Banco Nacional de Bolivia</option>
                                  <option>Banco Mercantil Santa Cruz</option>
                                  <option>BISA</option>
                                  <option>Banco Económico</option>
                                  <option>Banco Solidario (BancoSol)</option>
                                  <option>Banco de Crédito de Bolivia</option>
                                  <option>Banco Los Andes Procredit</option>
                                  <option>Banco FIE</option>
                                  <option>Banco Fortaleza</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Titular de la cuenta</label>
                                <input
                                  type="text"
                                  value={boliviaBankHolder}
                                  onChange={e => setBoliviaBankHolder(e.target.value)}
                                  placeholder="Nombre completo del titular"
                                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-black focus:ring-2 focus:ring-purple-500"
                                />
                              </div>
                              <button
                                onClick={handleSaveBoliviaBank}
                                className="w-full bg-purple-600 text-white font-bold py-3 rounded-xl hover:bg-purple-700 transition"
                              >
                                Guardar Cuenta Bolivia
                              </button>
                              {boliviaBankSaved && (
                                <p className="text-sm text-green-600 font-medium text-center">✅ Cuenta guardada correctamente</p>
                              )}
                            </div>
                          </div>
                                    <button 
                                        onClick={handleLinkHoldingAccount}
                                        className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition flex items-center justify-center space-x-2 shadow-md"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                        </svg>
                                        <span>{t('link holding account')}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            <div className="bg-red-50 rounded-xl p-6 border border-red-200">
                <h2 className="text-xl font-bold text-red-700 mb-2">{t('danger zone')}</h2>
                <p className="text-sm text-red-600 mb-4">{t('clear all data description')}</p>
                <button 
                    onClick={() => setShowClearConfirm(true)}
                    className="bg-red-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-red-700 transition"
                >
                    {t('clear all data')}
                </button>
            </div>

            {showClearConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
                        <h3 className="text-xl font-bold text-black mb-4">{t('confirm clear all data')}</h3>
                        <p className="text-black mb-6">{t('clear all data warning')}</p>
                        <div className="flex space-x-4">
                            <button 
                                onClick={() => setShowClearConfirm(false)}
                                className="flex-1 bg-slate-100 text-black font-bold py-2 rounded-lg hover:bg-slate-200"
                            >
                                {t('cancel')}
                            </button>
                            <button 
                                onClick={() => {
                                    onClearAllData();
                                    setShowClearConfirm(false);
                                }}
                                className="flex-1 bg-red-600 text-white font-bold py-2 rounded-lg hover:bg-red-700"
                            >
                                {t('yes clear all')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {userToDelete && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
                        <h3 className="text-xl font-bold text-black mb-4">Delete Client</h3>
                        <p className="text-black mb-6">Are you sure you want to delete client <strong>{userToDelete.name}</strong>? This action will remove them from the database and platform and cannot be undone.</p>
                        <div className="flex space-x-4">
                            <button 
                                onClick={() => setUserToDelete(null)}
                                disabled={isDeleting}
                                className="flex-1 bg-slate-100 text-black font-bold py-2 rounded-lg hover:bg-slate-200 disabled:opacity-50"
                            >
                                {t('cancel')}
                            </button>
                            <button 
                                onClick={async () => {
                                    setIsDeleting(true);
                                    try {
                                        await onDeleteUser(userToDelete);
                                        setUserToDelete(null);
                                    } finally {
                                        setIsDeleting(false);
                                    }
                                }}
                                disabled={isDeleting}
                                className="flex-1 bg-red-600 text-white font-bold py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center space-x-2"
                            >
                                {isDeleting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                        <span>{t('deleting')}...</span>
                                    </>
                                ) : (
                                    <span>{t('delete')}</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {workerToDelete && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
                        <h3 className="text-xl font-bold text-black mb-4">Delete Provider</h3>
                        <p className="text-black mb-6">Are you sure you want to delete provider <strong>{workerToDelete.name}</strong>? This action will remove them from the database and platform and cannot be undone.</p>
                        <div className="flex space-x-4">
                            <button 
                                onClick={() => setWorkerToDelete(null)}
                                disabled={isDeleting}
                                className="flex-1 bg-slate-100 text-black font-bold py-2 rounded-lg hover:bg-slate-200 disabled:opacity-50"
                            >
                                {t('cancel')}
                            </button>
                            <button 
                                onClick={async () => {
                                    setIsDeleting(true);
                                    try {
                                        await onDeleteWorker(workerToDelete);
                                        setWorkerToDelete(null);
                                    } finally {
                                        setIsDeleting(false);
                                    }
                                }}
                                disabled={isDeleting}
                                className="flex-1 bg-red-600 text-white font-bold py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center space-x-2"
                            >
                                {isDeleting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                        <span>{t('deleting')}...</span>
                                    </>
                                ) : (
                                    <span>{t('delete')}</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;