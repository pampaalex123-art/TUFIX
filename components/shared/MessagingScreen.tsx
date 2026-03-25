// FIX: Replaced placeholder content with a functional MessagingScreen component.
import React, { useState, useRef, useEffect } from 'react';
import { User, Worker, Message, Invoice } from '../../types';
import { formatDistanceToNow } from '../../utils/time';
import PaymentModal from './PaymentModal';
import ReceiptModal from './ReceiptModal';
import InvoiceCard from './InvoiceCard';

interface MessagingScreenProps {
  currentUser: User | Worker;
  otherParticipant: User | Worker;
  messages: Message[];
  invoices: Invoice[];
  onSendMessage: (receiverId: string, content: { text?: string; imageUrl?: string; }) => void;
  onPayInvoice: (invoiceId: string) => void;
  onMarkAsRead: (otherParticipantId: string) => void;
  onViewProfile?: (participant: User | Worker) => void;
  onBack: () => void;
  isReadOnly?: boolean;
  t: (key: string) => string;
}

const MessagingScreen: React.FC<MessagingScreenProps> = ({ currentUser, otherParticipant, messages, invoices, onSendMessage, onPayInvoice, onMarkAsRead, onViewProfile, onBack, isReadOnly = false, t }) => {
  const [newMessage, setNewMessage] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
  const [isReceiptModalOpen, setReceiptModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isCurrentUserWorker = 'service' in currentUser;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      onSendMessage(otherParticipant.id, { text: newMessage.trim() });
      setNewMessage('');
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendImage = () => {
    if (imagePreview) {
      onSendMessage(otherParticipant.id, { imageUrl: imagePreview });
      setImagePreview(null);
    }
  };
  
  const handlePay = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setPaymentModalOpen(true);
  };

  const handleConfirmPayment = () => {
    if(selectedInvoice) {
        onPayInvoice(selectedInvoice.id);
    }
    setPaymentModalOpen(false);
    setSelectedInvoice(null);
  };

  const handleViewReceipt = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setReceiptModalOpen(true);
  };

  const renderMessageContent = (message: Message) => {
    if (message.imageUrl) {
        return <img src={message.imageUrl} alt="User upload" className="mt-2 rounded-lg max-w-xs" />;
    }
    if (message.invoiceId) {
        const invoice = invoices.find(inv => inv.id === message.invoiceId);
        if (!invoice) return <div className="italic text-gray-400">{t('invoice not found')}</div>;
        return <InvoiceCard 
                    invoice={invoice} 
                    userType={isCurrentUserWorker ? 'worker' : 'user'}
                    onPay={handlePay}
                    onViewReceipt={handleViewReceipt}
                    t={t}
                />;
    }
    return <p>{message.text}</p>;
  };

  const hasUnreadMessages = messages.some(m => !m.isRead && m.receiverId === currentUser.id);

  return (
    <>
      <div className="container mx-auto max-w-3xl">
         <button onClick={onBack} className="flex items-center text-black hover:text-purple-600 font-semibold mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 mr-2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          {t('back')}
        </button>

        <div className="bg-white rounded-xl shadow-lg flex flex-col" style={{height: 'calc(100vh - 160px)'}}>
          {isReadOnly && (
            <div className="bg-yellow-100 text-yellow-800 text-sm font-semibold p-2 text-center flex items-center justify-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
              <span>{t('viewing as admin')}</span>
            </div>
          )}
          {/* Header */}
          <div className="flex items-center p-4 border-b">
            <div 
              className={`flex items-center ${onViewProfile ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
              onClick={() => onViewProfile && onViewProfile(otherParticipant)}
            >
              <img className="w-10 h-10 rounded-full object-cover mr-4" src={otherParticipant.avatarUrl} alt={otherParticipant.name} />
              <div>
                <h2 className="text-xl font-bold text-black">{otherParticipant.name}</h2>
                {isReadOnly && <p className="text-xs text-black">{t('in conversation with', { name: currentUser.name })}</p>}
              </div>
            </div>
            {!isReadOnly && hasUnreadMessages && (
                <button 
                    onClick={() => onMarkAsRead(otherParticipant.id)} 
                    className="ml-auto text-sm font-semibold text-purple-600 hover:underline focus:outline-none"
                >
                    {t('mark_all_as_read')}
                </button>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-4">
              {messages.sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()).map(message => {
                const isCurrentUserSender = message.senderId === currentUser.id;
                const isMessageFromAdmin = isCurrentUserSender 
                  ? currentUser.userType === 'admin' 
                  : otherParticipant.userType === 'admin';

                return (
                  <div key={message.id} className={`flex items-end gap-2 ${isCurrentUserSender ? 'justify-end' : 'justify-start'}`}>
                    {!isCurrentUserSender && <img src={otherParticipant.avatarUrl} className="w-6 h-6 rounded-full" alt="" />}
                    <div className={`max-w-md p-3 rounded-lg ${isMessageFromAdmin ? 'bg-purple-600 text-white' : 'bg-slate-200 text-black'}`}>
                      {renderMessageContent(message)}
                      <p className={`text-xs mt-1 ${isMessageFromAdmin ? 'text-purple-200' : 'text-slate-500'}`}>
                        {formatDistanceToNow(message.timestamp, t)}
                      </p>
                    </div>
                     {isCurrentUserSender && <img src={currentUser.avatarUrl} className="w-6 h-6 rounded-full" alt="" />}
                  </div>
                );
              })}
            </div>
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          {!isReadOnly && (
            <div className="p-4 border-t">
              {imagePreview ? (
                  <div className="flex items-center space-x-3 mb-2">
                      <img src={imagePreview} alt="preview" className="w-20 h-20 object-cover rounded-lg" />
                      <div className="flex-grow">
                          <p className="text-sm text-black">{t('image selected ready to send')}</p>
                          <div className="flex space-x-2 mt-2">
                            <button onClick={handleSendImage} className="bg-purple-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-purple-700 transition text-sm">{t('send image')}</button>
                            <button onClick={() => setImagePreview(null)} className="bg-slate-200 text-black font-bold py-2 px-4 rounded-lg hover:bg-slate-300 transition text-sm">{t('cancel')}</button>
                          </div>
                      </div>
                  </div>
              ) : (
                  <form onSubmit={handleTextSubmit} className="flex items-center space-x-2">
                    <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" />
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-black hover:text-purple-600 rounded-full hover:bg-slate-100 transition">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    </button>
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={t('ask placeholder')}
                      className="flex-1 p-3 border border-slate-300 rounded-full focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition bg-white text-black placeholder-slate-400"
                    />
                    <button type="submit" className="bg-purple-600 text-white font-bold p-3 rounded-full hover:bg-purple-700 transition flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" transform="rotate(-45 12 12) translate(-2 -2)" /></svg>
                    </button>
                  </form>
              )}
            </div>
          )}
        </div>
      </div>
      
      {isPaymentModalOpen && selectedInvoice && (
        <PaymentModal
            invoice={selectedInvoice}
            onClose={() => { setPaymentModalOpen(false); setSelectedInvoice(null); }}
            onConfirm={handleConfirmPayment}
// FIX: The 't' prop was missing and is required by the PaymentModal component.
            t={t}
        />
      )}
      
      {isReceiptModalOpen && selectedInvoice && (
        <ReceiptModal
            invoice={selectedInvoice}
            clientName={isCurrentUserWorker ? otherParticipant.name : currentUser.name}
            workerName={isCurrentUserWorker ? currentUser.name : otherParticipant.name}
            onClose={() => { setReceiptModalOpen(false); setSelectedInvoice(null); }}
            t={t}
        />
      )}
    </>
  );
};

export default MessagingScreen;