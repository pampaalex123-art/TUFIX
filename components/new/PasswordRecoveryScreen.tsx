import React, { useState } from 'react';

interface PasswordRecoveryScreenProps {
  error: string;
  onSendCode: (emailOrPhone: string) => boolean;
  onVerifyCode: (code: string) => boolean;
  onResetPassword: (password: string) => boolean;
  onBackToLogin: () => void;
  t: (key: string) => string;
}

const PasswordRecoveryScreen: React.FC<PasswordRecoveryScreenProps> = ({ error, onSendCode, onVerifyCode, onResetPassword, onBackToLogin, t }) => {
  const [stage, setStage] = useState<'selection' | 'input' | 'code' | 'reset'>('selection');
  const [method, setMethod] = useState<'email' | 'phone' | null>(null);
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [internalError, setInternalError] = useState('');

  const handleSendCode = (e: React.FormEvent) => {
    e.preventDefault();
    setInternalError('');
    if (onSendCode(emailOrPhone)) {
        setStage('code');
    }
  };
  
  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    setInternalError('');
    if (onVerifyCode(code)) {
        setStage('reset');
    }
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setInternalError(t('passwords do not match'));
      return;
    }
    setInternalError('');
    onResetPassword(password);
  };
  
  const inputStyles = "w-full p-3 border rounded-lg bg-slate-50 border-slate-300 text-black";

  const renderStage = () => {
    switch (stage) {
      case 'selection':
        return (
          <div className="space-y-4">
            <p className="text-slate-600 text-center mb-6">{t('choose recovery method')}</p>
            <button 
              onClick={() => { setMethod('email'); setStage('input'); }}
              className="w-full flex items-center justify-between p-4 border rounded-xl bg-slate-50 border-slate-200 hover:border-purple-500 hover:bg-purple-50 transition-all group"
            >
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mr-4 group-hover:bg-purple-200">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="font-semibold text-slate-800">{t('recover via email')}</span>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button 
              onClick={() => { setMethod('phone'); setStage('input'); }}
              className="w-full flex items-center justify-between p-4 border rounded-xl bg-slate-50 border-slate-200 hover:border-purple-500 hover:bg-purple-50 transition-all group"
            >
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mr-4 group-hover:bg-purple-200">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <span className="font-semibold text-slate-800">{t('recover via phone')}</span>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        );
      case 'input':
        return (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div>
              <label htmlFor="emailOrPhone" className="block text-sm font-medium text-slate-700 mb-1">
                {method === 'email' ? t('email_address') : t('phone_number')}
              </label>
              <input 
                type={method === 'email' ? "email" : "text"} 
                name="emailOrPhone" 
                id="emailOrPhone" 
                placeholder={method === 'email' ? t('enter email') : t('enter phone')} 
                value={emailOrPhone} 
                onChange={e => setEmailOrPhone(e.target.value)} 
                required 
                className={inputStyles} 
              />
            </div>
            <button type="submit" className="w-full bg-purple-600 text-white font-bold py-3.5 px-4 rounded-xl hover:bg-purple-700 shadow-md transition-all">{t('send code')}</button>
            <button type="button" onClick={() => setStage('selection')} className="w-full text-sm text-slate-500 hover:text-purple-600 transition-all">{t('change method')}</button>
          </form>
        );
      case 'code':
        return (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div>
              <label htmlFor="code" className="sr-only">{t('recovery code')}</label>
              <input type="text" name="code" id="code" placeholder={t('recovery code')} value={code} onChange={e => setCode(e.target.value)} required className={inputStyles} />
            </div>
            <button type="submit" className="w-full bg-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-purple-700">{t('verify')}</button>
          </form>
        );
      case 'reset':
        return (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label htmlFor="password"className="sr-only">{t('new password')}</label>
              <input type="password" name="password" id="password" placeholder={t('new password')} value={password} onChange={e => setPassword(e.target.value)} required className={inputStyles} />
            </div>
            <div>
              <label htmlFor="confirmPassword"className="sr-only">{t('confirm new password')}</label>
              <input type="password" name="confirmPassword" id="confirmPassword" placeholder={t('confirm new password')} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className={inputStyles} />
            </div>
            <button type="submit" className="w-full bg-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-purple-700">{t('reset password')}</button>
          </form>
        );
    }
  };
  
  const subtitles = {
      selection: t('choose recovery method subtitle'),
      input: method === 'email' ? t('recover_email_subtitle') : t('recover_phone_subtitle'),
      code: 'A recovery code was sent to you. Please enter it below.',
      reset: t('reset password subtitle'),
  }

  return (
    <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 128px)' }}>
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg relative">
        <button onClick={onBackToLogin} className="absolute top-4 left-4 text-black hover:text-purple-600">
            &larr; {t('back')}
        </button>
        <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-black mb-2">{t('password recovery')}</h1>
            <p className="text-black">{subtitles[stage]}</p>
        </div>
        {(error || internalError) && <p className="text-sm text-red-500 text-center mb-4">{error || internalError}</p>}
        {renderStage()}
      </div>
    </div>
  );
};

export default PasswordRecoveryScreen;