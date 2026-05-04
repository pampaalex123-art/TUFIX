import React, { useState } from 'react';

interface CompanyRegisterProps {
  onSubmit: (data: any) => void;
  onBack: () => void;
  t: (key: string) => string;
}

const INDUSTRY_OPTIONS = [
  'Tecnología', 'Construcción', 'Gastronomía', 'Salud', 'Educación', 'Retail',
  'Logística', 'Inmobiliaria', 'Turismo', 'Manufactura', 'Servicios Financieros', 'Otro',
];

const CompanyRegister: React.FC<CompanyRegisterProps> = ({ onSubmit, onBack }) => {
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    companyName: '', industry: '', country: '', email: '',
    password: '', confirmPassword: '', phone: '', taxId: '',
    description: '', employeeCount: '', acceptTerms: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value }));
    setError('');
  };

  const validate = () => {
    if (step === 1) {
      if (!formData.companyName.trim()) return 'Ingresá el nombre de la empresa.';
      if (!formData.industry) return 'Seleccioná la industria.';
      if (!formData.country) return 'Seleccioná el país.';
    }
    if (step === 2) {
      if (!formData.email.includes('@')) return 'Email inválido.';
      if (formData.password.length < 6) return 'La contraseña debe tener al menos 6 caracteres.';
      if (formData.password !== formData.confirmPassword) return 'Las contraseñas no coinciden.';
      if (!formData.phone.trim()) return 'Ingresá un teléfono.';
    }
    if (step === 3 && !formData.acceptTerms) return 'Debés aceptar los términos.';
    return null;
  };

  const handleNext = () => {
    const err = validate();
    if (err) { setError(err); return; }
    if (step < 3) setStep(step + 1);
    else onSubmit(formData);
  };

  const inputClass = "w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none mt-1";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col">
      <div className="px-4 pt-10 pb-6 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center">
          <span className="text-white font-black text-2xl">TF</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Registro Empresarial</h1>
        <p className="text-purple-200 text-sm mt-1">Gestioná tus servicios con TUFIX</p>
      </div>

      <div className="px-6 mb-6">
        <div className="flex items-center gap-2">
          {[1, 2, 3].map(s => (
            <React.Fragment key={s}>
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${step >= s ? 'bg-purple-500 text-white' : 'bg-white/20 text-white/50'}`}>
                {step > s ? '✓' : s}
              </div>
              {s < 3 && <div className={`flex-1 h-0.5 ${step > s ? 'bg-purple-500' : 'bg-white/20'}`} />}
            </React.Fragment>
          ))}
        </div>
        <div className="flex justify-between mt-1 text-xs text-purple-200">
          <span>Empresa</span><span>Acceso</span><span>Confirmar</span>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-t-3xl px-6 pt-8 pb-10">
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Información de la empresa</h2>
            <div><label className="text-xs font-semibold text-slate-500 uppercase">Nombre de la empresa *</label><input name="companyName" value={formData.companyName} onChange={handleChange} placeholder="Ej: Construcciones López S.A." className={inputClass} /></div>
            <div><label className="text-xs font-semibold text-slate-500 uppercase">Industria *</label><select name="industry" value={formData.industry} onChange={handleChange} className={inputClass}><option value="">Seleccioná tu industria</option>{INDUSTRY_OPTIONS.map(i => <option key={i} value={i}>{i}</option>)}</select></div>
            <div><label className="text-xs font-semibold text-slate-500 uppercase">País *</label><select name="country" value={formData.country} onChange={handleChange} className={inputClass}><option value="">Seleccioná el país</option><option value="argentina">🇦🇷 Argentina</option><option value="bolivia">🇧🇴 Bolivia</option><option value="other">🌎 Otro</option></select></div>
            <div><label className="text-xs font-semibold text-slate-500 uppercase">CUIT / NIT (opcional)</label><input name="taxId" value={formData.taxId} onChange={handleChange} placeholder="Número de identificación fiscal" className={inputClass} /></div>
            <div><label className="text-xs font-semibold text-slate-500 uppercase">Descripción (opcional)</label><textarea name="description" value={formData.description} onChange={handleChange} rows={3} placeholder="¿A qué se dedica tu empresa?" className={inputClass} /></div>
            <div><label className="text-xs font-semibold text-slate-500 uppercase">Empleados</label><select name="employeeCount" value={formData.employeeCount} onChange={handleChange} className={inputClass}><option value="">Cantidad de empleados</option>{['1-10','11-50','51-200','201-500','500+'].map(r => <option key={r} value={r}>{r}</option>)}</select></div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Datos de acceso</h2>
            <div><label className="text-xs font-semibold text-slate-500 uppercase">Email corporativo *</label><input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="empresa@tudominio.com" className={inputClass} /></div>
            <div><label className="text-xs font-semibold text-slate-500 uppercase">Contraseña *</label><input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Mínimo 6 caracteres" className={inputClass} /></div>
            <div><label className="text-xs font-semibold text-slate-500 uppercase">Confirmar contraseña *</label><input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Repetí tu contraseña" className={inputClass} /></div>
            <div><label className="text-xs font-semibold text-slate-500 uppercase">Teléfono *</label><input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+54 11 1234-5678" className={inputClass} /></div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Confirmá tu registro</h2>
            <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Empresa</span><span className="font-semibold">{formData.companyName}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Industria</span><span className="font-semibold">{formData.industry}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">País</span><span className="font-semibold">{formData.country === 'argentina' ? '🇦🇷 Argentina' : formData.country === 'bolivia' ? '🇧🇴 Bolivia' : 'Otro'}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Email</span><span className="font-semibold truncate ml-4">{formData.email}</span></div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
              <p className="font-bold mb-1">⏳ Tu cuenta será revisada</p>
              <p className="text-xs">Verificaremos tus datos en unos minutos. Recibirás una notificación cuando esté aprobada.</p>
            </div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" name="acceptTerms" checked={formData.acceptTerms} onChange={handleChange} className="mt-0.5 h-4 w-4 text-purple-600 rounded" />
              <span className="text-sm text-slate-600">Acepto los <span className="text-purple-600 font-semibold underline">Términos y Condiciones</span> y la <span className="text-purple-600 font-semibold underline">Política de Privacidad</span> de TUFIX.</span>
            </label>
          </div>
        )}

        {error && <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">⚠️ {error}</div>}

        <div className="flex gap-3 mt-8">
          <button onClick={step === 1 ? onBack : () => setStep(step - 1)} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition">
            {step === 1 ? '← Volver' : '← Atrás'}
          </button>
          <button onClick={handleNext} className="flex-[2] py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-sm hover:opacity-90 transition shadow-md">
            {step === 3 ? '🏢 Crear cuenta empresarial' : 'Siguiente →'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompanyRegister;