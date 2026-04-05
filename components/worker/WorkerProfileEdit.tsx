import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Worker, ServiceCategory, DayOfWeek, PaymentMethods } from '../../types';
import { JOB_TYPE_OPTIONS, CURRENCIES } from '../../constants';
// FIX: The file 'components/shared/LoginScreen.tsx' was missing. It has been created with the 'useTranslations' hook.
import { Language } from '../shared/LoginScreen';
import MercadoPagoConnect from './MercadoPagoConnect';

// --- Types & Constants ---
const DAYS_OF_WEEK: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// --- Helper Functions ---
const isSameDay = (d1: Date, d2: Date | null) => {
    if (!d2) return false;
    return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
};

// --- Sub-components ---

const EditOverrideModal: React.FC<{
    date: Date;
    override: { start: string; end: string } | null | undefined;
    onClose: () => void;
    onSave: (date: string, newOverride: { start: string; end: string } | null) => void;
    t: (key: string) => string;
    language: Language;
}> = ({ date, override, onClose, onSave, t, language }) => {
    const isInitiallyAvailable = override !== null;
    const [status, setStatus] = useState<'available' | 'unavailable'>(isInitiallyAvailable ? 'available' : 'unavailable');
    const [startTime, setStartTime] = useState(override?.start || '09:00');
    const [endTime, setEndTime] = useState(override?.end || '17:00');
    
    const inputStyles = "mt-1 block w-full p-3 bg-slate-100 border-transparent rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none sm:text-sm text-slate-900";


    const handleSave = () => {
        const newOverride = status === 'available' ? { start: startTime, end: endTime } : null;
        onSave(date.toISOString().split('T')[0], newOverride);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-2">{t('edit availability')}</h2>
                <p className="mb-4 font-semibold text-purple-600">{date.toLocaleDateString(language, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-600">{t('status')}</label>
                        <select value={status} onChange={(e) => setStatus(e.target.value as any)} className={inputStyles}>
                            <option value="available">{t('available')}</option>
                            <option value="unavailable">{t('unavailable')}</option>
                        </select>
                    </div>
                    {status === 'available' && (
                        <div className="flex space-x-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-600">{t('start time')}</label>
                                <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={inputStyles} />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-slate-600">{t('end time')}</label>
                                <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={inputStyles} />
                            </div>
                        </div>
                    )}
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                    <button onClick={onClose} className="bg-slate-200 font-bold py-2 px-4 rounded-lg">{t('cancel')}</button>
                    <button onClick={handleSave} className="bg-purple-600 text-white font-bold py-2 px-4 rounded-lg">{t('save')}</button>
                </div>
            </div>
        </div>
    );
};

// --- Main Component ---

interface WorkerProfileEditProps {
  worker: Worker;
  onSave: (updatedWorker: Worker) => void;
  onBack: () => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
  language: Language;
}

const WorkerProfileEdit: React.FC<WorkerProfileEditProps> = ({ worker, onSave, onBack, t, language }) => {
  const [formData, setFormData] = useState<Worker>({
    ...worker,
    avgJobCost: worker.avgJobCost || { amount: 0, currency: 'USD' },
    paymentMethods: worker.paymentMethods || {},
    regions: worker.regions || [],
    jobTypes: worker.jobTypes || [],
    availabilityOverrides: worker.availabilityOverrides || {},
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newRegion, setNewRegion] = useState('');

  // State for the override calendar
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [modalDate, setModalDate] = useState<Date | null>(null);
  
  const translatedDaysOfWeek = useMemo(() => DAYS_OF_WEEK.map(day => t(day)), [t]);
  const translatedDayAbbreviations = useMemo(() => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => t(day)), [t]);
  
  const inputStyles = "mt-1 block w-full p-3 bg-slate-100 border-transparent rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none sm:text-sm text-slate-900";


  const getDayAvailabilityStatus = (date: Date): { isOverride: boolean; } => {
    const dateString = date.toISOString().split('T')[0];
    return { isOverride: formData.availabilityOverrides?.[dateString] !== undefined };
  };

  const calendarGrid = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const startDayOfWeek = firstDayOfMonth.getDay();

    const grid = [];
    for (let i = 0; i < startDayOfWeek; i++) {
        grid.push({ date: new Date(year, month, i - startDayOfWeek + 1), isCurrentMonth: false });
    }
    for (let i = 1; i <= daysInMonth; i++) {
        grid.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    const remainingCells = 42 - grid.length;
    for (let i = 1; i <= remainingCells; i++) {
        grid.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }
    return grid;
  }, [calendarDate]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'avgJobCostAmount' || name === 'avgJobCostCurrency') {
      const field = name === 'avgJobCostAmount' ? 'amount' : 'currency';
      setFormData(prev => ({ ...prev, avgJobCost: { ...prev.avgJobCost, [field]: field === 'amount' ? Number(value) : value }}));
    } else if (name.startsWith('paymentMethod_')) {
      const field = name.replace('paymentMethod_', '') as keyof PaymentMethods;
      setFormData(prev => ({ ...prev, paymentMethods: { ...(prev.paymentMethods || {}), [field]: value }}));
    } else {
      setFormData(prev => ({ ...prev, [name]: value, ...(name === 'service' && { jobTypes: [] }) }));
    }
  };
  
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData(prev => ({ ...prev, avatarUrl: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const handleAddRegion = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newRegion.trim() !== '') {
      e.preventDefault();
      if (!formData.regions.includes(newRegion.trim())) {
        setFormData(prev => ({ ...prev, regions: [...prev.regions, newRegion.trim()] }));
      }
      setNewRegion('');
    }
  };

  const handleRemoveRegion = (regionToRemove: string) => setFormData(prev => ({ ...prev, regions: prev.regions.filter(r => r !== regionToRemove) }));

  const handleJobTypeChange = (jobType: string, checked: boolean) => {
    setFormData(prev => {
      const newJobTypes = new Set(prev.jobTypes);
      checked ? newJobTypes.add(jobType) : newJobTypes.delete(jobType);
      return { ...prev, jobTypes: Array.from(newJobTypes) };
    });
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Validate origin is from AI Studio preview or localhost
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
        return;
      }
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        console.log('Mercado Pago linked successfully');
        alert('Mercado Pago linked successfully');
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleLinkMercadoPago = async () => {
    const isMobile = window.innerWidth < 768;
    let authWindow: Window | null = null;

    if (!isMobile) {
      // Pre-open window to bypass popup blockers on desktop
      authWindow = window.open('', 'oauth_popup', 'width=600,height=700');
    }

    try {
      const response = await fetch(`/api/mercadopago/auth-url?workerId=${worker.id}`);
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
      alert('Failed to initiate Mercado Pago linking.');
    }
  };

  const handleAvailabilityToggle = (day: DayOfWeek, checked: boolean) => {
    setFormData(prev => ({ ...prev, availability: { ...prev.availability, [day]: checked ? { start: '09:00', end: '17:00' } : null } }));
  };

  const handleTimeChange = (day: DayOfWeek, timeType: 'start' | 'end', value: string) => {
    setFormData(prev => {
        const dayAvailability = prev.availability[day];
        
        // Do not update if the day is not available (is null)
        if (dayAvailability) {
            return {
                ...prev,
                availability: {
                    ...prev.availability,
                    [day]: { ...dayAvailability, [timeType]: value }
                }
            };
        }
        return prev;
    });
  };
  
  const handleSaveOverride = (date: string, newOverride: { start: string; end: string } | null) => {
      setFormData(prev => ({ ...prev, availabilityOverrides: { ...(prev.availabilityOverrides || {}), [date]: newOverride } }));
      setModalDate(null);
  };
  
  const handleRemoveOverride = (date: string) => {
      setFormData(prev => {
          const newOverrides = { ...(prev.availabilityOverrides || {}) };
          delete newOverrides[date];
          return { ...prev, availabilityOverrides: newOverrides };
      });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <>
    <div className="container mx-auto max-w-3xl">
      <button onClick={onBack} className="flex items-center text-slate-600 hover:text-slate-900 font-semibold mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
        {t('back to dashboard')}
      </button>
      
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8 space-y-8 divide-y divide-slate-200">
        {/* Basic Info */}
        <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-8 border-b border-slate-200 pb-4">{t('edit your profile')}</h1>
            <div className="flex items-center space-x-6 mb-8">
                <img className="w-24 h-24 rounded-full object-cover ring-4 ring-purple-100" src={formData.avatarUrl} alt={formData.name} />
                <div>
                    <input type="file" ref={fileInputRef} onChange={handleAvatarChange} accept="image/*" className="hidden" />
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="bg-slate-100 py-2 px-4 border border-slate-300 rounded-lg shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-200">{t('change photo')}</button>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-600">{t('full name')}</label>
                    <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className={inputStyles} />
                </div>
                <div>
                    <label htmlFor="service" className="block text-sm font-medium text-slate-600">{t('service category')}</label>
                    <select name="service" id="service" value={formData.service} onChange={handleChange} className={inputStyles}>
                        {Object.values(ServiceCategory).map(cat => <option key={cat} value={cat}>{t(cat)}</option>)}
                    </select>
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-600">{t('job specialties')}</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 p-4 bg-slate-50 rounded-lg mt-1">
                        {JOB_TYPE_OPTIONS[formData.service].map(jobType => (
                            <div key={jobType} className="flex items-center">
                                <input type="checkbox" id={`jobType-${jobType}`} value={jobType} checked={formData.jobTypes.includes(jobType)} onChange={(e) => handleJobTypeChange(jobType, e.target.checked)} className="h-4 w-4 text-purple-600 border-slate-300 rounded focus:ring-purple-500" />
                                <label htmlFor={`jobType-${jobType}`} className="ml-2 block text-sm text-slate-800">{t(jobType)}</label>
                            </div>
                        ))}
                    </div>
                </div>
                <div>
                    <label htmlFor="location" className="block text-sm font-medium text-slate-600">{t('location')}</label>
                    <input type="text" name="location" id="location" value={formData.location} onChange={handleChange} className={inputStyles} />
                </div>
                <div>
                    <label htmlFor="avgJobCostAmount" className="block text-sm font-medium text-slate-600">{t('avg job cost')}</label>
                    <div className="mt-1 flex rounded-lg shadow-sm">
                        <select name="avgJobCostCurrency" id="avgJobCostCurrency" value={formData.avgJobCost.currency} onChange={handleChange} className="px-3 rounded-l-lg border-transparent bg-slate-100 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none">
                            {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                        </select>
                        <input type="number" name="avgJobCostAmount" id="avgJobCostAmount" min="0" value={formData.avgJobCost.amount} onChange={handleChange} className="block w-full p-3 bg-slate-100 border-transparent rounded-r-lg focus:ring-2 focus:ring-purple-500 focus:outline-none" />
                    </div>
                </div>
                <div className="md:col-span-2">
                    <label htmlFor="bio" className="block text-sm font-medium text-slate-600">{t('about me bio')}</label>
                    <textarea name="bio" id="bio" rows={4} value={formData.bio} onChange={handleChange} className={inputStyles}></textarea>
                </div>
                 <div className="md:col-span-2">
                    <label htmlFor="regions" className="block text-sm font-medium text-slate-600">{t('service areas')}</label>
                    <input type="text" id="regions" value={newRegion} onChange={(e) => setNewRegion(e.target.value)} onKeyDown={handleAddRegion} placeholder={t('type region enter')} className={inputStyles} />
                    <div className="flex flex-wrap gap-2 mt-2">
                        {formData.regions.map(region => (<span key={region} className="flex items-center bg-purple-100 text-purple-800 text-sm font-medium px-3 py-1 rounded-full">{region}<button type="button" onClick={() => handleRemoveRegion(region)} className="ml-2" aria-label={t('remove region', { region })}>&times;</button></span>))}
                    </div>
                </div>
                <div className="md:col-span-2 mt-4">
                    <label className="block text-sm font-medium text-slate-600 mb-2">Métodos de Pago</label>
                        <MercadoPagoConnect worker={worker} />
                </div>
            </div>
        </div>

        {/* Weekly Availability */}
        <div className="pt-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4">{t('weekly availability')}</h2>
            <div className="space-y-4">
                {DAYS_OF_WEEK.map((day, index) => {
                    const dayAvailability = formData.availability[day];
                    return (
                        <div key={day} className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 p-3 bg-slate-50 rounded-lg">
                            <div className="flex items-center">
                                <input type="checkbox" id={`check-${day}`} checked={!!dayAvailability} onChange={(e) => handleAvailabilityToggle(day, e.target.checked)} className="h-5 w-5 text-purple-600 rounded focus:ring-purple-500" />
                                <label htmlFor={`check-${day}`} className="ml-3 block text-md font-medium text-slate-800">{translatedDaysOfWeek[index]}</label>
                            </div>
                            <div className={`md:col-span-2 grid grid-cols-2 gap-4 ${!dayAvailability ? 'opacity-50 pointer-events-none' : ''}`}>
                                <div>
                                <label htmlFor={`start-${day}`} className="block text-sm text-slate-600">{t('start_time')}</label>
                                <input type="time" id={`start-${day}`} value={dayAvailability?.start || ''} onChange={(e) => handleTimeChange(day, 'start', e.target.value)} className={inputStyles} disabled={!dayAvailability} />
                                </div>
                                <div>
                                <label htmlFor={`end-${day}`} className="block text-sm text-slate-600">{t('end_time')}</label>
                                <input type="time" id={`end-${day}`} value={dayAvailability?.end || ''} onChange={(e) => handleTimeChange(day, 'end', e.target.value)} className={inputStyles} disabled={!dayAvailability} />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* Custom Overrides Calendar */}
        <div className="pt-8">
          <h2 className="text-xl font-bold text-slate-900 mb-2">{t('custom availability calendar')}</h2>
          <p className="text-sm text-slate-500 mb-4">{t('custom availability desc')}</p>
           <div className="bg-slate-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                    <button type="button" onClick={() => setCalendarDate(d => new Date(d.setMonth(d.getMonth() - 1)))} className="p-2 rounded-full hover:bg-slate-200">&lt;</button>
                    <h3 className="text-lg font-semibold text-slate-800">{calendarDate.toLocaleString(language, { month: 'long', year: 'numeric' })}</h3>
                    <button type="button" onClick={() => setCalendarDate(d => new Date(d.setMonth(d.getMonth() + 1)))} className="p-2 rounded-full hover:bg-slate-200">&gt;</button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-sm text-slate-600 mb-2">{translatedDayAbbreviations.map(day => <div key={day}>{day}</div>)}</div>
                <div className="grid grid-cols-7">
                    {calendarGrid.map(({ date, isCurrentMonth }, index) => {
                        const { isOverride } = getDayAvailabilityStatus(date);
                        let dayClasses = "w-10 h-10 mx-auto flex items-center justify-center rounded-lg text-sm transition-colors ";
                        if (!isCurrentMonth) dayClasses += "text-slate-300";
                        else {
                           dayClasses += "cursor-pointer ";
                           if(isOverride) dayClasses += "bg-purple-200 hover:bg-purple-300 font-bold";
                           else dayClasses += "bg-slate-200 hover:bg-slate-300";
                           if(isSameDay(date, new Date())) dayClasses += " ring-2 ring-purple-500";
                        }
                        return <button type="button" key={index} disabled={!isCurrentMonth} onClick={() => setModalDate(date)} className={dayClasses}>{date.getDate()}</button>;
                    })}
                </div>
            </div>
             <div className="mt-6">
                <h3 className="text-md font-semibold text-slate-800">{t('current overrides')}</h3>
                <div className="space-y-2 mt-2 max-h-40 overflow-y-auto">
                    {Object.keys(formData.availabilityOverrides || {}).sort((dateA, dateB) => new Date(dateA).getTime() - new Date(dateB).getTime()).map(date => {
                        const override = (formData.availabilityOverrides || {})[date];
                        return (
                            <div key={date} className="flex justify-between items-center p-2 bg-slate-100 rounded-md">
                               <p className="text-sm font-medium text-slate-700">{new Date(date + 'T00:00:00').toLocaleDateString(language, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                               <div className="flex items-center space-x-3">
                                   {override === null ? <span className="text-sm font-semibold text-red-500">{t('unavailable')}</span> : <span className="text-sm font-semibold text-green-500">{override.start} - {override.end}</span>}
                                   <button type="button" onClick={() => handleRemoveOverride(date)} className="text-red-500 hover:text-red-700">&times;</button>
                               </div>
                            </div>
                        );
                    })}
                     {Object.keys(formData.availabilityOverrides || {}).length === 0 && <p className="text-sm text-slate-500">{t('no overrides set')}</p>}
                </div>
            </div>
        </div>

        {/* Save/Cancel */}
        <div className="pt-5 flex justify-end space-x-3">
          <button type="button" onClick={onBack} className="bg-slate-200 font-bold py-2 px-4 rounded-lg hover:bg-slate-300">{t('cancel')}</button>
          <button type="submit" className="bg-purple-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-purple-700">{t('save changes')}</button>
        </div>
      </form>
    </div>
    
    {modalDate && (
        <EditOverrideModal 
            date={modalDate}
            override={formData.availabilityOverrides?.[modalDate.toISOString().split('T')[0]]}
            onClose={() => setModalDate(null)}
            onSave={handleSaveOverride}
            t={t}
            language={language}
        />
    )}
    </>
  );
};

export default WorkerProfileEdit;