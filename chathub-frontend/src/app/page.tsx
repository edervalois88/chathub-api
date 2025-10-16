'use client';

import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import ChatRoom from '@/components/ChatRoom';

function WelcomePanel() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-[#FFE8F5]">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-semibold text-[#10276F]">
          Bienvenido a Japifon ChatHub
        </h1>
        <p className="mt-4 text-sm text-slate-500">
          Selecciona una conversación en la barra lateral para comenzar o crea un
          nuevo contacto desde el centro de control.
        </p>
        <div className="mt-6 rounded-2xl border border-dashed border-[#E4007C] bg-[#E4007C1A] px-6 py-4">
          <p className="text-xs uppercase tracking-wide text-[#E4007C]">
            Consejo
          </p>
          <p className="mt-2 text-sm text-[#10276F]">
            Mantén a tu equipo conectado: invita agentes y sigue las métricas de
            servicio desde el panel de analítica.
          </p>
        </div>
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
    router.push(`/chat/${roomId}`);
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
      <main className="flex h-full flex-1 flex-col">
        {selectedRoomId ? <ChatRoom roomId={selectedRoomId} /> : <WelcomePanel />}
      </main>
    </div>
  );
}
