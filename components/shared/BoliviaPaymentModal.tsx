import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Invoice, Worker } from '../../types';
import { formatCurrency } from '../../constants';
import { Check, X, ChevronRight, Copy, Download, RefreshCw, ExternalLink } from 'lucide-react';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';

interface BoliviaPaymentModalProps {
  invoice: Invoice;
  worker?: Worker;
  job?: any;
  onClose: () => void;
  onConfirm: () => void;
  t: (key: string) => string;
}

type BOPaymentMethod =
  | 'yape' | 'tigo_money' | 'simple_qr'
  | 'banco_union' | 'banco_mercantil' | 'banco_ganadero'
  | 'banco_economico' | 'banco_bisa' | 'banco_bcp' | 'banco_fie'
  | 'stripe' | 'card';

interface PaymentOption {
  id: BOPaymentMethod;
  name: string;
  description: string;
  category: 'wallet' | 'qr' | 'bank' | 'card';
  color: string;
  abbr: string;
}

const PAYMENT_OPTIONS: PaymentOption[] = [
  { id: 'yape',            name: 'Yape',            category: 'wallet', color: '#6C24C7', abbr: 'YAPE', description: '3M+ usuarios en Bolivia — QR o número de teléfono' },
  { id: 'tigo_money',      name: 'Tigo Money',      category: 'wallet', color: '#0099CC', abbr: 'TIGO', description: 'Billetera móvil Tigo — paga con tu número' },
  { id: 'simple_qr',       name: '$imple QR',       category: 'qr',     color: '#1a1a2e', abbr: '$',    description: 'QR interoperable ASOBAN — funciona con TODOS los bancos' },
  { id: 'banco_union',     name: 'Banco Unión',     category: 'bank',   color: '#003399', abbr: 'BU',   description: 'Transferencia o QR desde tu app Banco Unión' },
  { id: 'banco_mercantil', name: 'Banco Mercantil', category: 'bank',   color: '#CC0000', abbr: 'BM',   description: 'Transferencia o QR desde tu app Banco Mercantil' },
  { id: 'banco_ganadero',  name: 'Banco Ganadero',  category: 'bank',   color: '#006600', abbr: 'BG',   description: 'Transferencia o QR desde tu app Banco Ganadero' },
  { id: 'banco_economico', name: 'Banco Económico', category: 'bank',   color: '#FF6600', abbr: 'BE',   description: 'Transferencia o QR desde tu app Banco Económico' },
  { id: 'banco_bisa',      name: 'Banco BISA',      category: 'bank',   color: '#990099', abbr: 'BISA', description: 'Transferencia o QR desde tu app Banco BISA' },
  { id: 'banco_bcp',       name: 'BCP / Soli',      category: 'bank',   color: '#003366', abbr: 'BCP',  description: 'Paga con Soli o transferencia BCP Bolivia' },
  { id: 'banco_fie',       name: 'Banco FIE',       category: 'bank',   color: '#CC6600', abbr: 'FIE',  description: 'Transferencia o QR desde tu app Banco FIE' },
  { id: 'stripe',          name: 'Tarjeta (Stripe)', category: 'card',  color: '#635BFF', abbr: 'STR',  description: 'Visa, Mastercard, débito — procesado por Stripe' },
  { id: 'card',            name: 'Débito / Crédito', category: 'card',  color: '#1a1a2e', abbr: 'CARD', description: 'Visa o Mastercard directamente' },
];

const CATEGORIES = [
  { id: 'wallet', label: '📱 Billeteras' },
  { id: 'qr',     label: '🔲 QR Universal' },
  { id: 'bank',   label: '🏦 Bancos' },
  { id: 'card',   label: '💳 Tarjetas' },
];

// Generates a QR code image URL using QR Server API (free, reliable)
const getQRUrl = (data: string, size = 280) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}&margin=10&color=1a1a2e&bgcolor=ffffff`;

// Bolivia interoperable QR payload format (simplified $imple compatible)
const buildQRPayload = (amount: number, reference: string, accountNumber: string, name: string) =>
  `TUFIX|BOB|${amount.toFixed(2)}|${accountNumber}|${name}|${reference}`;

const BoliviaPaymentModal: React.FC<BoliviaPaymentModalProps> = ({
  invoice, worker, job, onClose, onConfirm, t
}) => {
  const [selectedMethod, setSelectedMethod] = useState<BOPaymentMethod>('simple_qr');
  const [activeCategory, setActiveCategory] = useState('qr');
  const [step, setStep] = useState<'select' | 'qr' | 'confirm' | 'success'>('select');
  const [copied, setCopied] = useState(false);
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [polling, setPolling] = useState(false);
  const [qrDownloading, setQrDownloading] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const qrImgRef = useRef<HTMLImageElement>(null);

  const amount = invoice.total;
  const reference = `TUFIX-${invoice.jobId?.slice(-6) || invoice.id.slice(-6)}`;
  const workerName = worker?.name || 'Trabajador TUFIX';
  const workerPhone = (worker as any)?.phoneNumber?.number || '';
  const workerAccount = (worker as any)?.payoutDetails?.bankAccount || (worker as any)?.payoutDetails?.mercadoPago?.userId || '';
  const workerYape = (worker as any)?.payoutDetails?.yapePhone || workerPhone;
  const workerTigo = (worker as any)?.payoutDetails?.tigoNumber || workerPhone;

  const selected = PAYMENT_OPTIONS.find(o => o.id === selectedMethod)!;

  // QR data payload
  const qrPayload = selectedMethod === 'yape'
    ? `yape://pay?phone=${workerYape}&amount=${amount}&description=${reference}`
    : selectedMethod === 'tigo_money'
    ? `tigomoney://send?phone=${workerTigo}&amount=${amount}&ref=${reference}`
    : buildQRPayload(amount, reference, workerAccount || workerPhone, workerName);

  const qrUrl = getQRUrl(qrPayload);

  // Listen to Firestore for payment status update
  useEffect(() => {
    if (step !== 'qr') return;
    const invoiceRef = doc(db, 'invoices', invoice.id);
    const unsub = onSnapshot(invoiceRef, (snap) => {
      const data = snap.data();
      if (data?.status === 'held' || data?.status === 'released' || data?.boliviaPaymentConfirmed) {
        setPaymentVerified(true);
        setPolling(false);
        if (pollingRef.current) clearInterval(pollingRef.current);
      }
    });
    return () => unsub();
  }, [step, invoice.id]);

  // Polling fallback — check every 8 seconds
  const startPolling = useCallback(async () => {
    setPolling(true);
    pollingRef.current = setInterval(async () => {
      try {
        // Mark invoice as pending manual verification in Firestore
        const invoiceRef = doc(db, 'invoices', invoice.id);
        // Snapshot is handled by onSnapshot above
      } catch (e) {
        console.error('Polling error', e);
      }
    }, 8000);
  }, [invoice.id]);

  useEffect(() => {
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, []);

  // Download QR as image
  const handleDownloadQR = async () => {
    setQrDownloading(true);
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `TUFIX-QR-${reference}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      // Fallback: show screenshot instruction instead of opening in new tab
      alert('No se pudo descargar automáticamente. Por favor, toma una captura de pantalla del código QR para compartirlo o usarlo.');
    } finally {
      setQrDownloading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Mark payment as pending in Firestore when user says they paid
  const handleMarkAsPaid = async () => {
    try {
      const invoiceRef = doc(db, 'invoices', invoice.id);
      await updateDoc(invoiceRef, {
        boliviaPaymentMethod: selectedMethod,
        boliviaPaymentReference: reference,
        boliviaPaymentPendingAt: new Date().toISOString(),
        boliviaPaymentStatus: 'pending_verification',
      });
      const jobRef = doc(db, 'jobRequests', invoice.jobId);
      await updateDoc(jobRef, {
        boliviaPaymentPending: true,
        boliviaPaymentMethod: selectedMethod,
      });
    } catch (e) {
      console.error('Error marking as paid:', e);
    }
    setStep('confirm');
  };

  // Final confirmation — triggers the normal payment flow
  const handleFinalConfirm = async () => {
    try {
      const invoiceRef = doc(db, 'invoices', invoice.id);
      await updateDoc(invoiceRef, {
        status: 'held',
        paidAt: new Date().toISOString(),
        boliviaPaymentStatus: 'client_confirmed',
        transactionId: `bol_${Date.now()}`,
      });
    } catch (e) {
      console.error('Error confirming:', e);
    }
    setStep('success');
    setTimeout(() => {
      onConfirm();
    }, 2000);
  };

  const filteredOptions = PAYMENT_OPTIONS.filter(o => o.category === activeCategory);

  // ─── STEP: SELECT ───────────────────────────────────────────────────────────
  if (step === 'select') return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-t-[24px] sm:rounded-[24px] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Pagar en Bolivia 🇧🇴</h2>
            <p className="text-xs text-gray-500 mt-0.5">Total: <span className="font-bold text-green-600">Bs. {amount.toFixed(2)}</span></p>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-50 rounded-full text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Category tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  activeCategory === cat.id ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {cat.label}
              </button>
            ))}
          </div>

          {/* Recommended badge */}
          {activeCategory === 'qr' && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3">
              <p className="text-xs font-bold text-green-700">✅ Recomendado para Bolivia</p>
              <p className="text-xs text-green-600 mt-0.5">El QR $imple funciona con TODOS los bancos bolivianos — Unión, Mercantil, Ganadero, BCP, BISA y más.</p>
            </div>
          )}

          {/* Options */}
          <div className="space-y-2">
            {filteredOptions.map(option => (
              <button key={option.id} onClick={() => setSelectedMethod(option.id)}
                className={`w-full flex items-center p-4 rounded-2xl border-2 transition-all text-left ${
                  selectedMethod === option.id ? 'border-green-500 bg-green-50' : 'border-gray-100 hover:border-gray-200 bg-white'}`}>
                {/* Icon */}
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-sm"
                  style={{ backgroundColor: option.color }}>
                  {option.abbr}
                </div>
                <div className="flex-1 ml-3">
                  <p className={`text-sm font-bold ${selectedMethod === option.id ? 'text-green-900' : 'text-gray-900'}`}>{option.name}</p>
                  <p className="text-[10px] text-gray-500 leading-tight mt-0.5">{option.description}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  selectedMethod === option.id ? 'border-green-500 bg-green-500' : 'border-gray-200'}`}>
                  {selectedMethod === option.id && <Check className="w-3 h-3 text-white" />}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="p-5 border-t border-gray-100 flex-shrink-0">
          <button onClick={() => setStep('qr')}
            className="w-full bg-green-600 text-white font-bold py-4 rounded-2xl hover:bg-green-700 flex items-center justify-center gap-2 shadow-lg shadow-green-200">
            <span>Continuar con {selected.name}</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );

  // ─── STEP: QR + INSTRUCTIONS ────────────────────────────────────────────────
  if (step === 'qr') return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-t-[24px] sm:rounded-[24px] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Escanea y Paga</h2>
            <p className="text-xs text-gray-500">{selected.name} · Bs. {amount.toFixed(2)}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-50 rounded-full text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Amount pill */}
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
            <p className="text-xs text-green-600 font-medium">Monto exacto a transferir</p>
            <p className="text-4xl font-bold text-green-700 mt-1">Bs. {amount.toFixed(2)}</p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <p className="text-xs font-mono text-green-600">Ref: {reference}</p>
              <button onClick={() => handleCopy(reference)} className="text-green-500 hover:text-green-700">
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center space-y-3">
            <div className="bg-white border-2 border-gray-200 rounded-2xl p-4 shadow-sm">
              <img
                ref={qrImgRef}
                src={qrUrl}
                alt="Código QR de pago"
                className="w-56 h-56 mx-auto"
                onLoad={() => {}}
              />
            </div>

            {/* Payment verified indicator */}
            {paymentVerified ? (
              <div className="flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full">
                <Check className="w-4 h-4" />
                <span className="text-sm font-bold">¡Pago detectado!</span>
              </div>
            ) : polling ? (
              <div className="flex items-center gap-2 text-gray-400 text-xs">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Esperando confirmación de pago...</span>
              </div>
            ) : null}

            {/* Download button */}
            <button onClick={handleDownloadQR} disabled={qrDownloading}
              className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 px-5 rounded-xl transition-all text-sm">
              <Download className="w-4 h-4" />
              {qrDownloading ? 'Descargando...' : 'Descargar código QR'}
            </button>
          </div>

          {/* Phone number for wallets */}
          {(selectedMethod === 'yape' || selectedMethod === 'tigo_money') && workerPhone && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-500">O busca por número</p>
                <p className="text-xl font-bold text-blue-900">{selectedMethod === 'yape' ? workerYape : workerTigo}</p>
                <p className="text-xs text-blue-600">{workerName}</p>
              </div>
              <button onClick={() => handleCopy(selectedMethod === 'yape' ? workerYape : workerTigo)}
                className="bg-blue-500 text-white p-2.5 rounded-xl">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          )}

          {/* Deep link for mobile */}
          {(selectedMethod === 'yape' || selectedMethod === 'tigo_money') && (
            <a href={qrPayload}
              className="flex items-center justify-center gap-2 w-full border-2 border-purple-200 text-purple-700 font-bold py-3 rounded-xl hover:bg-purple-50 transition-all text-sm">
              <ExternalLink className="w-4 h-4" />
              Abrir {selected.name} directamente
            </a>
          )}

          {/* Bank account for transfers */}
          {workerAccount && (selectedMethod !== 'yape' && selectedMethod !== 'tigo_money') && (
            <div className="bg-gray-50 rounded-xl p-3 space-y-2">
              <p className="text-xs font-bold text-gray-500">DATOS DE TRANSFERENCIA</p>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-gray-500">Número de cuenta</p>
                  <p className="font-bold text-gray-900 font-mono">{workerAccount}</p>
                </div>
                <button onClick={() => handleCopy(workerAccount)} className="bg-gray-200 p-2 rounded-lg">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex justify-between">
                <div>
                  <p className="text-xs text-gray-500">Titular</p>
                  <p className="font-bold text-gray-900">{workerName}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Moneda</p>
                  <p className="font-bold text-gray-900">BOB (Bs.)</p>
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 rounded-xl p-4 space-y-2">
            <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Instrucciones</p>
            {[
              selectedMethod === 'simple_qr' || selectedMethod.startsWith('banco')
                ? 'Abre la app de tu banco (cualquier banco boliviano)'
                : `Abre tu app ${selected.name}`,
              'Escanea el código QR de arriba o descárgalo para pagarlo después',
              `Ingresa el monto exacto: Bs. ${amount.toFixed(2)}`,
              `Escribe la referencia: ${reference}`,
              'Confirma el pago en tu aplicación',
              'Regresa aquí y presiona "Ya pagué"',
            ].map((step, i) => (
              <div key={i} className="flex gap-2 items-start">
                <div className="w-5 h-5 rounded-full bg-blue-200 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</div>
                <p className="text-xs text-blue-800">{step}</p>
              </div>
            ))}
          </div>

          {/* $imple info */}
          {(selectedMethod === 'simple_qr' || selectedMethod.startsWith('banco')) && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
              <p className="text-xs text-yellow-800">
                🔲 <strong>QR $imple (ASOBAN)</strong> — Este código QR es interoperable. Funciona con Banco Unión, Mercantil, Ganadero, BCP, BISA, Económico, FIE y todos los bancos privados de Bolivia.
              </p>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-gray-100 space-y-2 flex-shrink-0">
          {paymentVerified ? (
            <button onClick={handleMarkAsPaid}
              className="w-full bg-green-600 text-white font-bold py-4 rounded-2xl hover:bg-green-700 flex items-center justify-center gap-2 shadow-lg shadow-green-200">
              <Check className="w-5 h-5" />
              ¡Pago detectado! Continuar
            </button>
          ) : (
            <button onClick={() => { startPolling(); handleMarkAsPaid(); }}
              className="w-full bg-green-600 text-white font-bold py-4 rounded-2xl hover:bg-green-700 flex items-center justify-center gap-2 shadow-lg shadow-green-200">
              <Check className="w-5 h-5" />
              Ya realicé el pago
            </button>
          )}
          <button onClick={() => setStep('select')}
            className="w-full py-2 text-gray-400 text-sm font-medium hover:text-gray-600">
            ← Cambiar método
          </button>
        </div>
      </div>
    </div>
  );

  // ─── STEP: CONFIRM ──────────────────────────────────────────────────────────
  if (step === 'confirm') return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-t-[24px] sm:rounded-[24px] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-900">Confirmar Pago</h2>
          <button onClick={onClose} className="p-2 bg-gray-50 rounded-full text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="text-center py-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">¿Confirmás el pago?</h3>
            <p className="text-sm text-gray-500 mt-2">
              Al confirmar avisas al trabajador y al equipo TUFIX que realizaste la transferencia.
            </p>
          </div>

          {/* Summary */}
          <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
            {[
              ['Método', selected.name],
              ['Monto', `Bs. ${amount.toFixed(2)}`],
              ['Referencia', reference],
              ['Trabajador', workerName],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between items-center">
                <span className="text-sm text-gray-500">{label}</span>
                <span className="text-sm font-bold text-gray-900">{value}</span>
              </div>
            ))}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
            <p className="text-xs text-blue-800">
              ℹ️ El equipo TUFIX verificará tu pago. Una vez confirmado, el trabajo seguirá su curso normal y los fondos serán liberados al trabajador cuando ambas partes confirmen la finalización.
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
            <p className="text-xs text-yellow-800">
              ⚠️ Solo confirma si realmente realizaste la transferencia. Si hay discrepancias, el equipo TUFIX resolverá el caso.
            </p>
          </div>
        </div>

        <div className="p-5 border-t border-gray-100 space-y-2 flex-shrink-0">
          <button onClick={handleFinalConfirm}
            className="w-full bg-green-600 text-white font-bold py-4 rounded-2xl hover:bg-green-700 flex items-center justify-center gap-2 shadow-lg shadow-green-200">
            <Check className="w-5 h-5" />
            Confirmar — Sí, pagué
          </button>
          <button onClick={() => setStep('qr')}
            className="w-full py-2 text-gray-400 text-sm font-medium hover:text-gray-600">
            ← Volver al QR
          </button>
        </div>
      </div>
    </div>
  );

  // ─── STEP: SUCCESS ──────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-[24px] shadow-2xl p-8 text-center">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
          <Check className="w-12 h-12 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">¡Pago Registrado!</h2>
        <p className="text-gray-500 mt-2 text-sm">
          Tu pago de <strong>Bs. {amount.toFixed(2)}</strong> fue registrado correctamente.
          El equipo TUFIX verificará la transferencia y continuará con el proceso.
        </p>
        <div className="mt-6 bg-green-50 rounded-2xl p-4">
          <p className="text-xs text-green-700 font-bold">Referencia: {reference}</p>
          <p className="text-xs text-green-600 mt-1">Guarda este número por si lo necesitas</p>
        </div>
      </div>
    </div>
  );
};

export default BoliviaPaymentModal;