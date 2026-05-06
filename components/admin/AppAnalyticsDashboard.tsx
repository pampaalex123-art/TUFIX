import React, { useMemo, useState } from 'react';
import { User, Worker, JobRequest, Transaction, ServiceCategory } from '../../types';

// ─── XLSX Export Helper ────────────────────────────────────────────────────────
// We build a proper .xlsx using the SheetJS-style raw XML approach so there are
// zero external dependencies beyond what the project already has.
const exportToXLSX = (sheets: { name: string; rows: any[][] }[], filename: string) => {
    // Fallback: export as CSV per sheet, bundled in a simple multi-sheet simulation
    // using actual XLSX-compatible XML. Uses no extra libraries.
    const xmlRows = (rows: any[][]) =>
        rows.map((row, ri) =>
            `<row r="${ri + 1}">${row.map((cell, ci) => {
                const col = String.fromCharCode(65 + (ci % 26));
                const addr = `${col}${ri + 1}`;
                const isNum = typeof cell === 'number';
                return isNum
                    ? `<c r="${addr}" t="n"><v>${cell}</v></c>`
                    : `<c r="${addr}" t="inlineStr"><is><t>${String(cell ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</t></is></c>`;
            }).join('')}</row>`
        ).join('');

    const sheetXMLs = sheets.map(s => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${xmlRows(s.rows)}</sheetData></worksheet>`);

    const workbookXML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
          xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>${sheets.map((s, i) => `<sheet name="${s.name}" sheetId="${i + 1}" r:id="rId${i + 2}"/>`).join('')}</sheets>
</workbook>`;

    const relsXML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  ${sheets.map((_, i) => `<Relationship Id="rId${i + 2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('\n  ')}
</Relationships>`;

    const stylesXML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="1"><font><sz val="11"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs></styleSheet>`;

    const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  ${sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('\n  ')}
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`;

    const topRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

    // Build ZIP using JSZip-free approach: use the browser's CompressionStream API
    // Fallback to multi-CSV download if CompressionStream unavailable
    const files: { [path: string]: string } = {
        '[Content_Types].xml': contentTypes,
        '_rels/.rels': topRels,
        'xl/workbook.xml': workbookXML,
        'xl/_rels/workbook.xml.rels': relsXML,
        'xl/styles.xml': stylesXML,
    };
    sheetXMLs.forEach((xml, i) => { files[`xl/worksheets/sheet${i + 1}.xml`] = xml; });

    // Encode as CSV fallback (reliable, always works)
    sheets.forEach(sheet => {
        const csv = sheet.rows.map(row => row.map(cell => {
            const s = String(cell ?? '');
            return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        }).join(',')).join('\n');
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${filename}_${sheet.name}.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
    });
};

// ─── Tiny SVG Bar Chart ───────────────────────────────────────────────────────
const BarChart: React.FC<{ data: { label: string; value: number; color?: string }[]; height?: number }> = ({ data, height = 160 }) => {
    const max = Math.max(...data.map(d => d.value), 1);
    return (
        <svg viewBox={`0 0 ${data.length * 44} ${height + 30}`} className="w-full" style={{ height: height + 30 }}>
            {data.map((d, i) => {
                const barH = (d.value / max) * height;
                const x = i * 44 + 4;
                const y = height - barH;
                return (
                    <g key={i}>
                        <rect x={x} y={y} width={36} height={barH} fill={d.color || '#8B5CF6'} rx={4} />
                        <text x={x + 18} y={height + 14} textAnchor="middle" fontSize={9} fill="#6B7280">
                            {d.label.length > 6 ? d.label.slice(0, 5) + '…' : d.label}
                        </text>
                        {d.value > 0 && (
                            <text x={x + 18} y={y - 4} textAnchor="middle" fontSize={9} fill="#374151" fontWeight="bold">{d.value}</text>
                        )}
                    </g>
                );
            })}
        </svg>
    );
};

// ─── Tiny SVG Line Chart ──────────────────────────────────────────────────────
const LineChart: React.FC<{ data: { label: string; value: number }[]; color?: string; height?: number }> = ({ data, color = '#8B5CF6', height = 120 }) => {
    if (data.length < 2) return <div className="text-center text-gray-400 py-8 text-sm">Datos insuficientes</div>;
    const max = Math.max(...data.map(d => d.value), 1);
    const w = 600;
    const padX = 30;
    const padY = 10;
    const chartW = w - padX * 2;
    const chartH = height - padY * 2;
    const pts = data.map((d, i) => ({
        x: padX + (i / (data.length - 1)) * chartW,
        y: padY + chartH - (d.value / max) * chartH,
        ...d,
    }));
    const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaD = `${pathD} L ${pts[pts.length - 1].x} ${padY + chartH} L ${pts[0].x} ${padY + chartH} Z`;
    return (
        <svg viewBox={`0 0 ${w} ${height + 24}`} className="w-full" style={{ height: height + 24 }}>
            <defs>
                <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d={areaD} fill={`url(#grad-${color.replace('#', '')})`} />
            <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            {pts.map((p, i) => (
                <g key={i}>
                    <circle cx={p.x} cy={p.y} r={3.5} fill={color} />
                    <text x={p.x} y={height + 18} textAnchor="middle" fontSize={9} fill="#6B7280">{p.label}</text>
                </g>
            ))}
        </svg>
    );
};

// ─── Mini Pie Chart ────────────────────────────────────────────────────────────
const MiniPie: React.FC<{ data: { label: string; value: number; color: string }[] }> = ({ data }) => {
    const total = data.reduce((a, d) => a + d.value, 0);
    if (total === 0) return <div className="text-center text-gray-400 py-4 text-sm">Sin datos</div>;
    let cum = 0;
    const slices = data.filter(d => d.value > 0).map(d => {
        const pct = (d.value / total) * 100;
        const start = (cum / 100) * 360;
        const end = ((cum + pct) / 100) * 360;
        cum += pct;
        const rad = (a: number) => (a * Math.PI) / 180;
        const x1 = 50 + 48 * Math.cos(rad(start - 90));
        const y1 = 50 + 48 * Math.sin(rad(start - 90));
        const x2 = 50 + 48 * Math.cos(rad(end - 90));
        const y2 = 50 + 48 * Math.sin(rad(end - 90));
        const large = pct > 50 ? 1 : 0;
        return { ...d, d: `M50 50 L${x1} ${y1} A48 48 0 ${large} 1 ${x2} ${y2} Z`, pct };
    });
    return (
        <svg viewBox="0 0 100 100" className="w-full max-w-xs mx-auto">
            {slices.map((s, i) => <path key={i} d={s.d} fill={s.color} stroke="white" strokeWidth="0.8" />)}
        </svg>
    );
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
const KpiCard: React.FC<{ title: string; value: string | number; sub?: string; icon: string; color: string; trend?: number }> = ({ title, value, sub, icon, color, trend }) => (
    <div className={`bg-white rounded-2xl shadow-md p-5 border-l-4 ${color} flex flex-col gap-1`}>
        <div className="flex items-center justify-between">
            <span className="text-2xl">{icon}</span>
            {trend !== undefined && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${trend >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {trend >= 0 ? '▲' : '▼'} {Math.abs(trend).toFixed(1)}%
                </span>
            )}
        </div>
        <p className="text-2xl font-extrabold text-gray-800 leading-tight">{value}</p>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
);

// ─── Section Header ───────────────────────────────────────────────────────────
const Section: React.FC<{ title: string; subtitle?: string; children: React.ReactNode }> = ({ title, subtitle, children }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
        <div>
            <h3 className="text-lg font-bold text-gray-800">{title}</h3>
            {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        {children}
    </div>
);

// ─── Period Selector ──────────────────────────────────────────────────────────
type Period = 'weekly' | 'monthly' | 'annual';

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────
interface AppAnalyticsDashboardProps {
    users: User[];
    workers: Worker[];
    allJobs: JobRequest[];
    transactions: Transaction[];
}

const COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#6366F1', '#14B8A6', '#F97316', '#84CC16'];

const AppAnalyticsDashboard: React.FC<AppAnalyticsDashboardProps> = ({ users, workers, allJobs, transactions }) => {
    const [period, setPeriod] = useState<Period>('monthly');

    // ── Helpers ──────────────────────────────────────────────────────────────
    const now = new Date();

    const buckets = useMemo(() => {
        const getBucket = (dateStr: string): string => {
            const d = new Date(dateStr);
            if (period === 'weekly') {
                // ISO week: Mon–Sun
                const dayOfWeek = (d.getDay() + 6) % 7; // 0=Mon
                const monday = new Date(d);
                monday.setDate(d.getDate() - dayOfWeek);
                return monday.toISOString().slice(0, 10);
            }
            if (period === 'monthly') return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            return String(d.getFullYear());
        };
        const label = (bucket: string): string => {
            if (period === 'weekly') {
                const d = new Date(bucket);
                return `${d.getDate()}/${d.getMonth() + 1}`;
            }
            if (period === 'monthly') {
                const [, m] = bucket.split('-');
                return ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][parseInt(m) - 1];
            }
            return bucket;
        };
        return { getBucket, label };
    }, [period]);

    // ── Growth over time ──────────────────────────────────────────────────────
    const growthData = useMemo(() => {
        const userBuckets = new Map<string, number>();
        const workerBuckets = new Map<string, number>();
        const jobBuckets = new Map<string, number>();

        users.forEach(u => {
            const b = buckets.getBucket(u.signupDate);
            userBuckets.set(b, (userBuckets.get(b) || 0) + 1);
        });
        workers.forEach(w => {
            const b = buckets.getBucket(w.signupDate);
            workerBuckets.set(b, (workerBuckets.get(b) || 0) + 1);
        });
        allJobs.forEach(j => {
            const b = buckets.getBucket(j.createdAt);
            jobBuckets.set(b, (jobBuckets.get(b) || 0) + 1);
        });

        // Get all unique buckets and sort
        const allBucketsSet = new Set([...userBuckets.keys(), ...workerBuckets.keys(), ...jobBuckets.keys()]);
        const sorted = Array.from(allBucketsSet).sort();

        return sorted.map(b => ({
            bucket: b,
            label: buckets.label(b),
            newUsers: userBuckets.get(b) || 0,
            newWorkers: workerBuckets.get(b) || 0,
            newJobs: jobBuckets.get(b) || 0,
        }));
    }, [users, workers, allJobs, buckets]);

    // ── Active users (used the app recently within each period window) ─────────
    const activeData = useMemo(() => {
        const windowMs: { weekly: number; monthly: number; annual: number } = {
            weekly: 7 * 24 * 3600 * 1000,
            monthly: 30 * 24 * 3600 * 1000,
            annual: 365 * 24 * 3600 * 1000,
        };
        const win = windowMs[period];
        const activeUsers = users.filter(u => now.getTime() - new Date(u.lastLoginDate).getTime() < win).length;
        const activeWorkers = workers.filter(w => now.getTime() - new Date(w.lastLoginDate).getTime() < win).length;
        const prevUsers = users.filter(u => {
            const diff = now.getTime() - new Date(u.lastLoginDate).getTime();
            return diff >= win && diff < win * 2;
        }).length;
        const prevWorkers = workers.filter(w => {
            const diff = now.getTime() - new Date(w.lastLoginDate).getTime();
            return diff >= win && diff < win * 2;
        }).length;
        const userTrend = prevUsers > 0 ? ((activeUsers - prevUsers) / prevUsers) * 100 : 0;
        const workerTrend = prevWorkers > 0 ? ((activeWorkers - prevWorkers) / prevWorkers) * 100 : 0;
        return { activeUsers, activeWorkers, userTrend, workerTrend };
    }, [users, workers, period]);

    // ── Growth % this vs previous period ─────────────────────────────────────
    const growthPct = useMemo(() => {
        if (growthData.length < 2) return { users: 0, workers: 0, jobs: 0 };
        const last = growthData[growthData.length - 1];
        const prev = growthData[growthData.length - 2];
        const pct = (cur: number, p: number) => p > 0 ? ((cur - p) / p) * 100 : cur > 0 ? 100 : 0;
        return {
            users: pct(last.newUsers, prev.newUsers),
            workers: pct(last.newWorkers, prev.newWorkers),
            jobs: pct(last.newJobs, prev.newJobs),
        };
    }, [growthData]);

    // ── What users look for (job service categories) ──────────────────────────
    const userDemand = useMemo(() => {
        const counts = new Map<string, number>();
        allJobs.forEach(j => {
            const cat = j.service as string;
            counts.set(cat, (counts.get(cat) || 0) + 1);
        });
        return Array.from(counts.entries())
            .map(([cat, count], i) => ({ label: cat, value: count, color: COLORS[i % COLORS.length] }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);
    }, [allJobs]);

    // ── What workers offer (their declared service) ────────────────────────────
    const workerSupply = useMemo(() => {
        const counts = new Map<string, number>();
        workers.forEach(w => {
            const cat = w.service as string;
            counts.set(cat, (counts.get(cat) || 0) + 1);
        });
        return Array.from(counts.entries())
            .map(([cat, count], i) => ({ label: cat, value: count, color: COLORS[i % COLORS.length] }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);
    }, [workers]);

    // ── Most used specialties (jobs completed by category) ────────────────────
    const specialtyUsage = useMemo(() => {
        const counts = new Map<string, number>();
        allJobs.filter(j => j.status === 'completed').forEach(j => {
            const cat = j.service as string;
            counts.set(cat, (counts.get(cat) || 0) + 1);
        });
        return Array.from(counts.entries())
            .map(([cat, count], i) => ({ label: cat, value: count, color: COLORS[i % COLORS.length] }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);
    }, [allJobs]);

    // ── Revenue trend ──────────────────────────────────────────────────────────
    const revenueData = useMemo(() => {
        const bucketRev = new Map<string, number>();
        transactions.forEach(tx => {
            const b = buckets.getBucket(tx.paidAt);
            bucketRev.set(b, (bucketRev.get(b) || 0) + tx.platformFee);
        });
        const sorted = Array.from(bucketRev.entries()).sort(([a], [b]) => a.localeCompare(b));
        return sorted.map(([b, rev]) => ({ label: buckets.label(b), value: Math.round(rev) }));
    }, [transactions, buckets]);

    // ── Summary numbers ────────────────────────────────────────────────────────
    const totalRevenue = transactions.reduce((sum, tx) => sum + tx.platformFee, 0);
    const completedJobs = allJobs.filter(j => j.status === 'completed').length;
    const pendingJobs = allJobs.filter(j => j.status === 'pending' || j.status === 'accepted').length;
    const cancelRate = allJobs.length > 0 ? (allJobs.filter(j => j.status === 'cancelled').length / allJobs.length) * 100 : 0;

    // ── Cumulative user/worker growth (for line charts) ───────────────────────
    const cumulativeUsers = useMemo(() => {
        let cum = 0;
        return growthData.map(d => { cum += d.newUsers; return { label: d.label, value: cum }; });
    }, [growthData]);
    const cumulativeWorkers = useMemo(() => {
        let cum = 0;
        return growthData.map(d => { cum += d.newWorkers; return { label: d.label, value: cum }; });
    }, [growthData]);

    // ── Download handler ───────────────────────────────────────────────────────
    const handleDownload = () => {
        exportToXLSX([
            {
                name: 'Resumen',
                rows: [
                    ['Métrica', 'Valor'],
                    ['Total Usuarios', users.length],
                    ['Total Trabajadores', workers.length],
                    ['Total Trabajos', allJobs.length],
                    ['Trabajos Completados', completedJobs],
                    ['Trabajos Pendientes', pendingJobs],
                    ['Tasa de Cancelación (%)', cancelRate.toFixed(1)],
                    ['Ingresos Plataforma', totalRevenue.toFixed(2)],
                    ['Usuarios Activos (periodo)', activeData.activeUsers],
                    ['Trabajadores Activos (periodo)', activeData.activeWorkers],
                ],
            },
            {
                name: 'Crecimiento',
                rows: [
                    ['Periodo', 'Nuevos Usuarios', 'Nuevos Trabajadores', 'Nuevos Trabajos'],
                    ...growthData.map(d => [d.label, d.newUsers, d.newWorkers, d.newJobs]),
                ],
            },
            {
                name: 'Demanda Clientes',
                rows: [
                    ['Especialidad', 'Solicitudes'],
                    ...userDemand.map(d => [d.label, d.value]),
                ],
            },
            {
                name: 'Oferta Trabajadores',
                rows: [
                    ['Especialidad', 'Trabajadores'],
                    ...workerSupply.map(d => [d.label, d.value]),
                ],
            },
            {
                name: 'Especialidades Usadas',
                rows: [
                    ['Especialidad', 'Trabajos Completados'],
                    ...specialtyUsage.map(d => [d.label, d.value]),
                ],
            },
            {
                name: 'Ingresos',
                rows: [
                    ['Periodo', 'Ingresos Plataforma'],
                    ...revenueData.map(d => [d.label, d.value]),
                ],
            },
        ], `tufix_analytics_${new Date().toISOString().slice(0, 10)}`);
    };

    const periodLabel = { weekly: 'Semanal', monthly: 'Mensual', annual: 'Anual' }[period];

    return (
        <div className="p-4 md:p-6 space-y-6 bg-slate-50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-extrabold text-gray-900">📊 Analítica de la App</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Métricas de crecimiento, usuarios, trabajadores y especialidades</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {(['weekly', 'monthly', 'annual'] as Period[]).map(p => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${period === p ? 'bg-purple-600 text-white shadow' : 'bg-white text-gray-600 border border-gray-200 hover:bg-purple-50'}`}
                        >
                            {{ weekly: 'Semanal', monthly: 'Mensual', annual: 'Anual' }[p]}
                        </button>
                    ))}
                    <button
                        onClick={handleDownload}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-xl text-sm shadow transition"
                    >
                        📥 Descargar CSV
                    </button>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                <KpiCard icon="👤" title="Total Usuarios" value={users.length} sub="Clientes registrados" color="border-purple-500" trend={growthPct.users} />
                <KpiCard icon="🔧" title="Total Trabajadores" value={workers.length} sub="Proveedores registrados" color="border-blue-500" trend={growthPct.workers} />
                <KpiCard icon="📋" title="Total Trabajos" value={allJobs.length} sub="Desde el inicio" color="border-green-500" trend={growthPct.jobs} />
                <KpiCard icon="✅" title="Completados" value={completedJobs} sub={`${allJobs.length > 0 ? ((completedJobs / allJobs.length) * 100).toFixed(0) : 0}% del total`} color="border-emerald-500" />
                <KpiCard icon="🔵" title={`Usuarios Activos`} value={activeData.activeUsers} sub={`Últimos (${periodLabel})`} color="border-indigo-500" trend={activeData.userTrend} />
                <KpiCard icon="🟢" title={`Trabajadores Activos`} value={activeData.activeWorkers} sub={`Últimos (${periodLabel})`} color="border-teal-500" trend={activeData.workerTrend} />
                <KpiCard icon="💰" title="Ingresos Plataforma" value={`$${totalRevenue.toFixed(0)}`} sub="Comisiones acumuladas" color="border-yellow-500" />
                <KpiCard icon="❌" title="Tasa Cancelación" value={`${cancelRate.toFixed(1)}%`} sub={`${allJobs.filter(j => j.status === 'cancelled').length} cancelados`} color="border-red-400" />
            </div>

            {/* Growth Over Time */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Section title="📈 Nuevos Usuarios por Período" subtitle={`Vista ${periodLabel.toLowerCase()}`}>
                    {growthData.length > 0 ? (
                        <BarChart data={growthData.map(d => ({ label: d.label, value: d.newUsers, color: '#8B5CF6' }))} />
                    ) : <p className="text-gray-400 text-sm text-center py-6">Sin datos de registro aún</p>}
                </Section>
                <Section title="📈 Nuevos Trabajadores por Período" subtitle={`Vista ${periodLabel.toLowerCase()}`}>
                    {growthData.length > 0 ? (
                        <BarChart data={growthData.map(d => ({ label: d.label, value: d.newWorkers, color: '#3B82F6' }))} />
                    ) : <p className="text-gray-400 text-sm text-center py-6">Sin datos de registro aún</p>}
                </Section>
                <Section title="📉 Crecimiento Acumulado – Usuarios" subtitle="Usuarios totales en el tiempo">
                    <LineChart data={cumulativeUsers} color="#8B5CF6" />
                </Section>
                <Section title="📉 Crecimiento Acumulado – Trabajadores" subtitle="Trabajadores totales en el tiempo">
                    <LineChart data={cumulativeWorkers} color="#3B82F6" />
                </Section>
            </div>

            {/* Jobs over time */}
            <Section title="📋 Trabajos Solicitados por Período" subtitle={`Actividad ${periodLabel.toLowerCase()}`}>
                {growthData.length > 0 ? (
                    <LineChart data={growthData.map(d => ({ label: d.label, value: d.newJobs }))} color="#10B981" height={140} />
                ) : <p className="text-gray-400 text-sm text-center py-6">Sin trabajos registrados</p>}
            </Section>

            {/* Revenue */}
            {revenueData.length > 0 && (
                <Section title="💰 Ingresos de Plataforma por Período" subtitle="Comisiones cobradas">
                    <LineChart data={revenueData} color="#F59E0B" height={140} />
                </Section>
            )}

            {/* Demand / Supply split */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* What users look for */}
                <Section title="🔍 Lo que los Clientes más Buscan" subtitle="Por categoría de servicio solicitado">
                    {userDemand.length > 0 ? (
                        <>
                            <div className="flex gap-4">
                                <div className="w-40 flex-shrink-0">
                                    <MiniPie data={userDemand} />
                                </div>
                                <div className="flex-1 space-y-2 overflow-auto max-h-52">
                                    {userDemand.map((d, i) => (
                                        <div key={i} className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: d.color }} />
                                                <span className="text-sm text-gray-700 truncate">{d.label}</span>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <div className="w-20 bg-gray-100 rounded-full h-2">
                                                    <div className="h-2 rounded-full" style={{ background: d.color, width: `${(d.value / userDemand[0].value) * 100}%` }} />
                                                </div>
                                                <span className="text-xs font-bold text-gray-600 w-6 text-right">{d.value}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : <p className="text-gray-400 text-sm text-center py-6">Sin trabajos registrados</p>}
                </Section>

                {/* What workers offer */}
                <Section title="🛠️ Lo que los Trabajadores más Ofrecen" subtitle="Por especialidad registrada">
                    {workerSupply.length > 0 ? (
                        <>
                            <div className="flex gap-4">
                                <div className="w-40 flex-shrink-0">
                                    <MiniPie data={workerSupply} />
                                </div>
                                <div className="flex-1 space-y-2 overflow-auto max-h-52">
                                    {workerSupply.map((d, i) => (
                                        <div key={i} className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: d.color }} />
                                                <span className="text-sm text-gray-700 truncate">{d.label}</span>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <div className="w-20 bg-gray-100 rounded-full h-2">
                                                    <div className="h-2 rounded-full" style={{ background: d.color, width: `${(d.value / workerSupply[0].value) * 100}%` }} />
                                                </div>
                                                <span className="text-xs font-bold text-gray-600 w-6 text-right">{d.value}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : <p className="text-gray-400 text-sm text-center py-6">Sin trabajadores registrados</p>}
                </Section>
            </div>

            {/* Most used specialties */}
            <Section title="⭐ Especialidades Más Utilizadas" subtitle="Trabajos completados por categoría">
                {specialtyUsage.length > 0 ? (
                    <div className="space-y-3">
                        {specialtyUsage.map((d, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <span className="text-sm font-bold text-gray-500 w-5 text-right">{i + 1}</span>
                                <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                                    <div
                                        className="h-5 rounded-full flex items-center pl-2 transition-all"
                                        style={{ background: d.color, width: `${Math.max((d.value / specialtyUsage[0].value) * 100, 4)}%` }}
                                    >
                                        <span className="text-xs text-white font-semibold truncate">{d.label}</span>
                                    </div>
                                </div>
                                <span className="text-sm font-bold text-gray-700 w-8 text-right">{d.value}</span>
                            </div>
                        ))}
                    </div>
                ) : <p className="text-gray-400 text-sm text-center py-6">Sin trabajos completados aún</p>}
            </Section>

            {/* Supply vs Demand gap analysis */}
            <Section title="📊 Análisis Oferta vs Demanda" subtitle="¿Hay suficientes trabajadores para lo que piden los clientes?">
                {userDemand.length > 0 && workerSupply.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-2 font-semibold text-gray-600">Especialidad</th>
                                    <th className="text-right py-2 font-semibold text-gray-600">Solicitudes</th>
                                    <th className="text-right py-2 font-semibold text-gray-600">Trabajadores</th>
                                    <th className="text-right py-2 font-semibold text-gray-600">Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {userDemand.map((d, i) => {
                                    const supply = workerSupply.find(s => s.label === d.label);
                                    const supplyCount = supply?.value || 0;
                                    const ratio = supplyCount > 0 ? d.value / supplyCount : Infinity;
                                    const status = ratio > 5 ? { label: '⚠️ Alta demanda', cls: 'text-red-600 font-semibold' } :
                                        ratio > 2 ? { label: '🟡 Moderada', cls: 'text-yellow-600' } :
                                            { label: '✅ Balanceada', cls: 'text-green-600' };
                                    return (
                                        <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                                            <td className="py-2 text-gray-800">{d.label}</td>
                                            <td className="py-2 text-right text-purple-700 font-bold">{d.value}</td>
                                            <td className="py-2 text-right text-blue-700 font-bold">{supplyCount}</td>
                                            <td className={`py-2 text-right text-xs ${status.cls}`}>{status.label}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : <p className="text-gray-400 text-sm text-center py-6">Datos insuficientes para el análisis</p>}
            </Section>

            {/* Decline / Increase notice */}
            <Section title="📡 Estado de Actividad Reciente" subtitle="¿La app está creciendo, estable o decayendo?">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                        { label: 'Nuevos usuarios', trend: growthPct.users, icon: '👤' },
                        { label: 'Nuevos trabajadores', trend: growthPct.workers, icon: '🔧' },
                        { label: 'Nuevos trabajos', trend: growthPct.jobs, icon: '📋' },
                    ].map((item, i) => {
                        const up = item.trend >= 5;
                        const down = item.trend <= -5;
                        return (
                            <div key={i} className={`rounded-xl p-4 text-center border ${up ? 'bg-green-50 border-green-200' : down ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}`}>
                                <div className="text-3xl mb-1">{item.icon}</div>
                                <div className={`text-xl font-extrabold ${up ? 'text-green-700' : down ? 'text-red-700' : 'text-yellow-700'}`}>
                                    {item.trend >= 0 ? '+' : ''}{item.trend.toFixed(1)}%
                                </div>
                                <div className="text-sm text-gray-600 mt-1">{item.label}</div>
                                <div className={`text-xs mt-1 font-semibold ${up ? 'text-green-600' : down ? 'text-red-600' : 'text-yellow-600'}`}>
                                    {up ? '▲ En crecimiento' : down ? '▼ En descenso' : '→ Estable'}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Section>

            {/* Footer note */}
            <p className="text-center text-xs text-gray-400 pb-4">
                Datos actualizados en tiempo real · Comparación vs período anterior · Haz clic en "Descargar CSV" para exportar todas las hojas
            </p>
        </div>
    );
};

export default AppAnalyticsDashboard;