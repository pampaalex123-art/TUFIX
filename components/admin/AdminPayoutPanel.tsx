import React, { useState } from 'react';
import { JobRequest, Worker, User, Invoice } from '../../types';
import { formatCurrency } from '../../constants';
import { auth } from '../../firebase';

interface AdminPayoutPanelProps {
  jobs: JobRequest[];
  workers: Worker[];
  users: User[];
  invoices: Invoice[];
  t: (key: string) => string;
}

const AdminPayoutPanel: React.FC<AdminPayoutPanelProps> = ({ jobs, workers, users, invoices, t }) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, string>>({});

  // Jobs that are completed by both parties but payout not yet approved
  const pendingPayouts = jobs.filter(j =>
    j.client_confirmed && j.worker_confirmed &&
    (!(j as any).adminPayoutStatus || (j as any).adminPayoutStatus === 'pending')
  );

  const approvedPayouts = jobs.filter(j => (j as any).adminPayoutStatus === 'approved');
  const rejectedPayouts = jobs.filter(j => (j as any).adminPayoutStatus === 'rejected');

  const getWorker = (id: string) => workers.find(w => w.id === id);
  const getUser = (job: JobRequest) => job.user;
  const getInvoice = (job: JobRequest) => invoices.find(i => i.jobId === job.id);

  const handleAction = async (jobId: string, action: 'approve' | 'reject') => {
    setLoading(jobId + action);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/admin/approve-payout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ jobId, action }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      setResults(prev => ({
        ...prev,
        [jobId]: action === 'approve'
          ? `✅ Aprobado — Worker recibe: ${data.workerAmount} | TUFIX fee: ${data.tufixFee}${data.payoutResult?.manual ? ' (⚠️ Transferencia manual requerida)' : ' (✅ Transferencia automática)'}`
          : '❌ Rechazado'
      }));

    } catch (error: any) {
      setResults(prev => ({ ...prev, [jobId]: `Error: ${error.message}` }));
    } finally {
      setLoading(null);
    }
  };

  const JobCard = ({ job, showActions }: { job: JobRequest; showActions: boolean }) => {
    const worker = getWorker(job.workerId);
    const invoice = getInvoice(job);
    const workerAmount = invoice ? Math.round(invoice.total * 0.9 * 100) / 100 : 0;
    const tufixFee = invoice ? Math.round(invoice.total * 0.1 * 100) / 100 : 0;

    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
        {/* Job Info */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-gray-400 font-mono">#{job.id.slice(-8)}</p>
            <p className="font-bold text-gray-900">{job.service}</p>
            <p className="text-sm text-gray-500">{new Date(job.createdAt).toLocaleDateString()}</p>
          </div>
          {invoice && (
            <div className="text-right">
              <p className="text-xs text-gray-400">Total</p>
              <p className="text-lg font-bold text-purple-600">
                {formatCurrency(invoice.total, invoice.currency)}
              </p>
            </div>
          )}
        </div>

        {/* Parties */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 rounded-xl p-3">
            <p className="text-xs text-blue-400 font-medium">Cliente</p>
            <p className="text-sm font-bold text-blue-900">{job.user.name}</p>
            <p className="text-xs text-blue-600">{job.user.email}</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-3">
            <p className="text-xs text-purple-400 font-medium">Trabajador</p>
            <p className="text-sm font-bold text-purple-900">{worker?.name || 'N/A'}</p>
            <p className="text-xs text-purple-600">{worker?.email || ''}</p>
            {!(worker as any)?.payoutDetails?.mercadoPago?.accessToken && (
              <p className="text-xs text-red-500 mt-1">⚠️ Sin MP conectado</p>
            )}
          </div>
        </div>

        {/* Split */}
        {invoice && (
          <div className="bg-gray-50 rounded-xl p-3 flex justify-between text-sm">
            <div>
              <p className="text-gray-400 text-xs">Worker recibe (90%)</p>
              <p className="font-bold text-green-600">{formatCurrency(workerAmount, invoice.currency)}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-xs">TUFIX fee (10%)</p>
              <p className="font-bold text-purple-600">{formatCurrency(tufixFee, invoice.currency)}</p>
            </div>
          </div>
        )}

        {/* Result message */}
        {results[job.id] && (
          <p className="text-xs bg-yellow-50 border border-yellow-200 rounded-lg p-2 text-yellow-800">
            {results[job.id]}
          </p>
        )}

        {/* Actions */}
        {showActions && !results[job.id] && (
          <div className="flex gap-3">
            <button
              onClick={() => handleAction(job.id, 'reject')}
              disabled={loading !== null}
              className="flex-1 py-2 rounded-xl border-2 border-red-200 text-red-600 font-bold text-sm hover:bg-red-50 disabled:opacity-50 transition"
            >
              {loading === job.id + 'reject' ? '...' : '✕ Rechazar'}
            </button>
            <button
              onClick={() => handleAction(job.id, 'approve')}
              disabled={loading !== null}
              className="flex-1 py-2 rounded-xl bg-green-600 text-white font-bold text-sm hover:bg-green-700 disabled:opacity-50 transition"
            >
              {loading === job.id + 'approve' ? '...' : '✓ Aprobar Pago'}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-500 rounded-2xl p-5 text-white">
        <h2 className="text-xl font-bold">Panel de Pagos</h2>
        <p className="text-sm opacity-80 mt-1">Aprueba o rechaza los pagos a trabajadores</p>
        <div className="flex gap-4 mt-3">
          <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
            <p className="text-2xl font-bold">{pendingPayouts.length}</p>
            <p className="text-xs opacity-80">Pendientes</p>
          </div>
          <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
            <p className="text-2xl font-bold">{approvedPayouts.length}</p>
            <p className="text-xs opacity-80">Aprobados</p>
          </div>
          <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
            <p className="text-2xl font-bold">{rejectedPayouts.length}</p>
            <p className="text-xs opacity-80">Rechazados</p>
          </div>
        </div>
      </div>

      {/* Pending */}
      <div>
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
          ⏳ Pagos Pendientes de Aprobación
        </h3>
        {pendingPayouts.length === 0 ? (
          <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-2xl">
            <p className="text-4xl mb-2">🎉</p>
            <p className="font-medium">No hay pagos pendientes</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingPayouts.map(job => (
              <JobCard key={job.id} job={job} showActions={true} />
            ))}
          </div>
        )}
      </div>

      {/* Approved */}
      {approvedPayouts.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
            ✅ Pagos Aprobados
          </h3>
          <div className="space-y-4">
            {approvedPayouts.slice(0, 5).map(job => (
              <JobCard key={job.id} job={job} showActions={false} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPayoutPanel;