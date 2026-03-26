import React, { useState, useEffect } from 'react';
import { Joyride, STATUS, Step, EventData } from 'react-joyride';
import { User, Worker, UserType } from '../../types';

interface OnboardingTourProps {
  currentUser: User | Worker | null;
  userType: UserType | null;
  onComplete: () => void;
}

const OnboardingTour: React.FC<OnboardingTourProps> = ({ currentUser, userType, onComplete }) => {
  const [run, setRun] = useState(false);

  useEffect(() => {
    if (currentUser && !currentUser.has_completed_onboarding) {
      setRun(true);
    }
  }, [currentUser]);

  const steps: Step[] = [
    {
      target: 'body',
      content: (
        <div className="text-center">
          <h2 className="text-2xl font-bold text-purple-700 mb-2">Welcome to TUFIX!</h2>
          <p className="text-slate-600">Let's take a quick tour to help you get started.</p>
        </div>
      ),
      placement: 'center',
      skipBeacon: true,
    },
    {
      target: '.tour-identity',
      content: 'Here you can choose your role. Whether you need a service or want to offer your skills, TUFIX connects you!',
      placement: 'bottom',
    },
    {
      target: '.tour-location',
      content: 'Use the address search bar to precisely set where the service will take place.',
      placement: 'bottom',
    },
    {
      target: '.tour-payments',
      content: 'Securely pay or get paid using Mercado Pago. It\'s fast and reliable!',
      placement: 'top',
    }
  ];

  const handleJoyrideCallback = (data: EventData) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      onComplete();
    }
  };

  if (!run) return null;

  return (
    <>
      {/* Mock elements for the tour to target, rendered visibly in a nice tutorial panel */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none bg-black/40">
        <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto opacity-100 transition-opacity">
          <h3 className="text-xl font-bold text-center mb-6 text-purple-800">TUFIX Features</h3>
          
          <div className="space-y-6">
            <div className="tour-identity flex space-x-2">
              <button className="flex-1 bg-purple-600 text-white py-2 rounded-lg text-sm font-medium">I need a service</button>
              <button className="flex-1 bg-white border border-purple-600 text-purple-600 py-2 rounded-lg text-sm font-medium">I want to provide a service</button>
            </div>

            <div className="tour-location">
              <label className="block text-sm font-medium text-slate-700 mb-1">Service Location</label>
              <div className="flex items-center border border-slate-300 rounded-lg p-2 bg-slate-50">
                <svg className="w-5 h-5 text-slate-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                <input type="text" placeholder="Search address (Google Maps)" className="bg-transparent w-full outline-none text-sm" readOnly />
              </div>
            </div>

            <div className="tour-payments">
              <label className="block text-sm font-medium text-slate-700 mb-1">Payment Method</label>
              <div className="flex items-center justify-between border border-slate-300 rounded-lg p-3 bg-slate-50">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-blue-600 font-bold text-xs">MP</span>
                  </div>
                  <span className="font-medium text-slate-800 text-sm">Mercado Pago</span>
                </div>
                <div className="w-4 h-4 rounded-full border-2 border-purple-600 flex items-center justify-center">
                  <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Joyride
        steps={steps}
        run={run}
        continuous
        onEvent={handleJoyrideCallback}
        options={{
          primaryColor: '#9333ea', // purple-600
          textColor: '#334155', // slate-700
          backgroundColor: '#ffffff',
          overlayColor: 'rgba(0, 0, 0, 0.6)',
          zIndex: 10000,
          showProgress: true,
          buttons: ['back', 'close', 'primary', 'skip'],
        }}
        styles={{
          buttonSkip: {
            color: '#64748b', // slate-500
          },
          buttonPrimary: {
            backgroundColor: '#9333ea',
          },
          buttonBack: {
            color: '#9333ea',
          }
        }}
      />
    </>
  );
};

export default OnboardingTour;
