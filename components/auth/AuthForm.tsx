import React, { useState } from 'react';
import { UserType } from '../../types';
import { COUNTRY_CODES } from '../../constants';
import TermsModal from '../shared/TermsModal';

interface AuthFormProps {
  userType: UserType;
  onLogin: (formData: any) => Promise<string | null> | string | null;
  onSignUp: (formData: any) => Promise<string | null> | string | null;
  onForgotPassword: () => void;
  onBack: () => void;
  t: (key: string) => string;
  termsContent: string;
}

const AuthForm: React.FC<AuthFormProps> = ({ userType, onLogin, onSignUp, onForgotPassword, onBack, t, termsContent }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    idNumber: '',
    countryCode: '+1',
    phoneNumber: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);


  const config = {
    user: {
      title: 'Client',
      iconUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=800&auto=format&fit=crop'
    },
    worker: {
      title: 'Service Provider',
      iconUrl: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?q=80&w=800&auto=format&fit=crop'
    },
    admin: {
      title: 'Administrator',
      iconUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800&auto=format&fit=crop'
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setError('');
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      if (mode === 'signup') {
        if(userType === 'admin') {
            setError("Admin accounts cannot be created from the sign-up form.");
            return;
        }
        if (!acceptedTerms) {
          setError(t('must_accept_terms'));
          return;
        }
        if (formData.password !== formData.confirmPassword) {
          setError(t('passwords_do_not_match'));
          return;
        }
        if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim() || !formData.idNumber.trim() || !formData.phoneNumber.trim()) {
          setError(t('fill_all_fields'));
          return;
        }
        const signUpError = await onSignUp(formData);
        if (signUpError) {
          setError(signUpError);
        }
      } else {
        if (!formData.email.trim() || !formData.password.trim()) {
          setError(t('fill_all_fields'));
          return;
        }
        const loginError = await onLogin(formData);
        if (loginError) {
          setError(loginError);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };
    const inputStyles = "w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-black placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-white transition";


  return (
    <>
    <div className="max-w-4xl w-full bg-white border border-slate-200 rounded-2xl shadow-xl relative overflow-hidden flex flex-col md:flex-row">
        {/* Left side: Image */}
        <div className="hidden md:block md:w-1/2 relative">
            <img 
                src={userType === 'user' ? 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=1000&auto=format&fit=crop' : userType === 'worker' ? 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?q=80&w=1000&auto=format&fit=crop' : 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1000&auto=format&fit=crop'} 
                alt="Login" 
                className="absolute inset-0 w-full h-full object-cover"
                referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-purple-900/40 mix-blend-multiply"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-8 text-white">
                <h3 className="text-3xl font-bold mb-2">
                    {userType === 'user' ? 'Find the perfect professional' : userType === 'worker' ? 'Grow your business' : 'Manage the platform'}
                </h3>
                <p className="text-white/80">
                    {userType === 'user' ? 'Connect with skilled workers in your area for any job.' : userType === 'worker' ? 'Find clients and manage your jobs all in one place.' : 'Oversee users, workers, and platform activity.'}
                </p>
            </div>
        </div>

        {/* Right side: Form */}
        <div className="w-full md:w-1/2 p-8 relative flex flex-col">
            <button onClick={onBack} className="absolute top-4 left-4 text-white hover:text-purple-200 drop-shadow-md transition-colors z-20 bg-black/20 rounded-full p-1 backdrop-blur-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                </svg>
            </button>
            
          <div className="-mx-8 -mt-8 mb-6 h-48 relative">
             <img 
                src={config[userType].iconUrl} 
                alt={config[userType].title} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
             />
             <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent"></div>
          </div>
          
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold bg-gradient-to-br from-yellow-300 via-pink-500 to-purple-700 text-transparent bg-clip-text">{t(`${userType}_${mode}`)}</h2>
          </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'signup' && (
          <div>
            <label htmlFor="name" className="sr-only">{t('full_name')}</label>
            <input type="text" name="name" id="name" placeholder={t('full_name')} value={formData.name} onChange={handleChange} required className={inputStyles} />
          </div>
        )}
        <div>
          <label htmlFor="email" className="sr-only">{t('email_address')}</label>
          <input type="email" name="email" id="email" placeholder={t('email_address')} value={formData.email} onChange={handleChange} required className={inputStyles} />
        </div>
        <div>
          <label htmlFor="password"className="sr-only">{t('password')}</label>
          <input type="password" name="password" id="password" placeholder={t('password')} value={formData.password} onChange={handleChange} required className={inputStyles} />
        </div>
         {mode === 'login' && userType !== 'admin' && (
            <div className="text-right -mt-2">
                <button type="button" onClick={onForgotPassword} className="text-sm font-semibold text-black hover:text-purple-600 hover:underline">
                    {t('forgot_password')}
                </button>
            </div>
        )}
        {mode === 'signup' && (
          <>
            <div>
              <label htmlFor="confirmPassword"className="sr-only">{t('confirm_password')}</label>
              <input type="password" name="confirmPassword" id="confirmPassword" placeholder={t('confirm_password')} value={formData.confirmPassword} onChange={handleChange} required className={inputStyles} />
            </div>
             <div>
                <label htmlFor="idNumber" className="sr-only">{t('id_number')}</label>
                <input type="text" name="idNumber" id="idNumber" placeholder={t('id_number')} value={formData.idNumber} onChange={handleChange} required className={inputStyles} />
            </div>
            <div className="flex space-x-2">
                <div>
                    <label htmlFor="countryCode" className="sr-only">{t('country_code')}</label>
                    <select name="countryCode" id="countryCode" value={formData.countryCode} onChange={handleChange} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-black placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-white transition h-full">
                        {COUNTRY_CODES.map(c => <option key={c.code} value={c.code} className="bg-white text-black">{c.name} ({c.code})</option>)}
                    </select>
                </div>
                <div className="flex-grow">
                    <label htmlFor="phoneNumber" className="sr-only">{t('phone_number')}</label>
                    <input type="tel" name="phoneNumber" id="phoneNumber" placeholder={t('phone_number')} value={formData.phoneNumber} onChange={handleChange} required className={inputStyles} />
                </div>
            </div>
          </>
        )}

        {mode === 'signup' && userType !== 'admin' && (
            <div className="flex items-center">
              <input id="terms" name="terms" type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} className="h-4 w-4 text-purple-600 bg-white border-slate-300 rounded focus:ring-purple-500" />
              <label htmlFor="terms" className="ml-2 block text-sm text-black">
                {t('accept_terms')}{' '}
                <button type="button" onClick={() => setIsTermsModalOpen(true)} className="font-medium text-purple-600 hover:text-purple-700 underline">
                  {t('terms_and_services')}
                </button>
              </label>
            </div>
        )}
        
        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        <button type="submit" disabled={isLoading || (mode === 'signup' && !acceptedTerms)} className="w-full text-white font-bold py-3 px-4 rounded-lg bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition duration-300 ease-in-out disabled:bg-slate-300 disabled:cursor-not-allowed shadow-md flex justify-center items-center">
          {isLoading ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            mode === 'login' ? t('login') : t('create_account')
          )}
        </button>
      </form>
      
      {userType !== 'admin' && (
        <p className="text-center text-sm text-black mt-6">
            {mode === 'login' ? t('dont_have_account') : t('already_have_account')}
            <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }} className="font-semibold text-purple-600 hover:underline ml-1">
            {mode === 'login' ? t('signup') : t('login')}
            </button>
        </p>
      )}
    </div>
    </div>
    {isTermsModalOpen && (
      <TermsModal
        content={termsContent}
        onClose={() => setIsTermsModalOpen(false)}
        t={t}
      />
    )}
    </>
  );
};

export default AuthForm;