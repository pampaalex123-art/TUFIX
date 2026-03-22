import React from 'react';
import { UserType } from '../../types';

interface BottomNavigationProps {
  userType: UserType | null;
  activeScreen: string;
  onNavigate: (screen: 'messages' | 'profile' | 'earnings' | 'job-requests' | 'notifications' | 'my-jobs') => void;
  t: (key: string) => string;
  unreadNotificationsCount?: number;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ userType, activeScreen, onNavigate, t, unreadNotificationsCount = 0 }) => {
  if (!userType || userType === 'admin') return null;

  const navItems = [
    { id: 'messages', label: t('messages'), icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    )},
    { id: 'profile', label: t('profile'), icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    )},
    ...(userType === 'worker' ? [{ id: 'earnings', label: t('earnings'), icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )}] : []),
    ...(userType === 'user' ? [{ id: 'my-jobs', label: t('jobs'), icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    )}] : []),
    { id: 'job-requests', label: userType === 'user' ? t('workers') : t('jobs'), icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    )},
    { id: 'notifications', label: t('notifications'), icon: (
      <div className="relative">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadNotificationsCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
            {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
          </span>
        )}
      </div>
    )},
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 pb-safe shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id as any)}
            className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
              (item.id === 'messages' && activeScreen === 'CONVERSATIONS') ||
              (item.id === 'profile' && (activeScreen === 'WORKER_PROFILE_EDIT' || activeScreen === 'USER_PROFILE_EDIT')) ||
              (item.id === 'earnings' && activeScreen === 'EARNINGS') ||
              (item.id === 'my-jobs' && activeScreen === 'MY_JOBS') ||
              (item.id === 'job-requests' && (activeScreen === 'WORKER_DASHBOARD' || activeScreen === 'USER_DASHBOARD')) ||
              (item.id === 'notifications' && activeScreen === 'NOTIFICATIONS')
                ? 'text-purple-600'
                : 'text-slate-900 hover:text-purple-600'
            }`}
          >
            {item.icon}
            <span className="text-[10px] mt-1 font-medium uppercase tracking-wider">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default BottomNavigation;
