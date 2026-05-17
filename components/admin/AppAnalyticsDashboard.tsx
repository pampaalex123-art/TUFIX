import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { User, Worker, JobRequest, Transaction } from '../../types';

type Period = 'daily' | 'weekly' | 'monthly' | 'annual';
type FilterView = 'overview' | 'jobs' | 'reviews' | 'specialties' | 'users';

interface Props {
    users?: User[];
    workers?: Worker[];
    allJobs?: JobRequest[];
    transactions?: Transaction[];
}

// ── Detail modal types ─────────────────────────────────────────────────────
interface DrillItem {
    id: string;
    name: string;
    email: string;
    type: 'user' | 'worker';
    signupDate?: string;
    lastLoginDate?: string;
    rating?: number;
    service?: string;
    verificationStatus?: string;
}

interface DrillModal {
    title: string;
    subtitle: string;
    items: DrillItem[];
}

// ── Helpers ────────────────────────────────────────────────────────────────
const downloadCSV = (rows: any[][], filename: string) => {
    const csv = rows.map(row => row.map(cell => { const s = String(cell ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; }).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click(); URL.revokeObjectURL(a.href);
};
const fmt = (n: number) => n.toLocaleString();
const fmtPct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;
const fmtDate = (iso: string) => { try { return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }); } catch { return iso; } };
const getBucketKey = (iso: string, period: Period): string => {
    const d = new Date(iso);
    if (period === 'daily') return iso.slice(0, 10);
    if (period === 'weekly') { const day = (d.getDay() + 6) % 7; const mon = new Date(d); mon.setDate(d.getDate() - day); return mon.toISOString().slice(0, 10); }
    if (period === 'monthly') return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return String(d.getFullYear());
};
const getBucketLabel = (key: string, period: Period): string => {
    if (period === 'daily') return fmtDate(key);
    if (period === 'weekly') return `Sem ${fmtDate(key)}`;
    if (period === 'monthly') { const [y, m] = key.split('-'); const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']; return `${months[parseInt(m)-1]} ${y}`; }
    return key;
};
const COLORS = ['#6366f1','#f59e0b','#10b981','#ef4444','#3b82f6','#ec4899','#14b8a6','#f97316','#8b5cf6','#84cc16','#06b6d4','#a855f7','#e11d48','#0ea5e9','#d97706'];

// ── Tooltip ────────────────────────────────────────────────────────────────
const Tooltip: React.FC<{ x: number; y: number; visible: boolean; children: React.ReactNode }> = ({ x, y, visible, children }) => (
    <div style={{
        position: 'fixed', left: x + 12, top: y - 8, zIndex: 9999, pointerEvents: 'none',
        opacity: visible ? 1 : 0, transition: 'opacity 0.15s',
        background: 'rgba(17,24,39,0.95)', color: 'white', borderRadius: 10, padding: '8px 12px',
        fontSize: 12, fontWeight: 600, boxShadow: '0 4px 24px rgba(0,0,0,0.3)', whiteSpace: 'nowrap',
    }}>
        {children}
    </div>
);

// ── Interactive Line Chart ─────────────────────────────────────────────────
interface LinePoint { label: string; value: number; key?: string; }
interface LineChartProps {
    data: LinePoint[];
    color?: string;
    height?: number;
    onClickPoint?: (point: LinePoint) => void;
    label?: string;
}
const InteractiveLineChart: React.FC<LineChartProps> = ({ data, color = '#6366f1', height = 120, onClickPoint, label }) => {
    const [hover, setHover] = useState<{ idx: number; x: number; y: number } | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    if (data.length < 2) return <div className="text-center text-gray-400 py-6 text-sm">Datos insuficientes</div>;
    const max = Math.max(...data.map(d => d.value), 1);
    const W = 600; const padX = 24; const padY = 16; const cW = W - padX * 2; const cH = height - padY * 2;
    const pts = data.map((d, i) => ({ ...d, x: padX + (i / (data.length - 1)) * cW, y: padY + cH - (d.value / max) * cH }));
    const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
    const area = `${path} L${pts[pts.length-1].x},${padY+cH} L${pts[0].x},${padY+cH} Z`;
    const gradId = `grad-${color.replace('#','')}`;
    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
        const rect = svgRef.current?.getBoundingClientRect();
        if (!rect) return;
        const svgX = ((e.clientX - rect.left) / rect.width) * W;
        let closest = 0; let minDist = Infinity;
        pts.forEach((p, i) => { const d = Math.abs(p.x - svgX); if (d < minDist) { minDist = d; closest = i; } });
        setHover({ idx: closest, x: e.clientX, y: e.clientY });
    };
    return (
        <>
            <svg ref={svgRef} viewBox={`0 0 ${W} ${height + 32}`} className="w-full cursor-pointer" preserveAspectRatio="xMidYMid meet"
                onMouseMove={handleMouseMove} onMouseLeave={() => setHover(null)}
                onClick={() => { if (hover && onClickPoint) onClickPoint(data[hover.idx]); }}>
                <defs>
                    <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                        <stop offset="100%" stopColor={color} stopOpacity="0.02" />
                    </linearGradient>
                </defs>
                {/* Grid lines */}
                {[0,0.25,0.5,0.75,1].map((t,i) => (
                    <line key={i} x1={padX} x2={W-padX} y1={padY + t*cH} y2={padY + t*cH} stroke="#f3f4f6" strokeWidth="1" />
                ))}
                {/* Y labels */}
                {[0,0.5,1].map((t,i) => (
                    <text key={i} x={padX-4} y={padY + t*cH + 3} textAnchor="end" fontSize={8} fill="#d1d5db">{fmt(Math.round(max*(1-t)))}</text>
                ))}
                <path d={area} fill={`url(#${gradId})`} />
                <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                {pts.map((p, i) => (
                    <g key={i}>
                        <circle cx={p.x} cy={p.y} r={hover?.idx === i ? 6 : 3.5}
                            fill={hover?.idx === i ? color : 'white'}
                            stroke={color} strokeWidth="2"
                            style={{ transition: 'r 0.1s, fill 0.1s' }} />
                        <text x={p.x} y={height + 26} textAnchor="middle" fontSize={8} fill="#9ca3af">{p.label}</text>
                    </g>
                ))}
                {/* Hover vertical line */}
                {hover && <line x1={pts[hover.idx].x} x2={pts[hover.idx].x} y1={padY} y2={padY+cH} stroke={color} strokeWidth="1" strokeDasharray="4,3" opacity="0.5" />}
            </svg>
            {hover && (
                <Tooltip x={hover.x} y={hover.y} visible={true}>
                    <div style={{ opacity: 0.7, marginBottom: 2 }}>{data[hover.idx].label}</div>
                    <div style={{ fontSize: 15 }}>{label || ''} {fmt(data[hover.idx].value)}</div>
                    {onClickPoint && <div style={{ opacity: 0.6, marginTop: 3, fontSize: 10 }}>Click para ver detalles →</div>}
                </Tooltip>
            )}
        </>
    );
};

// ── Interactive Bar Chart ──────────────────────────────────────────────────
interface BarPoint { label: string; value: number; color?: string; key?: string; }
interface BarChartProps {
    data: BarPoint[];
    height?: number;
    onClickBar?: (point: BarPoint) => void;
    label?: string;
}
const InteractiveBarChart: React.FC<BarChartProps> = ({ data, height = 140, onClickBar, label }) => {
    const [hover, setHover] = useState<{ idx: number; x: number; y: number } | null>(null);
    if (!data.length) return <div className="text-center text-gray-400 py-8 text-sm">Sin datos</div>;
    const max = Math.max(...data.map(d => d.value), 1);
    const barW = Math.max(20, Math.min(48, Math.floor(560 / data.length) - 8));
    const totalW = Math.max(data.length * (barW + 8), 300);
    return (
        <>
            <svg viewBox={`0 0 ${totalW} ${height + 32}`} className="w-full cursor-pointer" preserveAspectRatio="xMidYMid meet"
                onMouseLeave={() => setHover(null)}
                onClick={() => { if (hover && onClickBar) onClickBar(data[hover.idx]); }}>
                {data.map((d, i) => {
                    const barH = Math.max((d.value / max) * height, d.value > 0 ? 4 : 0);
                    const x = i * (barW + 8) + 4; const y = height - barH;
                    const color = d.color || COLORS[i % COLORS.length];
                    const isHover = hover?.idx === i;
                    return (
                        <g key={i} onMouseEnter={(e) => setHover({ idx: i, x: e.clientX, y: e.clientY })}
                            onMouseMove={(e) => setHover({ idx: i, x: e.clientX, y: e.clientY })}>
                            <rect x={x} y={y} width={barW} height={barH} fill={color} rx={4}
                                opacity={hover && !isHover ? 0.5 : 1}
                                style={{ transition: 'opacity 0.15s' }} />
                            {isHover && <rect x={x-2} y={y-2} width={barW+4} height={barH+2} fill="none" stroke={color} strokeWidth="2" rx={5} />}
                            {d.value > 0 && <text x={x + barW / 2} y={y - 5} textAnchor="middle" fontSize={9} fill="#374151" fontWeight="700">{d.value}</text>}
                            <text x={x + barW / 2} y={height + 16} textAnchor="middle" fontSize={8} fill="#9ca3af">{d.label.length > 7 ? d.label.slice(0, 6) + '…' : d.label}</text>
                        </g>
                    );
                })}
            </svg>
            {hover && (
                <Tooltip x={hover.x} y={hover.y} visible={true}>
                    <div style={{ opacity: 0.7, marginBottom: 2 }}>{data[hover.idx].label}</div>
                    <div style={{ fontSize: 15 }}>{label || ''} {fmt(data[hover.idx].value)}</div>
                    {onClickBar && <div style={{ opacity: 0.6, marginTop: 3, fontSize: 10 }}>Click para ver detalles →</div>}
                </Tooltip>
            )}
        </>
    );
};

// ── Drill-down Modal ───────────────────────────────────────────────────────
const DrillDownModal: React.FC<{ modal: DrillModal; onClose: () => void }> = ({ modal, onClose }) => (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div style={{ background: 'white', borderRadius: 20, width: '90%', maxWidth: 560, maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 80px rgba(0,0,0,0.3)' }}>
            {/* Header */}
            <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h2 style={{ fontWeight: 800, fontSize: 18, color: '#111827', margin: 0 }}>{modal.title}</h2>
                    <p style={{ fontSize: 12, color: '#9ca3af', margin: '4px 0 0' }}>{modal.subtitle} · {modal.items.length} persona{modal.items.length !== 1 ? 's' : ''}</p>
                </div>
                <button onClick={onClose} style={{ background: '#f3f4f6', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>
            {/* List */}
            <div style={{ overflowY: 'auto', padding: '12px 24px 20px', flex: 1 }}>
                {modal.items.length === 0 && (
                    <div style={{ textAlign: 'center', color: '#9ca3af', padding: '32px 0', fontSize: 14 }}>No hay datos para este período</div>
                )}
                {modal.items.map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < modal.items.length - 1 ? '1px solid #f9fafb' : 'none' }}>
                        <div style={{ width: 38, height: 38, borderRadius: '50%', background: item.type === 'worker' ? '#fef3c7' : '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                            {item.type === 'worker' ? '🔧' : '👤'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: 14, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                            <div style={{ fontSize: 12, color: '#6b7280' }}>{item.email}</div>
                            {item.service && <div style={{ fontSize: 11, color: '#8b5cf6', marginTop: 2 }}>🔧 {item.service}</div>}
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            {item.rating !== undefined && item.rating > 0 && <div style={{ fontSize: 12, color: '#f59e0b', fontWeight: 700 }}>★ {item.rating.toFixed(1)}</div>}
                            {item.signupDate && <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>Registro: {fmtDate(item.signupDate)}</div>}
                            {item.lastLoginDate && <div style={{ fontSize: 10, color: '#9ca3af' }}>Último login: {fmtDate(item.lastLoginDate)}</div>}
                            {item.verificationStatus && (
                                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: item.verificationStatus === 'approved' ? '#d1fae5' : item.verificationStatus === 'pending' ? '#fef3c7' : '#fee2e2', color: item.verificationStatus === 'approved' ? '#065f46' : item.verificationStatus === 'pending' ? '#92400e' : '#991b1b', marginTop: 2, display: 'inline-block' }}>
                                    {item.verificationStatus}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            {/* Footer */}
            {modal.items.length > 0 && (
                <div style={{ padding: '12px 24px', borderTop: '1px solid #f3f4f6' }}>
                    <button onClick={() => {
                        downloadCSV([['Nombre','Email','Tipo','Servicio','Rating','Registro','Último Login','Verificación'],
                            ...modal.items.map(i => [i.name, i.email, i.type, i.service||'', i.rating?.toFixed(1)||'', i.signupDate||'', i.lastLoginDate||'', i.verificationStatus||''])],
                            `tufix_detalle_${new Date().toISOString().slice(0,10)}.csv`);
                    }} style={{ background: '#6366f1', color: 'white', border: 'none', borderRadius: 10, padding: '8px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', width: '100%' }}>
                        📥 Exportar esta lista como CSV
                    </button>
                </div>
            )}
        </div>
    </div>
);

// ── Existing components (unchanged) ───────────────────────────────────────
const KpiCard: React.FC<{ icon: string; label: string; value: string | number; sub?: string; trend?: number; color: string }> = ({ icon, label, value, sub, trend, color }) => (
    <div className="relative overflow-hidden rounded-2xl p-5 bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all">
        <div className="absolute top-0 left-0 w-1 h-full rounded-l-2xl" style={{ background: color }} />
        <div className="flex items-start justify-between mb-3">
            <span className="text-2xl">{icon}</span>
            {trend !== undefined && (
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${trend > 0 ? 'bg-emerald-100 text-emerald-700' : trend < 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>
                    {trend > 0 ? '▲' : trend < 0 ? '▼' : '→'} {Math.abs(trend).toFixed(1)}%
                </span>
            )}
        </div>
        <p className="text-2xl font-black text-gray-900 leading-none mb-1">{value}</p>
        <p className="text-sm font-semibold text-gray-500">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
);

const DonutChart: React.FC<{ data: { label: string; value: number; color: string }[] }> = ({ data }) => {
    const total = data.reduce((a, d) => a + d.value, 0);
    if (!total) return <div className="text-center text-gray-400 py-4 text-sm">Sin datos</div>;
    let cum = 0;
    const slices = data.filter(d => d.value > 0).map(d => {
        const pct = d.value / total; const sa = cum * 2 * Math.PI - Math.PI / 2; cum += pct; const ea = cum * 2 * Math.PI - Math.PI / 2;
        const R = 46; const r = 28;
        const x1 = 50+R*Math.cos(sa), y1 = 50+R*Math.sin(sa), x2 = 50+R*Math.cos(ea), y2 = 50+R*Math.sin(ea);
        const x3 = 50+r*Math.cos(ea), y3 = 50+r*Math.sin(ea), x4 = 50+r*Math.cos(sa), y4 = 50+r*Math.sin(sa);
        return { ...d, pct, d: `M${x1},${y1} A${R},${R} 0 ${pct>0.5?1:0} 1 ${x2},${y2} L${x3},${y3} A${r},${r} 0 ${pct>0.5?1:0} 0 ${x4},${y4} Z` };
    });
    return (
        <svg viewBox="0 0 100 100" className="w-full max-w-[140px] mx-auto">
            {slices.map((s, i) => <path key={i} d={s.d} fill={s.color} stroke="white" strokeWidth="1.5"><title>{s.label}: {s.value} ({(s.pct*100).toFixed(1)}%)</title></path>)}
            <text x="50" y="47" textAnchor="middle" fontSize="11" fontWeight="800" fill="#111">{fmt(total)}</text>
            <text x="50" y="57" textAnchor="middle" fontSize="7" fill="#6b7280">total</text>
        </svg>
    );
};

const RankedBar: React.FC<{ label: string; value: number; max: number; color: string; rank: number; pct?: number }> = ({ label, value, max, color, rank, pct }) => (
    <div className="flex items-center gap-3">
        <span className="w-5 text-xs font-black text-gray-400 text-right flex-shrink-0">{rank}</span>
        <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-gray-700 truncate">{label}</span>
                <span className="text-sm font-black text-gray-800 ml-2 flex-shrink-0">{fmt(value)}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(value / max) * 100}%`, background: color }} />
            </div>
            {pct !== undefined && <p className="text-xs text-gray-400 mt-0.5">{pct.toFixed(1)}%</p>}
        </div>
    </div>
);

const Section: React.FC<{ title: string; subtitle?: string; children: React.ReactNode; className?: string }> = ({ title, subtitle, children, className = '' }) => (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden ${className}`}>
        <div className="px-6 pt-5 pb-4 border-b border-gray-50">
            <h3 className="text-base font-black text-gray-900">{title}</h3>
            {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        <div className="p-6">{children}</div>
    </div>
);

const LiveDot: React.FC = () => (
    <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
        <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        En vivo
    </span>
);

// ── Main Component ─────────────────────────────────────────────────────────
const AppAnalyticsDashboard: React.FC<Props> = ({ users: _u, workers: _w, allJobs: _j, transactions: _t }) => {
    const users = _u ?? [];
    const workers = _w ?? [];
    const allJobs = _j ?? [];
    const transactions = _t ?? [];

    const [period, setPeriod] = useState<Period>('monthly');
    const [view, setView] = useState<FilterView>('overview');
    const [lastUpdated, setLastUpdated] = useState(new Date());
    const [specialtyFilter, setSpecialtyFilter] = useState<'demand' | 'supply' | 'completed'>('demand');
    const [drillModal, setDrillModal] = useState<DrillModal | null>(null);

    useEffect(() => { const i = setInterval(() => setLastUpdated(new Date()), 30000); return () => clearInterval(i); }, []);
    const now = useMemo(() => new Date(), [lastUpdated]);

    const makeBuckets = useCallback((dates: (string | undefined)[]) => {
        const map = new Map<string, number>();
        dates.forEach(d => { if (!d) return; const key = getBucketKey(d, period); map.set(key, (map.get(key) || 0) + 1); });
        return map;
    }, [period]);

    // ── useMemo computations (identical to original) ───────────────────────
    const growthData = useMemo(() => {
        const uB = makeBuckets(users.map(u => u.signupDate));
        const wB = makeBuckets(workers.map(w => w.signupDate));
        const jB = makeBuckets(allJobs.map(j => j.createdAt));
        const all = new Set([...uB.keys(), ...wB.keys(), ...jB.keys()]);
        return Array.from(all).sort().map(k => ({ key: k, label: getBucketLabel(k, period), users: uB.get(k)||0, workers: wB.get(k)||0, jobs: jB.get(k)||0 }));
    }, [users, workers, allJobs, makeBuckets]);

    const loginData = useMemo(() => {
        const lB = makeBuckets([...users.map(u => u.lastLoginDate), ...workers.map(w => w.lastLoginDate)]);
        return Array.from(lB.entries()).sort().slice(-14).map(([k, v]) => ({ key: k, label: getBucketLabel(k, period), value: v }));
    }, [users, workers, makeBuckets]);

    const activeData = useMemo(() => {
        const wMs = { daily: 86400000, weekly: 604800000, monthly: 2592000000, annual: 31536000000 }[period];
        const aU = users.filter(u => now.getTime() - new Date(u.lastLoginDate).getTime() < wMs).length;
        const aW = workers.filter(w => now.getTime() - new Date(w.lastLoginDate).getTime() < wMs).length;
        const pU = users.filter(u => { const d = now.getTime()-new Date(u.lastLoginDate).getTime(); return d>=wMs&&d<wMs*2; }).length;
        const pW = workers.filter(w => { const d = now.getTime()-new Date(w.lastLoginDate).getTime(); return d>=wMs&&d<wMs*2; }).length;
        return { activeU: aU, activeW: aW, trendU: pU>0?((aU-pU)/pU)*100:aU>0?100:0, trendW: pW>0?((aW-pW)/pW)*100:aW>0?100:0 };
    }, [users, workers, period, now]);

    const growthPct = useMemo(() => {
        if (growthData.length < 2) return { users: 0, workers: 0, jobs: 0 };
        const l = growthData[growthData.length-1]; const p = growthData[growthData.length-2];
        const pct = (c: number, pr: number) => pr > 0 ? ((c-pr)/pr)*100 : c>0?100:0;
        return { users: pct(l.users,p.users), workers: pct(l.workers,p.workers), jobs: pct(l.jobs,p.jobs) };
    }, [growthData]);

    const jobStats = useMemo(() => {
        const total = allJobs.length;
        const completed = allJobs.filter(j => j.status==='completed').length;
        const pending = allJobs.filter(j => j.status==='pending'||j.status==='accepted').length;
        const inProgress = allJobs.filter(j => j.status==='in_progress'||j.status==='worker_completed').length;
        const cancelled = allJobs.filter(j => j.status==='cancelled').length;
        const declined = allJobs.filter(j => j.status==='declined').length;
        return { total, completed, pending, inProgress, cancelled, declined, completionRate: total>0?(completed/total)*100:0, cancelRate: total>0?(cancelled/total)*100:0 };
    }, [allJobs]);

    const jobsOverTime = useMemo(() => {
        const b = makeBuckets(allJobs.map(j => j.createdAt));
        return Array.from(b.entries()).sort().map(([k,v]) => ({ key: k, label: getBucketLabel(k,period), value: v }));
    }, [allJobs, makeBuckets]);

    const revenueData = useMemo(() => {
        const b = new Map<string,number>();
        transactions.forEach(tx => { if(!tx.paidAt) return; const k=getBucketKey(tx.paidAt,period); b.set(k,(b.get(k)||0)+tx.platformFee); });
        return Array.from(b.entries()).sort().map(([k,v]) => ({ key: k, label: getBucketLabel(k,period), value: Math.round(v) }));
    }, [transactions, period]);

    const totalRevenue = useMemo(() => transactions.reduce((s,t) => s+(t.platformFee||0), 0), [transactions]);

    const demandByService = useMemo(() => {
        const counts = new Map<string,number>();
        allJobs.forEach(j => counts.set(j.service,(counts.get(j.service)||0)+1));
        const total = allJobs.length;
        return Array.from(counts.entries()).map(([s,v],i) => ({ label:s, value:v, color:COLORS[i%COLORS.length], pct:total>0?(v/total)*100:0 })).sort((a,b) => b.value-a.value);
    }, [allJobs]);

    const supplyByService = useMemo(() => {
        const counts = new Map<string,number>();
        workers.forEach(w => counts.set(w.service,(counts.get(w.service)||0)+1));
        const total = workers.length;
        return Array.from(counts.entries()).map(([s,v],i) => ({ label:s, value:v, color:COLORS[i%COLORS.length], pct:total>0?(v/total)*100:0 })).sort((a,b) => b.value-a.value);
    }, [workers]);

    const completedByService = useMemo(() => {
        const counts = new Map<string,number>();
        allJobs.filter(j=>j.status==='completed').forEach(j => counts.set(j.service,(counts.get(j.service)||0)+1));
        const total = allJobs.filter(j=>j.status==='completed').length;
        return Array.from(counts.entries()).map(([s,v],i) => ({ label:s, value:v, color:COLORS[i%COLORS.length], pct:total>0?(v/total)*100:0 })).sort((a,b) => b.value-a.value);
    }, [allJobs]);

    const reviewStats = useMemo(() => {
        const uR = allJobs.filter(j=>j.userReview).map(j=>j.userReview!);
        const wR = allJobs.filter(j=>j.workerReview).map(j=>j.workerReview!);
        const avgU = uR.length>0?uR.reduce((s,r)=>s+r.rating,0)/uR.length:0;
        const avgW = wR.length>0?wR.reduce((s,r)=>s+r.rating,0)/wR.length:0;
        const dist = [1,2,3,4,5].map(star => ({ label:`${star}★`, value:uR.filter(r=>Math.round(r.rating)===star).length, color:star>=4?'#10b981':star===3?'#f59e0b':'#ef4444' }));
        const bySvc = new Map<string,number[]>();
        allJobs.filter(j=>j.userReview).forEach(j => { if(!bySvc.has(j.service)) bySvc.set(j.service,[]); bySvc.get(j.service)!.push(j.userReview!.rating); });
        const topRated = Array.from(bySvc.entries()).map(([s,ratings],i) => ({ label:s, value:ratings.reduce((a,b)=>a+b,0)/ratings.length, color:COLORS[i%COLORS.length] })).filter(x=>x.value>0).sort((a,b)=>b.value-a.value).slice(0,8);
        return { userReviews:uR, workerReviews:wR, avgUser:avgU, avgWorker:avgW, dist, topRated };
    }, [allJobs]);

    const gapAnalysis = useMemo(() => {
        return demandByService.slice(0,10).map(d => {
            const supply = supplyByService.find(s=>s.label===d.label);
            const sc = supply?.value||0;
            const ratio = sc>0?d.value/sc:d.value>0?Infinity:0;
            const status = ratio===Infinity?'critical':ratio>3?'high':ratio>1.5?'moderate':'balanced';
            return { ...d, supplyCount:sc, ratio, status };
        });
    }, [demandByService, supplyByService]);





    // ── Drill-down handlers ────────────────────────────────────────────────
    const openUserSignups = (point: { label: string; key?: string }) => {
        if (!point.key) return;
        const key = point.key;
        const matchedUsers = users.filter(u => u.signupDate && getBucketKey(u.signupDate, period) === key)
            .map(u => ({ id: u.id, name: u.name, email: u.email, type: 'user' as const, signupDate: u.signupDate, lastLoginDate: u.lastLoginDate, rating: u.rating, verificationStatus: u.verificationStatus }));
        setDrillModal({ title: `Nuevos Usuarios — ${point.label}`, subtitle: 'Clientes que se registraron en este período', items: matchedUsers });
    };

    const openWorkerSignups = (point: { label: string; key?: string }) => {
        if (!point.key) return;
        const key = point.key;
        const matchedWorkers = workers.filter(w => w.signupDate && getBucketKey(w.signupDate, period) === key)
            .map(w => ({ id: w.id, name: w.name, email: w.email, type: 'worker' as const, signupDate: w.signupDate, lastLoginDate: w.lastLoginDate, rating: w.rating, service: w.service, verificationStatus: w.verificationStatus }));
        setDrillModal({ title: `Nuevos Trabajadores — ${point.label}`, subtitle: 'Trabajadores que se registraron en este período', items: matchedWorkers });
    };

    const openLogins = (point: { label: string; key?: string }) => {
        if (!point.key) return;
        const key = point.key;
        const matchedUsers = users.filter(u => u.lastLoginDate && getBucketKey(u.lastLoginDate, period) === key)
            .map(u => ({ id: u.id, name: u.name, email: u.email, type: 'user' as const, signupDate: u.signupDate, lastLoginDate: u.lastLoginDate, rating: u.rating }));
        const matchedWorkers = workers.filter(w => w.lastLoginDate && getBucketKey(w.lastLoginDate, period) === key)
            .map(w => ({ id: w.id, name: w.name, email: w.email, type: 'worker' as const, signupDate: w.signupDate, lastLoginDate: w.lastLoginDate, rating: w.rating, service: w.service }));
        setDrillModal({ title: `Logins — ${point.label}`, subtitle: 'Usuarios y trabajadores que iniciaron sesión', items: [...matchedUsers, ...matchedWorkers] });
    };

    const openJobsDrilldown = (point: { label: string; key?: string }) => {
        if (!point.key) return;
        const key = point.key;
        const matchedJobs = allJobs.filter(j => j.createdAt && getBucketKey(j.createdAt, period) === key);
        const workerIds = [...new Set(matchedJobs.map(j => j.workerId).filter(Boolean))];
        const matchedWorkers = workers.filter(w => workerIds.includes(w.id))
            .map(w => ({ id: w.id, name: w.name, email: w.email, type: 'worker' as const, service: w.service, rating: w.rating }));
        setDrillModal({ title: `Trabajos Creados — ${point.label}`, subtitle: `${matchedJobs.length} trabajos · trabajadores involucrados`, items: matchedWorkers });
    };

    // ── Download handler (identical to original) ───────────────────────────
    const handleDownload = () => {
        const date = new Date().toISOString().slice(0,10);
        if (view==='overview'||view==='users') {
            downloadCSV([['Métrica','Valor'],['Total Usuarios',users.length],['Total Trabajadores',workers.length],['Usuarios Activos',activeData.activeU],['Trabajadores Activos',activeData.activeW],['Total Trabajos',jobStats.total],['Completados',jobStats.completed],['Tasa Completación',jobStats.completionRate.toFixed(1)+'%'],['Tasa Cancelación',jobStats.cancelRate.toFixed(1)+'%'],['Ingresos Plataforma',totalRevenue.toFixed(2)],[],['Crecimiento'],['Periodo','Nuevos Usuarios','Nuevos Trabajadores','Nuevos Trabajos'],...growthData.map(d=>[d.label,d.users,d.workers,d.jobs])],`tufix_resumen_${date}.csv`);
        } else if (view==='jobs') {
            downloadCSV([['Estado','Cantidad','%'],['Completados',jobStats.completed,jobStats.completionRate.toFixed(1)+'%'],['Pendientes',jobStats.pending,''],['En Progreso',jobStats.inProgress,''],['Cancelados',jobStats.cancelled,jobStats.cancelRate.toFixed(1)+'%'],['Declinados',jobStats.declined,''],[],['Por Periodo'],['Periodo','Trabajos'],...jobsOverTime.map(d=>[d.label,d.value])],`tufix_trabajos_${date}.csv`);
        } else if (view==='specialties') {
            downloadCSV([['Especialidad','Demanda','%','Oferta','Estado'],...gapAnalysis.map(d=>[d.label,d.value,d.pct.toFixed(1)+'%',d.supplyCount,d.status])],`tufix_especialidades_${date}.csv`);
        } else if (view==='reviews') {
            downloadCSV([['Métrica','Valor'],['Promedio Clientes',reviewStats.avgUser.toFixed(2)],['Promedio Trabajadores',reviewStats.avgWorker.toFixed(2)],['Total Reseñas Clientes',reviewStats.userReviews.length],['Total Reseñas Trabajadores',reviewStats.workerReviews.length],[],['Distribución'],['Estrellas','Cantidad'],...reviewStats.dist.map(d=>[d.label,d.value])],`tufix_resenas_${date}.csv`);
        }
    };

    const activeSpecialties = (specialtyFilter==='demand'?demandByService:specialtyFilter==='supply'?supplyByService:completedByService) ?? [];
    const periodLabel = { daily:'Diario', weekly:'Semanal', monthly:'Mensual', annual:'Anual' }[period];

    return (
        <div className="min-h-screen bg-slate-50">
            {drillModal && <DrillDownModal modal={drillModal} onClose={() => setDrillModal(null)} />}

            {/* Top Bar — identical to original */}
            <div className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-10 shadow-sm">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div>
                            <h1 className="text-xl font-black text-gray-900">Analytics de la App</h1>
                            <p className="text-xs text-gray-400">Actualizado {lastUpdated.toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'})}</p>
                        </div>
                        <LiveDot />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex bg-gray-100 rounded-xl p-0.5 gap-0.5">
                            {(['daily','weekly','monthly','annual'] as Period[]).map(p => (
                                <button key={p} onClick={()=>setPeriod(p)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${period===p?'bg-white text-indigo-600 shadow':'text-gray-500 hover:text-gray-700'}`}>
                                    {{daily:'Día',weekly:'Sem',monthly:'Mes',annual:'Año'}[p]}
                                </button>
                            ))}
                        </div>
                        <button onClick={handleDownload} className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-sm">
                            📥 Exportar CSV
                        </button>
                    </div>
                </div>
                <div className="flex gap-1 mt-3 overflow-x-auto pb-1">
                    {([{id:'overview',label:'General',icon:'📊'},{id:'users',label:'Usuarios',icon:'👥'},{id:'jobs',label:'Trabajos',icon:'📋'},{id:'specialties',label:'Especialidades',icon:'🔧'},{id:'reviews',label:'Reseñas',icon:'⭐'}] as {id:FilterView;label:string;icon:string}[]).map(n => (
                        <button key={n.id} onClick={()=>setView(n.id)} className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0 ${view===n.id?'bg-indigo-600 text-white shadow':'text-gray-500 hover:bg-gray-100'}`}>
                            {n.icon} {n.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="p-4 md:p-6 space-y-6">

                {/* OVERVIEW */}
                {view==='overview' && (<>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <KpiCard icon="👤" label="Total Usuarios" value={fmt(users.length)} sub="Clientes registrados" trend={growthPct.users} color="#6366f1" />
                        <KpiCard icon="🔧" label="Total Trabajadores" value={fmt(workers.length)} sub="Proveedores registrados" trend={growthPct.workers} color="#f59e0b" />
                        <KpiCard icon="📋" label="Total Trabajos" value={fmt(jobStats.total)} sub={`${jobStats.completionRate.toFixed(0)}% completados`} trend={growthPct.jobs} color="#10b981" />
                        <KpiCard icon="💰" label="Ingresos Plataforma" value={`$${fmt(Math.round(totalRevenue))}`} sub="Comisiones acumuladas" color="#ef4444" />
                        <KpiCard icon="🟢" label="Usuarios Activos" value={fmt(activeData.activeU)} sub={`Últimos (${periodLabel})`} trend={activeData.trendU} color="#3b82f6" />
                        <KpiCard icon="🟡" label="Trabaj. Activos" value={fmt(activeData.activeW)} sub={`Últimos (${periodLabel})`} trend={activeData.trendW} color="#ec4899" />
                        <KpiCard icon="✅" label="Completados" value={fmt(jobStats.completed)} sub={`${jobStats.completionRate.toFixed(1)}% del total`} color="#10b981" />
                        <KpiCard icon="❌" label="Cancelados" value={fmt(jobStats.cancelled)} sub={`${jobStats.cancelRate.toFixed(1)}% del total`} color="#ef4444" />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Section title="📈 Nuevos Usuarios por Periodo" subtitle={`Vista ${periodLabel.toLowerCase()} · hover para ver · click para detalles`}>
                            <InteractiveBarChart data={growthData.slice(-12).map(d=>({label:d.label,value:d.users,color:'#6366f1',key:d.key}))} label="usuarios" onClickBar={openUserSignups} />
                        </Section>
                        <Section title="📈 Nuevos Trabajadores por Periodo" subtitle={`Vista ${periodLabel.toLowerCase()} · hover para ver · click para detalles`}>
                            <InteractiveBarChart data={growthData.slice(-12).map(d=>({label:d.label,value:d.workers,color:'#f59e0b',key:d.key}))} label="trabajadores" onClickBar={openWorkerSignups} />
                        </Section>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Section title="🔐 Logins por Periodo" subtitle="Hover para ver · click para ver quién entró">
                            <InteractiveLineChart data={loginData} color="#6366f1" label="logins" onClickPoint={openLogins} />
                        </Section>
                        <Section title="💰 Ingresos por Periodo" subtitle="Comisiones de plataforma · hover para ver monto">
                            <InteractiveLineChart data={revenueData} color="#10b981" label="$" />
                        </Section>
                    </div>
                    <Section title="📊 Estado de la App" subtitle="Comparativa vs período anterior">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {[{label:'Nuevos usuarios',trend:growthPct.users,icon:'👤'},{label:'Nuevos trabajadores',trend:growthPct.workers,icon:'🔧'},{label:'Nuevos trabajos',trend:growthPct.jobs,icon:'📋'}].map((item,i) => {
                                const up=item.trend>=5; const down=item.trend<=-5;
                                return (
                                    <div key={i} className={`rounded-xl p-4 text-center border ${up?'bg-emerald-50 border-emerald-200':down?'bg-red-50 border-red-200':'bg-amber-50 border-amber-200'}`}>
                                        <div className="text-2xl mb-1">{item.icon}</div>
                                        <div className={`text-xl font-black ${up?'text-emerald-700':down?'text-red-700':'text-amber-700'}`}>{fmtPct(item.trend)}</div>
                                        <div className="text-sm text-gray-600 mt-1">{item.label}</div>
                                        <div className={`text-xs font-bold mt-1 ${up?'text-emerald-600':down?'text-red-600':'text-amber-600'}`}>{up?'▲ Creciendo':down?'▼ Decayendo':'→ Estable'}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </Section>
                </>)}

                {/* USERS */}
                {view==='users' && (<>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <KpiCard icon="👤" label="Total Usuarios" value={fmt(users.length)} color="#6366f1" trend={growthPct.users} />
                        <KpiCard icon="🔧" label="Total Trabajadores" value={fmt(workers.length)} color="#f59e0b" trend={growthPct.workers} />
                        <KpiCard icon="🟢" label="Activos (periodo)" value={fmt(activeData.activeU+activeData.activeW)} sub={`${activeData.activeU} clientes · ${activeData.activeW} trabaj.`} color="#10b981" />
                        <KpiCard icon="🔐" label="Logins Recientes" value={fmt(loginData.reduce((a,d)=>a+d.value,0))} sub="En los últimos periodos" color="#3b82f6" />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Section title="📅 Nuevos Usuarios por Periodo" subtitle="Click en una barra para ver quiénes se registraron">
                            <InteractiveLineChart data={growthData.map(d=>({label:d.label,value:d.users,key:d.key}))} color="#6366f1" label="usuarios" onClickPoint={openUserSignups} />
                        </Section>
                        <Section title="📅 Nuevos Trabajadores por Periodo" subtitle="Click en un punto para ver quiénes se registraron">
                            <InteractiveLineChart data={growthData.map(d=>({label:d.label,value:d.workers,key:d.key}))} color="#f59e0b" label="trabajadores" onClickPoint={openWorkerSignups} />
                        </Section>
                    </div>
                    <Section title="🔐 Actividad de Logins" subtitle="Click en un punto para ver quién entró ese día">
                        <InteractiveLineChart data={loginData} color="#6366f1" height={150} label="logins" onClickPoint={openLogins} />
                    </Section>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Section title="✅ Verificación de Usuarios">
                            <div className="space-y-3">
                                {[{label:'Aprobados',value:users.filter(u=>u.verificationStatus==='approved').length,color:'#10b981'},{label:'Pendientes',value:users.filter(u=>u.verificationStatus==='pending').length,color:'#f59e0b'},{label:'Declinados',value:users.filter(u=>u.verificationStatus==='declined').length,color:'#ef4444'}].map((d,i) => (
                                    <RankedBar key={i} rank={i+1} label={d.label} value={d.value} max={Math.max(users.length,1)} color={d.color} pct={users.length>0?(d.value/users.length)*100:0} />
                                ))}
                            </div>
                        </Section>
                        <Section title="✅ Verificación de Trabajadores">
                            <div className="space-y-3">
                                {[{label:'Aprobados',value:workers.filter(w=>w.verificationStatus==='approved').length,color:'#10b981'},{label:'Pendientes',value:workers.filter(w=>w.verificationStatus==='pending').length,color:'#f59e0b'},{label:'Declinados',value:workers.filter(w=>w.verificationStatus==='declined').length,color:'#ef4444'}].map((d,i) => (
                                    <RankedBar key={i} rank={i+1} label={d.label} value={d.value} max={Math.max(workers.length,1)} color={d.color} pct={workers.length>0?(d.value/workers.length)*100:0} />
                                ))}
                            </div>
                        </Section>
                    </div>
                </>)}

                {/* JOBS */}
                {view==='jobs' && (<>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <KpiCard icon="📋" label="Total Trabajos" value={fmt(jobStats.total)} color="#6366f1" trend={growthPct.jobs} />
                        <KpiCard icon="✅" label="Completados" value={fmt(jobStats.completed)} sub={`${jobStats.completionRate.toFixed(1)}%`} color="#10b981" />
                        <KpiCard icon="⏳" label="Pend./Activos" value={fmt(jobStats.pending+jobStats.inProgress)} sub={`${jobStats.pending} pend · ${jobStats.inProgress} activos`} color="#f59e0b" />
                        <KpiCard icon="❌" label="Cancelados" value={fmt(jobStats.cancelled)} sub={`${jobStats.cancelRate.toFixed(1)}%`} color="#ef4444" />
                    </div>
                    <Section title="📋 Trabajos por Período" subtitle={`Vista ${periodLabel.toLowerCase()} · click en un punto para ver los trabajadores`}>
                        <InteractiveLineChart data={jobsOverTime} color="#6366f1" height={150} label="trabajos" onClickPoint={openJobsDrilldown} />
                    </Section>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Section title="🍩 Distribución por Estado">
                            <div className="flex gap-6 items-center">
                                <div className="w-36 flex-shrink-0">
                                    <DonutChart data={[{label:'Completados',value:jobStats.completed,color:'#10b981'},{label:'Pendientes',value:jobStats.pending,color:'#f59e0b'},{label:'En Progreso',value:jobStats.inProgress,color:'#3b82f6'},{label:'Cancelados',value:jobStats.cancelled,color:'#ef4444'},{label:'Declinados',value:jobStats.declined,color:'#9ca3af'}]} />
                                </div>
                                <div className="flex-1 space-y-2">
                                    {[{label:'Completados',value:jobStats.completed,color:'#10b981'},{label:'Pendientes',value:jobStats.pending,color:'#f59e0b'},{label:'En Progreso',value:jobStats.inProgress,color:'#3b82f6'},{label:'Cancelados',value:jobStats.cancelled,color:'#ef4444'},{label:'Declinados',value:jobStats.declined,color:'#9ca3af'}].map((d,i) => (
                                        <RankedBar key={i} rank={i+1} label={d.label} value={d.value} max={Math.max(jobStats.total,1)} color={d.color} pct={jobStats.total>0?(d.value/jobStats.total)*100:0} />
                                    ))}
                                </div>
                            </div>
                        </Section>
                        <Section title="💰 Ingresos por Período">
                            <InteractiveLineChart data={revenueData} color="#10b981" label="$" />
                            <div className="mt-3 p-3 bg-emerald-50 rounded-xl text-center">
                                <p className="text-xl font-black text-emerald-700">${fmt(Math.round(totalRevenue))}</p>
                                <p className="text-xs text-emerald-600">Total acumulado</p>
                            </div>
                        </Section>
                    </div>
                </>)}

                {/* SPECIALTIES — identical to original */}
                {view==='specialties' && (<>
                    <div className="flex bg-white border border-gray-200 rounded-xl p-1 w-fit gap-1 shadow-sm flex-wrap">
                        {([{id:'demand',label:'🔍 Lo que buscan clientes'},{id:'supply',label:'🔧 Lo que ofrecen trabaj.'},{id:'completed',label:'✅ Más completados'}] as const).map(opt => (
                            <button key={opt.id} onClick={()=>setSpecialtyFilter(opt.id)} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${specialtyFilter===opt.id?'bg-indigo-600 text-white shadow':'text-gray-500 hover:bg-gray-50'}`}>{opt.label}</button>
                        ))}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Section title={specialtyFilter==='demand'?'🔍 Lo que los Clientes más Buscan':specialtyFilter==='supply'?'🔧 Lo que los Trabajadores Ofrecen':'✅ Especialidades más Completadas'} subtitle="Top 10 · por volumen">
                            <div className="flex gap-4 items-start">
                                <div className="w-32 flex-shrink-0 mt-2"><DonutChart data={activeSpecialties.slice(0,8)} /></div>
                                <div className="flex-1 space-y-3 overflow-y-auto max-h-64">
                                    {activeSpecialties.slice(0,10).map((d,i) => (
                                        <RankedBar key={i} rank={i+1} label={d.label} value={d.value} max={activeSpecialties[0]?.value||1} color={d.color} pct={d.pct} />
                                    ))}
                                </div>
                            </div>
                        </Section>
                        <Section title="📊 Oferta vs Demanda" subtitle="¿Hay suficientes trabajadores para la demanda?">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead><tr className="border-b border-gray-100"><th className="text-left py-2 text-xs font-bold text-gray-500 uppercase">Especialidad</th><th className="text-right py-2 text-xs font-bold text-gray-500 uppercase">Demanda</th><th className="text-right py-2 text-xs font-bold text-gray-500 uppercase">Oferta</th><th className="text-right py-2 text-xs font-bold text-gray-500 uppercase">Estado</th></tr></thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {gapAnalysis.map((d,i) => (
                                            <tr key={i} className="hover:bg-gray-50">
                                                <td className="py-2 font-medium text-gray-800 max-w-[120px] truncate">{d.label}</td>
                                                <td className="py-2 text-right font-bold text-indigo-700">{d.value}</td>
                                                <td className="py-2 text-right font-bold text-amber-600">{d.supplyCount}</td>
                                                <td className="py-2 text-right">
                                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${d.status==='critical'?'bg-red-100 text-red-700':d.status==='high'?'bg-orange-100 text-orange-700':d.status==='moderate'?'bg-yellow-100 text-yellow-700':'bg-emerald-100 text-emerald-700'}`}>
                                                        {{critical:'🔴 Crítico',high:'🟠 Alta',moderate:'🟡 Mod.',balanced:'🟢 OK'}[d.status]}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Section>
                    </div>
                    <Section title="📊 Visualización Top Especialidades">
                        <InteractiveBarChart data={activeSpecialties.slice(0,12).map(d=>({label:d.label,value:d.value,color:d.color}))} height={150} label="trabajos" />
                    </Section>
                </>)}

                {/* REVIEWS — identical to original */}
                {view==='reviews' && (<>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <KpiCard icon="⭐" label="Promedio Clientes" value={reviewStats.avgUser.toFixed(2)} sub={`${reviewStats.userReviews.length} reseñas`} color="#f59e0b" />
                        <KpiCard icon="⭐" label="Promedio Trabajadores" value={reviewStats.avgWorker.toFixed(2)} sub={`${reviewStats.workerReviews.length} reseñas`} color="#6366f1" />
                        <KpiCard icon="📝" label="Total Reseñas" value={fmt(reviewStats.userReviews.length+reviewStats.workerReviews.length)} sub="De ambas partes" color="#10b981" />
                        <KpiCard icon="📋" label="Con Reseña" value={`${jobStats.total>0?((reviewStats.userReviews.length/jobStats.total)*100).toFixed(0):0}%`} sub="Del total de trabajos" color="#3b82f6" />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Section title="⭐ Distribución de Calificaciones" subtitle="Reseñas de clientes a trabajadores">
                            <InteractiveBarChart data={reviewStats.dist} height={130} label="reseñas" />
                        </Section>
                        <Section title="🏆 Mejores Especialidades por Rating">
                            <div className="space-y-3">
                                {reviewStats.topRated.map((d,i) => (
                                    <RankedBar key={i} rank={i+1} label={d.label} value={parseFloat(d.value.toFixed(2))} max={5} color={d.color} pct={(d.value/5)*100} />
                                ))}
                                {!reviewStats.topRated.length && <p className="text-gray-400 text-sm text-center py-6">Sin reseñas aún</p>}
                            </div>
                        </Section>
                    </div>
                    <Section title="💬 Reseñas Recientes" subtitle="Últimas opiniones de clientes">
                        <div className="space-y-3 max-h-80 overflow-y-auto">
                            {allJobs.filter(j=>j.userReview).sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime()).slice(0,10).map((job,i) => (
                                <div key={i} className="flex gap-3 p-3 bg-gray-50 rounded-xl">
                                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-600 flex-shrink-0">{job.userReview!.author?.charAt(0)||'?'}</div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-sm font-semibold text-gray-800 truncate">{job.userReview!.author}</span>
                                            <span className="text-xs text-amber-500 font-bold flex-shrink-0">{'★'.repeat(Math.round(job.userReview!.rating))}{'☆'.repeat(5-Math.round(job.userReview!.rating))}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{job.userReview!.comment||'Sin comentario'}</p>
                                        <p className="text-xs text-gray-400 mt-1">{job.service} · {fmtDate(job.createdAt)}</p>
                                    </div>
                                </div>
                            ))}
                            {!allJobs.filter(j=>j.userReview).length && <p className="text-gray-400 text-sm text-center py-6">Sin reseñas aún</p>}
                        </div>
                    </Section>
                </>)}

                <div className="flex items-center justify-center gap-2 pb-4">
                    <p className="text-center text-xs text-gray-400">TUFIX Analytics · Datos en tiempo real desde Firebase ·</p>
                    <LiveDot />
                </div>
            </div>
        </div>
    );
};

export default AppAnalyticsDashboard;