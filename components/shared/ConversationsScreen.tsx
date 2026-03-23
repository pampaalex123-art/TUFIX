// FIX: Replaced placeholder content with a functional ConversationsScreen component.
import React from 'react';
import { User, Worker, Conversation } from '../../types';
import { formatDistanceToNow } from '../../utils/time';

interface ConversationsScreenProps {
  currentUser: User | Worker;
  conversations: Conversation[];
  onSelectConversation: (conversation: Conversation) => void;
  onBack: () => void;
  t: (key: string) => string;
}

const ConversationsScreen: React.FC<ConversationsScreenProps> = ({ currentUser, conversations, onSelectConversation, onBack, t }) => {
  return (
    <div className="container mx-auto max-3xl">
      <button onClick={onBack} className="flex items-center text-black hover:text-purple-600 font-semibold mb-4 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 mr-2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        {t('back_to_dashboard')}
      </button>

      <div className="bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
        <div className="p-4 border-b border-slate-200">
            <h1 className="text-2xl font-bold text-black">{t('my_conversations')}</h1>
        </div>
        <div className="divide-y divide-slate-200">
          {conversations.length === 0 ? (
            <p className="p-6 text-black text-center">{t('no_conversations')}</p>
          ) : (
            conversations
              .sort((a, b) => new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime())
              .map(conv => {
                const otherParticipant = conv.participantA.id === currentUser.id ? conv.participantB : conv.participantA;
                const isUnread = !conv.lastMessage.isRead && conv.lastMessage.receiverId === currentUser.id;
                
                return (
                  <button 
                    key={conv.id} 
                    onClick={() => onSelectConversation(conv)}
                    className={`w-full text-left p-4 flex items-center space-x-4 hover:bg-slate-50 transition ${isUnread ? 'bg-purple-50' : ''}`}
                  >
                    <img className="w-12 h-12 rounded-full object-cover" src={otherParticipant.avatarUrl} alt={otherParticipant.name} />
                    <div className="flex-1">
                      <div className="flex justify-between items-baseline">
                        <p className={`font-bold text-black ${isUnread ? 'font-extrabold' : ''}`}>{otherParticipant.name}</p>
                        <span className="text-xs text-black">{formatDistanceToNow(conv.lastMessage.timestamp, t)}</span>
                      </div>
                      <p className={`text-sm text-black truncate ${isUnread ? 'font-semibold' : ''}`}>
                         {conv.lastMessage.senderId === currentUser.id && t('you_prefix')}
                         {conv.lastMessage.text}
                      </p>
                    </div>
                     {isUnread && <div className="w-3 h-3 rounded-full bg-purple-500 flex-shrink-0"></div>}
                  </button>
                )
              })
          )}
        </div>
      </div>
    </div>
  );
};

export default ConversationsScreen;