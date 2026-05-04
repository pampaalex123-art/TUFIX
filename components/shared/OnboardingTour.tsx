import React, { useState, useEffect } from 'react';

interface OnboardingTourProps {
  currentUser: any;
  userType: string | null;
  onComplete: () => void;
}

const USER_STEPS = [
  { id: 'welcome', title: '¡Bienvenido a TUFIX! 🎉', description: 'Te mostramos cómo funciona la app en unos pocos pasos. Tocá Siguiente para continuar.', emoji: '👋', menuItem: null },
  { id: 'home', title: 'Inicio — Buscá tu servicio', description: 'Desde acá buscás trabajadores cercanos. Seleccioná una categoría o usá la búsqueda.', emoji: '🔍', menuItem: 0 },
  { id: 'jobs', title: 'Mis Trabajos', description: 'Acá ves todos tus trabajos activos e historial en tiempo real.', emoji: '📋', menuItem: 1 },
  { id: 'messages', title: 'Mensajes', description: 'Chateá con tus trabajadores. Coordiná horarios y mandá fotos.', emoji: '💬', menuItem: 2 },
  { id: 'profile', title: 'Tu Perfil', description: 'Completá tu perfil para que los trabajadores te conozcan mejor.', emoji: '👤', menuItem: 3 },
  { id: 'done', title: '¡Listo para empezar!', description: 'Buscá tu primer trabajador y comenzá a usar TUFIX.', emoji: '🚀', menuItem: null },
];

const WORKER_STEPS = [
  { id: 'welcome', title: '¡Bienvenido a TUFIX! 🎉', description: 'Te mostramos las herramientas para gestionar tu trabajo profesional.', emoji: '👷', menuItem: null },
  { id: 'dashboard', title: 'Trabajos — Tu centro de operaciones', description: 'Acá ves solicitudes nuevas, trabajos activos e historial.', emoji: '🔧', menuItem: 0 },
  { id: 'earnings', title: 'Ganancias', description: 'Seguí tus ingresos en tiempo real. Ves cuánto ganaste y el valor promedio.', emoji: '💰', menuItem: 1 },
  { id: 'messages', title: 'Mensajes', description: 'Comunicáte con clientes. Coordiná detalles y confirmá trabajos.', emoji: '💬', menuItem: 2 },
  { id: 'profile', title: 'Tu Perfil Profesional', description: 'Completá tu perfil al 100% para aparecer más arriba en búsquedas.', emoji: '⭐', menuItem: 3 },
  { id: 'done', title: '¡Todo listo! Ya podés recibir trabajos', description: 'Tu perfil está activo. Los clientes en tu zona podrán encontrarte.', emoji: '🎯', menuItem: null },
];

const OnboardingTour: React.FC<OnboardingTourProps> = ({ currentUser, userType, onComplete }) => {
  const [run, setRun] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [highlight, setHighlight] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

  const steps = userType === 'worker' ? WORKER_STEPS : USER_STEPS;

  useEffect(() => {
    if (localStorage.getItem('tufix_onboarding_done') === 'true') return;
    if (currentUser && (currentUser.has_completed_onboarding === false || currentUser.has_completed_onboarding === undefined)) {
      setTimeout(() => setRun(true), 900);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!run) return;
    const step = steps[currentStep];
    if (step.menuItem !== null && step.menuItem !== undefined) {
      setTimeout(() => {
        const navButtons = document.querySelectorAll('nav button');
        const el = navButtons[step.menuItem!] as HTMLElement;
        if (el) {
          const rect = el.getBoundingClientRect();
          setHighlight({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
        } else {
          setHighlight(null);
        }
      }, 200);
    } else {
      setHighlight(null);
    }
  }, [currentStep, run]);

  const handleComplete = () => {
    setRun(false);
    localStorage.setItem('tufix_onboarding_done', 'true');
    onComplete();
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) setCurrentStep(s => s + 1);
    else handleComplete();
  };

  const prevStep = () => { if (currentStep > 0) setCurrentStep(s => s - 1); };

  if (!run) return null;

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;
  const progress = ((currentStep + 1) / steps.length) * 100;

  const cardBottom = highlight ? highlight.height + 90 : 130;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', pointerEvents: 'auto' }} onClick={nextStep} />

      {highlight && (
        <div style={{
          position: 'fixed',
          top: highlight.top - 5,
          left: highlight.left - 5,
          width: highlight.width + 10,
          height: highlight.height + 10,
          borderRadius: 14,
          outline: '3px solid #a855f7',
          outlineOffset: 3,
          boxShadow: '0 0 0 4px rgba(168,85,247,0.4)',
          zIndex: 10001,
          pointerEvents: 'none',
        }} />
      )}

      <div style={{
        position: 'fixed',
        ...(step.menuItem !== null && highlight
          ? { bottom: cardBottom, left: '50%', transform: 'translateX(-50%)' }
          : { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }),
        width: 'min(360px, 90vw)',
        zIndex: 10000,
        pointerEvents: 'auto',
      }}>
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="w-full h-1.5 bg-slate-100">
            <div className="h-full bg-gradient-to-r from-pink-500 to-purple-600 transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-4xl">{step.emoji}</span>
              <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">{currentStep + 1} / {steps.length}</span>
            </div>
            <h2 className="text-lg font-extrabold text-slate-900 mb-2">{step.title}</h2>
            <p className="text-sm text-slate-500 leading-relaxed mb-4">{step.description}</p>
            {step.menuItem !== null && highlight && (
              <div className="flex items-center gap-2 mb-4 text-purple-600 font-bold text-sm">
                <span className="animate-bounce inline-block">👇</span> Tocá este botón para explorar
              </div>
            )}
            <div className="flex items-center justify-between">
              <button onClick={handleComplete} className="text-slate-400 hover:text-slate-600 text-sm font-medium">Omitir</button>
              <div className="flex items-center gap-2">
                {currentStep > 0 && (
                  <button onClick={prevStep} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition">← Atrás</button>
                )}
                <button onClick={nextStep} className="px-5 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white text-sm font-bold hover:opacity-90 transition shadow-md">
                  {isLast ? '¡Empezar! 🚀' : 'Siguiente →'}
                </button>
              </div>
            </div>
          </div>
          <div className="flex justify-center gap-1.5 pb-4">
            {steps.map((_, i) => (
              <button key={i} onClick={() => setCurrentStep(i)} className={`rounded-full transition-all duration-300 ${i === currentStep ? 'w-5 h-2 bg-purple-600' : 'w-2 h-2 bg-slate-300'}`} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingTour;