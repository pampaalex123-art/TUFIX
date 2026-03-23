import React, { useState } from 'react';
import { Worker } from '../../types';

interface AdminWorkerVerificationScreenProps {
    worker: Worker;
    onApprove: (workerId: string) => void;
    onDecline: (workerId: string, reason: string) => void;
    onBack: () => void;
    t: (key: string) => string;
}

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div>
        <p className="text-sm text-black opacity-60">{label}</p>
        <p className="font-semibold text-black">{value}</p>
    </div>
);

const AdminWorkerVerificationScreen: React.FC<AdminWorkerVerificationScreenProps> = ({ worker, onApprove, onDecline, onBack, t }) => {
    const [declineReason, setDeclineReason] = useState('');
    const [showDeclineModal, setShowDeclineModal] = useState(false);

    const handleDecline = () => {
        if (!declineReason.trim()) {
            alert(t('please provide a reason for declining'));
            return;
        }
        onDecline(worker.id, declineReason);
        setShowDeclineModal(false);
    };

    return (
        <div className="container mx-auto max-w-4xl px-4 sm:px-0">
            <button onClick={onBack} className="flex items-center text-black hover:text-purple-600 font-semibold mb-6">
                &larr; {t('back_to_verifications')}
            </button>
            <div className="bg-white rounded-xl shadow-lg border border-slate-200">
                <div className="p-6 border-b border-slate-200">
                    <h1 className="text-2xl sm:text-3xl font-bold text-black">{t('worker verification')}</h1>
                    <p className="text-black opacity-70">{t('worker verification description')}</p>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h2 className="text-xl font-bold text-black mb-4">{t('provider details')}</h2>
                        <div className="space-y-4">
                            <InfoRow label={t('full_name')} value={worker.name} />
                            <InfoRow label={t('email_address')} value={worker.email} />
                            <InfoRow label={t('phone_number')} value={`${worker.phoneNumber.code} ${worker.phoneNumber.number}`} />
                            <InfoRow label={t('id_number')} value={worker.idNumber} />
                            <InfoRow label={t('location')} value={worker.location} />
                            <InfoRow label={t('service')} value={t(worker.service)} />
                        </div>
                    </div>
                    <div className="space-y-6">
                        <div>
                            <h3 className="font-semibold text-black mb-2">{t('id_photo')}</h3>
                            {worker.idPhotoUrl ? (
                                <img src={worker.idPhotoUrl} alt={t('id document')} className="w-full rounded-lg border shadow-sm" />
                            ) : (
                                <p className="text-black opacity-50 italic">{t('no id photo submitted')}</p>
                            )}
                        </div>
                         <div>
                            <h3 className="font-semibold text-black mb-2">{t('selfie_photo')}</h3>
                            {worker.selfiePhotoUrl ? (
                                <img src={worker.selfiePhotoUrl} alt={t('selfie')} className="w-full rounded-lg border shadow-sm" />
                            ) : (
                                <p className="text-black opacity-50 italic">{t('no selfie submitted')}</p>
                            )}
                        </div>
                    </div>
                </div>
                <div className="p-6 bg-white border-t border-slate-200 flex flex-col sm:flex-row sm:justify-end space-y-3 sm:space-y-0 sm:space-x-3">
                    <button onClick={() => setShowDeclineModal(true)} className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 w-full sm:w-auto">
                        {t('decline')}
                    </button>
                    <button onClick={() => onApprove(worker.id)} className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 w-full sm:w-auto">
                        {t('approve')}
                    </button>
                </div>
            </div>

            {showDeclineModal && (
                <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
                        <h2 className="text-xl font-bold mb-4 text-black">{t('decline application')}</h2>
                        <p className="text-sm text-black opacity-70 mb-4">{t('decline application description')}</p>
                        <textarea 
                            value={declineReason}
                            onChange={(e) => setDeclineReason(e.target.value)}
                            rows={4}
                            className="w-full p-2 border rounded-md bg-white text-black"
                            placeholder={t('decline reason placeholder')}
                        />
                        <div className="mt-6 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
                            <button onClick={() => setShowDeclineModal(false)} className="bg-slate-100 text-black font-bold py-2 px-4 rounded-lg w-full sm:w-auto">
                                {t('cancel')}
                            </button>
                            <button onClick={handleDecline} className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg w-full sm:w-auto">
                                {t('confirm_decline')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminWorkerVerificationScreen;
