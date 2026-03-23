import React, { useState, useMemo } from 'react';
import { Worker, ServiceCategory, DayOfWeek } from '../../types';
import { SUPER_CATEGORIES, SERVICE_CATEGORIES, formatCurrency, JOB_TYPE_OPTIONS } from '../../constants';
import StarRating from '../common/StarRating';

interface UserDashboardProps {
    workers: Worker[];
    selectedCategory: ServiceCategory | null;
    onSelectCategory: (category: ServiceCategory | null) => void;
    onSelectWorker: (worker: Worker) => void;
    t: (key: string, replacements?: Record<string, string | number>) => string;
}

const DAYS_OF_WEEK: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface Filters {
  searchTerm: string;
  region: string;
  date: string;
  priceMin: string;
  priceMax: string;
  rating: number;
  reviewsMin: string;
  reviewsMax: string;
  specialties: string[];
}

const initialFilters: Filters = {
  searchTerm: '',
  region: '',
  date: '',
  priceMin: '',
  priceMax: '',
  rating: 0,
  reviewsMin: '',
  reviewsMax: '',
  specialties: [],
};

const WorkerCard: React.FC<{ worker: Worker; onSelectWorker: (worker: Worker) => void; t: (key: string, replacements?: Record<string, string | number>) => string; }> = ({ worker, onSelectWorker, t }) => (
    <div 
        onClick={() => onSelectWorker(worker)}
        className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 cursor-pointer group hover:border-purple-200"
    >
        <div className="p-3 sm:p-4">
            <div className="flex items-start">
                <img className="h-12 w-12 sm:h-16 sm:w-16 rounded-full object-cover flex-shrink-0" src={worker.avatarUrl} alt={worker.name} />
                <div className="ml-3 sm:ml-4 flex-grow min-w-0">
                    <h3 className="text-base sm:text-lg font-bold text-black group-hover:text-purple-600 transition-colors truncate">{worker.name}</h3>
                    <p className="text-xs sm:text-sm text-black truncate">{worker.location}</p>
                    <div className="flex items-center mt-1">
                        <StarRating rating={worker.rating} />
                        <span className="text-[10px] sm:text-xs text-black ml-1 sm:ml-2">({(worker.reviews || []).length})</span>
                    </div>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                    <p className="text-base sm:text-lg font-bold text-purple-700">{worker.avgJobCost ? formatCurrency(worker.avgJobCost.amount, worker.avgJobCost.currency) : 'N/A'}</p>
                    <p className="text-[10px] sm:text-xs text-black">{t('job avg')}</p>
                </div>
            </div>
            <p className="text-xs sm:text-sm text-black mt-2 sm:mt-3 line-clamp-2">{worker.bio}</p>
        </div>
    </div>
);

const UserDashboard: React.FC<UserDashboardProps> = ({
    workers,
    selectedCategory,
    onSelectCategory,
    onSelectWorker,
    t
}) => {
    const [selectedSuperCategoryName, setSelectedSuperCategoryName] = useState<string | null>(null);
    const [filters, setFilters] = useState<Filters>(initialFilters);
    const [showFilters, setShowFilters] = useState(false);

    const serviceCategoryDetails = useMemo(() => new Map(SERVICE_CATEGORIES.map(sc => [sc.name, sc])), []);
    const selectedSuperCategory = useMemo(() => SUPER_CATEGORIES.find(c => c.name === selectedSuperCategoryName), [selectedSuperCategoryName]);
    const uniqueRegions = useMemo(() => Array.from(new Set(workers.flatMap(w => w.regions || []))).sort(), [workers]);
    const specialtyOptions = useMemo(() => selectedCategory ? JOB_TYPE_OPTIONS[selectedCategory] || [] : [], [selectedCategory]);

    const handleFilterChange = (field: keyof Filters, value: any) => setFilters(prev => ({ ...prev, [field]: value }));
    
    const handleSpecialtyChange = (specialty: string, checked: boolean) => {
        setFilters(prev => {
            const newSpecialties = new Set(prev.specialties);
            if (checked) newSpecialties.add(specialty);
            else newSpecialties.delete(specialty);
            return { ...prev, specialties: Array.from(newSpecialties) };
        });
    };
    
    const resetFilters = () => setFilters(initialFilters);
    const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
        if (key === 'rating' && Number(value) > 0) return true;
        if (key === 'specialties' && Array.isArray(value) && value.length > 0) return true;
        if (typeof value === 'string' && value.trim() !== '') return true;
        return false;
    }).length;


    const filteredWorkers = useMemo(() => {
        const checkAvailability = (worker: Worker, date: Date) => {
            const dateString = date.toISOString().split('T')[0];
            const dayOfWeek = DAYS_OF_WEEK[date.getDay()];
            if (worker.availabilityOverrides && worker.availabilityOverrides[dateString] !== undefined) {
                return worker.availabilityOverrides[dateString] !== null;
            }
            return worker.availability[dayOfWeek] !== null;
        };

        return workers.filter(worker => {
            if (worker.verificationStatus !== 'approved') return false; // Only show approved workers
            
            const inSelectedSuperCategory = selectedSuperCategory ? selectedSuperCategory.subCategories.includes(worker.service) : true;
            if (!inSelectedSuperCategory) return false;
            if (selectedCategory && worker.service !== selectedCategory) return false;
            if (filters.searchTerm) {
                const term = filters.searchTerm.toLowerCase();
                const matchesName = worker.name.toLowerCase().includes(term);
                const matchesService = t(worker.service).toLowerCase().includes(term);
                const matchesJobTypes = (worker.jobTypes || []).some(jt => t(jt).toLowerCase().includes(term));
                if (!matchesName && !matchesService && !matchesJobTypes) return false;
            }
            if (filters.region && !worker.regions.includes(filters.region)) return false;
            if (filters.date) {
                const filterDate = new Date(filters.date + 'T00:00:00');
                if (!checkAvailability(worker, filterDate)) return false;
            }
            const priceMin = parseFloat(filters.priceMin) || 0;
            const priceMax = parseFloat(filters.priceMax) || Infinity;
            if (worker.avgJobCost.amount < priceMin || worker.avgJobCost.amount > priceMax) return false;
            
            const reviewsMin = parseInt(filters.reviewsMin) || 0;
            const reviewsMax = parseInt(filters.reviewsMax) || Infinity;
            if ((worker.reviews || []).length < reviewsMin || (worker.reviews || []).length > reviewsMax) return false;
            
            if (filters.rating > 0 && worker.rating < filters.rating) return false;
            if (filters.specialties.length > 0 && !filters.specialties.every(spec => (worker.jobTypes || []).includes(spec))) return false;
            
            return true;
        });
    }, [workers, selectedCategory, selectedSuperCategory, filters]);

    const handleSuperCategorySelect = (name: string) => {
        setSelectedSuperCategoryName(name);
        onSelectCategory(null);
        resetFilters();
    };

    const handleBackToSuperCategories = () => {
        setSelectedSuperCategoryName(null);
        onSelectCategory(null);
        resetFilters();
    };

    const allCategoriesAndSpecialties = useMemo(() => {
        const items: { type: 'category' | 'specialty', name: string }[] = [];
        SERVICE_CATEGORIES.forEach(sc => {
            items.push({ type: 'category', name: sc.name });
        });
        Object.values(JOB_TYPE_OPTIONS).forEach(specialties => {
            specialties.forEach(spec => {
                items.push({ type: 'specialty', name: spec });
            });
        });
        // Remove duplicates
        const uniqueItems = Array.from(new Map(items.map(item => [item.name, item])).values());
        return uniqueItems;
    }, []);

    const searchSuggestions = useMemo(() => {
        if (!filters.searchTerm || filters.searchTerm.length < 2) return [];
        const term = filters.searchTerm.toLowerCase();
        return allCategoriesAndSpecialties.filter(item => 
            t(item.name).toLowerCase().includes(term) || item.name.toLowerCase().includes(term)
        ).slice(0, 5);
    }, [filters.searchTerm, allCategoriesAndSpecialties, t]);

    const [showSuggestions, setShowSuggestions] = useState(false);

    return (
        <div className="container mx-auto">
            <h1 className="text-3xl font-bold text-black mb-6">{t('find a service')}</h1>
            
            <div className="mb-8 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <input
                    type="text"
                    placeholder={t('search for a service')}
                    value={filters.searchTerm}
                    onChange={e => {
                        handleFilterChange('searchTerm', e.target.value);
                        setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    className="block w-full pl-10 pr-3 py-4 border border-slate-300 rounded-xl leading-5 bg-white placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 sm:text-lg transition duration-150 ease-in-out shadow-sm text-black"
                />
                {showSuggestions && searchSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-30 overflow-hidden">
                        <ul className="py-1">
                            {searchSuggestions.map((suggestion, idx) => (
                                <li 
                                    key={`${suggestion.name}-${idx}`}
                                    onClick={() => {
                                        handleFilterChange('searchTerm', t(suggestion.name));
                                        setShowSuggestions(false);
                                    }}
                                    className="px-4 py-3 hover:bg-purple-50 cursor-pointer text-black flex items-center transition-colors"
                                >
                                    <span className="font-medium">{t(suggestion.name)}</span>
                                    <span className="ml-2 text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                        {suggestion.type === 'category' ? t('category') : t('specialty')}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl shadow-sm p-6 mb-8">
                <h2 className="text-2xl font-bold text-black mb-4">{t('find a professional')}</h2>

                {!selectedSuperCategory ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {SUPER_CATEGORIES.map(category => (
                            <button key={category.name} onClick={() => handleSuperCategorySelect(category.name)} className="relative flex flex-col items-center justify-center h-32 text-center font-semibold rounded-lg transition bg-white border border-slate-200 text-black hover:border-purple-400 shadow-sm overflow-hidden group">
                                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors z-10"></div>
                                <img src={category.imageUrl} alt={t(category.name)} referrerPolicy="no-referrer" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                <span className="relative z-20 text-white font-bold px-2">{t(category.name)}</span>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div>
                        <button onClick={handleBackToSuperCategories} className="flex items-center text-sm text-purple-600 font-semibold mb-4 hover:underline">
                            &larr; {t('back to categories')}
                        </button>
                         <h3 className="text-xl font-bold text-black mb-4">{t(selectedSuperCategory.name)}</h3>
                        <div className="flex flex-wrap gap-2">
                           {selectedSuperCategory.subCategories.length > 0 ? selectedSuperCategory.subCategories.map(subCatName => (
                                <button key={subCatName} onClick={() => { onSelectCategory(subCatName); setFilters(prev => ({...prev, specialties: []})); }} className={`flex items-center space-x-2 px-4 py-2 text-sm font-semibold rounded-full transition ${selectedCategory === subCatName ? 'bg-purple-600 text-white' : 'bg-white border border-slate-200 text-black hover:bg-purple-50 hover:text-purple-700'}`}>
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>{serviceCategoryDetails.get(subCatName)?.icon}</svg>
                                    <span>{t(subCatName)}</span>
                                </button>
                           )) : ( <p className="text-black text-sm">{t('no specific services listed')}</p> )}
                        </div>
                    </div>
                )}
            </div>

            <div className="relative mb-6">
                <button onClick={() => setShowFilters(!showFilters)} className="flex items-center space-x-2 bg-white rounded-lg shadow-sm px-4 py-2 font-semibold text-black">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                    <span>{t('filters')}</span>
                    {activeFilterCount > 0 && <span className="bg-purple-600 text-white text-xs font-bold rounded-full px-2 py-0.5">{activeFilterCount}</span>}
                </button>

                {showFilters && (
                    <div className="absolute top-full left-0 mt-2 w-full max-w-4xl bg-white border border-slate-200 rounded-xl shadow-2xl p-4 z-20">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm text-black">
                            <div><label className="font-semibold block mb-1 text-black">{t('region')}</label><select value={filters.region} onChange={e => handleFilterChange('region', e.target.value)} className="w-full p-2 border rounded-md"><option value="">{t('all regions')}</option>{uniqueRegions.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
                            <div><label className="font-semibold block mb-1 text-black">{t('date available')}</label><input type="date" value={filters.date} onChange={e => handleFilterChange('date', e.target.value)} className="w-full p-2 border rounded-md" /></div>
                            <div><label className="font-semibold block mb-1 text-black">{t('min rating')}</label><select value={filters.rating} onChange={e => handleFilterChange('rating', Number(e.target.value))} className="w-full p-2 border rounded-md"><option value="0">{t('any rating')}</option>{[4,3,2,1].map(r => <option key={r} value={r}>{r} ★ &amp; Up</option>)}</select></div>
                            <div><label className="font-semibold block mb-1 text-black">{t('price range')}</label><div className="flex space-x-2"><input type="number" placeholder={t('min price')} value={filters.priceMin} onChange={e => handleFilterChange('priceMin', e.target.value)} className="w-1/2 p-2 border rounded-md" /><input type="number" placeholder={t('max price')} value={filters.priceMax} onChange={e => handleFilterChange('priceMax', e.target.value)} className="w-1/2 p-2 border rounded-md" /></div></div>
                            <div><label className="font-semibold block mb-1 text-black">{t('number of reviews')}</label><div className="flex space-x-2"><input type="number" placeholder={t('min reviews')} value={filters.reviewsMin} onChange={e => handleFilterChange('reviewsMin', e.target.value)} className="w-1/2 p-2 border rounded-md" /><input type="number" placeholder={t('max reviews')} value={filters.reviewsMax} onChange={e => handleFilterChange('reviewsMax', e.target.value)} className="w-1/2 p-2 border rounded-md" /></div></div>
                            {specialtyOptions.length > 0 && (
                                <div className="col-span-full"><label className="font-semibold block mb-2 text-black">{t('job specialties')}</label><div className="grid grid-cols-2 sm:grid-cols-3 gap-2">{specialtyOptions.map(spec => (<div key={spec} className="flex items-center"><input type="checkbox" id={`spec-${spec}`} checked={filters.specialties.includes(spec)} onChange={e => handleSpecialtyChange(spec, e.target.checked)} className="h-4 w-4 rounded" /><label htmlFor={`spec-${spec}`} className="ml-2 text-black">{t(spec)}</label></div>))}</div></div>
                            )}
                        </div>
                        <div className="flex justify-end mt-4"><button onClick={resetFilters} className="text-sm bg-slate-200 px-4 py-2 rounded-lg font-semibold hover:bg-slate-300 text-black">{t('reset filters')}</button></div>
                    </div>
                )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredWorkers.length > 0 ? (
                    filteredWorkers.map(worker => (
                        <WorkerCard key={worker.id} worker={worker} onSelectWorker={onSelectWorker} t={t} />
                    ))
                ) : (
                    <div className="md:col-span-2 text-center py-12 bg-slate-50 border border-slate-200 rounded-xl shadow-sm">
                       <p className="text-black">{t('no professionals found')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserDashboard;