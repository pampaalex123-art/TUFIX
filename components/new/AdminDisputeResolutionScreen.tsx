import React, { useState, useRef, useEffect } from 'react';
import { Dispute, JobRequest, User, Worker, Invoice } from '../../types';
import { formatCurrency } from '../../constants';

interface AdminDisputeResolutionScreenProps {
    dispute: Dispute;
    job: JobRequest;
    client: User;
    worker: Worker;
    invoice: Invoice;
    onBack: () => void;
    onSendMessage: (disputeId: string, text: string) => void;
    onResolve: (disputeId: string, resolution: string, fundAction: 'release_full' | 'refund_full' | 'refund_partial', partialAmount?: number) => void;
    t: (key: string) => string;
}

type FundAction = 'release_full' | 'refund_full' | 'refund_partial';

const AdminDisputeResolutionScreen: React.FC<AdminDisputeResolutionScreenProps> = ({ dispute, job, client, worker, invoice, onBack, onSendMessage, onResolve, t }) => {
    const [message, setMessage] = useState('');
    const [isResolveModalOpen, setResolveModalOpen] = useState(false);
    const [fundAction, setFundAction] = useState<FundAction>('release_full');
    const [partialAmount, setPartialAmount] = useState<number>(0);
    const [resolutionText, setResolutionText] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [dispute.messages]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (message.trim()) {
            onSendMessage(dispute.id, message);
            setMessage('');
        }
    };

    const handleResolve = () => {
        if (!resolutionText.trim()) {
            alert('Please provide a final resolution summary.');
            return;
        }
        if (fundAction === 'refund_partial' && (partialAmount <= 0 || partialAmount >= invoice.total)) {
            alert(`Partial refund must be greater than $0 and less than the total of $${invoice.total.toFixed(2)}.`);
            return;
        }
        onResolve(dispute.id, resolutionText, fundAction, partialAmount);
        setResolveModalOpen(false);
    };

    const raisedBy = dispute.raisedByType === 'user' ? client : worker;

    return (
        <div className="container mx-auto max-w-6xl">
            <button onClick={onBack} className="flex items-center text-black hover:text-purple-600 font-semibold mb-6">
                &larr; {t('back_to_disputes')}
            </button>
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="p-6 border-b">
                    <h1 className="text-3xl font-bold text-black">{t('dispute_resolution')}</h1>
                    <p className="text-black">{t('job_id_label')} {job.id.slice(-6)} &bull; {t('dispute_id_label')} {dispute.id.slice(-6)}</p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
                    {/* Left Panel: Details */}
                    <div className="lg:col-span-1 space-y-6">
                        <InfoCard title={t('job_summary')}>
                            <p className="text-black"><strong>{t('service_label')}</strong> {t(job.service)}</p>
                            <p className="text-black"><strong>{t('date_label')}</strong> {new Date(job.date).toLocaleDateString()}</p>
                            <p className="text-black"><strong>{t('amount_in_escrow')}</strong> <span className="font-bold text-purple-600">{formatCurrency(invoice.total, invoice.currency)}</span></p>
                        </InfoCard>
                        <InfoCard title={t('parties_involved')}>
                            <p className="text-black"><strong>{t('client_label')}</strong> {client.name} ({client.email})</p>
                            <p className="text-black"><strong>{t('worker_label')}</strong> {worker.name} ({worker.email})</p>
                        </InfoCard>
                        <InfoCard title={t('initial_claim')} subtitle={`${t('raised_by')} ${raisedBy.name} (${t(`${dispute.raisedByType}_role_label`)})`}>
                            <p className="text-sm italic text-black">"{dispute.reason}"</p>
                        </InfoCard>
                    </div>

                    {/* Right Panel: Mediation & Resolution */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-slate-50 rounded-lg border">
                            <h2 className="text-xl font-bold p-4 border-b text-black">{t('mediation_chat')}</h2>
                            <div className="p-4 h-80 overflow-y-auto space-y-4" ref={messagesEndRef}>
                                {dispute.messages.map(msg => (
                                    <div key={msg.id} className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-white font-bold flex-shrink-0 text-sm">A</div>
                                        <div className="p-3 rounded-lg bg-white border w-full">
                                            <p className="text-sm text-black">{msg.text}</p>
                                            <p className="text-xs text-black mt-1 text-right">{new Date(msg.timestamp).toLocaleString()}</p>
                                        </div>
                                    </div>
                                ))}
                                {dispute.messages.length === 0 && <p className="text-center text-sm text-black pt-16">{t('no_mediation_messages')}</p>}
                            </div>
                            {dispute.status !== 'resolved' && (
                                <form onSubmit={handleSendMessage} className="p-4 border-t flex space-x-2">
                                    <input type="text" value={message} onChange={e => setMessage(e.target.value)} placeholder={t('type_mediation_message')} className="flex-grow p-2 border rounded-md bg-white text-black" />
                                    <button type="submit" className="bg-purple-600 text-white font-semibold px-4 py-2 rounded-md hover:bg-purple-700">{t('send')}</button>
                                </form>
                            )}
                        </div>
                        {dispute.status === 'resolved' ? (
                            <InfoCard title={t('dispute_resolved')}>
                                <p className="font-semibold text-black">{t('resolution_label')}</p>
                                <p className="text-sm italic mb-2 text-black">"{dispute.resolution}"</p>
                                <p className="font-semibold text-black">{t('fund_action_label')}</p>
                                <p className="text-sm capitalize font-mono text-black">{dispute.fundResolution?.action.replace('_', ' ')} {dispute.fundResolution?.action === 'refund_partial' && `(${formatCurrency(dispute.fundResolution.refundAmount!, invoice.currency)})`}</p>
                            </InfoCard>
                        ) : (
                            <div className="text-center">
                                <button onClick={() => setResolveModalOpen(true)} className="bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700">{t('resolve_dispute')}</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {isResolveModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-lg w-full max-lg p-6">
                        <h2 className="text-2xl font-bold mb-4 text-black">{t('final_resolution')}</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="font-semibold block mb-2 text-black">{t('select_fund_action')}</label>
                                <select value={fundAction} onChange={e => setFundAction(e.target.value as FundAction)} className="w-full p-2 border rounded-md bg-white text-black">
                                    <option value="release_full">{t('release_full_to_worker')}</option>
                                    <option value="refund_full">{t('refund_full_to_client')}</option>
                                    <option value="refund_partial">{t('refund_partial_to_client')}</option>
                                </select>
                                {fundAction === 'refund_partial' && (
                                    <div className="mt-2">
                                        <label className="text-black">{t('refund_amount')} ({invoice.currency})</label>
                                        <input type="number" value={partialAmount} onChange={e => setPartialAmount(parseFloat(e.target.value))} max={invoice.total} min="0.01" step="0.01" className="w-full p-2 border rounded-md bg-white text-black" />
                                    </div>
                                )}
                            </div>
                             <div>
                                <label htmlFor="resolutionText" className="font-semibold block mb-2 text-black">{t('final_resolution_summary')}</label>
                                <textarea id="resolutionText" value={resolutionText} onChange={e => setResolutionText(e.target.value)} rows={4} placeholder={t('summarize_resolution_placeholder')} className="w-full p-2 border rounded-md bg-white text-black" />
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end space-x-3">
                            <button onClick={() => setResolveModalOpen(false)} className="bg-slate-200 text-black font-bold py-2 px-4 rounded-lg">{t('cancel')}</button>
                            <button onClick={handleResolve} className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg">{t('confirm_and_resolve')}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const InfoCard: React.FC<{ title: string; subtitle?: string; children: React.ReactNode }> = ({ title, subtitle, children }) => (
    <div className="bg-slate-50 p-4 rounded-xl border">
        <h3 className="font-bold text-lg text-black">{title}</h3>
        {subtitle && <p className="text-xs text-black -mt-1 mb-2">{subtitle}</p>}
        <div className="text-black space-y-1 text-sm">{children}</div>
    </div>
);

export default AdminDisputeResolutionScreen;