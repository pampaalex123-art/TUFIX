// FIX: Replaced placeholder content with a functional Header component.
import React, { useState, useRef, useEffect } from 'react';
import { User, Worker, UserType, Notification } from '../../types';
// FIX: The file 'components/shared/LoginScreen.tsx' was missing. It has been created with the 'useTranslations' hook.
import { Language } from '../shared/LoginScreen';
import { Globe } from 'lucide-react';
import NotificationPopover from './NotificationPopover';

interface HeaderProps {
  user: User | Worker | null;
  userType: UserType | null;
  onLogout: () => void;
  notifications: Notification[];
  onNotificationClick: (notification: Notification) => void;
  onMarkAllAsRead: () => void;
  onNavigate: (screen: 'dashboard') => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const Header: React.FC<HeaderProps> = ({ user, userType, onLogout, notifications, onNotificationClick, onMarkAllAsRead, onNavigate, language, setLanguage, t }) => {
  const [isProfileMenuOpen, setProfileMenuOpen] = useState(false);
  const [isNotificationsOpen, setNotificationsOpen] = useState(false);
  const [isLangMenuOpen, setLangMenuOpen] = useState(false);

  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const langMenuRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <button onClick={() => onNavigate('dashboard')} className="flex-shrink-0 flex items-center space-x-2">
              <svg className="h-8 w-8" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                      <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#FCD34D" /> {/* from-yellow-300 */}
                          <stop offset="50%" stopColor="#EC4899" /> {/* via-pink-500 */}
                          <stop offset="100%" stopColor="#6D28D9" /> {/* to-purple-700 */}
                      </linearGradient>
                  </defs>
                  <rect width="24" height="24" rx="5" fill="url(#logoGradient)" />
                  <text 
                      x="50%" 
                      y="50%" 
                      fill="white" 
                      textAnchor="middle" 
                      dominantBaseline="central" 
                      fontFamily="sans-serif" 
                      fontSize="12" 
                      fontWeight="bold">
                      TF
                  </text>
              </svg>
              <span className="font-bold text-xl text-black">TUFIX</span>
            </button>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
             {/* Language Selector */}
            <div className="relative" ref={langMenuRef}>
              <button 
                onClick={() => setLangMenuOpen(!isLangMenuOpen)} 
                className="px-3 h-8 flex items-center space-x-2 rounded-md border border-slate-300 text-black hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
              >
                <Globe className="h-4 w-4" />
                <span className="text-sm font-medium">{t('language')}</span>
              </button>
               {isLangMenuOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-36 rounded-xl shadow-lg py-1 bg-white border border-slate-200 focus:outline-none">
                      <button onClick={() => { setLanguage('en'); setLangMenuOpen(false); }} className={`w-full text-left block px-4 py-2 text-sm ${language === 'en' ? 'bg-purple-50 text-purple-700 font-semibold' : 'text-slate-700'} hover:bg-slate-50`}>{t('english')}</button>
                      <button onClick={() => { setLanguage('es'); setLangMenuOpen(false); }} className={`w-full text-left block px-4 py-2 text-sm ${language === 'es' ? 'bg-purple-50 text-purple-700 font-semibold' : 'text-slate-700'} hover:bg-slate-50`}>{t('spanish')}</button>
                  </div>
              )}
            </div>

            {user && (
              <button onClick={onLogout} className="text-xs font-bold text-black hover:text-purple-600 transition-colors uppercase tracking-widest">
                {t('logout')}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;