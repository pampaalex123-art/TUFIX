import React from 'react';
import { User } from '../../types';
import StarRating from '../common/StarRating';

interface ClientProfileForWorkerViewProps {
  client: User;
  onBack: () => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
}

const ClientProfileForWorkerView: React.FC<ClientProfileForWorkerViewProps> = ({ client, onBack, t }) => {
  return (
    <div className="container mx-auto max-w-4xl">
      <button onClick={onBack} className="flex items-center text-black hover:text-purple-600 font-semibold mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 mr-2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        {t('back to job details')}
      </button>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-8">
          <div className="flex flex-col md:flex-row md:items-start space-y-6 md:space-y-0 md:space-x-8">
            <img className="w-32 h-32 rounded-full object-cover ring-4 ring-purple-100" src={client.avatarUrl} alt={client.name} />
            <div className="flex-grow">
              <h1 className="text-4xl font-bold text-black">{client.name}</h1>
              <p className="text-black mt-2">{client.location}</p>
              <div className="flex items-center mt-2 space-x-4">
                <div className="flex items-center">
                  <StarRating rating={client.rating} />
                  <span className="text-black ml-2 font-semibold">{client.rating.toFixed(1)}</span>
                </div>
                <span className="text-black">({(client.reviews || []).length} {t('reviews')})</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 p-8">
          <h2 className="text-2xl font-bold text-black mb-6">{t('reviews from providers')}</h2>
          <div className="space-y-6">
            {(client.reviews || []).length > 0 ? client.reviews.map((review, index) => (
              <div key={index} className="flex space-x-4">
                <img className="w-12 h-12 rounded-full object-cover" src={`https://picsum.photos/seed/${review.author.replace(/\s/g, '')}/100`} alt={review.author} />
                <div>
                  <div className="flex items-center justify-between">
                     <p className="font-bold text-black">{review.author}</p>
                     <span className="text-sm text-black">{review.date}</span>
                  </div>
                  <StarRating rating={review.rating} />
                  <p className="text-black mt-2">{review.comment}</p>
                </div>
              </div>
            )) : (
                <p className="text-black">{t('this_client_has_no_reviews')}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientProfileForWorkerView;