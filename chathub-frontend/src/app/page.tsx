'use client';

import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import ChatRoom from '@/components/ChatRoom';

function WelcomePanel() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-japifon-gray-light">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-japifon-dark-blue">Welcome to ChatHub</h1>
        <p className="text-japifon-gray-mid mt-2">Select a conversation from the sidebar to start chatting.</p>
        <p className="text-japifon-gray-mid">Or, create a new conversation to begin.</p>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { token } = useAuth();
  const router = useRouter();
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      router.replace('/login');
    }
  }, [token, router]);

  const handleSelectConversation = (roomId: string) => {
    setSelectedRoomId(roomId);
  };

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white">
      <Sidebar onSelectConversation={handleSelectConversation} selectedRoomId={selectedRoomId} />
      <main className="flex-1 h-full">
        {selectedRoomId ? (
          <ChatRoom roomId={selectedRoomId} />
        ) : (
          <WelcomePanel />
        )}
      </main>
    </div>
  );
}
