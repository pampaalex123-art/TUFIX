import React, { useState, useRef, useCallback, useEffect } from 'react';
import Spinner from '../common/Spinner';
import { motion } from 'motion/react';
import PhoneVerificationScreen from '../new/PhoneVerificationScreen';

interface WorkerVerificationScreenProps {
    workerId: string;
    phoneNumber: string;
    onSubmit: (workerId: string, idPhotoUrl: string, selfiePhotoUrl: string) => void;
    onBack: () => void;
    t: (key: string, replacements?: Record<string, string | number>) => string;
}

const WorkerVerificationScreen: React.FC<WorkerVerificationScreenProps> = ({ workerId, phoneNumber, onSubmit, onBack, t }) => {
    const [step, setStep] = useState<'id' | 'selfie' | 'phone'>('id');
    const [idPhoto, setIdPhoto] = useState<string | null>(null);
    const [selfie, setSelfie] = useState<string | null>(null);
    const [verificationCode, setVerificationCode] = useState<string | null>(null);
    const [phoneError, setPhoneError] = useState('');
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const idInputRef = useRef<HTMLInputElement>(null);

    const handleIdUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setIdPhoto(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    // Effect to manage getting and cleaning up the camera stream
    useEffect(() => {
        let active = true;

        if (step === 'selfie' && !selfie) {
            setError('');
            navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
                .then(mediaStream => {
                    if (active) {
                        setStream(mediaStream);
                    } else {
                        // Cleanup if component unmounted while waiting for stream
                        mediaStream.getTracks().forEach(track => track.stop());
                    }
                })
                .catch(err => {
                    console.error("Camera error:", err);
                    if (active) {
                        setError(t('camera access error'));
                    }
                });
        }

        // Cleanup function for when dependencies change or component unmounts
        return () => {
            active = false;
            setStream(prevStream => {
                if (prevStream) {
                    prevStream.getTracks().forEach(track => track.stop());
                }
                return null;
            });
        };
    }, [step, selfie]);

    // Effect to attach the stream to the video element once both are available
    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    const takeSelfie = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            const dataUrl = canvas.toDataURL('image/jpeg');
            setSelfie(dataUrl);
            // The cleanup effect will now handle stopping the camera automatically
        }
    };

    const retakeSelfie = () => {
        setSelfie(null);
    };

    const handleSelfieSubmit = async () => {
        if (idPhoto && selfie) {
            const code = Math.floor(1000 + Math.random() * 9000).toString();
            setVerificationCode(code);
            
            try {
                const response = await fetch('/api/send-otp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phoneNumber, code }),
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || t('failed to send verification code'));
                }

                setStep('phone');
            } catch (err: any) {
                console.error('SMS Error:', err);
                setPhoneError(t('sms error', { error: err.message }));
                // Fallback for demo purposes if not configured
                setTimeout(() => alert(`DEMO: TUFIX Verification Code: ${code}`), 500);
                setStep('phone');
            }
        }
    };

    const handlePhoneVerify = (code: string) => {
        if (code === verificationCode) {
            handleSubmit();
        } else {
            setPhoneError(t('invalid verification code'));
        }
    };
    
    const handleSubmit = async () => {
        if (idPhoto && selfie) {
            setIsSubmitting(true);
            try {
                await onSubmit(workerId, idPhoto, selfie);
            } finally {
                setIsSubmitting(false);
            }
        } else {
            alert(t('please complete all verification steps'));
        }
    };

    return (
        <div className="flex items-center justify-center p-4 min-h-[80vh]">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-lg w-full bg-white border border-slate-200 rounded-2xl shadow-xl p-6 md:p-8"
            >
                {step !== 'phone' && (
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold mb-2">
                            <span className="bg-gradient-to-br from-yellow-300 via-pink-500 to-purple-700 text-transparent bg-clip-text">
                                {t('identity verification')}
                            </span>
                        </h1>
                        <p className="text-slate-600 text-sm">{t('identity verification subtitle')}</p>
                    </div>
                )}

                {/* Step 1: ID Upload */}
                <div className={`${step === 'id' ? 'block' : 'hidden'}`}>
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                        <span className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center mr-3 text-sm">1</span>
                        {t('upload id photo')}
                    </h2>
                    <input type="file" accept="image/*" onChange={handleIdUpload} ref={idInputRef} className="hidden" />
                    <button 
                        onClick={() => idInputRef.current?.click()} 
                        className="w-full h-56 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 hover:border-purple-300 transition-all overflow-hidden bg-slate-50/50"
                    >
                        {idPhoto ? (
                            <img src={idPhoto} alt="ID Preview" className="h-full w-full object-contain p-2" />
                        ) : (
                            <div className="flex flex-col items-center p-4">
                                <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 border border-slate-100">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                                <span className="text-sm font-medium text-slate-600">{t('click to upload id')}</span>
                                <span className="text-xs text-slate-400 mt-1">{t('supported formats')}</span>
                            </div>
                        )}
                    </button>
                    {idPhoto && (
                        <motion.button 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            onClick={() => setStep('selfie')} 
                            className="w-full mt-6 bg-purple-600 text-white font-bold py-4 px-4 rounded-xl hover:bg-purple-700 shadow-md transition-all"
                        >
                            {t('next step selfie')}
                        </motion.button>
                    )}
                </div>
                
                {/* Step 2: Selfie */}
                <div className={`${step === 'selfie' ? 'block' : 'hidden'}`}>
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                        <span className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center mr-3 text-sm">2</span>
                        {t('take a selfie')}
                    </h2>
                    <div className="w-full aspect-square bg-slate-100 rounded-2xl flex items-center justify-center overflow-hidden relative border border-slate-200 shadow-inner">
                       {selfie ? (
                           <img src={selfie} alt="Selfie Preview" className="w-full h-full object-cover" />
                       ) : stream ? (
                           <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover transform -scale-x-100"></video>
                       ) : (
                            <div className="text-center text-slate-500 p-6">
                                {error ? (
                                    <div className="flex flex-col items-center">
                                        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-3">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                        </div>
                                        <p className="text-sm text-red-600 font-medium">{error}</p>
                                    </div>
                                ) : <Spinner />}
                            </div>
                       )}
                       <canvas ref={canvasRef} className="hidden"></canvas>
                    </div>
                     <div className="mt-6 flex gap-3">
                        {selfie ? (
                            <>
                                <button onClick={retakeSelfie} className="flex-1 bg-slate-100 text-slate-700 font-bold py-4 px-4 rounded-xl hover:bg-slate-200 transition-all">{t('retake')}</button>
                                <button 
                                    onClick={handleSelfieSubmit} 
                                    disabled={isSubmitting}
                                    className="flex-1 bg-purple-600 text-white font-bold py-4 px-4 rounded-xl hover:bg-purple-700 shadow-md transition-all flex justify-center items-center"
                                >
                                    {t('next step phone')}
                                </button>
                            </>
                        ) : (
                            <button 
                                onClick={takeSelfie} 
                                disabled={!stream} 
                                className="w-full bg-purple-600 text-white font-bold py-4 px-4 rounded-xl hover:bg-purple-700 disabled:bg-slate-300 disabled:cursor-not-allowed shadow-md transition-all"
                            >
                                {t('take photo')}
                            </button>
                        )}
                     </div>
                </div>

                {/* Step 3: Phone Verification */}
                <div className={`${step === 'phone' ? 'block' : 'hidden'}`}>
                    <PhoneVerificationScreen 
                        phoneNumber={phoneNumber}
                        onVerify={handlePhoneVerify}
                        onBack={() => setStep('selfie')}
                        error={phoneError}
                        t={t}
                    />
                    {isSubmitting && (
                        <div className="mt-4 flex justify-center">
                            <Spinner />
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default WorkerVerificationScreen;

