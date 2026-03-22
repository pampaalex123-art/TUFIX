import React, { useState } from 'react';
import { UserType } from '../../types';
import AuthForm from './AuthForm';

interface AuthScreenProps {
  onLogin: (type: UserType, formData: any) => Promise<string | null> | string | null;
  onSignUp: (type: UserType, formData: any) => Promise<string | null> | string | null;
  onForgotPassword: () => void;
  t: (key: string) => string;
  termsContent: string;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin, onSignUp, onForgotPassword, t, termsContent }) => {
  const [selectedType, setSelectedType] = useState<UserType | null>(null);

  const handleSelectType = (type: UserType) => {
    setSelectedType(type);
  };

  const handleBack = () => {
    setSelectedType(null);
  };
  
  if (selectedType) {
    return (
        <div className="flex flex-col items-center justify-center w-full">
            <AuthForm 
                userType={selectedType}
                onLogin={(formData) => onLogin(selectedType, formData)}
                onSignUp={(formData) => onSignUp(selectedType, formData)}
                onForgotPassword={onForgotPassword}
                onBack={handleBack}
                t={t}
                termsContent={termsContent}
            />
        </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className="w-[90%] max-w-[400px] bg-white border border-slate-200 rounded-2xl p-8 shadow-xl text-center">
        <h1 className="text-5xl font-bold text-black mb-2">
          {t('welcome to')} <span className="bg-gradient-to-br from-yellow-300 via-pink-500 to-purple-700 text-transparent bg-clip-text">TUFIX</span>
        </h1>
        <p className="text-black mb-10">{t('auth subtitle')}</p>
        <div className="flex flex-col items-center space-y-6">
          <button
            onClick={() => handleSelectType('user')}
            className="w-full bg-slate-50 border border-slate-200 text-black font-bold py-4 px-2 sm:px-4 rounded-xl hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 transition duration-300 ease-in-out flex items-center justify-center space-x-2 sm:space-x-3 shadow-sm text-sm sm:text-base"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
            <span className="whitespace-nowrap">{t('need service')}</span>
          </button>
          <button
            onClick={() => handleSelectType('worker')}
            className="w-full bg-slate-50 border border-slate-200 text-black font-bold py-4 px-2 sm:px-4 rounded-xl hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 transition duration-300 ease-in-out flex items-center justify-center space-x-2 sm:space-x-3 shadow-sm text-sm sm:text-base"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
            <span className="whitespace-nowrap">{t('provide service')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
