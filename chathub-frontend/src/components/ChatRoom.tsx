'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';

interface User {
  _id: string;
  username: string;
}

interface Message {
  _id: string;
  content: string;
  sender: User;
  createdAt: string;
}

interface ChatRoomProps {
  roomId: string;
}

export default function ChatRoom({ roomId }: ChatRoomProps) {
  const { token, user } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const socketRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Reset messages when room changes
    setMessages([]);

    if (token && roomId) {
      const url = `ws://localhost:3000?token=${token}`;
      const ws = new WebSocket(url);

      ws.onopen = () => {
        console.log(`WebSocket connection established for room ${roomId}`);
        const joinMessage = { event: 'joinRoom', data: roomId };
        ws.send(JSON.stringify(joinMessage));
      };

      ws.onmessage = (event) => {
        const messageFromServer = JSON.parse(event.data);
        if (messageFromServer.event === 'messageHistory') {
          setMessages(messageFromServer.data);
        } else if (messageFromServer.event === 'receiveMessage') {
          setMessages((prevMessages) => [...prevMessages, messageFromServer.data]);
        }
      };

      ws.onclose = () => console.log('WebSocket connection closed');
      ws.onerror = (error) => console.error('WebSocket error:', error);

      socketRef.current = ws;

      return () => ws.close();
    }
  }, [token, roomId]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && socketRef.current) {
      const wsMessage = { event: 'sendMessage', data: newMessage.trim() };
      socketRef.current.send(JSON.stringify(wsMessage));
      setNewMessage('');
    }
  };

  if (!user) {
    return <div className="p-4">Loading user...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between p-4 bg-white shadow-md">
        <h1 className="text-xl font-bold text-japifon-dark-blue">Conversation</h1>
        {/* Maybe show contact name here in the future */}
      </header>

      <main className="flex-1 p-4 overflow-y-auto bg-japifon-gray-light">
        <div className="space-y-4">
          {messages.map((msg) => {
            const isCurrentUser = msg.sender._id === user._id;
            return (
              <div key={msg._id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                  <div className="text-xs text-japifon-gray-mid">{msg.sender.username}</div>
                  <div className={`mt-1 rounded-lg p-3 shadow-sm max-w-md ${isCurrentUser ? 'bg-japifon-blue text-white' : 'bg-white'}`}>
                      <p className="text-sm">{msg.content}</p>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                      {new Date(msg.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="p-4 bg-white border-t">
        <form onSubmit={handleSendMessage} className="flex items-center">
          <input 
            type="text" 
            placeholder="Escribe tu mensaje..." 
            className="flex-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-japifon-blue"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <button type="submit" className="ml-2 px-4 py-2 rounded-md bg-japifon-blue text-white font-semibold hover:bg-japifon-dark-blue">
            Enviar
          </button>
        </form>
      </footer>
    </div>
  );
}
