import React, { useState, useEffect } from 'react';
import { User, Worker, UserType } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { UserCircle, Briefcase, MessageSquare, Bell, DollarSign, CheckCircle, ChevronRight, ChevronLeft } from 'lucide-react';

interface MenuOnboardingTourProps {
  currentUser: User | Worker | null;
  userType: UserType | null;
  onComplete: () => void;
}

const MenuOnboardingTour: React.FC<MenuOnboardingTourProps> = ({ currentUser, userType, onComplete }) => {
  const [run, setRun] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Run if they completed the first onboarding but haven't completed this one
    if (currentUser && currentUser.has_completed_onboarding === true && 
        (currentUser.has_completed_menu_onboarding === undefined || currentUser.has_completed_menu_onboarding === false)) {
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

  // Base steps for everyone
  const baseSteps = [
    {
      title: 'Tu Perfil',
      description: 'Aquí puedes actualizar tu información, foto y ver tus reseñas. ¡Un perfil completo genera más confianza!',
      icon: <UserCircle size={48} strokeWidth={1.5} />,
      color: 'bg-white/40 text-purple-700 border border-white/50 shadow-lg'
    }
  ];

  // Worker specific steps
  const workerSteps = [
    {
      title: 'Trabajos Disponibles',
      description: 'Explora las solicitudes de trabajo de los usuarios en tu área y postúlate a las que mejor se adapten a tus habilidades.',
      icon: <Briefcase size={48} strokeWidth={1.5} />,
      color: 'bg-white/40 text-blue-700 border border-white/50 shadow-lg'
    },
    {
      title: 'Tus Ganancias',
      description: 'Lleva un control detallado de todos tus ingresos y retira tu dinero de forma segura cuando lo necesites.',
      icon: <DollarSign size={48} strokeWidth={1.5} />,
      color: 'bg-white/40 text-emerald-700 border border-white/50 shadow-lg'
    }
  ];

  // User specific steps
  const userSteps = [
    {
      title: 'Mis Trabajos',
      description: 'Aquí verás el estado de los servicios que has solicitado, desde la búsqueda hasta la finalización.',
      icon: <Briefcase size={48} strokeWidth={1.5} />,
      color: 'bg-white/40 text-blue-700 border border-white/50 shadow-lg'
    },
    {
      title: 'Trabajadores',
      description: 'Encuentra a los mejores profesionales cerca de ti, revisa sus perfiles y contrátalos directamente.',
      icon: <UserCircle size={48} strokeWidth={1.5} />,
      color: 'bg-white/40 text-emerald-700 border border-white/50 shadow-lg'
    }
  ];

  // Common steps at the end
  const endSteps = [
    {
      title: 'Mensajes',
      description: 'Comunícate directamente con los usuarios o trabajadores. Coordina detalles, envía fotos y resuelve dudas.',
      icon: <MessageSquare size={48} strokeWidth={1.5} />,
      color: 'bg-white/40 text-orange-700 border border-white/50 shadow-lg'
    },
    {
      title: 'Notificaciones',
      description: 'Mantente al tanto de todo. Recibirás alertas sobre nuevos mensajes, actualizaciones de trabajos y más.',
      icon: <Bell size={48} strokeWidth={1.5} />,
      color: 'bg-white/40 text-rose-700 border border-white/50 shadow-lg'
    }
  ];

  const steps = [
    ...baseSteps,
    ...(userType === 'worker' ? workerSteps : []),
    ...(userType === 'user' ? userSteps : []),
    ...endSteps
  ];

  if (!run) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="bg-white/70 backdrop-blur-2xl border border-white/60 shadow-[0_8px_32px_0_rgba(0,0,0,0.1)] rounded-3xl w-full max-w-md overflow-hidden flex flex-col relative"
        >
          {/* Decorative background glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-400/30 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-400/30 rounded-full blur-3xl pointer-events-none"></div>

          {/* Progress Bar */}
          <div className="w-full h-1.5 bg-white/50 relative z-10">
            <motion.div 
              className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
              initial={{ width: `${(currentStep / steps.length) * 100}%` }}
              animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            />
          </div>

          <div className="p-8 flex flex-col items-center text-center relative z-10">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className={`w-28 h-28 rounded-full flex items-center justify-center mb-8 backdrop-blur-md ${steps[currentStep].color}`}
            >
              {steps[currentStep].icon}
            </motion.div>
            
            <motion.h2 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="text-2xl font-extrabold text-slate-800 mb-4 tracking-tight"
            >
              {steps[currentStep].title}
            </motion.h2>
            
            <motion.p 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.3 }}
              className="text-slate-600 leading-relaxed mb-10 text-[15px]"
            >
              {steps[currentStep].description}
            </motion.p>

            <motion.div 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.3 }}
              className="w-full flex items-center justify-between mt-auto"
            >
              <button
                onClick={handleComplete}
                className="text-slate-500 hover:text-slate-800 font-semibold text-sm transition-colors px-2 py-1"
              >
                Omitir
              </button>
              
              <div className="flex items-center space-x-3">
                {currentStep > 0 && (
                  <button
                    onClick={prevStep}
                    className="p-3 rounded-full bg-white/50 hover:bg-white/80 border border-white/60 text-slate-700 transition-all shadow-sm"
                  >
                    <ChevronLeft size={20} strokeWidth={2.5} />
                  </button>
                )}
                <button
                  onClick={nextStep}
                  className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white px-7 py-3 rounded-full font-semibold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  <span>{currentStep === steps.length - 1 ? '¡Listo!' : 'Siguiente'}</span>
                  {currentStep === steps.length - 1 ? <CheckCircle size={18} strokeWidth={2.5} /> : <ChevronRight size={18} strokeWidth={2.5} />}
                </button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default MenuOnboardingTour;
