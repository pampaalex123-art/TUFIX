

import React, { useState } from 'react';

interface AdminTermsEditScreenProps {
  initialContent: string;
  onSave: (newContent: string) => void;
  onBack: () => void;
  t: (key: string) => string;
}

const AdminTermsEditScreen: React.FC<AdminTermsEditScreenProps> = ({ initialContent, onSave, onBack, t }) => {
  const [content, setContent] = useState(initialContent);

  const handleSave = () => {
    onSave(content);
  };

  return (
    <div className="container mx-auto max-w-4xl">
      <button onClick={onBack} className="flex items-center text-gray-100 hover:text-white font-semibold mb-6">
        &larr; {t('back to dashboard')}
      </button>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{t('edit terms and services')}</h1>
          <p className="text-slate-600 dark:text-slate-300 mt-2">
            {t('terms edit subtitle')}
          </p>
        </div>

        <div className="border-t dark:border-slate-700 pt-6">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={20}
            className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm bg-white dark:bg-slate-700 dark:text-white"
          ></textarea>
        </div>

        <div className="pt-5 flex justify-end space-x-3">
          <button type="button" onClick={onBack} className="bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-100 font-bold py-2 px-4 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition">
            {t('cancel')}
          </button>
          <button type="button" onClick={handleSave} className="bg-purple-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-purple-700 transition">
            {t('save changes')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminTermsEditScreen;