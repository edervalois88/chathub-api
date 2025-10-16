'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import ChatRoom from '@/components/ChatRoom';
import { useAuth } from '@/context/AuthContext';

interface PageProps {
  params: {
    roomId: string;
  };
}

export default function ChatRoomPage({ params }: PageProps) {
  const { token } = useAuth();
  const router = useRouter();
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      router.replace('/login');
      return;
    }
    setSelectedRoomId(params.roomId);
  }, [token, router, params.roomId]);

  const handleSelectConversation = (roomId: string) => {
    setSelectedRoomId(roomId);
    router.replace(`/chat/${roomId}`);
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
      <Sidebar
        onSelectConversation={handleSelectConversation}
        selectedRoomId={selectedRoomId}
      />
      <main className="flex-1 h-full">
        {selectedRoomId ? <ChatRoom roomId={selectedRoomId} /> : null}
      </main>
    </div>
  );
}

