import React from 'react';
import { motion } from 'motion/react';

interface VerificationPendingScreenProps {
  onBackToHome: () => void;
  t: (key: string) => string;
}

const VerificationPendingScreen: React.FC<VerificationPendingScreenProps> = ({ onBackToHome, t }) => {
  return (
    <div className="flex items-center justify-center p-4 min-h-[80vh]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white border border-slate-200 p-6 md:p-8 rounded-2xl shadow-xl text-center relative overflow-hidden"
      >
        {/* Background decorative elements to match login style */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-purple-100 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 bg-pink-100 rounded-full blur-3xl opacity-50"></div>

        <div className="relative z-10">
          {/* Animated Ticked Button with Glass Effect */}
          <div className="flex justify-center mb-6 md:mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: 0.2 
              }}
              className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-white/40 backdrop-blur-md border border-white/60 shadow-lg flex items-center justify-center relative overflow-hidden"
            >
              {/* Inner glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none"></div>
              
              <motion.svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-10 w-10 md:h-12 md:w-12 text-green-500" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
                strokeWidth={3}
              >
                <motion.path 
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  d="M5 13l4 4L19 7" 
                />
              </motion.svg>
            </motion.div>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold mb-3 md:mb-4">
            <span className="bg-gradient-to-br from-yellow-300 via-pink-500 to-purple-700 text-transparent bg-clip-text">
              {t('verification submitted')}
            </span>
          </h1>
          
          <p className="text-slate-600 mb-6 md:mb-8 leading-relaxed text-sm md:text-base">
            {t('verification submitted subtitle')}
          </p>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onBackToHome}
            className="w-full bg-purple-600 text-white font-bold py-3.5 md:py-4 px-6 rounded-xl hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition shadow-md"
          >
            {t('back to home')}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default VerificationPendingScreen;

