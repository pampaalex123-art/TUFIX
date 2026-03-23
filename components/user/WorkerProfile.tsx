import React from 'react';
import { User, Worker } from '../../types';
import StarRating from '../common/StarRating';
import AvailabilityCalendar from '../common/AvailabilityCalendar';
import { formatCurrency } from '../../constants';

interface WorkerProfileProps {
  worker: Worker;
  onBack: () => void;
  onContact: (worker: Worker) => void;
  onBookNow: (worker: Worker) => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
}

const WorkerProfile: React.FC<WorkerProfileProps> = ({ worker, onBack, onContact, onBookNow, t }) => {
  return (
    <div className="container mx-auto max-w-6xl">
      <button onClick={onBack} className="flex items-center text-black hover:text-purple-600 font-semibold mb-6 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 mr-2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        {t('back_to_results')}
      </button>

      <div className="bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="flex flex-col md:flex-row md:items-start space-y-6 md:space-y-0 md:space-x-8 text-center md:text-left items-center md:items-start">
            <img className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover ring-4 ring-purple-100" src={worker.avatarUrl} alt={worker.name} />
            <div className="flex-grow">
              <h1 className="text-3xl sm:text-4xl font-bold text-black">{worker.name}</h1>
              <p className="text-lg sm:text-xl font-semibold text-purple-600 mt-1">{t(worker.service)}</p>
              <p className="text-black mt-2">{worker.location}</p>
              <div className="flex items-center mt-2 space-x-4 justify-center md:justify-start">
                <div className="flex items-center">
                  <StarRating rating={worker.rating} />
                  <span className="text-black ml-2 font-semibold">{worker.rating.toFixed(1)}</span>
                </div>
                <span className="text-black">({(worker.reviews || []).length} {t('reviews')})</span>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-black mt-4">{worker.avgJobCost ? formatCurrency(worker.avgJobCost.amount, worker.avgJobCost.currency) : t('price not available')}<span className="text-sm sm:text-base font-normal text-black"> {t('job_avg')}</span></p>
            </div>
            <div className="flex flex-col space-y-3 w-full md:w-auto self-stretch md:self-center flex-shrink-0">
              <button 
                onClick={() => onContact(worker)}
                className="w-full md:w-auto bg-purple-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-purple-700 transition duration-300 flex items-center justify-center space-x-2">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
                 <span>{t('contact')}</span>
              </button>
              <button 
                onClick={() => onBookNow(worker)}
                className="w-full md:w-auto bg-green-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-600 transition duration-300">{t('book_now')}</button>
            </div>
          </div>
          
          <div className="mt-8 border-t pt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
                <h2 className="text-2xl font-bold text-black mb-4">{t('about_worker', { name: worker.name })}</h2>
                <p className="text-black leading-relaxed whitespace-pre-wrap">{worker.bio}</p>
            </div>
            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-8">
                <div>
                    <h2 className="text-xl font-bold text-black mb-4">{t('availability')}</h2>
                    <AvailabilityCalendar 
                        availability={worker.availability} 
                        availabilityOverrides={worker.availabilityOverrides}
                        t={t}
                    />
                </div>
                {worker.jobTypes && worker.jobTypes.length > 0 && (
                    <div>
                        <h3 className="text-xl font-bold text-black mb-3">{t('job_specialties')}</h3>
                        <div className="flex flex-wrap gap-2">
                        {worker.jobTypes.map(jobType => (
                            <span key={jobType} className="bg-purple-100 text-purple-800 text-sm font-medium px-3 py-1 rounded-full">{t(jobType)}</span>
                        ))}
                        </div>
                    </div>
                )}
                <div>
                    <h3 className="text-xl font-bold text-black mb-3">{t('service_areas')}</h3>
                    <div className="flex flex-wrap gap-2">
                    {(worker.regions || []).map(region => (
                        <span key={region} className="bg-slate-200 text-black text-sm font-medium px-3 py-1 rounded-full">{region}</span>
                    ))}
                    </div>
                </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 border-t border-slate-200 p-8">
          <h2 className="text-2xl font-bold text-black mb-6">{t('reviews')}</h2>
          <div className="space-y-6">
            {(worker.reviews || []).length > 0 ? worker.reviews.map((review, index) => (
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
                <p className="text-black">{t('no reviews yet')}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkerProfile;