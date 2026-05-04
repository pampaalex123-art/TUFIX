import React, { useState } from 'react';

interface UserIdVerificationModalProps {
  onSubmit: (data: { idFront: string; idBack: string; selfie: string }) => void;
  onClose: () => void;
  t: (key: string) => string;
}

type Step = 'intro' | 'id_front' | 'id_back' | 'selfie' | 'uploading' | 'done';

const UserIdVerificationModal: React.FC<UserIdVerificationModalProps> = ({ onSubmit, onClose }) => {
  const [step, setStep] = useState<Step>('intro');
  const [idFront, setIdFront] = useState<string>('');
  const [idBack, setIdBack] = useState<string>('');
  const [selfie, setSelfie] = useState<string>('');

  const capturePhoto = (setter: (v: string) => void, next: Step) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result as string);
        setStep(next);
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const handleUpload = async () => {
    setStep('uploading');
    await new Promise(res => setTimeout(res, 1800));
    setStep('done');
    setTimeout(() => {
      onSubmit({ idFront, idBack, selfie });
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">

        {step === 'intro' && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-3xl">🪪</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">¡Casi listo! Verificá tu identidad</h2>
            <p className="text-sm text-slate-500">Para completar tu cuenta necesitamos verificar tu identidad.</p>
            <ul className="text-left space-y-2 text-sm text-slate-600 bg-slate-50 p-4 rounded-lg">
              <li className="flex items-center gap-2"><span className="text-purple-500">📷</span> Foto del <strong>frente</strong> de tu DNI/Cédula</li>
              <li className="flex items-center gap-2"><span className="text-purple-500">📷</span> Foto del <strong>dorso</strong> de tu DNI/Cédula</li>
              <li className="flex items-center gap-2"><span className="text-purple-500">🤳</span> Una <strong>selfie</strong> tuya</li>
            </ul>
            <button onClick={() => setStep('id_front')} className="w-full bg-purple-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-purple-700 transition">
              Comenzar verificación
            </button>
            <button onClick={onClose} className="w-full text-slate-400 text-sm hover:text-slate-600 transition">Hacerlo más tarde</button>
          </div>
        )}

        {step === 'id_front' && (
          <div className="text-center space-y-5">
            <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-3xl">🪪</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">Foto del frente de tu DNI</h2>
            <p className="text-sm text-slate-500">Asegurate que el documento esté bien iluminado y los datos sean legibles.</p>
            {idFront ? (
              <div>
                <img src={idFront} alt="ID Front" className="w-full rounded-lg mb-3 border-2 border-green-400" />
                <button onClick={() => setStep('id_back')} className="w-full bg-green-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-green-700 transition">✓ Continuar al dorso</button>
                <button onClick={() => setIdFront('')} className="w-full mt-2 text-slate-400 text-sm hover:text-slate-600">Volver a sacar la foto</button>
              </div>
            ) : (
              <button onClick={() => capturePhoto(setIdFront, 'id_back')} className="w-full border-2 border-dashed border-purple-300 bg-purple-50 text-purple-700 font-bold py-8 rounded-xl hover:border-purple-500 flex flex-col items-center gap-2">
                <span className="text-4xl">📷</span>
                <span>Sacar foto del frente</span>
              </button>
            )}
          </div>
        )}

        {step === 'id_back' && (
          <div className="text-center space-y-5">
            <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-3xl">🪪</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">Foto del dorso de tu DNI</h2>
            <p className="text-sm text-slate-500">Girá el documento y tomá una foto del dorso.</p>
            {idBack ? (
              <div>
                <img src={idBack} alt="ID Back" className="w-full rounded-lg mb-3 border-2 border-green-400" />
                <button onClick={() => setStep('selfie')} className="w-full bg-green-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-green-700 transition">✓ Continuar a la selfie</button>
                <button onClick={() => setIdBack('')} className="w-full mt-2 text-slate-400 text-sm hover:text-slate-600">Volver a sacar la foto</button>
              </div>
            ) : (
              <button onClick={() => capturePhoto(setIdBack, 'selfie')} className="w-full border-2 border-dashed border-purple-300 bg-purple-50 text-purple-700 font-bold py-8 rounded-xl hover:border-purple-500 flex flex-col items-center gap-2">
                <span className="text-4xl">📷</span>
                <span>Sacar foto del dorso</span>
              </button>
            )}
          </div>
        )}

        {step === 'selfie' && (
          <div className="text-center space-y-5">
            <div className="w-16 h-16 mx-auto bg-pink-100 rounded-full flex items-center justify-center">
              <span className="text-3xl">🤳</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">Ahora una selfie</h2>
            <p className="text-sm text-slate-500">Mirá a la cámara y asegurate de que tu cara esté bien iluminada.</p>
            {selfie ? (
              <div>
                <img src={selfie} alt="Selfie" className="w-full rounded-lg mb-3 border-2 border-green-400" />
                <button onClick={handleUpload} className="w-full bg-purple-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-purple-700 transition">Subir y finalizar</button>
                <button onClick={() => setSelfie('')} className="w-full mt-2 text-slate-400 text-sm hover:text-slate-600">Volver a sacar la selfie</button>
              </div>
            ) : (
              <button onClick={() => capturePhoto(setSelfie, 'selfie')} className="w-full border-2 border-dashed border-pink-300 bg-pink-50 text-pink-700 font-bold py-8 rounded-xl hover:border-pink-500 flex flex-col items-center gap-2">
                <span className="text-4xl">🤳</span>
                <span>Sacar selfie</span>
              </button>
            )}
          </div>
        )}

        {step === 'uploading' && (
          <div className="text-center space-y-5 py-8">
            <div className="w-16 h-16 mx-auto bg-purple-100 rounded-full flex items-center justify-center animate-pulse">
              <span className="text-3xl">⬆️</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">Subiendo documentos...</h2>
            <p className="text-sm text-slate-500">Estamos procesando tu información de forma segura.</p>
          </div>
        )}

        {step === 'done' && (
          <div className="text-center space-y-5 py-4">
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-3xl">✅</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">¡Documentos enviados!</h2>
            <p className="text-sm text-slate-500">Tus documentos están siendo revisados. Te notificaremos cuando tu cuenta esté aprobada.</p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-xs text-yellow-700">⏳ Tu perfil está en revisión. Podés explorar la app mientras esperás.</p>
            </div>
          </div>
        )}

        {!['intro', 'uploading', 'done'].includes(step) && (
          <div className="flex justify-center gap-2 mt-6">
            {(['id_front', 'id_back', 'selfie'] as const).map(s => (
              <div key={s} className={`h-2 rounded-full transition-all ${step === s ? 'w-5 bg-purple-600' : 'w-2 bg-slate-300'}`} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserIdVerificationModal;