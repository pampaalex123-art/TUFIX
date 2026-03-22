import React, { useState, useRef } from 'react';
import { User } from '../../types';

interface UserProfileEditProps {
  user: User;
  onSave: (updatedUser: User) => void;
  onBack: () => void;
  t: (key: string) => string;
}

const UserProfileEdit: React.FC<UserProfileEditProps> = ({ user, onSave, onBack, t }) => {
  const [formData, setFormData] = useState<User>(user);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          avatarUrl: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const inputStyles = "mt-1 block w-full p-3 bg-slate-100 border-transparent rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none sm:text-sm text-slate-900";

  return (
    <div className="container mx-auto max-w-2xl">
      <button onClick={onBack} className="flex items-center text-slate-600 hover:text-slate-900 font-semibold mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 mr-2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        {t('back_to_dashboard')}
      </button>
      
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-8 border-b border-slate-200 pb-4">{t('edit_my_profile_user')}</h1>
          
          <div className="flex items-center space-x-6 mb-8">
            <img className="w-24 h-24 rounded-full object-cover ring-4 ring-purple-100" src={formData.avatarUrl} alt={formData.name} />
            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarChange}
                accept="image/*"
                className="hidden"
                aria-label="Upload new profile picture"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-slate-100 py-2 px-4 border border-slate-300 rounded-lg shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-200"
              >
                {t('change_photo')}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-600">{t('full_name')}</label>
              <input
                type="text"
                name="name"
                id="name"
                value={formData.name}
                onChange={handleChange}
                className={inputStyles}
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-600">{t('email_address')}</label>
              <input
                type="email"
                name="email"
                id="email"
                value={formData.email}
                onChange={handleChange}
                className={inputStyles}
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="location" className="block text-sm font-medium text-slate-600">{t('location')}</label>
              <input
                type="text"
                name="location"
                id="location"
                value={formData.location}
                onChange={handleChange}
                className={inputStyles}
              />
            </div>
          </div>
        </div>

        <div className="pt-5 flex justify-end space-x-3">
          <button type="button" onClick={onBack} className="bg-slate-200 text-slate-800 font-bold py-2 px-4 rounded-lg hover:bg-slate-300 transition">
            {t('cancel')}
          </button>
          <button type="submit" className="bg-purple-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-purple-700 transition">
            {t('save_changes')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserProfileEdit;