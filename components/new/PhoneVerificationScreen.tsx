import React, { useState } from 'react';

interface PhoneVerificationScreenProps {
  onVerify: (code: string) => void;
  onBack: () => void;
  error: string;
  phoneNumber: string;
  t: (key: string) => string;
}

const PhoneVerificationScreen: React.FC<PhoneVerificationScreenProps> = ({ onVerify, onBack, error, phoneNumber, t }) => {
  const [code, setCode] = useState(['', '', '', '']);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const pastedCode = value.replace(/\D/g, '').substring(0, 4).split('');
      const newCode = [...code];
      pastedCode.forEach((char, i) => {
        if (i < 4) newCode[i] = char;
      });
      setCode(newCode);
      return;
    }

    const newCode = [...code];
    newCode[index] = value.replace(/\D/g, '');
    setCode(newCode);

    // Auto focus next input
    if (value && index < 3) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join('');
    if (fullCode.length === 4) {
        onVerify(fullCode);
    }
  };

  return (
    <div className="relative max-w-md mx-auto">
      <button onClick={onBack} className="absolute -top-2 -left-2 text-slate-400 hover:text-purple-600 transition-colors p-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
          </svg>
      </button>
      <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">{t('verify_phone')}</h1>
          <p className="text-slate-600 text-base leading-relaxed max-w-sm mx-auto">
            {t('verify_phone_description')} <span className="font-bold text-purple-700 whitespace-nowrap block mt-1">{phoneNumber}</span>
          </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="flex justify-center gap-4">
          {code.map((digit, index) => (
            <input
              key={index}
              id={`code-${index}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-16 h-16 text-center text-3xl font-bold border border-slate-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all bg-slate-50 text-slate-900 shadow-inner"
              required
            />
          ))}
        </div>
        {error && <p className="text-sm text-red-500 text-center font-medium">{error}</p>}
        <button
          type="submit"
          className="w-full bg-purple-600 text-white font-bold py-4 px-4 rounded-xl hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all shadow-md text-lg"
        >
          {t('verify')}
        </button>
      </form>
    </div>
  );
};

export default PhoneVerificationScreen;