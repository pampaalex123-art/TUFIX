import React, { useState, useEffect } from 'react';
import { User, Worker, UserType } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, CreditCard, UserCircle, CheckCircle, ChevronRight, ChevronLeft } from 'lucide-react';

interface OnboardingTourProps {
  currentUser: User | Worker | null;
  userType: UserType | null;
  onComplete: () => void;
}

const OnboardingTour: React.FC<OnboardingTourProps> = ({ currentUser, userType, onComplete }) => {
  const [run, setRun] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (currentUser && currentUser.has_completed_onboarding === undefined) {
      setRun(true);
    } else if (currentUser && currentUser.has_completed_onboarding === false) {
      setRun(true);
    }
  }, [currentUser]);

  const handleComplete = () => {
    setRun(false);
    onComplete();
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const steps = [
    {
      title: 'Welcome to TUFIX!',
      description: 'Let\'s take a quick tour to help you get started with our platform.',
      icon: <span className="text-4xl">👋</span>,
      color: 'bg-purple-100 text-purple-600'
    },
    {
      title: 'Choose Your Role',
      description: 'Whether you need a service or want to offer your skills, TUFIX connects you with the right people.',
      icon: <UserCircle size={48} />,
      color: 'bg-blue-100 text-blue-600'
    },
    {
      title: 'Set Your Location',
      description: 'Use the address search bar to precisely set where the service will take place.',
      icon: <MapPin size={48} />,
      color: 'bg-green-100 text-green-600'
    },
    {
      title: 'Secure Payments',
      description: 'Securely pay or get paid using Mercado Pago. It\'s fast, reliable, and protected.',
      icon: <CreditCard size={48} />,
      color: 'bg-orange-100 text-orange-600'
    }
  ];

  if (!run) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col"
        >
          {/* Progress Bar */}
          <div className="w-full h-1.5 bg-slate-100">
            <motion.div 
              className="h-full bg-purple-600"
              initial={{ width: `${(currentStep / steps.length) * 100}%` }}
              animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          <div className="p-8 flex flex-col items-center text-center">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 ${steps[currentStep].color}`}>
              {steps[currentStep].icon}
            </div>
            
            <h2 className="text-2xl font-bold text-slate-800 mb-3">
              {steps[currentStep].title}
            </h2>
            
            <p className="text-slate-600 leading-relaxed mb-8">
              {steps[currentStep].description}
            </p>

            <div className="w-full flex items-center justify-between mt-auto">
              <button
                onClick={handleComplete}
                className="text-slate-400 hover:text-slate-600 font-medium text-sm transition-colors"
              >
                Skip Tour
              </button>
              
              <div className="flex items-center space-x-3">
                {currentStep > 0 && (
                  <button
                    onClick={prevStep}
                    className="p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
                  >
                    <ChevronLeft size={20} />
                  </button>
                )}
                <button
                  onClick={nextStep}
                  className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-full font-medium transition-colors shadow-md shadow-purple-200"
                >
                  <span>{currentStep === steps.length - 1 ? 'Get Started' : 'Next'}</span>
                  {currentStep === steps.length - 1 ? <CheckCircle size={18} /> : <ChevronRight size={18} />}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default OnboardingTour;
