// FIX: Replaced placeholder content with concrete utility functions.

const MINUTE = 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;
const WEEK = DAY * 7;
const MONTH = DAY * 30;
const YEAR = DAY * 365;

export function formatDistanceToNow(dateString: string, t: (key: string) => string): string {
  const date = new Date(dateString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const isYesterday = new Date(now.getTime() - 86400000).toDateString() === date.toDateString();

  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (isToday) {
    return timeStr;
  } else if (isYesterday) {
    return `${t('Yesterday')}, ${timeStr}`;
  } else {
    return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${timeStr}`;
  }
}

export const formatTime12hr = (time24: string): string => {
  if (!time24) return '';
  const [hours, minutes] = time24.split(':');
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const formattedHour = h % 12 || 12;
  return `${formattedHour}:${minutes} ${ampm}`;
};

export const generateTimeSlots = (start: string, end: string, duration: number = 60): string[] => {
  const slots: string[] = [];
  if (!start || !end) return slots;
  
  const [startHour, startMinute] = start.split(':').map(Number);
  const [endHour, endMinute] = end.split(':').map(Number);

  const endTotalMinutes = endHour * 60 + endMinute;
  
  let currentTotalMinutes = startHour * 60 + startMinute;

  while (currentTotalMinutes < endTotalMinutes) {
    const currentHour = Math.floor(currentTotalMinutes / 60);
    const currentMinute = currentTotalMinutes % 60;
    slots.push(`${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`);
    currentTotalMinutes += duration;
  }
  return slots;
};