'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

interface ConversationListItem {
  _id: string;
  channel: string;
  status: 'open' | 'pending' | 'resolved';
  lastMessagePreview?: string;
  lastActivityAt?: string;
  contact: {
    _id: string;
    name: string;
  };
}

interface SidebarProps {
  onSelectConversation: (roomId: string) => void;
  selectedRoomId: string | null;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export default function Sidebar({
  onSelectConversation,
  selectedRoomId,
}: SidebarProps) {
  const { token, user, logout } = useAuth();
  const [conversations, setConversations] = useState<ConversationListItem[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const organizationName = useMemo(
    () => user?.organization?.name ?? 'Japifon',
    [user?.organization?.name],
  );

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    let unsubscribe = false;

    const fetchConversations = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/chat/conversations`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          throw new Error('No fue posible cargar las conversaciones');
        }
        const data = await response.json();

        if (!unsubscribe) {
          setConversations(data);
          setError(null);
        }
      } catch (err) {
        if (!unsubscribe) {
          setError((err as Error).message);
        }
      } finally {
        if (!unsubscribe) {
          setLoading(false);
        }
      }
    };

    fetchConversations();
    const intervalId = setInterval(fetchConversations, 30_000);

    return () => {
      unsubscribe = true;
      clearInterval(intervalId);
    };
  }, [token]);

  const emptyState = (
    <div className="p-6 text-center text-sm text-slate-500">
      <p className="mb-3">Aun no tienes conversaciones activas.</p>
      <Link
        href="/conversations/create"
        className="font-semibold text-[#255FED] hover:text-[#10276F]"
      >
        Crea la primera conversacion
      </Link>
    </div>
  );

  return (
    <aside className="flex w-80 flex-col border-r border-slate-100 bg-white/95 backdrop-blur">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div>
          <h1 className="text-lg font-semibold text-[#10276F]">
            {organizationName}
          </h1>
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Bandeja omnicanal
          </p>
        </div>
        <Link
          href="/conversations/create"
          className="rounded-full bg-gradient-to-r from-[#255FED] to-[#E4007C] p-2 text-white shadow-md transition hover:opacity-90"
          title="Crear conversación"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && (
          <p className="px-4 py-6 text-center text-sm text-slate-500">
            Cargando conversaciones...
          </p>
        )}

        {!loading && error && (
          <p className="px-4 py-6 text-center text-sm text-red-500">{error}</p>
        )}

        {!loading && !error && conversations.length === 0 && emptyState}

        {!loading && !error && conversations.length > 0 && (
          <ul>
            {conversations.map((conversation) => {
              const isActive = conversation._id === selectedRoomId;
              const lastActivity = conversation.lastActivityAt
                ? new Date(conversation.lastActivityAt).toLocaleTimeString(
                    [],
                    {
                      hour: '2-digit',
                      minute: '2-digit',
                    },
                  )
                : '';
              const preview =
                conversation.lastMessagePreview ??
                'Sin mensajes registrados aún';

              return (
                <li key={conversation._id}>
                  <button
                    type="button"
                    onClick={() => onSelectConversation(conversation._id)}
                    className={`flex w-full flex-col gap-2 px-5 py-4 text-left transition ${
                      isActive
                        ? 'bg-gradient-to-r from-[#F3F6FF] to-[#FFE8F5]'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold text-[#10276F]">
                          {conversation.contact?.name ?? 'Contacto'}
                        </p>
                        <p className="text-xs uppercase tracking-wide text-slate-400">
                          {conversation.channel}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase ${
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
                    <div className="flex items-center justify-between gap-2">
                      <p className="line-clamp-2 text-xs text-slate-500">
                        {preview}
                      </p>
                      <span className="text-[10px] uppercase tracking-wide text-slate-400">
                        {lastActivity}
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {user && (
        <div className="border-t border-slate-100 px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[#10276F]">
                {user.displayName}
              </p>
              <p className="text-xs uppercase tracking-wide text-slate-400">
                {user.role}
              </p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500 transition hover:border-[#E4007C] hover:text-[#E4007C]"
            >
              Salir
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
