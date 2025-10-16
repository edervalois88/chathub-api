'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface ConversationCard {
  _id: string;
  channel: string;
  status: 'open' | 'pending' | 'resolved';
  lastMessagePreview?: string;
  lastActivityAt?: string;
  createdAt: string;
  contact: {
    _id: string;
    name: string;
  };
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export default function ConversationsPage() {
  const router = useRouter();
  const { token, user } = useAuth();
  const [conversations, setConversations] = useState<ConversationCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const totalOpen = useMemo(
    () => conversations.filter((conversation) => conversation.status === 'open').length,
    [conversations],
  );

  useEffect(() => {
    if (!token) {
      router.replace('/login');
      return;
    }

    let unsubscribe = false;

    const fetchConversations = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/chat/conversations`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('No fue posible obtener las conversaciones');
        }

        const data = await response.json();
        if (!unsubscribe) {
          setConversations(data);
        }
      } catch (err) {
        if (!unsubscribe) {
          setError((err as Error).message);
        }
      } finally {
        if (!unsubscribe) {
          setIsLoading(false);
        }
      }
    };

    fetchConversations();
    const intervalId = setInterval(fetchConversations, 30_000);

    return () => {
      unsubscribe = true;
      clearInterval(intervalId);
    };
  }, [token, router]);

  const handleJoinConversation = (conversationId: string) => {
    router.push(`/chat/${conversationId}`);
  };

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-white">
        <p className="text-sm text-slate-500">Cargando conversaciones...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-white">
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#10276F]">
            Conversaciones activas
          </h1>
          <p className="text-sm text-slate-500">
            {user?.organization?.name ?? 'Japifon'} · {conversations.length}{' '}
            conversaciones ({totalOpen} abiertas)
          </p>
        </div>
        <button
          className="rounded-full bg-gradient-to-r from-[#255FED] to-[#E4007C] px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#255FED]"
          onClick={() => router.push('/conversations/create')}
        >
          Nueva conversación
        </button>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {conversations.map((conversation) => {
          const lastActivity = conversation.lastActivityAt
            ? new Date(conversation.lastActivityAt).toLocaleString()
            : new Date(conversation.createdAt).toLocaleString();

          return (
            <article
              key={conversation._id}
              className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div>
                <div className="flex items-start justify-between gap-4">
                  <h2 className="text-lg font-semibold text-[#10276F]">
                    {conversation.contact?.name ?? 'Contacto'}
                  </h2>
                  <span
                    className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                      conversation.status === 'resolved'
                        ? 'bg-emerald-100 text-emerald-600'
                        : conversation.status === 'pending'
                        ? 'bg-amber-100 text-amber-600'
                        : 'bg-[#E4007C1A] text-[#E4007C]'
                    }`}
                  >
                    {conversation.status}
                  </span>
                </div>
                <p className="mt-3 text-xs uppercase tracking-wide text-slate-400">
                  Canal: {conversation.channel}
                </p>
                <p className="mt-3 line-clamp-3 text-sm text-slate-500">
                  {conversation.lastMessagePreview ?? 'Sin mensajes registrados'}
                </p>
              </div>
              <div className="mt-6 flex items-center justify-between text-xs text-slate-400">
                <span>Última actividad</span>
                <span>{lastActivity}</span>
              </div>
              <button
                className="mt-6 rounded-full border border-transparent bg-[#255FED] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#173DA6] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#255FED]"
                onClick={() => handleJoinConversation(conversation._id)}
              >
                Abrir conversación
              </button>
            </article>
          );
        })}
      </div>
    </div>
  );
}
