import React from 'react';
import { AppNotification } from '../../types';
import { formatDistanceToNow } from '../../utils/time';

interface NotificationsScreenProps {
  notifications: AppNotification[];
  onNotificationClick: (notification: AppNotification) => void;
  onMarkAllAsRead: () => void;
  t: (key: string) => string;
}

const NotificationIcon: React.FC<{ type: AppNotification['type'] }> = ({ type }) => {
  const baseClasses = "h-6 w-6 text-white";
  let iconPath;
  let bgClass;

  switch (type) {
    case 'new_job':
      iconPath = <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />;
      bgClass = "bg-blue-500";
      break;
    case 'status_update':
      iconPath = <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />;
      bgClass = "bg-green-500";
      break;
    case 'new_message':
      iconPath = <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.068.157 2.148.279 3.238.364.466.037.893.281 1.153.671L12 21l2.652-3.978c.26-.39.687-.634 1.153-.67 1.09-.086 2.17-.208 3.238-.365 1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.344 48.344 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />;
      bgClass = "bg-purple-500";
      break;
    case 'new_registration':
      iconPath = <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />;
      bgClass = "bg-indigo-500";
      break;
    case 'new_dispute':
      iconPath = <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />;
      bgClass = "bg-red-500";
      break;
    case 'new_support_chat':
      iconPath = <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.9l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />;
      bgClass = "bg-orange-500";
      break;
    case 'dispute_update':
        iconPath = <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />;
        bgClass = "bg-yellow-500";
        break;
    default:
      return null;
  }

  return (
    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${bgClass}`}>
      <svg xmlns="http://www.w3.org/2000/svg" className={baseClasses} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        {iconPath}
      </svg>
    </div>
  );
};

const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ notifications, onNotificationClick, onMarkAllAsRead, t }) => {
  return (
    <div className="container mx-auto max-w-2xl space-y-6">
      <div className="flex justify-between items-center bg-white border border-slate-200 p-4 rounded-xl shadow-lg">
        <h1 className="text-2xl font-bold text-black">{t('notifications')}</h1>
        {notifications.some(n => !n.isRead) && (
          <button 
            onClick={onMarkAllAsRead} 
            className="text-sm bg-purple-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-purple-700 transition">
            {t('mark_all_as_read')}
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-black">{t('no_notifications')}</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {notifications.map(notification => (
              <li 
                key={notification.id} 
                className={`p-4 flex items-start space-x-4 transition duration-150 hover:bg-slate-50 ${!notification.isRead ? 'bg-purple-50' : ''}`}
              >
                {!notification.isRead && (
                    <div className="w-2 h-2 rounded-full bg-purple-500 mt-3 flex-shrink-0" aria-label="Unread notification"></div>
                )}
                <div className={notification.isRead ? 'pl-6' : ''}>
                  <NotificationIcon type={notification.type} />
                </div>
                <div className="flex-1">
                  <button onClick={() => onNotificationClick(notification)} className="text-left w-full focus:outline-none">
                    <p className={`text-sm leading-snug ${!notification.isRead ? 'text-black font-semibold' : 'text-black'}`}>
                      {notification.message}
                    </p>
                    <p className="text-xs text-black mt-1">
                      {formatDistanceToNow(notification.timestamp, t)}
                    </p>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default NotificationsScreen;
