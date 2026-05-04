import React from 'react';
import { ServiceCategory } from './types';

export const SERVICE_CATEGORIES = [
  {
    name: ServiceCategory.HANDYMAN,
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M7.864 4.243A7.5 7.5 0 0119.5 12c0 2.42-.943 4.638-2.464 6.313M15.75 10.5a3 3 0 01-3 3M15.75 10.5a3 3 0 00-3-3M15.75 10.5V18m-4.5-3.375a3 3 0 01-3 3m3-3a3 3 0 00-3-3m3 3V18m-9-3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v6.75a1.5 1.5 0 001.5 1.5z" />,
  },
  {
    name: ServiceCategory.ELECTRICIAN,
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />,
  },
  {
    name: ServiceCategory.PLUMBER,
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.83-5.83M11.42 15.17l2.496-3.03c.527-1.032.47-2.34-.19-3.403L9.75 2.25 2.25 9.75l4.33 4.33c1.064.66 2.37.718 3.404.19l3.03-2.497m-2.25 2.25l-2.25-2.25" />,
  },
  {
    name: ServiceCategory.PAINTER,
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.998 15.998 0 013.388-1.62m0 0a2.25 2.25 0 003.767-1.973 11.25 11.25 0 00-8.173-8.173 2.25 2.25 0 00-1.973 3.767l1.973 1.973a2.25 2.25 0 002.75 2.75l1.973 1.973z" />,
  },
  {
    name: ServiceCategory.CARPENTER,
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h12A2.25 2.25 0 0020.25 14.25V3m-16.5 0h16.5m-16.5 0H3.75m16.5 0h.008v.008h-.008V3zM3.75 21h16.5" />,
  },
  {
    name: ServiceCategory.CLEANER,
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 11.25a.75.75 0 01.75.75v5.25a.75.75 0 01-1.5 0v-5.25a.75.75 0 01.75-.75zM12 3.75a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5zM3.75 6.75a2.25 2.25 0 114.5 0 2.25 2.25 0 01-4.5 0zM20.25 6.75a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zM12 11.25V12m0 0a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5zm-3.75-3a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5zm7.5 0a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z" />,
  },
  {
    name: ServiceCategory.LOCKSMITH,
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />,
  },
  {
    name: ServiceCategory.GARDENER,
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 2.25l.75 7.5-7.5 7.5 7.5 7.5 7.5-7.5-7.5-7.5" />,
  },
  {
    name: ServiceCategory.ARCHITECT,
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h6M9 11.25h6M9 15.75h6" />,
  },
  {
    name: ServiceCategory.MASON,
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 1.032a9.75 9.75 0 01-18.25 0L1.75 7.5m18.5 0v.001M1.75 7.5v.001M2.5 10.5l-1 1.5h19l-1-1.5M4.5 13.5l-1 1.5h15l-1-1.5M6.5 16.5l-1 1.5h11l-1-1.5" />,
  },
  {
    name: ServiceCategory.CONSTRUCTION_WORKER,
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />,
  },
  {
    name: ServiceCategory.WELDER,
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048l-1.928 1.928A12.728 12.728 0 003 12c0 5.523 4.477 10 10 10s10-4.477 10-10a12.73 12.73 0 00-1.088-5.018l-1.928-1.928zM12 9.75a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z" />,
  },
  {
    name: ServiceCategory.BLACKSMITH,
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a5.25 5.25 0 015.25 5.25H6.75a5.25 5.25 0 015.25-5.25zM12 6.75V3.75m0 3V2.25m-4.5 4.5V2.25m9 4.5V2.25M5.25 9.75h13.5" />,
  },
  {
    name: ServiceCategory.SURVEYOR,
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15m-10.5-6h19.5m-19.5 0a2.25 2.25 0 012.25-2.25h15a2.25 2.25 0 012.25 2.25m-19.5 0a2.25 2.25 0 002.25 2.25h15a2.25 2.25 0 002.25-2.25" />,
  },
  {
    name: ServiceCategory.HOUSEKEEPER,
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12.75 3.03v.568c0 .345.28.625.625.625h2.25c.345 0 .625-.28.625-.625v-.568a2.25 2.25 0 00-1.5-2.085 2.25 2.25 0 00-2.25 0 2.25 2.25 0 00-1.5 2.085zM12.75 3.03V6h-1.5V3.03m1.5 0v-1.5m-1.5 1.5h-1.5m1.5 1.5V6m0 3.75l-1.5-1.5m1.5 1.5V12m0 0v2.25m1.5-2.25h-1.5m0 0l-1.5 1.5m-3-1.5h.008v.008H9.75V12zm0 0h-.008v.008H9.75V12zm0 0V9.75m0 2.25h-3m3 0V9.75m0 2.25H6.75m0 0v3m0-3h3m0 0v3m0 0H6.75m3 0h3m6-12.75h-1.5m-12 0h1.5m10.5 0h1.5m-1.5 0h-10.5m0 0H3.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
  },
  {
    name: ServiceCategory.JANITOR,
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4M12 3v1m0 16v1m-6-2.828V12a2 2 0 012-2h4a2 2 0 012 2v4.172M8 12V5a2 2 0 012-2h4a2 2 0 012 2v7" />,
  },
  {
    name: ServiceCategory.HOME_ASSISTANT,
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />,
  },
  {
    name: ServiceCategory.LAUNDERER,
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 11.25a.75.75 0 01.75.75v5.25a.75.75 0 01-1.5 0v-5.25a.75.75 0 01.75-.75zM12 3.75a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5zM12 11.25V12m0 0a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z M3.75 6.75h16.5v10.5H3.75z" />,
  },
  {
    name: ServiceCategory.BUTLER,
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 3.75V16.5L12 20.25l-4.5-3.75V3.75m15 6h-21" />,
  },
  {
    name: ServiceCategory.COOK,
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M5 15a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H6a1 1 0 01-1-1v-2zM5 12V7a7 7 0 1114 0v5" />,
  },
  {
    name: ServiceCategory.WAITER,
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5v-2.25A3.375 3.375 0 017.125 7.5h9.75A3.375 3.375 0 0120.25 11.25v2.25m-16.5 0s.375-1.5 2.25-1.5h12c1.875 0 2.25 1.5 2.25 1.5m-16.5 0h16.5M3 16.5v3.375c0 .621.504 1.125 1.125 1.125h14.75c.621 0 1.125-.504 1.125-1.125V16.5" />,
  },
  {
    name: ServiceCategory.TAXI_DRIVER,
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125V14.25m-17.25 4.5v-1.875a3.375 3.375 0 013.375-3.375h9.75a3.375 3.375 0 013.375 3.375v1.875M3.75 14.25v-3.375A3.375 3.375 0 017.125 7.5h9.75A3.375 3.375 0 0120.25 10.875v3.375" />,
  },
  {
    name: ServiceCategory.MECHANIC,
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.83-5.83M11.42 15.17l2.496-3.03c.527-1.032.47-2.34-.19-3.403L9.75 2.25 2.25 9.75l4.33 4.33c1.064.66 2.37.718 3.404.19l3.03-2.497m-2.25 2.25l-2.25-2.25" />,
  },
  {
    name: ServiceCategory.HAIRDRESSER,
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M6 6.878V6a2.25 2.25 0 012.25-2.25h1.5A2.25 2.25 0 0112 6v.878m-6 0c-1.105 0-2 .895-2 2v1.122a2.25 2.25 0 00.933 1.83l2.25 1.5a2.25 2.25 0 002.634 0l2.25-1.5a2.25 2.25 0 00.933-1.83V8.878c0-1.105-.895-2-2-2m-6 0h6" />,
  },
  {
    name: ServiceCategory.BAKER,
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />,
  },
  {
    name: ServiceCategory.TAILOR,
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25L4.5 5.25m0 0l3 3m-3-3l3-3m-6 3l3 3m0 0l3-3m-3 3v6m12-9l-3 3m0 0l-3-3m3 3l-3-3m6 3l-3 3m0 0l-3-3m3 3V3" />,
  },
  {
    name: ServiceCategory.BARBER,
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 3.75v16.5M8.25 3.75v16.5M12 3.75v16.5M15.75 3.75v16.5M19.5 3.75v16.5M2.25 9h19.5" />,
  },
  {
    name: ServiceCategory.MAIL_CARRIER,
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />,
  },
  { name: ServiceCategory.DOCTOR, icon: <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /> },
  { name: ServiceCategory.NURSE, icon: <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" /> },
  { name: ServiceCategory.DENTIST, icon: <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9 9.563V9.563a1.125 1.125 0 012.25 0V9.563a1.125 1.125 0 01-2.25 0z" /> },
  { name: ServiceCategory.PHARMACIST, icon: <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H5.25A2.25 2.25 0 003 3.75v16.5a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0021 20.25V10.5a2.25 2.25 0 00-2.25-2.25H15M10.5 1.5L15 6.75m-4.5-5.25v5.25H15" /> },
  { name: ServiceCategory.PEDIATRICIAN, icon: <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m-7.286 2.72a3 3 0 01-4.682-2.72 9.094 9.094 0 013.741-.479m7.286 2.72a3 3 0 00-4.682-2.72M12 18.72a9.094 9.094 0 003.741-.479m-7.482 0a9.094 9.094 0 013.741-.479m7.146-4.283c-.397-.052-.795-.083-1.2-.104a4.524 4.524 0 00-8.682-3.15M12 15" /> },
  { name: ServiceCategory.SURGEON, icon: <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 4.5l-3.375 3.375M14.25 4.5L19.5 9.75M14.25 4.5L9 9.75M19.5 9.75l-4.125 4.125m0 0l-1.125 1.125a2.25 2.25 0 01-3.182 0l-1.125-1.125a2.25 2.25 0 010-3.182L15.375 9.75m-4.125 4.125L9 9.75" /> },
  { name: ServiceCategory.PSYCHOLOGIST, icon: <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.76 9.76 0 01-2.53-.388A.75.75 0 008.25 20.25h.375a.75.75 0 01.75.75v.375c0 .621.504 1.125 1.125 1.125h.375A9.753 9.753 0 0012 21.75c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 .242.013.48.038.714.025.234.244.41.488.41h.375a.75.75 0 01.75.75v.375c0 .621.504 1.125 1.125 1.125h.375c.244 0 .463.176.488.41A9.753 9.753 0 0012 13.5c4.97 0 9-1.806 9 4.125z" /> },
  { name: ServiceCategory.PHYSICAL_THERAPIST, icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /> },
  { name: ServiceCategory.NUTRITIONIST, icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.251 0-4.382.16-6.498.47M6 6a2.25 2.25 0 012.25-2.25h1.5a2.25 2.25 0 012.25 2.25v1.5A2.25 2.25 0 019.75 9.75h-1.5A2.25 2.25 0 016 7.5v-1.5zm12 0a2.25 2.25 0 012.25-2.25h1.5a2.25 2.25 0 012.25 2.25v1.5a2.25 2.25 0 01-2.25 2.25h-1.5a2.25 2.25 0 01-2.25-2.25v-1.5z" /> },
  { name: ServiceCategory.TEACHER, icon: <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0l-1.07-1.07a53.842 53.842 0 013.58-2.655.83.83 0 011.18.02l1.07 1.07m-1.07-1.07a53.842 53.842 0 003.58 2.655.83.83 0 001.18-.02l1.07-1.07m-4.75 3.725l1.07-1.07a53.842 53.842 0 013.58-2.655.83.83 0 011.18.02l1.07 1.07m-4.75 3.725a53.842 53.842 0 003.58 2.655.83.83 0 001.18-.02l1.07-1.07M3.289 16.12a59.902 59.902 0 0110.399 5.84c.897-.248 1.784-.52 2.658-.814m-15.482 0l-1.07 1.07a.83.83 0 000 1.18l1.07 1.07m1.07-1.07l1.07-1.07a.83.83 0 00-1.18 0l-1.07 1.07m4.75-3.725l-1.07 1.07a.83.83 0 000 1.18l1.07 1.07m-1.07-1.07a.83.83 0 011.18 0l1.07-1.07m-4.75-3.725l1.07 1.07a.83.83 0 011.18 0l1.07-1.07" /> },
  { name: ServiceCategory.PRIMARY_SCHOOL_TEACHER, icon: <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /> },
  { name: ServiceCategory.LIBRARIAN, icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5" /> },
  { name: ServiceCategory.SCHOOL_PRINCIPAL, icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 12a5 5 0 11-10 0 5 5 0 0110 0zm0 0a5 5 0 1010 0 5 5 0 00-10 0z" /> },
  { name: ServiceCategory.RESEARCHER, icon: <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /> },
  { name: ServiceCategory.PEDAGOGUE, icon: <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /> },
  { name: ServiceCategory.SCHOOL_COUNSELOR, icon: <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /> },
  { name: ServiceCategory.ACCOUNTANT, icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m-6 4h6m-6 4h6m-6-8a2 2 0 01-2-2h10a2 2 0 01-2 2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /> },
  { name: ServiceCategory.ADMINISTRATOR, icon: <path strokeLinecap="round" strokeLinejoin="round" d="M10 21h7a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2h3m-3-9h2.5m-2.5 4h2.5m2.5-4h2.5m-2.5 4h2.5m-5-12h.01M15 3h.01" /> },
  { name: ServiceCategory.SALESPERSON, icon: <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /> },
  { name: ServiceCategory.MANAGER, icon: <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /> },
  { name: ServiceCategory.ECONOMIST, icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2h10a2 2 0 002-2v-1a2 2 0 012-2h1.945M7.737 11a2 2 0 012.263 0l1 1a2 2 0 002.263 0l1-1a2 2 0 012.263 0M12 21a9 9 0 110-18 9 9 0 010 18z" /> },
  { name: ServiceCategory.FINANCIAL_ANALYST, icon: <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10 10.5h.01" /> },
  { name: ServiceCategory.STOCKBROKER, icon: <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28a11.95 11.95 0 00-5.814 5.519l-2.74 1.22m0 0l-5.94 2.28m5.94-2.28L9 11.25" /> },
  { name: ServiceCategory.TREASURER, icon: <path strokeLinecap="round" strokeLinejoin="round" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" /> },
  { name: ServiceCategory.WEB_DEVELOPER, icon: <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" /> },
  { name: ServiceCategory.SYSTEMS_TECHNICIAN, icon: <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h3.75" /> },
  { name: ServiceCategory.VIDEO_EDITOR, icon: <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.82m5.84-2.56a14.96 14.96 0 00-5.84-2.56M12 10.5H4.5m7.5-7.5h7.5" /> },
  { name: ServiceCategory.PHOTOGRAPHER, icon: <><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" /></> },
  { name: ServiceCategory.DATA_SCIENTIST, icon: <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" /> },
  { name: ServiceCategory.PROGRAMMER, icon: <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" /> },
  { name: ServiceCategory.ENGINEER, icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A11.953 11.953 0 0012 13.5c2.998 0 5.74 1.1 7.843 2.918m-15.686 0A8.959 8.959 0 003 12c0-.778.099-1.533.284-2.253m15.432 0a11.953 11.953 0 01-7.843 2.918" /> },
  { name: ServiceCategory.GRAPHIC_DESIGNER, icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM12 21a9 9 0 110-18 9 9 0 010 18z" /> },
  { name: ServiceCategory.JOURNALIST, icon: <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /> },
  { name: ServiceCategory.LAWYER, icon: <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.05a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25v-4.05m19.5 0v-2.25a2.25 2.25 0 00-2.25-2.25h-15a2.25 2.25 0 00-2.25 2.25v2.25m19.5 0h-19.5" /> },
  { name: ServiceCategory.POLICE_OFFICER, icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.286z" /> },
  { name: ServiceCategory.JUDGE, icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.251 0-4.382.16-6.498.47M6 6a2.25 2.25 0 012.25-2.25h1.5a2.25 2.25 0 012.25 2.25v1.5A2.25 2.25 0 019.75 9.75h-1.5A2.25 2.25 0 016 7.5v-1.5z" /> },
  { name: ServiceCategory.PROSECUTOR, icon: <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.05a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25v-4.05m19.5 0v-2.25a2.25 2.25 0 00-2.25-2.25h-15a2.25 2.25 0 00-2.25 2.25v2.25m19.5 0h-19.5" /> },
  { name: ServiceCategory.NOTARY, icon: <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /> },
  { name: ServiceCategory.FIREFIGHTER, icon: <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h7.5" /> },
  { name: ServiceCategory.SECURITY_GUARD, icon: <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" /> },
  { name: ServiceCategory.PHONE_REPAIR, icon: <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H10.5zM9 5.25h6M9 18.75h6" /> },
  { name: ServiceCategory.DJ, icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" /> },
];

export const SUPER_CATEGORIES = [
    {
        name: 'construccion mantenimiento',
        icon: <><path strokeLinecap="round" strokeLinejoin="round" d="M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" /> <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21v-4.5a3.75 3.75 0 013.75-3.75h9a3.75 3.75 0 013.75 3.75v4.5M12 6.75a2.25 2.25 0 00-2.25-2.25H9a2.25 2.25 0 00-2.25 2.25v.75h7.5v-.75a2.25 2.25 0 00-2.25-2.25h-1.5z" /></>,
        imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&q=80',
        subCategories: [
            ServiceCategory.ARCHITECT,
            ServiceCategory.SURVEYOR,
            ServiceCategory.CONSTRUCTION_WORKER,
            ServiceCategory.MASON,
            ServiceCategory.CARPENTER,
            ServiceCategory.WELDER,
            ServiceCategory.BLACKSMITH,
            ServiceCategory.ELECTRICIAN,
            ServiceCategory.PLUMBER,
            ServiceCategory.PAINTER,
            ServiceCategory.HANDYMAN,
        ]
    },
    {
        name: 'limpieza domesticos',
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M16 4.5l-4 4L8 4.5M12 8.5V21M6 21h12" />,
        imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80',
        subCategories: [
            ServiceCategory.CLEANER,
            ServiceCategory.HOUSEKEEPER,
            ServiceCategory.GARDENER,
            ServiceCategory.JANITOR,
            ServiceCategory.HOME_ASSISTANT,
            ServiceCategory.LAUNDERER,
            ServiceCategory.BUTLER,
        ]
    },
    {
        name: 'servicios oficios',
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />,
        imageUrl: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=400&q=80',
        subCategories: [
            ServiceCategory.COOK,
            ServiceCategory.WAITER,
            ServiceCategory.TAXI_DRIVER,
            ServiceCategory.MECHANIC,
            ServiceCategory.HAIRDRESSER,
            ServiceCategory.BAKER,
            ServiceCategory.TAILOR,
            ServiceCategory.BARBER,
            ServiceCategory.MAIL_CARRIER,
            ServiceCategory.LOCKSMITH,
            ServiceCategory.DJ,
        ]
    },
    {
        name: 'salud',
        icon: <><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m-6-9h12" /></>,
        imageUrl: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=400&q=80',
        subCategories: [
            ServiceCategory.DOCTOR,
            ServiceCategory.NURSE,
            ServiceCategory.DENTIST,
            ServiceCategory.PHARMACIST,
            ServiceCategory.PEDIATRICIAN,
            ServiceCategory.SURGEON,
            ServiceCategory.PSYCHOLOGIST,
            ServiceCategory.PHYSICAL_THERAPIST,
            ServiceCategory.NUTRITIONIST,
        ]
    },
    {
        name: 'educacion',
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />,
        imageUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=400&q=80',
        subCategories: [
            ServiceCategory.TEACHER,
            ServiceCategory.PRIMARY_SCHOOL_TEACHER,
            ServiceCategory.LIBRARIAN,
            ServiceCategory.SCHOOL_PRINCIPAL,
            ServiceCategory.RESEARCHER,
            ServiceCategory.PEDAGOGUE,
            ServiceCategory.SCHOOL_COUNSELOR,
        ]
    },
    {
        name: 'negocios finanzas',
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />,
        imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=80',
        subCategories: [
            ServiceCategory.ACCOUNTANT,
            ServiceCategory.ADMINISTRATOR,
            ServiceCategory.SALESPERSON,
            ServiceCategory.MANAGER,
            ServiceCategory.ECONOMIST,
            ServiceCategory.FINANCIAL_ANALYST,
            ServiceCategory.STOCKBROKER,
            ServiceCategory.TREASURER,
        ]
    },
    {
        name: 'tecnologia medios',
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z" />,
        imageUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=400&q=80',
        subCategories: [
            ServiceCategory.WEB_DEVELOPER,
            ServiceCategory.SYSTEMS_TECHNICIAN,
            ServiceCategory.VIDEO_EDITOR,
            ServiceCategory.PHOTOGRAPHER,
            ServiceCategory.DATA_SCIENTIST,
            ServiceCategory.PROGRAMMER,
            ServiceCategory.ENGINEER,
            ServiceCategory.GRAPHIC_DESIGNER,
            ServiceCategory.JOURNALIST,
            ServiceCategory.PHONE_REPAIR,
        ]
    },
     {
        name: 'legal seguridad',
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.75h-.152c-3.196 0-6.1-1.248-8.25-3.286z" />,
        imageUrl: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=400&q=80',
        subCategories: [
            ServiceCategory.LAWYER,
            ServiceCategory.POLICE_OFFICER,
            ServiceCategory.JUDGE,
            ServiceCategory.PROSECUTOR,
            ServiceCategory.NOTARY,
            ServiceCategory.FIREFIGHTER,
            ServiceCategory.SECURITY_GUARD,
        ]
    },
];

export const JOB_TYPE_OPTIONS: Record<ServiceCategory, string[]> = {
  [ServiceCategory.HANDYMAN]: ['Furniture Assembly', 'TV Mounting', 'Minor Plumbing', 'Drywall Repair', 'Picture Hanging', 'General Repairs'],
  [ServiceCategory.ELECTRICIAN]: ['Wiring & Rewiring', 'Fixture Installation', 'Outlet & Switch Repair', 'EV Charger Installation', 'Panel Upgrades', 'Smart Home Setup'],
  [ServiceCategory.PLUMBER]: ['Leak Repair', 'Drain Cleaning', 'Toilet Installation', 'Water Heater Repair', 'Pipe Fitting', 'Garbage Disposal'],
  [ServiceCategory.PAINTER]: ['Interior Painting', 'Exterior Painting', 'Cabinet Painting', 'Deck Staining', 'Wallpaper Removal', 'Trim Painting'],
  [ServiceCategory.CARPENTER]: ['Custom Shelving', 'Trim & Molding', 'Deck Building', 'Door Installation', 'Frame Repair', 'Cabinet Installation'],
  [ServiceCategory.CLEANER]: ['Standard Cleaning', 'Deep Cleaning', 'Move-in/Move-out', 'Window Cleaning', 'Carpet Cleaning', 'Office Cleaning'],
  [ServiceCategory.LOCKSMITH]: ['Lockout Service', 'Lock Installation', 'Key Duplication', 'Rekeying', 'Smart Lock Setup', 'Car Key Replacement'],
  [ServiceCategory.GARDENER]: ['Lawn Mowing', 'Weeding & Planting', 'Hedge Trimming', 'Garden Design', 'Tree Pruning', 'Irrigation Systems'],
  [ServiceCategory.ARCHITECT]: ['Residential Design', 'Commercial Planning', 'Blueprint Creation', 'Site Analysis', '3D Modeling', 'Permit Applications'],
  [ServiceCategory.MASON]: ['Bricklaying', 'Concrete Work', 'Stone Masonry', 'Chimney Repair', 'Foundation Work', 'Retaining Walls'],
  [ServiceCategory.CONSTRUCTION_WORKER]: ['Framing', 'Demolition', 'Site Cleanup', 'General Labor', 'Drywall Installation', 'Concrete Pouring'],
  [ServiceCategory.WELDER]: ['MIG Welding', 'TIG Welding', 'Stick Welding', 'Metal Fabrication', 'Pipe Welding', 'Structural Welding'],
  [ServiceCategory.BLACKSMITH]: ['Custom Ironwork', 'Gate & Railing Fabrication', 'Tool Forging', 'Metal Repair', 'Decorative Pieces', 'Blade Smithing'],
  [ServiceCategory.SURVEYOR]: ['Land Surveying', 'Boundary Survey', 'Topographic Mapping', 'Construction Staking', 'ALTA/NSPS Surveys', 'Flood Elevation Certificates'],
  [ServiceCategory.HOUSEKEEPER]: ['Tidying & Organizing', 'Bed Making', 'Dusting & Polishing', 'Vacuuming & Mopping', 'Bathroom Cleaning', 'Kitchen Cleaning'],
  [ServiceCategory.JANITOR]: ['Commercial Office Cleaning', 'Floor Buffing & Waxing', 'Trash Removal', 'Restroom Sanitization', 'Window Washing', 'Event Cleanup'],
  [ServiceCategory.HOME_ASSISTANT]: ['Grocery Shopping', 'Errand Running', 'Meal Preparation', 'Appointment Scheduling', 'Pet Care', 'Light Housekeeping'],
  [ServiceCategory.LAUNDERER]: ['Wash & Fold Service', 'Ironing & Pressing', 'Dry Cleaning Drop-off/Pickup', 'Stain Removal', 'Linen Service', 'Delicate Garment Care'],
  [ServiceCategory.BUTLER]: ['Event Serving & Management', 'Wardrobe Management', 'Household Staff Supervision', 'Guest Reception & Valet', 'Travel Arrangements', 'Personal Shopping'],
  [ServiceCategory.COOK]: ['Meal Prep', 'Event Catering', 'Private Chef', 'Specialty Cuisine', 'Baking & Pastry'],
  [ServiceCategory.WAITER]: ['Event Serving', 'Bartending', 'Restaurant Staffing', 'Fine Dining Service', 'Banquets'],
  [ServiceCategory.TAXI_DRIVER]: ['Airport Transfer', 'City Tours', 'Corporate Transport', 'Package Delivery', 'Local Rides'],
  [ServiceCategory.MECHANIC]: ['Oil Change', 'Brake Repair', 'Engine Diagnostics', 'Tire Rotation', 'General Maintenance'],
  [ServiceCategory.HAIRDRESSER]: ['Cut & Style', 'Coloring', 'Highlights', 'Updos & Styling', 'Hair Treatments'],
  [ServiceCategory.BAKER]: ['Custom Cakes', 'Wedding Cakes', 'Bread Baking', 'Pastries & Desserts', 'Artisan Breads'],
  [ServiceCategory.TAILOR]: ['Alterations', 'Custom Clothing', 'Suit Fitting', 'Dressmaking', 'Repairs & Mending'],
  [ServiceCategory.BARBER]: ['Classic Haircut', 'Beard Trim', 'Hot Towel Shave', 'Fades & Tapers', 'Head Shave'],
  [ServiceCategory.MAIL_CARRIER]: ['Local Package Delivery', 'Document Courier', 'Bulk Mail Handling', 'Scheduled Pickups'],
  [ServiceCategory.DOCTOR]: ['General Consultation', 'Annual Check-up', 'Minor Illness Treatment', 'Health Screening', 'Vaccinations'],
  [ServiceCategory.NURSE]: ['Home Care', 'Wound Dressing', 'Medication Administration', 'Post-operative Care', 'Health Monitoring'],
  [ServiceCategory.DENTIST]: ['Dental Cleaning', 'Fillings', 'Check-up & X-Ray', 'Tooth Extraction', 'Teeth Whitening'],
  [ServiceCategory.PHARMACIST]: ['Prescription Filling', 'Medication Review', 'Health Advice', 'Over-the-counter Consultation'],
  [ServiceCategory.PEDIATRICIAN]: ['Well-child Visits', 'Childhood Vaccinations', 'Newborn Care', 'Sick Child Diagnosis'],
  [ServiceCategory.SURGEON]: ['Surgical Consultation', 'Minor Outpatient Procedures', 'Post-Surgical Follow-up'],
  [ServiceCategory.PSYCHOLOGIST]: ['Individual Therapy', 'Couples Counseling', 'Family Therapy', 'Psychological Assessment'],
  [ServiceCategory.PHYSICAL_THERAPIST]: ['Injury Rehabilitation', 'Sports Therapy', 'Post-surgery Rehab', 'Mobility Improvement'],
  [ServiceCategory.NUTRITIONIST]: ['Diet Planning', 'Weight Management Counseling', 'Meal Prep Guidance', 'Nutritional Assessment'],
  [ServiceCategory.TEACHER]: ['Subject Tutoring (Math, Science, etc.)', 'Language Lessons', 'Test Preparation (SAT, ACT)', 'Music Lessons', 'College Application Help'],
  [ServiceCategory.PRIMARY_SCHOOL_TEACHER]: ['Elementary Tutoring', 'Reading & Writing Help', 'Homework Assistance', 'Special Needs Support', 'Early Childhood Education'],
  [ServiceCategory.LIBRARIAN]: ['Research Assistance', 'Cataloging Services', 'Digital Archive Management', 'Story Time Sessions', 'Information Literacy Workshops'],
  [ServiceCategory.SCHOOL_PRINCIPAL]: ['Educational Consulting', 'School Administration Advice', 'Curriculum Development', 'Teacher Training Workshops', 'Policy Review'],
  [ServiceCategory.RESEARCHER]: ['Data Analysis', 'Literature Review', 'Academic Writing', 'Survey Design', 'Qualitative Research'],
  [ServiceCategory.PEDAGOGUE]: ['Learning Plan Development', 'Educational Material Design', 'Child Development Assessment', 'Parental Guidance', 'Didactic Strategies'],
  [ServiceCategory.SCHOOL_COUNSELOR]: ['Academic Advising', 'Career Counseling', 'College Guidance', 'Student Support Sessions', 'Social-Emotional Learning'],
  [ServiceCategory.ACCOUNTANT]: ['Bookkeeping', 'Tax Preparation', 'Auditing', 'Financial Statements'],
  [ServiceCategory.ADMINISTRATOR]: ['Office Management', 'Data Entry', 'Scheduling', 'Executive Assistance'],
  [ServiceCategory.SALESPERSON]: ['Retail Sales', 'B2B Sales', 'Lead Generation', 'Product Demonstration'],
  [ServiceCategory.MANAGER]: ['Project Management', 'Team Leadership', 'Operations Management', 'Strategic Planning'],
  [ServiceCategory.ECONOMIST]: ['Economic Forecasting', 'Market Analysis', 'Policy Research', 'Financial Modeling'],
  [ServiceCategory.FINANCIAL_ANALYST]: ['Investment Analysis', 'Portfolio Management', 'Financial Reporting', 'Risk Assessment'],
  [ServiceCategory.STOCKBROKER]: ['Stock Trading', 'Investment Advice', 'Wealth Management', 'Market Orders'],
  [ServiceCategory.TREASURER]: ['Cash Management', 'Corporate Finance', 'Budgeting', 'Financial Risk Management'],
  [ServiceCategory.WEB_DEVELOPER]: ['Frontend Development', 'Backend Development', 'Full-Stack Development', 'E-commerce Site', 'CMS Setup'],
  [ServiceCategory.SYSTEMS_TECHNICIAN]: ['IT Support', 'Network Setup', 'Hardware Repair', 'Server Maintenance', 'Software Installation'],
  [ServiceCategory.VIDEO_EDITOR]: ['Corporate Videos', 'Social Media Content', 'Wedding Videos', 'Short Films', 'Color Grading'],
  [ServiceCategory.PHOTOGRAPHER]: ['Event Photography', 'Portrait Photoshoot', 'Product Photography', 'Real Estate Photography', 'Wedding Photography'],
  [ServiceCategory.DATA_SCIENTIST]: ['Data Analysis', 'Machine Learning Models', 'Data Visualization', 'Predictive Analytics', 'Big Data Solutions'],
  [ServiceCategory.PROGRAMMER]: ['Custom Software', 'Mobile App Development', 'Scripting & Automation', 'API Integration', 'Database Design'],
  [ServiceCategory.ENGINEER]: ['Software Engineering', 'Civil Engineering Consultation', 'Mechanical Design', 'Electrical Engineering', 'Systems Engineering'],
  [ServiceCategory.GRAPHIC_DESIGNER]: ['Logo Design', 'Branding Package', 'Marketing Materials', 'UI/UX Design', 'Social Media Graphics'],
  [ServiceCategory.JOURNALIST]: ['Article Writing', 'Investigative Reporting', 'Copywriting', 'Interviewing', 'Content Creation'],
  [ServiceCategory.LAWYER]: ['Legal Consultation', 'Contract Review', 'Family Law', 'Criminal Defense'],
  [ServiceCategory.POLICE_OFFICER]: ['Private Security', 'Event Security', 'Security Consulting'],
  [ServiceCategory.JUDGE]: ['Legal Mediation', 'Arbitration Services'],
  [ServiceCategory.PROSECUTOR]: ['Legal Consulting', 'Case Review'],
  [ServiceCategory.NOTARY]: ['Document Notarization', 'Apostille Services', 'Loan Signing Agent', 'Mobile Notary'],
  [ServiceCategory.FIREFIGHTER]: ['Fire Safety Inspection', 'First Aid Training', 'Event Standby'],
  [ServiceCategory.SECURITY_GUARD]: ['Event Security', 'Personal Bodyguard', 'Property Surveillance', 'Mobile Patrol'],
  [ServiceCategory.PHONE_REPAIR]: ['Screen Replacement', 'Battery Replacement', 'Charging Port Repair', 'Water Damage Repair', 'Software Troubleshooting', 'Data Recovery'],
  [ServiceCategory.DJ]: ['Club Events', 'Private Parties', 'Weddings', 'Small Events', 'Corporate Events', 'Festival Sets', 'Live Mixing', 'Themed Parties'],
};

export const CURRENCIES = [
  { code: 'USD', name: 'United States Dollar' },
  { code: 'ARS', name: 'Argentine Peso' },
  { code: 'BOB', name: 'Bolivian Boliviano' },
];

export const COUNTRY_CODES = [
    { name: 'USA', code: '+1' },
    { name: 'ARG', code: '+54' },
    { name: 'BOL', code: '+591' },
    { name: 'BRA', code: '+55' },
    { name: 'CHL', code: '+56' },
    { name: 'COL', code: '+57' },
    { name: 'ECU', code: '+593' },
    { name: 'GUY', code: '+592' },
    { name: 'PRY', code: '+595' },
    { name: 'PER', code: '+51' },
    { name: 'SUR', code: '+597' },
    { name: 'URY', code: '+598' },
    { name: 'VEN', code: '+58' },
];

export const formatCurrency = (amount: number, currency: string) => {
  try {
    // Use 'symbol' for known currencies, fallback to 'code'
    const display = ['USD', 'ARS', 'BOB'].includes(currency) ? 'symbol' : 'code';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, currencyDisplay: display }).format(amount);
  } catch (e) {
    // Fallback for unsupported currency codes or other errors
    return `${amount.toFixed(2)} ${currency}`;
  }
};