import React, { useState, useRef, useEffect } from 'react';
import { getAiSupportResponse } from '../../services/geminiService';
import { Content } from '@google/genai';
import { User, Worker, JobRequest, Transaction, UserType } from '../../types';

interface AiSupportBubbleProps {
  t: (key: string) => string;
  onRequestHumanSupport: (chatHistory: Content[]) => void;
  currentUser: User | Worker | null;
  userType: UserType | null;
  jobRequests: JobRequest[];
  transactions: Transaction[];
  workers: Worker[];
  users: User[];
  simple?: boolean;
}

const AiSupportBubble: React.FC<AiSupportBubbleProps> = ({ t, onRequestHumanSupport, currentUser, userType, jobRequests, transactions, workers, users, simple = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Content[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userInput, setUserInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const welcomeMessage = currentUser 
      ? t('ai support welcome') 
      : "¡Hola! Soy tu asistente de IA de TUFIX. Por favor, inicia sesión para que pueda ayudarte con tus trabajos y finanzas. ¿En qué puedo ayudarte hoy?";
    setMessages([{ role: 'model', parts: [{ text: welcomeMessage }] }]);
  }, [currentUser, t]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (e?: React.FormEvent, customInput?: string) => {
    if (e) e.preventDefault();
    const input = customInput || userInput;
    if (!input.trim() || isLoading) return;

    const userMessage: Content = { role: 'user', parts: [{ text: input.trim() }] };
    const newMessages = [...messages, userMessage];
    
    if (!customInput) {
      setMessages(newMessages);
      setUserInput('');
    }
    setIsLoading(true);

    try {
      const aiResponse = await getAiSupportResponse(newMessages, simple ? undefined : currentUser, simple ? undefined : userType, simple ? undefined : jobRequests, simple ? undefined : transactions, simple ? undefined : workers, simple ? undefined : users);

      if (aiResponse.functionCall) {
        if (aiResponse.functionCall === 'requestHumanSupport') {
          const modelMessage: Content = { role: 'model', parts: [{ text: "Te estoy conectando con un agente de soporte. Por favor espera un momento." }] };
          setMessages(prev => [...prev, modelMessage]);
          onRequestHumanSupport([...newMessages, modelMessage]);
          setTimeout(() => setIsOpen(false), 2000);
        } else if (aiResponse.functionCall === 'findWorkers') {
          const { service, minRating, location, maxPrice } = (aiResponse.functionArgs as any) || {};
          let filteredWorkers = workers;
          if (service) filteredWorkers = filteredWorkers.filter(w => w.service === service);
          if (minRating) filteredWorkers = filteredWorkers.filter(w => w.rating >= minRating);
          if (location) filteredWorkers = filteredWorkers.filter(w => w.location.toLowerCase().includes(location.toLowerCase()));
          if (maxPrice) filteredWorkers = filteredWorkers.filter(w => w.avgJobCost.amount <= maxPrice);

          const resultText = filteredWorkers.length > 0 
            ? `He encontrado ${filteredWorkers.length} trabajadores que coinciden con tu búsqueda:\n` + 
              filteredWorkers.slice(0, 3).map(w => `- **${w.name}**: ${t(w.service)} en ${w.location}, Calificación: ${w.rating}, Precio aprox: ${w.avgJobCost.amount} ${w.avgJobCost.currency}`).join('\n')
            : "No encontré trabajadores que coincidan exactamente con esos criterios.";

          const functionResponseMessage: Content = { 
            role: 'model', 
            parts: [{ text: resultText }] 
          };
          setMessages(prev => [...prev, functionResponseMessage]);
        }
      } else {
        const modelMessage: Content = { role: 'model', parts: [{ text: aiResponse.text }] };
        setMessages(prev => [...prev, modelMessage]);
      }
    } catch (error: any) {
      console.error(error);
      const errorText = error.message === "API_KEY_MISSING" 
        ? "Error: La clave de API no está configurada. Por favor, contacta al administrador."
        : t('ai support error');
      const errorMessage: Content = { role: 'model', parts: [{ text: errorText }] };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const bubbleIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  const closeIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );

  return (
    <>
      {/* Chat Window */}
      <div className={`fixed top-24 right-4 z-40 w-[calc(100%-2rem)] max-w-sm h-[60vh] max-h-[500px] bg-black/40 backdrop-blur-2xl border border-white/30 rounded-2xl shadow-2xl flex flex-col transition-all duration-300 ease-in-out ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10 pointer-events-none'}`}>
          <>
            {/* Header */}
            <div className="flex-shrink-0 p-3 flex justify-between items-center border-b border-white/30">
              <h3 className="text-sm font-bold text-white">{t('tufix ai support')}</h3>
            </div>

            {/* Messages */}
            <div className="flex-grow p-3 overflow-y-auto space-y-3">
              {messages.map((msg, index) => (
                <div key={index} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'model' && (
                    <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a6 6 0 00-6 6v3.586l-1.707 1.707A1 1 0 003 15v1a1 1 0 001 1h12a1 1 0 001-1v-1a1 1 0 00-.293-.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" /></svg>
                    </div>
                  )}
                  <div className={`max-w-[85%] p-2 rounded-lg ${msg.role === 'user' ? 'bg-white/20 text-white' : 'bg-white/10 text-gray-200'}`}>
                    <p className="text-xs" dangerouslySetInnerHTML={{ __html: (msg.parts[0].text || '').replace(/\n/g, '<br />') }}></p>
                  </div>
                </div>
              ))}
              {isLoading && (
                 <div className="flex items-end gap-2 justify-start">
                    <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a6 6 0 00-6 6v3.586l-1.707 1.707A1 1 0 003 15v1a1 1 0 001 1h12a1 1 0 001-1v-1a1 1 0 00-.293-.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" /></svg>
                    </div>
                    <div className="max-w-xs p-2 rounded-lg bg-white/10 text-gray-200 flex items-center space-x-1">
                        <span className="h-1.5 w-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="h-1.5 w-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="h-1.5 w-1.5 bg-gray-300 rounded-full animate-bounce"></span>
                    </div>
                 </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Input */}
            <form onSubmit={handleSendMessage} className="flex-shrink-0 p-3 border-t border-white/30 flex items-center space-x-2">
              <input 
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder={t('ask placeholder')}
                className="flex-1 p-2 bg-white/10 border border-white/30 rounded-full text-xs text-white placeholder-gray-400 focus:ring-2 focus:ring-white/50 focus:border-white/50 transition"
                disabled={isLoading}
              />
              <button type="submit" className="bg-purple-600 text-white p-2 rounded-full hover:bg-purple-700 disabled:bg-purple-800" disabled={isLoading || !userInput.trim()}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
              </button>
            </form>
          </>
      </div>

      {/* Bubble Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="fixed top-20 right-4 z-50 w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-700 shadow-2xl flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent focus:ring-white transition-transform hover:scale-110"
        aria-label={isOpen ? t('close ai support chat') : t('open ai support chat')}
      >
        <div className="transition-transform duration-300 ease-in-out" style={{ transform: isOpen ? 'rotate(180deg) scale(0.75)' : 'rotate(0deg)' }}>
            {isOpen ? closeIcon : bubbleIcon}
        </div>
      </button>
    </>
  );
};

export default AiSupportBubble;