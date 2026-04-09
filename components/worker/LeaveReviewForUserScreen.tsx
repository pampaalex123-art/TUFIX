import React, { useState } from 'react';
import { useToast } from '../common/Toast';
import { JobRequest, User } from '../../types';

interface LeaveReviewForUserScreenProps {
  job: JobRequest;
  user: User;
  onBack: () => void;
  onSubmit: (jobId: string, reviewData: { rating: number; comment: string }) => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
}

const LeaveReviewForUserScreen: React.FC<LeaveReviewForUserScreenProps> = ({ job, user, onBack, onSubmit, t }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      showToast(t('select_rating_alert'), 'warning');
      return;
    }
    if (comment.trim() === '') {
      showToast(t('leave_comment_alert'), 'warning');
      return;
    }
    onSubmit(job.id, { rating, comment });
  };
  
  const Star = ({ filled }: { filled: boolean }) => (
    <svg className="w-8 h-8" fill={filled ? "currentColor" : "none"} viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" stroke="currentColor" strokeWidth="1" />
    </svg>
  );

  return (
    <div className="container mx-auto max-w-2xl">
      <button onClick={onBack} className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 mr-2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        {t('back_to_dashboard')}
      </button>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{t('leave_review_title')}</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            {t('review_for_user_subtitle', { name: user.name, service: t(job.service) })}
          </p>
        </div>

        <div className="border-t dark:border-gray-700 pt-6">
          <label className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">{t('client_rating')}</label>
          <div className="flex items-center space-x-1 text-yellow-400" onMouseLeave={() => setHoverRating(0)}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                type="button"
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                className="focus:outline-none"
                aria-label={`Rate ${star} out of 5 stars`}
              >
                <Star filled={(hoverRating || rating) >= star} />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="comment" className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">{t('your review')}</label>
          <textarea
            id="comment"
            rows={6}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t('review_placeholder_user', { name: user.name })}
            required
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 dark:text-white"
          ></textarea>
        </div>
        
        <div className="pt-5 flex justify-end space-x-3">
          <button type="button" onClick={onBack} className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-100 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition">
            {t('cancel')}
          </button>
          <button type="submit" className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 transition">
            {t('submit_review')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LeaveReviewForUserScreen;