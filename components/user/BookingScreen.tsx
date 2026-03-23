import React, { useState, useMemo } from 'react';
import { Worker, User, DayOfWeek, JobRequest } from '../../types';
import { formatTime12hr, generateTimeSlots } from '../../utils/time';

interface BookingScreenProps {
  worker: Worker;
  user: User;
  allJobRequests: JobRequest[];
  onBack: () => void;
  onSubmit: (details: { worker: Worker; date: string; time: string; description: string; }) => void;
  t: (key: string, replacements?: Record<string, string>) => string;
}

const DAYS_OF_WEEK: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_ABBREVIATIONS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const isSameDay = (d1: Date, d2: Date | null) => {
    if (!d2) return false;
    return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
};

const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};


const BookingScreen: React.FC<BookingScreenProps> = ({ worker, user, allJobRequests, onBack, onSubmit, t }) => {
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [description, setDescription] = useState('');
  
  const availableSlots = useMemo(() => {
    if (!selectedDate) return [];

    const dateString = formatDateForInput(selectedDate);
    const dayOfWeek = DAYS_OF_WEEK[selectedDate.getDay()];
    
    let dayAvailability: { start: string; end: string } | null = worker.availability[dayOfWeek];

    if (worker.availabilityOverrides && worker.availabilityOverrides[dateString] !== undefined) {
      dayAvailability = worker.availabilityOverrides[dateString];
    }

    if (dayAvailability) {
      const allPossibleSlots = generateTimeSlots(dayAvailability.start, dayAvailability.end);
      
      const bookedTimes = allJobRequests
        .filter(job => 
            job.workerId === worker.id && 
            job.date === dateString && 
            (job.status === 'pending' || job.status === 'accepted')
        )
        .map(job => job.time);
      
      return allPossibleSlots.filter(slot => !bookedTimes.includes(slot));
    }
    return [];
  }, [selectedDate, worker, allJobRequests]);

  const calendarGrid = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const startDayOfWeek = firstDayOfMonth.getDay();

    const grid = [];
    for (let i = 0; i < startDayOfWeek; i++) grid.push({ date: new Date(year, month, i - startDayOfWeek + 1), isCurrentMonth: false });
    for (let i = 1; i <= daysInMonth; i++) grid.push({ date: new Date(year, month, i), isCurrentMonth: true });
    const remainingCells = 42 - grid.length;
    for (let i = 1; i <= remainingCells; i++) grid.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    return grid;
  }, [calendarDate]);


  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime('');
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime || !description.trim()) {
      alert(t('please select a date time and provide a description'));
      return;
    }
    onSubmit({ worker, date: formatDateForInput(selectedDate), time: selectedTime, description });
  };
  
  const isDateInPast = (date: Date) => {
      const today = new Date();
      today.setHours(0,0,0,0);
      return date < today;
  }

  return (
    <div className="container mx-auto max-w-4xl">
      <button onClick={onBack} className="flex items-center text-black hover:text-purple-600 font-semibold mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
        {t('back to profile')}
      </button>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-5 sm:p-8 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-black">{t('book service with', {name: worker.name})}</h1>
        </div>

        <div className="border-t border-slate-200 pt-6 grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {/* Calendar */}
            <div>
                 <label className="block text-base sm:text-lg font-medium mb-2 text-black">{t('select date')}</label>
                 <div className="p-3 sm:p-4 border rounded-lg border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                        <button type="button" onClick={() => setCalendarDate(d => new Date(d.setMonth(d.getMonth() - 1)))} className="p-2 rounded-full hover:bg-slate-100">&lt;</button>
                        <h3 className="font-semibold text-sm sm:text-base text-black">{calendarDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
                        <button type="button" onClick={() => setCalendarDate(d => new Date(d.setMonth(d.getMonth() + 1)))} className="p-2 rounded-full hover:bg-slate-100">&gt;</button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-[10px] sm:text-sm mb-2 font-bold text-black">{DAY_ABBREVIATIONS.map(day => <div key={day}>{day}</div>)}</div>
                    <div className="grid grid-cols-7 gap-1">
                        {calendarGrid.map(({ date, isCurrentMonth }, index) => {
                             const isPast = isDateInPast(date);
                             const isSelected = isSameDay(date, selectedDate);
                             const isDisabled = !isCurrentMonth || isPast;
                             let dayClasses = "w-8 h-8 sm:w-10 sm:h-10 mx-auto flex items-center justify-center rounded-lg text-xs sm:text-sm transition-colors ";
                             if (isDisabled) dayClasses += "text-slate-300 cursor-not-allowed";
                             else {
                                 dayClasses += "cursor-pointer ";
                                 if (isSelected) dayClasses += "bg-purple-600 text-white font-bold";
                                 else dayClasses += "hover:bg-purple-100 bg-white";
                             }
                             return <button type="button" key={index} disabled={isDisabled} onClick={() => handleDateSelect(date)} className={dayClasses}>{date.getDate()}</button>;
                        })}
                    </div>
                </div>
            </div>

            {/* Time Slots */}
            <div>
                 <label className="block text-base sm:text-lg font-medium mb-2 text-black">{t('select time')}</label>
                 <div className="p-3 sm:p-4 border rounded-lg border-slate-200 min-h-[200px] sm:min-h-[280px]">
                    {!selectedDate ? (
                        <div className="flex items-center justify-center h-full text-black text-sm">{t('please select date')}</div>
                    ) : availableSlots.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-black text-sm">{t('no slots available')}</div>
                    ) : (
                       <div className="grid grid-cols-3 sm:grid-cols-3 gap-2">
                            {availableSlots.map(slot => (
                                <button
                                    type="button"
                                    key={slot}
                                    onClick={() => setSelectedTime(slot)}
                                    className={`p-2 rounded-md text-[10px] sm:text-sm font-semibold transition ${selectedTime === slot ? 'bg-purple-600 text-white' : 'bg-slate-100 hover:bg-purple-100'}`}
                                >
                                    {formatTime12hr(slot)}
                                </button>
                            ))}
                       </div>
                    )}
                 </div>
            </div>
        </div>

        <div>
          <label htmlFor="description" className="block text-lg font-medium mb-2 text-black">{t('describe job')}</label>
          <textarea id="description" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t('job description placeholder', { service: t(worker.service) })} required className="w-full p-3 border rounded-lg bg-white border-slate-300 text-black"></textarea>
        </div>
        
        <div className="pt-5 flex justify-end space-x-3">
          <button type="button" onClick={onBack} className="bg-slate-200 font-bold py-2 px-4 rounded-lg text-black">{t('cancel')}</button>
          <button type="submit" className="bg-purple-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-purple-700 disabled:bg-slate-400" disabled={!selectedDate || !selectedTime || !description.trim()}>{t('submit request')}</button>
        </div>
      </form>
    </div>
  );
};

export default BookingScreen;