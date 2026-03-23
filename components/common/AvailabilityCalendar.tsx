import React, { useState, useMemo } from 'react';
import { Availability, DayOfWeek } from '../../types';
import { formatTime12hr } from '../../utils/time';

interface AvailabilityCalendarProps {
  availability: Availability;
  availabilityOverrides?: { [date: string]: { start: string; end: string } | null };
  t: (key: string, replacements?: Record<string, string | number>) => string;
}

const DAYS_OF_WEEK_NAMES: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// --- Sub-components ---

const CalendarLegend: React.FC<{ t: (key: string) => string }> = ({ t }) => (
    <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs mt-4 border-t pt-4">
        <div className="flex items-center text-black"><span className="w-3 h-3 rounded-full bg-green-100 mr-2 border border-green-200"></span>{t('regular')}</div>
        <div className="flex items-center text-black"><span className="w-3 h-3 rounded-full bg-yellow-100 mr-2 border border-yellow-200"></span>{t('custom')}</div>
        <div className="flex items-center text-black"><span className="w-3 h-3 rounded-full bg-red-100 mr-2 border border-red-200"></span>{t('day_off')}</div>
    </div>
);

const DailyScheduleView: React.FC<{ date: Date; availability: { start: string; end: string } | null; t: (key: string) => string }> = ({ date, availability, t }) => {
  const hours = Array.from({ length: 17 }, (_, i) => i + 6); // 6 AM to 10 PM

  const calculateStyle = () => {
    if (!availability) return { display: 'none' };
    
    const [startHour, startMinute] = availability.start.split(':').map(Number);
    const [endHour, endMinute] = availability.end.split(':').map(Number);
    
    const totalStartMinutes = startHour * 60 + startMinute;
    const totalEndMinutes = endHour * 60 + endMinute;

    const startOffset = ((totalStartMinutes - (6 * 60)) / 60) * 2.5; // 2.5rem per hour from 6 AM
    const duration = (totalEndMinutes - totalStartMinutes) / 60;
    const height = duration * 2.5;

    return {
      top: `${startOffset}rem`,
      height: `${height}rem`,
    };
  };

  return (
    <div className="w-full lg:w-1/3 pl-0 lg:pl-6 mt-8 lg:mt-0">
      <h3 className="text-lg font-semibold text-center mb-2 text-black">{date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</h3>
      <div className="relative bg-white border border-slate-200 p-2 rounded-lg h-96 overflow-y-auto scrollbar-hide">
        {hours.map(hour => (
          <div key={hour} className="h-10 border-b border-gray-200 flex items-start">
            <span className="text-xs text-black -mt-2 pr-2">{hour % 12 === 0 ? 12 : hour % 12} {hour < 12 || hour === 24 ? 'AM' : 'PM'}</span>
          </div>
        ))}
         {availability && (
            <div className="absolute left-12 right-2 rounded-lg bg-purple-50 border border-purple-200 p-2 shadow-sm" style={calculateStyle()}>
                 <p className="text-xs font-bold text-black">{formatTime12hr(availability.start)} - {formatTime12hr(availability.end)}</p>
                 <p className="text-xs text-black">{t('available')}</p>
            </div>
         )}
         {!availability && (
             <div className="absolute inset-0 flex items-center justify-center">
                 <p className="text-black font-semibold">{t('unavailable')}</p>
             </div>
         )}
      </div>
    </div>
  );
};


// --- Main Component ---

const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({ availability, availabilityOverrides, t }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const DAY_ABBREVIATIONS = [t('sun'), t('mon'), t('tue'), t('wed'), t('thu'), t('fri'), t('sat')];

  const getDayAvailabilityStatus = (date: Date): { available: boolean; isOverride: boolean; times: { start: string; end: string } | null } => {
    const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD
    const override = availabilityOverrides?.[dateString];
    
    if (override !== undefined) {
      return { available: override !== null, isOverride: true, times: override };
    }
    
    const dayOfWeek = DAYS_OF_WEEK_NAMES[date.getDay()];
    const regular = availability[dayOfWeek];
    return { available: regular !== null, isOverride: false, times: regular };
  };

  const calendarGrid = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
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
  }, [currentDate]);

  const changeMonth = (offset: number) => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() + offset);
      return newDate;
    });
  };

  const isSameDay = (d1: Date, d2: Date | null) => {
    if (!d2) return false;
    return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
  };
  
  const selectedDayStatus = getDayAvailabilityStatus(selectedDate);

  return (
    <div className="flex flex-col lg:flex-row">
      <div className="w-full lg:w-2/3">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => changeMonth(-1)} aria-label="Previous month" className="p-2 rounded-full hover:bg-gray-100"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
          <h3 className="text-lg font-bold text-pink-500">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
          <button onClick={() => changeMonth(1)} aria-label="Next month" className="p-2 rounded-full hover:bg-gray-100"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-sm text-black mb-2">{DAY_ABBREVIATIONS.map(day => <div key={day}>{day}</div>)}</div>
        <div className="grid grid-cols-7">
          {calendarGrid.map(({ date, isCurrentMonth }, index) => {
            const { available, isOverride } = getDayAvailabilityStatus(date);
            const isSelected = isSameDay(date, selectedDate);
            const isToday = isSameDay(date, new Date());
            
            let dayClasses = "w-10 h-10 mx-auto flex items-center justify-center rounded-lg text-sm transition-colors ";
            if (!isCurrentMonth) {
              dayClasses += "text-gray-300";
            } else {
              if (isSelected) {
                  dayClasses += 'bg-purple-600 text-white font-bold ring-2 ring-offset-2 ring-purple-600';
              } else {
                  if(available && isOverride) dayClasses += 'bg-yellow-100 hover:bg-yellow-200 cursor-pointer border border-yellow-200 text-black';
                  else if(available && !isOverride) dayClasses += 'bg-green-100 hover:bg-green-200 cursor-pointer border border-green-200 text-black';
                  else if(!available && isOverride) dayClasses += 'bg-red-100 text-black line-through border border-red-200';
                  else dayClasses += "text-black line-through";
              }
            }
           
            if (isToday && isCurrentMonth && !isSelected) dayClasses += ` bg-blue-100 ring-2 ring-blue-400`;

            return (
              <button key={index} disabled={!isCurrentMonth} onClick={() => setSelectedDate(date)} className={dayClasses}>{date.getDate()}</button>
            );
          })}
        </div>
        <CalendarLegend t={t} />
      </div>
      <DailyScheduleView date={selectedDate} availability={selectedDayStatus.times} t={t} />
    </div>
  );
};

export default AvailabilityCalendar;