'use client';

import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface IConversation {
  _id: string;
  contact: {
    _id: string;
    name: string;
  };
  lastMessage: string;
  channel: string;
  updatedAt: string;
}

interface SidebarProps {
  onSelectConversation: (roomId: string) => void;
  selectedRoomId: string | null;
}

export default function Sidebar({ onSelectConversation, selectedRoomId }: SidebarProps) {
  const [conversations, setConversations] = useState<IConversation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    const fetchConversations = async () => {
      setLoading(true);
      try {
        const response = await fetch('http://localhost:3000/chat/conversations', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Failed to fetch conversations');
        const data = await response.json();
        const formattedData = data.map((conv: any) => ({
          ...conv,
          lastMessage: conv.lastMessage || 'No messages yet...',
        })).sort((a: IConversation, b: IConversation) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        setConversations(formattedData);
      } catch (err: any) { 
        setError(err.message); 
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [token]);

  return (
    <div className="w-80 bg-japifon-gray-light border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-japifon-dark-blue">Japifon</h1>
          <p className="text-sm text-japifon-gray-mid">ChatHub</p>
        </div>
        <Link href="/conversations/create" className="p-2 rounded-full bg-japifon-blue text-white hover:bg-japifon-dark-blue" title="Start new conversation">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading && <p className="p-4 text-center text-gray-500">Loading conversations...</p>}
        {!loading && error && <p className="p-4 text-center text-red-500">Error: {error}</p>}
        {!loading && !error && conversations.length === 0 && (
          <div className="p-4 text-center text-gray-500">
            <p className="mb-2">No conversations found.</p>
            <Link href="/conversations/create" className="text-japifon-blue hover:underline font-semibold">
              Create one to get started!
            </Link>
          </div>
        )}
        {!loading && !error && conversations.length > 0 && (
          <ul>
            {conversations.map((conv) => (
              <li 
                key={conv._id}
                className={`border-b border-gray-200 cursor-pointer ${selectedRoomId === conv._id ? 'bg-japifon-blue/10' : ''}`}
                onClick={() => onSelectConversation(conv._id)}
              >
                <div className="block p-4 hover:bg-gray-50">
                  <div className="flex justify-between">
                    <span className="font-bold text-japifon-dark-blue">{conv.contact.name}</span>
                    <span className="text-xs text-gray-500 capitalize">{conv.channel}</span>
                  </div>
                  <p className="text-sm text-gray-600 truncate">{conv.lastMessage}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}