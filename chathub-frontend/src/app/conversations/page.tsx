'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface Conversation {
  _id: string;
  channel: string;
  contact: {
    _id: string;
    name: string;
  };
  messages: any[];
}

export default function ConversationsPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchConversations = async () => {
      try {
        const response = await fetch('http://localhost:3000/chat/conversations', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch conversations');
        }

        const data = await response.json();
        setConversations(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversations();
  }, [token, router]);

  const handleJoinConversation = (conversationId: string) => {
    router.push(`/chat/${conversationId}`);
  };

  if (isLoading) {
    return <div className="text-center p-8">Loading conversations...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-japifon-dark-blue">Conversations</h1>
        <button 
          className="px-4 py-2 rounded-md bg-japifon-blue text-white font-semibold hover:bg-japifon-dark-blue"
          onClick={() => router.push('/conversations/create')}
        >
          Create Conversation
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {conversations.map(conv => (
          <div key={conv._id} className="p-4 bg-white rounded-lg shadow-md flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-bold text-japifon-dark-blue">{conv.contact.name}</h2>
              <p className="text-japifon-gray-mid mt-2">Channel: {conv.channel}</p>
              <p className="text-sm text-gray-500 mt-2">Messages: {conv.messages.length}</p>
            </div>
            <button 
              className="mt-4 px-4 py-2 rounded-md bg-japifon-green text-white font-semibold hover:bg-green-700"
              onClick={() => handleJoinConversation(conv._id)}
            >
              Open Conversation
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}