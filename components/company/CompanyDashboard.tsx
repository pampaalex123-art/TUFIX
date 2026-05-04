import React, { useState } from 'react';

interface CompanyDashboardProps {
  company: any;
  t: (key: string) => string;
  onNavigate: (screen: string) => void;
  onUpdateCompany: (data: any) => void;
}

type CompanyTab = 'search' | 'contracts' | 'messages' | 'profile';

const SERVICE_TYPE_OPTIONS = [
  'Limpieza de Oficinas', 'Mantenimiento General', 'Seguridad Privada', 'Catering Corporativo',
  'Servicio de Mensajería', 'IT y Soporte Técnico', 'Jardinería y Paisajismo', 'Electricidad Industrial',
  'Plomería Comercial', 'Pintura Industrial', 'Mudanzas Corporativas', 'DJ para Eventos',
  'Fotografía Corporativa', 'Reparación de Equipos', 'Aire Acondicionado', 'Carpintería Comercial',
];

const INDUSTRY_OPTIONS = [
  'Tecnología', 'Construcción', 'Gastronomía', 'Salud', 'Educación', 'Retail',
  'Logística', 'Inmobiliaria', 'Turismo', 'Manufactura', 'Servicios Financieros', 'Otro',
];

const CompanyDashboard: React.FC<CompanyDashboardProps> = ({ company, onUpdateCompany }) => {
  const [activeTab, setActiveTab] = useState<CompanyTab>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ ...company });

  const tabs: { id: CompanyTab; label: string; emoji: string }[] = [
    { id: 'search', label: 'Buscar Servicio', emoji: '🔍' },
    { id: 'contracts', label: 'Contratos', emoji: '📋' },
    { id: 'messages', label: 'Mensajes', emoji: '💬' },
    { id: 'profile', label: 'Empresa', emoji: '🏢' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center">
            <span className="text-white font-black text-sm">TF</span>
          </div>
          <div>
            <p className="font-bold text-slate-900 text-sm leading-tight">{company.companyName || company.name}</p>
            <p className="text-xs text-slate-400">Panel Empresarial</p>
          </div>
        </div>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
          company.verificationStatus === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
        }`}>
          {company.verificationStatus === 'approved' ? '✓ Verificada' : '⏳ En revisión'}
        </span>
      </header>

      <main className="pb-24 max-w-2xl mx-auto">
        {activeTab === 'search' && (
          <div className="p-4 space-y-4">
            <div className="pt-2">
              <h1 className="text-2xl font-bold text-slate-900">¿Qué servicio necesitás?</h1>
              <p className="text-slate-500 text-sm mt-1">Encontrá el profesional ideal para tu empresa</p>
            </div>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar tipo de servicio..."
                className="w-full pl-4 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none shadow-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {SERVICE_TYPE_OPTIONS.filter(s => !searchQuery || s.toLowerCase().includes(searchQuery.toLowerCase())).map(service => (
                <div key={service} className="bg-white rounded-xl p-4 border border-slate-200 hover:border-purple-400 hover:shadow-md transition cursor-pointer">
                  <div className="text-2xl mb-2">
                    {service.includes('Limp') ? '🧹' : service.includes('IT') ? '💻' : service.includes('Seguridad') ? '🔒' :
                     service.includes('Catering') ? '🍽️' : service.includes('DJ') ? '🎵' : service.includes('Foto') ? '📸' :
                     service.includes('Jardín') ? '🌿' : service.includes('Electricidad') ? '⚡' : service.includes('Plomería') ? '🔧' :
                     service.includes('Mudanza') ? '🚛' : service.includes('Aire') ? '❄️' : service.includes('Pintura') ? '🎨' : '🏗️'}
                  </div>
                  <p className="text-sm font-semibold text-slate-800 leading-tight">{service}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'contracts' && (
          <div className="p-4 space-y-4">
            <h1 className="text-2xl font-bold text-slate-900 pt-2">Contratos Activos</h1>
            <div className="bg-white rounded-xl border border-slate-200 p-10 text-center space-y-3">
              <div className="text-5xl">📋</div>
              <p className="font-bold text-slate-800">Sin contratos activos</p>
              <p className="text-sm text-slate-400">Cuando contrates un servicio aparecerá acá.</p>
              <button onClick={() => setActiveTab('search')} className="mt-2 px-6 py-2 bg-purple-600 text-white font-bold rounded-xl text-sm hover:bg-purple-700 transition">
                Buscar un servicio
              </button>
            </div>
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 space-y-2">
              <p className="text-sm font-bold text-purple-800">💡 Tipos de contratos disponibles</p>
              <div className="space-y-1.5 text-xs text-purple-700">
                <p>🔸 <strong>Servicio único</strong> — Se paga una sola vez al completar</p>
                <p>🔄 <strong>Contrato mensual</strong> — Débito automático el día que elijas</p>
                <p>📅 <strong>Por evento</strong> — Para catering, DJs y eventos corporativos</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="p-4 space-y-4">
            <h1 className="text-2xl font-bold text-slate-900 pt-2">Mensajes</h1>
            <div className="bg-white rounded-xl border border-slate-200 p-10 text-center space-y-3">
              <div className="text-5xl">💬</div>
              <p className="font-bold text-slate-800">Sin conversaciones</p>
              <p className="text-sm text-slate-400">Cuando contactes a un proveedor aparecerán acá.</p>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between pt-2">
              <h1 className="text-2xl font-bold text-slate-900">Perfil de Empresa</h1>
              <button
                onClick={() => editMode ? (onUpdateCompany(formData), setEditMode(false)) : setEditMode(true)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition ${editMode ? 'bg-green-600 text-white' : 'bg-purple-600 text-white'}`}
              >
                {editMode ? '✓ Guardar' : '✏️ Editar'}
              </button>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-pink-500 h-24" />
              <div className="px-4 pb-4 space-y-3">
                {editMode ? (
                  <div className="space-y-3 pt-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-500">Nombre de la empresa</label>
                      <input type="text" value={formData.companyName || ''} onChange={e => setFormData((p: any) => ({ ...p, companyName: e.target.value }))} className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500">Industria</label>
                      <select value={formData.industry || ''} onChange={e => setFormData((p: any) => ({ ...p, industry: e.target.value }))} className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm">
                        <option value="">Seleccionar...</option>
                        {INDUSTRY_OPTIONS.map(i => <option key={i} value={i}>{i}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500">País</label>
                      <select value={formData.country || ''} onChange={e => setFormData((p: any) => ({ ...p, country: e.target.value }))} className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm">
                        <option value="">Seleccionar...</option>
                        <option value="argentina">🇦🇷 Argentina</option>
                        <option value="bolivia">🇧🇴 Bolivia</option>
                        <option value="other">🌎 Otro</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500">CUIT / NIT</label>
                      <input type="text" value={formData.taxId || ''} onChange={e => setFormData((p: any) => ({ ...p, taxId: e.target.value }))} className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500">Descripción</label>
                      <textarea value={formData.description || ''} onChange={e => setFormData((p: any) => ({ ...p, description: e.target.value }))} rows={3} className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 pt-4">
                    <h2 className="text-xl font-bold text-slate-900">{company.companyName || company.name}</h2>
                    <p className="text-sm text-slate-500">{company.industry || 'Industria no especificada'}</p>
                    {company.description && <p className="text-sm text-slate-600">{company.description}</p>}
                    <div className="flex flex-wrap gap-2 text-xs text-slate-500 pt-1">
                      {company.country && <span>📍 {company.country === 'argentina' ? 'Argentina' : company.country === 'bolivia' ? 'Bolivia' : 'Otro'}</span>}
                      {company.taxId && <span>🪪 {company.taxId}</span>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-10">
        <div className="flex max-w-2xl mx-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center py-3 gap-0.5 transition ${activeTab === tab.id ? 'text-purple-600' : 'text-slate-400'}`}
            >
              <span className="text-xl">{tab.emoji}</span>
              <span className="text-[10px] font-semibold">{tab.label}</span>
              {activeTab === tab.id && <div className="w-1 h-1 bg-purple-600 rounded-full" />}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default CompanyDashboard;