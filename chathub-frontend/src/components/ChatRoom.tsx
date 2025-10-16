'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';

interface ChatRoomProps {
  roomId: string;
}

interface ConversationSummary {
  _id: string;
  channel: string;
  status: 'open' | 'pending' | 'resolved';
  contact: {
    _id: string;
    name: string;
    email?: string;
    phone?: string;
  };
  updatedAt: string;
}

interface Message {
  _id: string;
  content: string;
  direction: 'inbound' | 'outbound';
  createdAt: string;
  sender?: {
    _id: string;
    displayName?: string;
    username?: string;
    avatarColor?: string;
  };
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:3000';

export default function ChatRoom({ roomId }: ChatRoomProps) {
  const { token, user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversation, setConversation] = useState<ConversationSummary | null>(
    null,
  );
  const [loadingConversation, setLoadingConversation] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const contactName = useMemo(
    () => conversation?.contact?.name ?? 'Conversacion',
    [conversation],
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!token || !roomId) return;
    let isMounted = true;
    setLoadingConversation(true);

    const controller = new AbortController();

    fetch(`${API_BASE_URL}/chat/conversations/${roomId}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('No se pudo cargar la conversacion');
        }
        const data = await response.json();
        if (isMounted) {
          setConversation(data);
        }
      })
      .catch((error) => {
        if (isMounted) {
          console.error(error);
          setConversation(null);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoadingConversation(false);
        }
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [roomId, token]);

  useEffect(() => {
    if (!token || !roomId) {
      return;
    }
    setMessages([]);

    const ws = new WebSocket(`${WS_BASE_URL}?token=${token}`);
    socketRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ event: 'joinConversation', data: roomId }));
    };

    ws.onmessage = (event) => {
      const messageFromServer = JSON.parse(event.data);
      if (messageFromServer.event === 'messageHistory') {
        setMessages(messageFromServer.data);
      } else if (messageFromServer.event === 'receiveMessage') {
        setMessages((prev) => [...prev, messageFromServer.data]);
      } else if (messageFromServer.event === 'error') {
        console.error(messageFromServer.data);
      }
    };

    ws.onerror = (event) => {
      console.error('WebSocket error', event);
    };

    return () => {
      ws.close(1000);
      socketRef.current = null;
    };
  }, [roomId, token]);

  const handleSendMessage = (event: React.FormEvent) => {
    event.preventDefault();
    if (!newMessage.trim() || !socketRef.current) return;

    const payload = {
      event: 'sendMessage',
      data: { content: newMessage.trim() },
    };

    socketRef.current.send(JSON.stringify(payload));
    setNewMessage('');
  };

  if (!user) {
    return <div className="p-4">Cargando sesion…</div>;
  }

  if (loadingConversation) {
    return (
      <div className="flex h-full flex-1 flex-col items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">Cargando conversacion...</p>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex h-full flex-1 flex-col items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">
          No se encontro la conversacion seleccionada.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold text-[#10276F]">{contactName}</h2>
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Canal: {conversation.channel}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            conversation.status === 'resolved'
              ? 'bg-emerald-100 text-emerald-600'
              : conversation.status === 'pending'
              ? 'bg-amber-100 text-amber-600'
              : 'bg-[#E4007C1A] text-[#E4007C]'
          }`}
        >
          {conversation.status.toUpperCase()}
        </span>
      </header>

      <main className="flex-1 space-y-4 overflow-y-auto bg-gradient-to-b from-slate-50 via-white to-slate-100 px-6 py-4">
        {messages.map((msg) => {
          const isCurrentUser = msg.sender?._id === user._id;
          const author =
            msg.sender?.displayName ??
            msg.sender?.username ??
            (msg.direction === 'inbound' ? conversation.contact.name : 'Agente');

          return (
            <div
              key={msg._id}
              className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-lg space-y-1 rounded-2xl px-4 py-3 shadow-sm ${
                  isCurrentUser
                    ? 'bg-gradient-to-r from-[#255FED] to-[#173DA6] text-white'
                    : 'bg-white text-slate-900'
                }`}
              >
                <div className="text-xs font-semibold uppercase tracking-wide opacity-70">
                  {author}
                </div>
                <p className="text-sm leading-relaxed">{msg.content}</p>
                <div
                  className={`text-[10px] uppercase tracking-wide ${
                    isCurrentUser ? 'text-white/70' : 'text-slate-400'
                  }`}
                >
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </main>

      <footer className="border-t border-slate-100 bg-white px-6 py-4">
        <form
          onSubmit={handleSendMessage}
          className="flex items-center gap-3"
          autoComplete="off"
        >
          <input
            type="text"
            placeholder="Escribe tu mensaje..."
            className="flex-1 rounded-full border border-slate-200 px-4 py-2 shadow-sm focus:border-[#255FED] focus:outline-none focus:ring-2 focus:ring-[#255FED]/40"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <button
            type="submit"
            className="rounded-full bg-gradient-to-r from-[#255FED] to-[#E4007C] px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#255FED]"
          >
            Enviar
          </button>
        </form>
      </footer>
    </div>
  );
}
